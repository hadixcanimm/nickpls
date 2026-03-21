/**
 * Nicklere Bakma v2 - Entry Point
 */

import {
    getWebSocketURI, create, getChampionSelectChatInfo, postMessageToChat,
    getMatchDataForPuuids, getRankedStatsForPuuids, getSummonerDataForPuuids
} from './api.js';
import { createPopup, populateContent, removeSidebar, showLoading, updateLoadingProgress } from './ui.js';
import { calculateWinRate, mostCommonRole, calculateKDA, detectPremades, getSoloQMatches } from './utils.js';

let currentChampSelectSession = 0;

async function handleChampionSelect() {
    try {
        currentChampSelectSession++;
        const sessionId = currentChampSelectSession;

        const config = await fetchConfig();
        if (config.popup) createPopup();

        // Start loading
        showLoading();

        // BİREBİR ESKİ KODDAKİ GİBİ: Önce sessizce 8 saniye bekle
        for (let i = 8; i > 0; i--) {
            if (sessionId !== currentChampSelectSession) return;
            updateLoadingProgress(10, `Waiting for chat synchronization... (${i}s)`);
            await new Promise(r => setTimeout(r, 1000));
        }

        if (sessionId !== currentChampSelectSession) return;
        updateLoadingProgress(20, "Fetching players...");

        const client = await create("GET", "/riotclient/region-locale");
        const region = client?.webRegion || 'tr';

        // Tıpkı eski koddaki gibi, önce ChatInfo'yu çağırıyoruz ki sistem algılasın
        const chatInfo = await getChampionSelectChatInfo();

        // Tıpkı eski koddaki gibi //riotclient/chat/v5/participants (çift slash ile) kullanıyoruz
        const participantsRes = await create("GET", "//riotclient/chat/v5/participants");
        if (!participantsRes || !participantsRes.participants) {
            updateLoadingProgress(0, "Chat API failed to respond.");
            return;
        }

        const lobbyChat = participantsRes.participants.filter(participant => participant.cid.includes('champ-select'));
        const puuids = lobbyChat.map(player => player.puuid).filter(p => p && p.length > 0);

        if (puuids.length === 0) {
            console.log('[v2] No puuids found. Waiting...');
            updateLoadingProgress(0, "Chat hasn't loaded anyone yet. Try again next lobby.");
            return;
        }

        updateLoadingProgress(40, "Fetching profiles...");

        // Fetch summoner data to get real names (works even in anonymous queues)
        const summoners = await getSummonerDataForPuuids(puuids);

        // Construct lobby object correctly
        const lobby = puuids.map((puuid, i) => {
            const s = summoners ? summoners[i] : null;
            let chatParticipant = null;
            if (participantsRes && participantsRes.participants) {
                chatParticipant = participantsRes.participants.find(p => p.puuid === puuid);
            }

            // Prefer name from chat participant over summoner profile if it exists, as summoner API hides names in some modes
            const chatName = chatParticipant ? chatParticipant.game_name : null;
            const chatTag = chatParticipant ? chatParticipant.game_tag : null;

            return {
                game_name: chatName || (s ? s.gameName : 'Unknown'),
                game_tag: chatTag || (s ? s.tagLine : '????'),
                puuid: puuid,
                icon: s?.profileIconId || 29
            };
        });

        updateLoadingProgress(60, "Fetching match history and stats...");

        const [matchData, ranks] = await Promise.all([
            getMatchDataForPuuids(puuids),
            getRankedStatsForPuuids(puuids)
        ]);

        if (sessionId !== currentChampSelectSession) return;

        updateLoadingProgress(90, "Processing data...");

        const premadeGroups = detectPremades(matchData, lobby);

        if (config.popup) {
            const urlNames = lobby.map(p => encodeURIComponent(`${p.game_name}#${p.game_tag}`)).join('%2C');
            const urlPoro = lobby.map(p => encodeURIComponent(`${p.game_name}#${p.game_tag}`)).join(',');
            const links = `<a href="https://www.op.gg/multisearch/${region}?summoners=${urlNames}" target="_blank">OP.GG</a>
                           <a href="https://porofessor.gg/tr/pregame/${region}/${urlPoro}" target="_blank">Porofessor.gg</a>`;

            populateContent(
                lobby,
                links,
                matchData,
                lobby,
                ranks,
                summoners,
                premadeGroups
            );
        }

        if (config.textchat && chatInfo) {
            const displayChat = lobby.map((p, i) => {
                const r = ranks[i];
                const m = matchData[i];
                let solo = getSoloQMatches(m);
                if (!solo || !solo.winList) {
                    solo = m;
                }
                if (!solo || !solo.winList) {
                    return `${p.game_name} - ${r} - N/A - N/A - N/A KDA`;
                }
                const win = calculateWinRate(solo.winList);
                const role = mostCommonRole(m.laneList);
                const kda = calculateKDA(solo.killList, solo.assistsList, solo.deathsList).replace(" KDA", "");
                return `${p.game_name} - ${r} - ${win} - ${role} - ${kda}`;
            });
            for (const msg of displayChat) {
                await postMessageToChat(chatInfo.id, msg);
            }
        }

    } catch (e) {
        console.error('[v2] Error in ChampSelect:', e);
    }
}

async function fetchConfig() {
    try {
        const response = await fetch(`https://plugins/NICKPLS/config.json`);
        return await response.json();
    } catch {
        return { textchat: true, popup: true };
    }
}

function onMessage(msg) {
    try {
        const data = JSON.parse(msg.data);
        if (data[2].data === "ChampSelect") {
            handleChampionSelect();
        } else {
            currentChampSelectSession++; // Abort any active polling loop
            removeSidebar();
        }
    } catch { }
}

window.refreshLobby = function () {
    console.log('[v2] FORCING LOBBY REFRESH');
    // Clear any active session to stop previous timeouts
    currentChampSelectSession++;

    // Clear the UI
    const container = document.getElementById('sidebarContent');
    if (container) container.innerHTML = '';

    // Restart logic
    handleChampionSelect();
};

async function init() {
    try {
        const ws = new WebSocket(getWebSocketURI(), 'wamp');
        ws.onopen = () => ws.send(JSON.stringify([5, 'OnJsonApiEvent' + "/lol-gameflow/v1/gameflow-phase".replaceAll("/", "_")]));
        ws.onmessage = onMessage;
        console.log("NICKPLS Loaded 🚀");
    } catch (e) {
        console.error('[v2] Init failed:', e);
    }
}

window.addEventListener('load', init);
