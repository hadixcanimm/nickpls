let countersDB = null;

/**
 * Handles fetching and parsing counter data from championcounter.com
 */

export async function fetchCounters(championName, lane = null) {
    if (!championName) return null;

    if (!countersDB) {
        try {
            const response = await fetch("https://plugins/NICKPLS/counters.json");
            if (response.ok) {
                countersDB = await response.json();
            } else return null;
        } catch (e) { return null; }
    }

    const normalized = normalizeChampionName(championName);
    const entry = countersDB[normalized];
    if (!entry) return "404";

    // If no lane specified, try to find the most common lane or pick first available
    let laneData = null;
    if (lane && entry[lane.toLowerCase()]) {
        laneData = entry[lane.toLowerCase()];
    } else {
        const availableLanes = Object.keys(entry);
        laneData = entry[availableLanes[0]];
    }

    if (!laneData) return null;

    return {
        name: championName,
        lane: lane || Object.keys(entry)[0],
        weakAgainst: laneData.weakAgainst || [],
        strongAgainst: (laneData.strongAgainst || []).slice(0, 10)
    };
}

export async function getAvailableLanes(championName) {
    if (!championName) return [];

    if (!countersDB) {
        try {
            const response = await fetch("https://plugins/NICKPLS/counters.json");
            if (response.ok) {
                countersDB = await response.json();
            } else return [];
        } catch (e) { return []; }
    }

    const normalized = normalizeChampionName(championName);
    const entry = countersDB[normalized];
    if (!entry) return [];

    // Return only lanes that have weakAgainst data
    return Object.keys(entry).filter(lane => {
        return entry[lane].weakAgainst && entry[lane].weakAgainst.length > 0;
    });
}

export async function analyzeTeam(enemyTeam) {
    /**
     * enemyTeam: Array of { name: 'Aatrox', lanes: ['top'] }
     */
    if (!enemyTeam || enemyTeam.length === 0) return null;

    if (!countersDB) {
        try {
            const response = await fetch("https://plugins/NICKPLS/counters.json");
            if (response.ok) {
                countersDB = await response.json();
            } else return null;
        } catch (e) { return null; }
    }

    if (!countersDB) return null;

    const scoreMap = {}; // champName -> score

    for (const enemy of enemyTeam) {
        const normalizedEnemy = normalizeChampionName(enemy.name);
        const enemyEntry = countersDB[normalizedEnemy];
        if (!enemyEntry) continue;

        // Iterate over ALL selected lanes for this enemy
        const targetLanes = (enemy.lanes && enemy.lanes.length > 0)
            ? enemy.lanes
            : Object.keys(enemyEntry); // Default to all if none (shouldn't happen with new UI)

        for (const lane of targetLanes) {
            const laneKey = lane.toLowerCase();
            const laneData = enemyEntry[laneKey];
            if (!laneData) continue;

            const weaknesses = laneData.weakAgainst || [];

            // Who is strong against this enemy (Counters)
            weaknesses.forEach(w => {
                const normW = normalizeChampionName(w);
                if (!scoreMap[normW]) scoreMap[normW] = { score: 0, against: [] };

                // Avoid duplicate points for same enemy in different lanes
                if (!scoreMap[normW].against.includes(enemy.name)) {
                    scoreMap[normW].score += 2;
                    scoreMap[normW].against.push(enemy.name);
                }
            });
        }
    }

    const recommended = Object.entries(scoreMap)
        .filter(([name, data]) => data.score > 0)
        .sort((a, b) => b[1].score - a[1].score)
        .map(([name, data]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            score: data.score,
            against: data.against
        }));

    return { recommended };
}

export async function getSuggestions(query) {
    if (!query || query.length < 1) return [];

    if (!countersDB) {
        try {
            const response = await fetch("https://plugins/NICKPLS/counters.json");
            if (response.ok) {
                countersDB = await response.json();
            } else {
                console.error("[Draft] Failed to load counters.json:", response.status);
                return [];
            }
        } catch (e) {
            console.error("[Draft] getSuggestions fetch error:", e);
            return [];
        }
    }

    if (!countersDB) return [];

    const normalized = query.toLowerCase().replace(/['.\s&]/g, '');
    const keys = Object.keys(countersDB);

    // Sort by: starts with query first, then includes query
    const results = keys.filter(k => k.includes(normalized))
        .sort((a, b) => {
            const aStarts = a.startsWith(normalized);
            const bStarts = b.startsWith(normalized);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.localeCompare(b);
        });

    return results.map(k => k.charAt(0).toUpperCase() + k.slice(1)).slice(0, 10);
}

function normalizeChampionName(name) {
    if (!name) return "";
    return name.toLowerCase()
        .replace(/['.]/g, '')
        .replace(/ & /g, '')
        .replace(/\s+/g, '');
}
