/**
 * Nicklere Bakma v2 - Entry Point
 */

import {
    getWebSocketURI, create, getChampionSelectChatInfo, postMessageToChat,
    getMatchDataForPuuids, getRankedStatsForPuuids, getSummonerDataForPuuids
} from './api.js';
import { createPopup, populateContent, removeSidebar, showLoading, updateLoadingProgress } from './ui.js';
import { calculateWinRate, mostCommonRole, calculateKDA, detectPremades, getSoloQMatches } from './utils.js';

async function handleChampionSelect() {
    try {
        const config = await fetchConfig();
        if (config.popup) createPopup();

        // Start loading
        showLoading();
        updateLoadingProgress(10, "Scanning players...");

        // Give it a moment for the session to be fully created
        await new Promise(r => setTimeout(r, 1000));

        const client = await create("GET", "/riotclient/region-locale");
        const region = client?.webRegion || 'tr';

        let puuids = [];

        // 1. Try to get PUUIDs from Champ Select Session (Most reliable)
        try {
            const session = await create("GET", "/lol-champ-select/v1/session");
            if (session && session.myTeam) {
                puuids = session.myTeam.map(m => m.puuid).filter(p => p && p.length > 0);
            }
        } catch (e) {
            console.warn('[v2] Session API failed:', e);
        }

        // 2. Fallback to chat participants if session failed or returned empty
        if (puuids.length === 0) {
            const participants = await create("GET", "/riotclient/chat/v5/participants");
            if (participants && participants.participants) {
                const lobbyChat = participants.participants.filter(p => p.cid && p.cid.includes('champ-select'));
                puuids = lobbyChat.map(p => p.puuid).filter(p => p && p.length > 0);
            }
        }

        if (puuids.length === 0) {
            console.log('[v2] No puuids found. Waiting...');
            updateLoadingProgress(0, "Waiting for the next lobby...");
            return;
        }

        updateLoadingProgress(20, "Fetching profiles...");

        // Fetch summoner data to get real names (works even in anonymous queues)
        const summoners = await getSummonerDataForPuuids(puuids);

        // Construct lobby object correctly
        const lobby = puuids.map((puuid, i) => {
            const s = summoners[i];
            return {
                game_name: s?.gameName || 'Unknown',
                game_tag: s?.tagLine || '????',
                puuid: puuid,
                icon: s?.profileIconId || 29
            };
        });

        updateLoadingProgress(50, "Fetching match history and stats...");

        const [matchData, ranks] = await Promise.all([
            getMatchDataForPuuids(puuids),
            getRankedStatsForPuuids(puuids)
        ]);

        updateLoadingProgress(90, "Processing data...");

        const format = (p, r, m, full) => {
            const solo = getSoloQMatches(m);
            if (!solo || !solo.winList) {
                return `${p.game_name}${full ? ' #' + p.game_tag : ''} - ${r} - N/A - N/A - N/A KDA`;
            }
            const win = calculateWinRate(solo.winList);
            const role = mostCommonRole(m.laneList); // Lane list stays the same for context
            const kda = calculateKDA(solo.killList, solo.assistsList, solo.deathsList);
            return `${p.game_name}${full ? ' #' + p.game_tag : ''} - ${r} - ${win} - ${role} - ${kda}`;
        };

        const displayChat = lobby.map((p, i) => format(p, ranks[i], matchData[i], false));
        const displayUI = lobby.map((p, i) => format(p, ranks[i], matchData[i], true));

        if (config.textchat) {
            const chatInfo = await getChampionSelectChatInfo();
            if (chatInfo) {
                for (const msg of displayChat) {
                    await postMessageToChat(chatInfo.id, msg);
                }
            }
        }

        const urlNames = lobby.map(p => encodeURIComponent(`${p.game_name}#${p.game_tag}`)).join('%2C');
        const urlPoro = lobby.map(p => encodeURIComponent(`${p.game_name}#${p.game_tag}`)).join(',');
        const links = `<a href="https://www.op.gg/multisearch/${region}?summoners=${urlNames}" target="_blank">OP.GG</a>
                       <a href="https://porofessor.gg/tr/pregame/${region}/${urlPoro}" target="_blank">Porofessor.gg</a>`;

        const premadeGroups = detectPremades(matchData, lobby);

        if (config.popup) {
            populateContent(displayUI, links, matchData, lobby, ranks, summoners, premadeGroups);
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
            removeSidebar();
        }
    } catch { }
}

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
