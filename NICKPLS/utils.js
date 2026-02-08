/**
 * Utility functions for Nicklere Bakma v2
 */

export const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

export function romanToNumber(roman) {
    const romanNumerals = {
        I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000
    };
    let number = 0;
    let prevValue = 0;

    for (let i = roman.length - 1; i >= 0; i--) {
        const currentValue = romanNumerals[roman[i]];
        if (!currentValue) continue;
        number += currentValue < prevValue ? -currentValue : currentValue;
        prevValue = currentValue;
    }

    return number;
}

export function sumArrayElements(array) {
    if (!Array.isArray(array)) return 0;
    return array.reduce((sum, num) => sum + num, 0);
}

export function calculateWinRate(winList) {
    if (!winList || winList.length === 0) return "N/A";
    const winCount = winList.filter(result => result === "true" || result === true).length;
    const totalGames = winList.length;
    const winRate = (winCount / totalGames) * 100;
    return `${Math.round(winRate)}%`;
}

export function mostCommonRole(rolesList) {
    if (!rolesList || rolesList.length === 0) return "N/A";
    const roleCounts = rolesList.reduce((acc, role) => {
        if (role && role !== "NONE" && role !== "NA" && role !== "") {
            acc[role] = (acc[role] || 0) + 1;
        }
        return acc;
    }, {});

    let maxCount = 0, mostCommonRoles = [];
    for (const role in roleCounts) {
        if (roleCounts[role] > maxCount) {
            mostCommonRoles = [role];
            maxCount = roleCounts[role];
        } else if (roleCounts[role] === maxCount) {
            mostCommonRoles.push(role);
        }
    }
    return mostCommonRoles.length > 0 ? mostCommonRoles.join('/') : "N/A";
}

export function calculateKDA(killsArray, assistsArray, deathsArray) {
    if (!killsArray || !assistsArray || !deathsArray) return "N/A KDA";

    const flattenAndSum = (arr) => sumArrayElements(arr.map(val =>
        typeof val === 'string' ? val.split(',').map(Number) : [Number(val)]
    ).flat());

    const totalKills = flattenAndSum(killsArray);
    const totalAssists = flattenAndSum(assistsArray);
    const totalDeaths = flattenAndSum(deathsArray);

    let kda = totalDeaths === 0 ? 'PERFECT' : ((totalKills + totalAssists) / totalDeaths).toFixed(2);
    return `${kda} KDA`;
}

export function resolveQueueId(queueId) {
    const queues = {
        420: "Ranked Solo",
        440: "Ranked Flex",
        450: "ARAM",
        400: "Normal Draft",
        430: "Normal Blind",
        490: "Quickplay",
        1700: "Arena"
    };
    return queues[queueId] || `Queue ${queueId}`;
}

export function mergeMatchData(target, source) {
    if (!source) return;
    Object.keys(source).forEach(key => {
        if (Array.isArray(target[key]) && Array.isArray(source[key])) {
            target[key].push(...source[key]);
        }
    });
}

export function detectPremades(matchDataArray, lobby) {
    if (!matchDataArray || !lobby || matchDataArray.length !== lobby.length) return [];

    const groups = [];
    const n = lobby.length;
    const processed = new Set();

    // Prepare lobby identifiers (lowercase name#tag)
    const lobbyIds = lobby.map(p => `${p.game_name.toLowerCase()}#${p.game_tag.toLowerCase()}`);

    for (let i = 0; i < n; i++) {
        if (processed.has(i)) continue;
        let currentGroup = [i];

        for (let j = i + 1; j < n; j++) {
            if (processed.has(j)) continue;

            const matchesI = matchDataArray[i];
            const nameJ = lobbyIds[j];

            if (!matchesI || !matchesI.allParticipants) continue;

            // Check how many times player J appears in player I's history
            let commonCount = 0;
            matchesI.allParticipants.forEach(participantsInMatch => {
                if (participantsInMatch.includes(nameJ)) {
                    commonCount++;
                }
            });

            // Fallback: Check J's history for I if not enough found in I's history
            if (commonCount < 2) {
                const matchesJ = matchDataArray[j];
                const nameI = lobbyIds[i];
                if (matchesJ && matchesJ.allParticipants) {
                    matchesJ.allParticipants.forEach(participantsInMatch => {
                        if (participantsInMatch.includes(nameI)) {
                            commonCount++;
                        }
                    });
                }
            }

            // Detection threshold: at least 2 games together in history
            if (commonCount >= 2) {
                currentGroup.push(j);
                processed.add(j);
            }
        }

        if (currentGroup.length > 1) {
            groups.push(currentGroup);
            processed.add(i);
        }
    }
    return groups;
}

export function getSoloQMatches(matches) {
    if (!matches || !matches.gameMode) return null;
    const soloIndices = [];
    for (let i = 0; i < matches.gameMode.length; i++) {
        if (matches.gameMode[i] === 420) soloIndices.push(i);
    }
    if (soloIndices.length === 0) return null;

    const result = {};
    Object.keys(matches).forEach(key => {
        if (Array.isArray(matches[key])) {
            result[key] = soloIndices.map(idx => matches[key][idx]);
        }
    });
    return result;
}
