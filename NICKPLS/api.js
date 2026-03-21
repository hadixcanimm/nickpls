/**
 * API communication for Nicklere Bakma v2
 */

import { resolveQueueId } from './utils.js';

const API_HEADERS = {
    "accept": "application/json",
    "content-type": "application/json",
};

export async function create(method, endpoint, action) {
    const initialize = {
        method: method,
        headers: API_HEADERS,
        ...(action ? { body: JSON.stringify(action) } : {})
    };

    try {
        const request = await fetch(endpoint, initialize);
        if (!request.ok) throw new Error(`HTTP error! status: ${request.status}`);
        return await request.json();
    } catch (error) {
        console.error(`Error in API request [${method} ${endpoint}]:`, error);
        return null;
    }
}

// WebSocket helpers
export function getWebSocketURI() {
    const linkElement = document.querySelector('link[rel="riot:plugins:websocket"]');
    if (!linkElement) throw new Error('WebSocket link element not found');
    return linkElement.href;
}

// Data fetching helpers
export async function queryMatch(puuid, begIndex = 0, endIndex = 99) {
    try {
        const endpoint = `/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=${begIndex}&endIndex=${endIndex}`;
        const result = await create('GET', endpoint);
        if (!result || !result.games || !result.games.games) return false;
        return extractMatchData(result.games.games);
    } catch (error) {
        console.error('Error querying match for puuid:', puuid, error);
        return false;
    }
}

function extractMatchData(matchList) {
    const data = {
        gameId: [], gameMode: [], championId: [], killList: [], deathsList: [],
        assistsList: [], Minions: [], gold: [], winList: [], laneList: [],
        spell1Id: [], spell2Id: [], items: [], types: [], gameCreation: [],
        allParticipants: [] // To store all player names in the match
    };

    matchList.forEach(match => {
        const p = match.participants[0];
        data.gameId.push(match.gameId);
        data.gameMode.push(match.queueId);
        data.championId.push(p.championId);
        data.killList.push(p.stats.kills);
        data.deathsList.push(p.stats.deaths);
        data.assistsList.push(p.stats.assists);
        data.Minions.push(p.stats.neutralMinionsKilled + p.stats.totalMinionsKilled);
        data.gold.push(p.stats.goldEarned);
        data.winList.push(p.stats.win ? "true" : "false");
        data.laneList.push(p.timeline.lane);
        data.spell1Id.push(p.spell1Id);
        data.spell2Id.push(p.spell2Id);
        data.types.push(match.gameType);
        data.gameCreation.push(match.gameCreation);

        // Capture all participant names/tags if available
        const names = [];
        if (match.participantIdentities) {
            match.participantIdentities.forEach(id => {
                if (id.player) {
                    const name = id.player.gameName || id.player.summonerName;
                    const tag = id.player.tagLine || "";
                    if (name) names.push(`${name.toLowerCase()}#${tag.toLowerCase()}`);
                }
            });
        }
        data.allParticipants.push(names);

        const items = [];
        for (let i = 0; i < 7; i++) items.push(p.stats['item' + i]);
        data.items.push(items);
    });

    return data;
}

export async function getMatchDataForPuuids(puuidArray) {
    const promises = puuidArray.map(puuid =>
        queryMatch(puuid, 0, 19).catch(e => {
            console.error(`Failed to fetch match data for ${puuid}:`, e);
            return null;
        })
    );
    return await Promise.all(promises);
}

export async function fetchRankedStats(puuid) {
    return await create('GET', `/lol-ranked/v1/ranked-stats/${puuid}`);
}

export async function getRankedStatsForPuuids(puuidArray) {
    const promises = puuidArray.map(puuid =>
        fetchRankedStats(puuid).catch(e => {
            console.error(`Failed to fetch ranked stats for ${puuid}:`, e);
            return null;
        })
    );
    const results = await Promise.all(promises);
    return results.map(stats => {
        if (!stats || !stats.queueMap) return "Unranked";
        const solo = stats.queueMap["RANKED_SOLO_5x5"];
        const flex = stats.queueMap["RANKED_FLEX_SR"];

        const romanToNum = (roman) => {
            const map = { I: 1, II: 2, III: 3, IV: 4 };
            return map[roman] || roman;
        };

        const format = (q) => {
            if (!q || q.tier === "NA" || q.isProvisional) return null;
            if (["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND"].includes(q.tier)) {
                return `${q.tier[0]}${romanToNum(q.division)}`;
            }
            return q.tier;
        };

        return format(solo) || format(flex) || "Unranked";
    });
}

export async function getSummonerDataForPuuids(puuidArray) {
    const promises = puuidArray.map(puuid =>
        create('GET', `/lol-summoner/v2/summoners/puuid/${puuid}`).catch(e => null)
    );
    return await Promise.all(promises);
}

export async function getChampionSelectChatInfo() {
    try {
        const chats = await create('GET', '/lol-chat/v1/conversations');
        return Array.isArray(chats) ? chats.find(item => item.type === 'championSelect') : null;
    } catch {
        return null;
    }
}

export async function postMessageToChat(chatId, message) {
    if (!chatId) return;
    await create('POST', `/lol-chat/v1/conversations/${chatId}/messages`, {
        body: message,
        type: "celebration"
    });
}

// Static Data Cache
export const StaticData = {
    items: null, spells: null, perks: null, styles: null, champions: null,
    async ensureLoaded() {
        if (this.items && this.champions) return;
        try {
            const [items, spells, perks, styles, champions] = await Promise.all([
                create('GET', '/lol-game-data/assets/v1/items.json'),
                create('GET', '/lol-game-data/assets/v1/summoner-spells.json'),
                create('GET', '/lol-game-data/assets/v1/perks.json'),
                create('GET', '/lol-game-data/assets/v1/perkstyles.json'),
                create('GET', '/lol-game-data/assets/v1/champion-summary.json')
            ]);
            this.items = items;
            this.spells = spells;
            this.perks = perks;
            this.styles = styles.styles || styles;
            this.champions = champions;
        } catch (e) {
            console.error("Failed to load static data", e);
        }
    },
    getItemIcon: id => StaticData.items?.find(i => i.id == id)?.iconPath || '',
    getSpellIcon: id => StaticData.spells?.find(s => s.id == id)?.iconPath || '',
    getPerkIcon: id => StaticData.perks?.find(p => p.id == id)?.iconPath || '',
    getPerkStyleIcon: id => StaticData.styles?.find(s => s.id == id)?.iconPath || '',
    getChampIdByName: name => {
        if (!StaticData.champions) return -1;
        const normalized = name.toLowerCase().replace(/['.\s&]/g, '');
        const entry = StaticData.champions.find(c =>
            c.name.toLowerCase().replace(/['.\s&]/g, '') === normalized ||
            c.alias.toLowerCase().replace(/['.\s&]/g, '') === normalized
        );
        return entry ? entry.id : -1;
    }
};
