/**
 * UI components and rendering for Nicklere Bakma v2
 */

import { injectStyles } from './styles.js';
import {
    calculateWinRate, mostCommonRole, calculateKDA,
    resolveQueueId, mergeMatchData, getSoloQMatches
} from './utils.js';
import {
    create, queryMatch, StaticData
} from './api.js';
import { fetchCounters, getSuggestions, analyzeTeam, getAvailableLanes } from './counters.js';

// Module State
let currentLobbyPlayers = [];
let activeFilter = 'ALL';
let currentHoveredPlayerIndex = -1;
let popoverTimer = null;
let isPopoverPinned = false;
let isModalOpen = false;
let loadingStartTime = 0;

export function updateLoadingProgress(percent, statusText) {
    const fill = document.getElementById('nbLoadFill');
    const status = document.getElementById('nbLoadStatus');
    const text = document.querySelector('.nb-loading-text');

    if (text) text.textContent = "Loading...";
    if (fill) fill.style.width = `${percent}%`;
    if (status) {
        if (percent > 0 && percent < 100) {
            const elapsed = Date.now() - loadingStartTime;
            const remaining = percent > 10 ? Math.round((elapsed / percent) * (100 - percent) / 1000) : '??';
            status.textContent = `${statusText || 'Loading...'} (${percent}% - ~${remaining}s)`;
        } else {
            status.textContent = statusText || 'Waiting for the next lobby...';
        }
    }
}

export function showLoading() {
    loadingStartTime = Date.now();
    const container = document.getElementById('sidebarContent');
    if (!container) return;

    container.innerHTML = `
        <div class="nb-loading-container" id="initialLoading">
            <div class="nb-loading-text">Loading...</div>
            <div class="nb-progress-bg">
                <div class="nb-progress-fill" id="nbLoadFill"></div>
            </div>
            <div class="nb-loading-status" id="nbLoadStatus">Loading...</div>
        </div>
    `;
}
// Add helper for copying text
window.copyNickToClipboard = async (text, btn) => {
    try {
        await navigator.clipboard.writeText(text);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2deb90" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 1500);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
};

window.copyAllNicks = async (btn) => {
    if (!currentLobbyPlayers || currentLobbyPlayers.length === 0) return;
    const nicks = currentLobbyPlayers.map(p => `${p.info.game_name}#${p.info.game_tag}`).join('\n');
    try {
        await navigator.clipboard.writeText(nicks);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>Copied All!</span>';
        btn.style.borderColor = '#2deb90';
        btn.style.color = '#2deb90';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 1500);
    } catch (err) {
        console.error('Failed to copy all nicks:', err);
    }
};

export function updateCloseButtonsVisibility() {
    const sidebarClose = document.getElementById('closeSidebar');
    const popoverClose = document.getElementById('closePopover');
    const modalClose = document.getElementById('closeModalBtn');

    const popover = document.getElementById('historyPopover');
    const countersPopover = document.getElementById('countersPopover');
    const modal = document.getElementById('matchDetailModal');

    const isModalVisible = modal?.classList.contains('visible');
    const isPopoverVisible = popover?.classList.contains('visible');
    const isCountersVisible = countersPopover?.classList.contains('visible');

    // Sync split layout state
    if (popover && countersPopover) {
        if (isPopoverVisible && isCountersVisible) {
            popover.classList.add('nb-split', 'nb-split-top');
            countersPopover.classList.add('nb-split', 'nb-split-bottom');
        } else {
            popover.classList.remove('nb-split', 'nb-split-top');
            countersPopover.classList.remove('nb-split', 'nb-split-bottom');
        }
    }

    // Default: Show sidebar close button
    if (sidebarClose) sidebarClose.style.display = 'flex';
    if (popoverClose) popoverClose.style.display = 'flex';
    if (modalClose) modalClose.style.display = 'flex';

    // Hide sidebar close button if ANY other panel is open (2nd or 3rd panels)
    if (isModalVisible || isPopoverVisible || isCountersVisible) {
        if (sidebarClose) sidebarClose.style.display = 'none';
    }

    // Special case: If the 3rd panel (Modal) is open, hide the 2nd panel's (Popover) close button
    if (isModalVisible) {
        if (popoverClose) popoverClose.style.display = 'none';
    }
}



export function createPopup(onToggle) {
    if (document.getElementById('infoSidebar')) return;

    injectStyles();

    const sidebarHtml = `
        <div id="infoSidebar" class="nb-sidebar">
            <div id="closeSidebar" class="nb-close-btn">×</div>
            <div class="nb-sidebar-header">
                <h2 class="nb-title">NICKPLS</h2>
                <div class="nb-copy-all-btn" onclick="window.copyAllNicks(this)">COPY ALL NICKS</div>
                <div id="headerLinks" class="nb-header-links"></div>
            </div>
            <div id="sidebarContent" class="nb-content">
                <div class="nb-loading-container" id="initialLoading">
                    <div class="nb-loading-text">Loading...</div>
                    <div class="nb-progress-bg">
                        <div class="nb-progress-fill" id="nbLoadFill"></div>
                    </div>
                    <div class="nb-loading-status" id="nbLoadStatus">Waiting for the next lobby...</div>
                </div>
            </div>
            <div class="nb-footer">
                <a href="https://discord.com/users/327464543288688640" class="nb-footer-item" onclick="window.open(this.href); return false;">
                    <svg class="nb-footer-icon" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.158-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.158-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"></path>
                    </svg>
                    <span>hadixcanim</span>
                </a>
                <a href="https://steamcommunity.com/id/Hadixcanim/" class="nb-footer-item" onclick="window.open(this.href); return false;">
                    <svg class="nb-footer-icon" viewBox="0 0 32 32">
                        <path d="M18.102 12.129c0-0 0-0 0-0.001 0-1.564 1.268-2.831 2.831-2.831s2.831 1.268 2.831 2.831c0 1.564-1.267 2.831-2.831 2.831-0 0-0 0-0.001 0h0c-0 0-0 0-0.001 0-1.563 0-2.83-1.267-2.83-2.83 0-0 0-0 0-0.001v0zM24.691 12.135c0-2.081-1.687-3.768-3.768-3.768s-3.768 1.687-3.768 3.768c0 2.081 1.687 3.768 3.768 3.768v0c2.080-0.003 3.765-1.688 3.768-3.767v-0zM10.427 23.76l-1.841-0.762c0.524 1.078 1.611 1.808 2.868 1.808 1.317 0 2.448-0.801 2.93-1.943l0.008-0.021c0.155-0.362 0.246-0.784 0.246-1.226 0-1.757-1.424-3.181-3.181-3.181-0.405 0-0.792 0.076-1.148 0.213l0.022-0.007 1.903 0.787c0.852 0.364 1.439 1.196 1.439 2.164 0 1.296-1.051 2.347-2.347 2.347-0.324 0-0.632-0.066-0.913-0.184l0.015 0.006zM15.974 1.004c-7.857 0.001-14.301 6.046-14.938 13.738l-0.004 0.054 8.038 3.322c0.668-0.462 1.495-0.737 2.387-0.737 0.001 0 0.002 0 0.002 0h-0c0.079 0 0.156 0.005 0.235 0.008l3.575-5.176v-0.074c0.003-3.12 2.533-5.648 5.653-5.648 3.122 0 5.653 2.531 5.653 5.653s-2.531 5.653-5.653 5.653h-0.131l-5.094 3.638c0 0.065 0.005 0.131 0.005 0.199 0 0.001 0 0.002 0 0.003 0 2.342-1.899 4.241-4.241 4.241-2.047 0-3.756-1.451-4.153-3.38l-0.005-0.027-5.755-2.383c1.841 6.345 7.601 10.905 14.425 10.905 8.281 0 14.994-6.713 14.994-14.994s-6.713-14.994-14.994-14.994c-0 0-0.001 0-0.001 0h0z"></path>
                    </svg>
                    <span>Ay muhteşemimm</span>
                </a>
                <div class="nb-counter-btn" id="openCountersBtn">
                    <svg class="nb-footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                    <span>Counter Pick</span>
                </div>
            </div>
        </div>
        
        <div id="countersPopover" class="nb-popover nb-draft-popover">
            <div id="closeCounters" class="nb-popover-close">×</div>
            <div class="nb-draft-container">
                <div class="nb-draft-header">BEST PICK ANALYZER</div>
                
                <div class="nb-draft-layout">
                    <!-- Left Side: Vertical Enemy Slots -->
                    <div class="nb-draft-sidebar">
                        <div class="nb-team-side-title red" style="margin-top: 0; margin-bottom: 1px; font-size: 10px;">ENEMY</div>
                        <div class="nb-draft-slots-vertical" id="redSlots">
                            <!-- Generic slots generated by JS or static -->
                            <div class="nb-enemy-slot red-slot" data-team="red" data-slot="0">
                                <div class="nb-lane-display"></div>
                                <div class="nb-inner-slot">+</div>
                                <div class="nb-enemy-slot-remove" title="Remove">×</div>
                            </div>
                            <div class="nb-enemy-slot red-slot" data-team="red" data-slot="1">
                                <div class="nb-lane-display"></div>
                                <div class="nb-inner-slot">+</div>
                                <div class="nb-enemy-slot-remove" title="Remove">×</div>
                            </div>
                            <div class="nb-enemy-slot red-slot" data-team="red" data-slot="2">
                                <div class="nb-lane-display"></div>
                                <div class="nb-inner-slot">+</div>
                                <div class="nb-enemy-slot-remove" title="Remove">×</div>
                            </div>
                            <div class="nb-enemy-slot red-slot" data-team="red" data-slot="3">
                                <div class="nb-lane-display"></div>
                                <div class="nb-inner-slot">+</div>
                                <div class="nb-enemy-slot-remove" title="Remove">×</div>
                            </div>
                            <div class="nb-enemy-slot red-slot" data-team="red" data-slot="4">
                                <div class="nb-lane-display"></div>
                                <div class="nb-inner-slot">+</div>
                                <div class="nb-enemy-slot-remove" title="Remove">×</div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side: Search & Analysis -->
                    <div class="nb-draft-body">
                        <div class="nb-draft-search-area">
                            <input type="text" id="counterSearch" placeholder="Search champion to add..." style="width: 100%; background: #010a13; border: 1px solid #c8aa6e; color: #f0e6d2; padding: 10px 12px; box-sizing: border-box; font-family: 'Spiegel', sans-serif; font-size: 12px; outline: none; transition: all 0.2s;">
                            <div id="counterSuggestions" class="nb-draft-sugg-box"></div>
                        </div>
                        <div id="countersResult" class="nb-draft-results">
                            <div style="color:#555; text-align:center; padding:40px;">Select enemy champions to analyze...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="historyPopover" class="nb-popover">
            <div id="closePopover" class="nb-popover-close">×</div>
            <div class="nb-filter-bar" id="historyFilters">
                <button class="nb-filter-btn active" data-filter="ALL">All</button>
                <button class="nb-filter-btn" data-filter="SOLO">SoloQ</button>
                <button class="nb-filter-btn" data-filter="FLEX">Flex</button>
                <button class="nb-filter-btn" data-filter="NORMAL">Normal</button>
            </div>
            <div id="historyList" class="nb-history-list"></div>
        </div>
        <div id="matchDetailModal" class="nb-detail-modal">
            <div class="nb-modal-content">
                <div class="nb-modal-header">
                    <div class="nb-modal-title" id="modalTitle">Match Details</div>
                    <div style="display:flex; align-items:center;">
                        <div class="nb-modal-minimize" id="collapseBtn" title="Collapse All">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                                <polyline points="11 17 6 12 11 7"></polyline>
                                <polyline points="18 17 13 12 18 7"></polyline>
                            </svg>
                        </div>
                        <div class="nb-modal-close" id="closeModalBtn">×</div>
                    </div>
                </div>
                <div class="nb-modal-body" id="modalBody">
                    <div style="margin:auto; color:#888;">Loading details...</div>
                </div>
            </div>
        </div>
        <button id="toggleButton" class="nb-toggle-btn" title="NickPls">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c8aa6e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
        </button>
    `;

    document.body.insertAdjacentHTML('beforeend', sidebarHtml);

    // Listeners
    document.getElementById('toggleButton').onclick = () => { toggleSidebar(); updateCloseButtonsVisibility(); };
    document.getElementById('closeSidebar').onclick = () => { toggleSidebar(); updateCloseButtonsVisibility(); };

    const modal = document.getElementById('matchDetailModal');
    document.getElementById('collapseBtn').onclick = (e) => {
        e.stopPropagation();
        toggleCollapse(true);
    };

    document.getElementById('infoSidebar').onclick = (e) => {
        const sidebar = document.getElementById('infoSidebar');
        if (sidebar.classList.contains('collapsed')) {
            toggleCollapse(false);
            e.stopPropagation();
        }
    };

    document.getElementById('closeModalBtn').onclick = () => {
        isModalOpen = false;
        modal.classList.remove('visible');
        updateCloseButtonsVisibility();
        setTimeout(() => {
            if (!isPopoverPinned) {
                const popover = document.getElementById('historyPopover');
                popover.classList.remove('visible');
                updateCloseButtonsVisibility();
            }
        }, 300);
    };

    const popover = document.getElementById('historyPopover');
    popover.onmouseenter = () => clearTimeout(popoverTimer);
    popover.onmouseleave = () => {
        if (!isModalOpen && !isPopoverPinned) {
            popover.classList.remove('visible');
            updateCloseButtonsVisibility();
        }
    };

    document.getElementById('closePopover').onclick = () => {
        isPopoverPinned = false;
        popover.classList.remove('visible');
        document.querySelectorAll('.nb-player-card').forEach(c => c.classList.remove('pinned'));
        updateCloseButtonsVisibility();
    };

    const filterBtns = document.querySelectorAll('.nb-filter-btn');
    filterBtns.forEach(btn => {
        btn.onclick = (e) => {
            activeFilter = e.target.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            if (currentHoveredPlayerIndex !== -1) {
                renderMatchHistory(currentLobbyPlayers[currentHoveredPlayerIndex], document.getElementById('historyList'), activeFilter);
            }
        };
    });
    // Counters UI Listeners
    const countersPopover = document.getElementById('countersPopover');
    const countersBtn = document.getElementById('openCountersBtn');
    const countersClose = document.getElementById('closeCounters');
    const searchInput = document.getElementById('counterSearch');
    const resultsDiv = document.getElementById('countersResult');

    let currentSlotIndex = 0;
    let redTeam = [null, null, null, null, null];
    let redLanes = [[], [], [], [], []];

    function updateLaneDisplay(index) {
        const slot = document.querySelector(`.red-slot[data-slot="${index}"]`);
        if (!slot) return;
        const display = slot.querySelector('.nb-lane-display');
        if (!display) return;
        display.innerHTML = '';

        redLanes[index].forEach(lane => {
            const icon = document.createElement('div');
            icon.className = `nb-lane-icon nb-lane-${lane}`;
            display.appendChild(icon);
        });
    }

    const updateDraftAnalysis = async () => {
        const red = redTeam.map((c, idx) => {
            if (!c) return null;
            return { name: c, lanes: redLanes[idx] };
        }).filter(item => item !== null);

        // Update search input state
        if (searchInput) {
            if (red.length >= 5) {
                searchInput.disabled = true;
                searchInput.placeholder = "Slots full! Remove to add more";
                searchInput.value = '';
            } else {
                searchInput.disabled = false;
                searchInput.placeholder = "Search champion to add...";
            }
        }

        if (red.length === 0) {
            resultsDiv.innerHTML = '<div style="color:#555; text-align:center; padding:40px;">Select enemy champions to analyze...</div>';
            return;
        }
        resultsDiv.innerHTML = '<div style="color:#888; padding:10px; text-align:center;">Analyzing Best Counters...</div>';
        const analysis = await analyzeTeam(red);
        renderTeamAnalysis(analysis, resultsDiv);
    };

    async function toggleLaneSelector(slotIndex) {
        const slot = document.querySelector(`.red-slot[data-slot="${slotIndex}"]`);
        let existingPanel = document.getElementById('nbActiveLanePanel');

        if (existingPanel) {
            const oldSlot = document.querySelector(`.red-slot[data-slot="${existingPanel.dataset.slot}"]`);
            if (oldSlot) oldSlot.classList.remove('panel-open');
            existingPanel.remove();
            if (existingPanel.dataset.slot === slotIndex.toString()) return;
        }

        const rect = slot.getBoundingClientRect();
        const panel = document.createElement('div');
        panel.id = 'nbActiveLanePanel';
        panel.dataset.slot = slotIndex;
        panel.className = 'nb-lane-selector-panel';
        panel.style.left = `${rect.right + 8}px`;
        panel.style.top = `${rect.top + (rect.height / 2) - 16}px`; // Center to slot

        slot.classList.add('panel-open');
        panel.onclick = (e) => e.stopPropagation();

        const championName = redTeam[slotIndex];
        let availableLanes = ['top', 'jng', 'mid', 'adc', 'sup'];

        if (championName) {
            const champLanes = await getAvailableLanes(championName);
            if (champLanes && champLanes.length > 0) availableLanes = champLanes;
        }

        availableLanes.forEach(lane => {
            const btn = document.createElement('div');
            btn.className = `nb-lane-option ${redLanes[slotIndex].includes(lane) ? 'selected' : ''}`;

            const icon = document.createElement('div');
            icon.className = `nb-lane-icon nb-lane-${lane}`;
            icon.style.width = '16px';
            icon.style.height = '16px';
            btn.appendChild(icon);

            btn.onclick = (e) => {
                e.stopPropagation();
                if (redLanes[slotIndex].includes(lane)) {
                    redLanes[slotIndex] = redLanes[slotIndex].filter(l => l !== lane);
                    btn.classList.remove('selected');
                } else {
                    redLanes[slotIndex].push(lane);
                    btn.classList.add('selected');
                }
                updateLaneDisplay(slotIndex);
                updateDraftAnalysis();
            };
            panel.appendChild(btn);
        });

        document.body.appendChild(panel);

        const closeHandler = (e) => {
            if (!panel.contains(e.target) && !slot.contains(e.target)) {
                panel.remove();
                slot.classList.remove('panel-open');
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 0);
    }

    async function addChampionToSlot(champName) {
        // Find the slot to use: either current candidate or the first available empty one
        let targetIndex = currentSlotIndex;
        if (redTeam[targetIndex] !== null) {
            targetIndex = redTeam.findIndex(champ => champ === null);
        }

        // Entire team is full, cannot add more
        if (targetIndex === -1) return;

        redTeam[targetIndex] = champName;
        const slot = document.querySelector(`.red-slot[data-slot="${targetIndex}"]`);
        const inner = slot.querySelector('.nb-inner-slot');

        await StaticData.ensureLoaded();
        const cid = StaticData.getChampIdByName(champName);
        if (cid !== -1) {
            inner.innerHTML = `<img src="/lol-game-data/assets/v1/champion-icons/${cid}.png" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">`;
        } else {
            inner.textContent = champName.substring(0, 2).toUpperCase();
        }

        slot.classList.add('filled');
        slot.classList.remove('active');
        slot.title = champName;

        const counters = await fetchCounters(champName);
        if (counters && counters.lane) {
            redLanes[targetIndex] = [counters.lane.toLowerCase()];
        }
        updateLaneDisplay(targetIndex);
        updateDraftAnalysis();

        // Automatically move "active" state to the next empty slot
        const nextEmpty = redTeam.findIndex(champ => champ === null);
        if (nextEmpty !== -1) {
            currentSlotIndex = nextEmpty;
            document.querySelectorAll('.red-slot').forEach(s => s.classList.remove('active'));
            const nextSlot = document.querySelector(`.red-slot[data-slot="${nextEmpty}"]`);
            if (nextSlot) nextSlot.classList.add('active');
        } else {
            // No slots left empty
            document.querySelectorAll('.red-slot').forEach(s => s.classList.remove('active'));
        }
    }

    if (countersBtn) {
        countersBtn.onclick = (e) => {
            e.stopPropagation();
            countersPopover.classList.toggle('visible');
            updateCloseButtonsVisibility();
        };
    }

    if (countersClose) {
        countersClose.onclick = () => {
            countersPopover.classList.remove('visible');
            updateCloseButtonsVisibility();
        };
    }

    document.querySelectorAll('.red-slot').forEach((slot, index) => {
        slot.addEventListener('click', (e) => {
            if (e.target.classList.contains('nb-enemy-slot-remove')) {
                redTeam[index] = null;
                redLanes[index] = [];
                slot.querySelector('.nb-inner-slot').textContent = '+';
                slot.classList.remove('filled');
                updateLaneDisplay(index);
                updateDraftAnalysis();

                // Automatically make the cleared slot active for the next search
                document.querySelectorAll('.red-slot').forEach(s => s.classList.remove('active'));
                slot.classList.add('active');
                currentSlotIndex = index;
                if (searchInput) searchInput.focus();

                e.stopPropagation();
            } else if (redTeam[index] && !e.target.closest('.nb-lane-selector-panel')) {
                toggleLaneSelector(index);
            } else {
                document.querySelectorAll('.red-slot').forEach(s => s.classList.remove('active'));
                slot.classList.add('active');
                currentSlotIndex = index;
                if (searchInput) searchInput.focus();
            }
        });
    });

    if (searchInput) {
        const suggDiv = document.getElementById('counterSuggestions');

        const showSuggestions = async () => {
            const val = searchInput.value.trim();
            if (!val) { suggDiv.style.display = 'none'; return; }
            suggDiv.style.display = 'block';
            suggDiv.innerHTML = '<div style="padding:10px; color:#888; font-size:11px;">Searching...</div>';

            try {
                let suggestions = await getSuggestions(val);
                suggestions = suggestions.filter(s => !redTeam.includes(s));

                if (suggestions.length > 0) {
                    await StaticData.ensureLoaded();

                    // Fetch available lanes for all suggestions
                    const suggestionsWithLanes = await Promise.all(
                        suggestions.map(async (s) => {
                            const lanes = await getAvailableLanes(s);
                            return { name: s, lanes: lanes || [] };
                        })
                    );

                    suggDiv.innerHTML = suggestionsWithLanes.map(({ name, lanes }) => {
                        const cid = StaticData.getChampIdByName(name);
                        const iconUrl = cid !== -1 ? `/lol-game-data/assets/v1/champion-icons/${cid}.png` : '';

                        // Create lane icons HTML
                        const laneIconsHtml = lanes.map(lane =>
                            `<div class="nb-lane-icon nb-lane-${lane}" style="width: 12px; height: 12px;"></div>`
                        ).join('');

                        return `
                        <div class="nb-suggestion-item" data-champ="${name}">
                            ${iconUrl ? `<img src="${iconUrl}">` : ''}
                            <span>${name}</span>
                            <div class="nb-suggestion-lanes" style="display: flex; gap: 3px; margin-left: auto;">
                                ${laneIconsHtml}
                            </div>
                        </div>`;
                    }).join('');

                    suggDiv.querySelectorAll('.nb-suggestion-item').forEach(item => {
                        item.onclick = async () => {
                            addChampionToSlot(item.dataset.champ);
                            searchInput.value = '';
                            suggDiv.style.display = 'none';
                        };
                    });
                } else {
                    suggDiv.innerHTML = '<div style="padding:10px; color:#555; font-size:11px;">No champions found.</div>';
                }
            } catch (err) {
                suggDiv.innerHTML = '<div style="padding:10px; color:#ff5859; font-size:11px;">Search failed.</div>';
            }
        };

        searchInput.oninput = showSuggestions;
        searchInput.onfocus = showSuggestions;

        // Shake if trying to click while disabled
        searchInput.parentElement.addEventListener('click', (e) => {
            if (searchInput.disabled) {
                searchInput.classList.remove('nb-search-shake');
                void searchInput.offsetWidth; // Trigger reflow
                searchInput.classList.add('nb-search-shake');
                setTimeout(() => searchInput.classList.remove('nb-search-shake'), 400);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target !== searchInput && !suggDiv.contains(e.target)) {
                suggDiv.style.display = 'none';
            }
        });
    }
}

function renderTeamAnalysis(data, container) {
    if (!data) return;

    const renderList = (list, color, label) => {
        const items = (list || []).map(c => {
            const cid = StaticData.getChampIdByName(c.name);
            const iconUrl = cid !== -1 ? `/lol-game-data/assets/v1/champion-icons/${cid}.png` : '';
            return `
                <div style="padding: 8px 15px; border-bottom: 1px solid rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; font-size: 13px; transition: all 0.2s;" onmouseover="this.style.background='rgba(200,170,110,0.05)'; this.style.paddingLeft='20px'" onmouseout="this.style.background='transparent'; this.style.paddingLeft='15px'">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${iconUrl ? `<img src="${iconUrl}" style="width: 24px; height: 24px; border: 1px solid #785a28; border-radius: 50%;">` : ''}
                        <span style="color:#f0e6d2; font-weight: 500; letter-spacing: 0.5px;">${c.name}</span>
                    </div>
                    <span style="color:${color}; font-weight: bold; font-family: 'Beaufort for LOL', serif; text-shadow: 0 0 10px ${color}44;">+${c.score}</span>
                </div>
            `;
        }).join('') || '<div style="color:#555; font-size:11px; padding:30px; text-align:center;">No strong counters found for this composition.</div>';

        return `
            <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(200,170,110,0.15); box-shadow: inset 0 0 20px rgba(0,0,0,0.3); margin-bottom: 15px;">
                <div style="color:${color}; font-family: 'Beaufort for LOL', serif; font-weight: bold; font-size: 11px; padding: 10px; background: rgba(200,170,110,0.05); border-bottom: 1px solid rgba(200,170,110,0.2); text-align: center; letter-spacing: 2px;">${label}</div>
                <div>${items}</div>
            </div>
        `;
    };

    container.innerHTML = `
        <div style="width: 100%; box-sizing: border-box; margin-top: 10px;">
            ${renderList(data.recommended, '#1ee768', 'RECOMMENDED BEST PICKS')}
        </div>
    `;
}

export function toggleSidebar() {
    const sidebar = document.getElementById('infoSidebar');
    if (!sidebar) return;
    sidebar.classList.toggle('visible');
}

export function populateContent(displayData, linkHTML, matchData, lobby, ranks, summoners, premadeGroups = []) {
    const container = document.getElementById('sidebarContent');
    const popover = document.getElementById('historyPopover');
    const listContainer = document.getElementById('historyList');
    if (!container) return;

    container.innerHTML = '';
    currentLobbyPlayers = displayData.map((_, i) => {
        const groupIndex = premadeGroups.findIndex(g => g.includes(i));
        return {
            info: lobby[i],
            matches: matchData[i],
            rank: ranks[i] || 'Unranked',
            summoner: summoners ? summoners[i] : null,
            premadeGroup: groupIndex !== -1 ? groupIndex + 1 : null
        };
    });

    displayData.forEach((_, index) => {
        const p = lobby[index];
        const r = ranks[index] || 'Unranked';
        const m = matchData[index];

        // Base stats purely on SoloQ
        const soloMatches = getSoloQMatches(m);
        const win = soloMatches?.winList ? calculateWinRate(soloMatches.winList) : "N/A";
        const role = m?.laneList ? mostCommonRole(m.laneList) : "N/A";
        const kda = soloMatches ? calculateKDA(soloMatches.killList, soloMatches.assistsList, soloMatches.deathsList).replace(" KDA", "") : "N/A";

        const card = document.createElement('div');
        card.className = 'nb-player-card';

        card.innerHTML = `
            <div class="nb-card-header">
                <div>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <span class="nb-card-name">${p.game_name}</span>
                        <div class="nb-copy-btn" onclick="event.stopPropagation(); window.copyNickToClipboard('${p.game_name.replace(/'/g, "\\'")}#${p.game_tag}', this)" title="Copy Nick">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </div>
                    </div>
                    <div class="nb-card-tag" style="margin-top:2px; display:block;">#${p.game_tag}</div>
                </div>
                <div class="nb-card-rank">${r}</div>
            </div>
            <div class="nb-card-stats">
                <div class="nb-stat-block">
                    <div class="nb-stat-value">${win}</div>
                    <div class="nb-stat-label">WINRATE</div>
                </div>
                <div class="nb-stat-block">
                    <div class="nb-stat-value">${role}</div>
                    <div class="nb-stat-label">ROLE</div>
                </div>
                <div class="nb-stat-block">
                    <div class="nb-stat-value">${kda}</div>
                    <div class="nb-stat-label">KDA</div>
                </div>
            </div>
        `;

        // Premade detection display
        const groupIndex = premadeGroups.findIndex(g => g.includes(index));
        if (groupIndex !== -1) {
            const badge = document.createElement('div');
            badge.className = 'nb-premade-badge';
            badge.textContent = `P${groupIndex + 1}`;
            badge.style.borderBottom = `2px solid ${['#ff5859', '#2deb90', '#0acbe6', '#f0e6d2', '#888'][groupIndex % 5]}`;
            card.appendChild(badge);
        }

        card.onmouseenter = (e) => {
            clearTimeout(popoverTimer);
            // If someone is pinned, don't change the popover content on hover
            if (isPopoverPinned) return;

            currentHoveredPlayerIndex = index;
            try {
                const popover = document.getElementById('historyPopover');
                renderProfileHeader(currentLobbyPlayers[index]);
                renderMatchHistory(currentLobbyPlayers[index], listContainer, activeFilter);
                popover.classList.add('visible');
                updateCloseButtonsVisibility();
            } catch (err) {
                console.error(err);
            }
        };

        card.onmouseleave = () => {
            if (!isModalOpen && !isPopoverPinned) {
                popoverTimer = setTimeout(() => {
                    popover.classList.remove('visible');
                    updateCloseButtonsVisibility();
                }, 200);
            }
        };

        card.onclick = (e) => {
            e.stopPropagation();
            if (currentHoveredPlayerIndex === index && isPopoverPinned) {
                // Toggle off
                isPopoverPinned = false;
                card.classList.remove('pinned');
                updateCloseButtonsVisibility();
            } else {
                // Switch pin or turn on
                document.querySelectorAll('.nb-player-card').forEach(c => c.classList.remove('pinned'));
                isPopoverPinned = true;
                currentHoveredPlayerIndex = index;
                card.classList.add('pinned');
                renderProfileHeader(currentLobbyPlayers[index]);
                renderMatchHistory(currentLobbyPlayers[index], listContainer, activeFilter);
                popover.classList.add('visible');
                updateCloseButtonsVisibility();
            }
        };

        container.appendChild(card);
    });

    const headerLinks = document.getElementById('headerLinks');
    if (headerLinks) {
        headerLinks.innerHTML = `<div class="nb-links">${linkHTML}</div>`;
    }
}

function renderProfileHeader(playerData) {
    const popover = document.getElementById('historyPopover');
    let header = document.getElementById('nb-profile-header');
    if (!header) {
        header = document.createElement('div');
        header.id = 'nb-profile-header';
        header.className = 'nb-profile-header';
        popover.prepend(header);
    }

    if (!playerData || !playerData.info) return;

    const { info, matches, rank, summoner = {} } = playerData;
    let wins = 0, total = 0, kills = 0, deaths = 0, assists = 0;
    const champCounts = {}, roleCounts = {};

    // For Main Champ/Role, we still use full history to be accurate
    if (matches && matches.gameId) {
        for (let i = 0; i < matches.gameId.length; i++) {
            const cid = matches.championId[i];
            champCounts[cid] = (champCounts[cid] || 0) + 1;
            const role = matches.laneList[i] || 'NONE';
            if (role !== 'NONE') roleCounts[role] = (roleCounts[role] || 0) + 1;
        }
    }

    // For WR and KDA, only SoloQ
    const solo = getSoloQMatches(matches);
    if (solo) {
        total = solo.gameId.length;
        for (let i = 0; i < total; i++) {
            if (solo.winList[i] === "true" || solo.winList[i] === true) wins++;
            kills += (solo.killList[i] || 0);
            deaths += (solo.deathsList[i] || 0);
            assists += (solo.assistsList[i] || 0);
        }
    }

    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const kda = total > 0 && deaths === 0 ? "Perfect" : total > 0 ? ((kills + assists) / deaths).toFixed(2) : "N/A";

    // Get top 3 champions
    const topChamps = Object.entries(champCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    if (topChamps.length === 0) topChamps.push(-1);

    const iconId = summoner?.profileIconId || info.icon || 29;
    const iconUrl = `/lol-game-data/assets/v1/profile-icons/${iconId}.jpg`;

    // Generate HTML for top champs
    // Generate HTML for top champs with specific order: 2nd, 1st (Main), 3rd
    const orderedChamps = [];
    if (topChamps[1]) orderedChamps.push({ cid: topChamps[1], rank: 2 });
    if (topChamps[0]) orderedChamps.push({ cid: topChamps[0], rank: 1 });
    if (topChamps[2]) orderedChamps.push({ cid: topChamps[2], rank: 3 });

    const champsHtml = orderedChamps.map(item => {
        const cid = item.cid;
        const url = cid != -1
            ? `/lol-game-data/assets/v1/champion-icons/${cid}.png`
            : `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`;

        const sizeClass = item.rank === 1 ? 'main' : 'sub';
        return `<img src="${url}" class="nb-stat-champ-icon ${sizeClass}" title="Rank ${item.rank}" style="order: ${item.rank === 1 ? 2 : (item.rank === 2 ? 1 : 3)}">`;
    }).join('');

    header.innerHTML = `
        <div class="nb-profile-container">
            <div class="nb-profile-top">
                <div class="nb-profile-icon-wrap">
                    <img src="${iconUrl}" class="nb-profile-img">
                        <div class="nb-profile-level">${summoner?.summonerLevel || '??'}</div>
                </div>
                <div class="nb-profile-info">
                    <div class="nb-profile-name-row">
                        <span class="nb-profile-name">${info.game_name}</span>
                        <div class="nb-copy-btn" onclick="window.copyNickToClipboard('${info.game_name.replace(/'/g, "\\'")}#${info.game_tag}', this)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </div>
                </div>
                <div class="nb-profile-tagline">#${info.game_tag} • <span class="nb-profile-rank-text">${rank}</span></div>
            </div>
        </div>

        <div class="nb-profile-stats-grid">
            <div class="nb-stat-item">
                <span class="nb-stat-label">WINRATE</span>
                <span class="nb-stat-value" style="color:${winRate >= 50 ? '#00efff' : '#ff5859'}">${winRate}%</span>
            </div>
            <div class="nb-stat-divider"></div>
            <div class="nb-stat-item">
                <span class="nb-stat-label">KDA</span>
                <span class="nb-stat-value">${kda}</span>
            </div>
            <div class="nb-stat-divider"></div>
            <div class="nb-stat-item top-champs">
                <div class="nb-stat-label">TOP 3</div>
                <div class="nb-champs-list">
                    ${champsHtml}
                </div>
            </div>
        </div>
        </div>
    `;
}

function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${min}`;
}

function renderMatchHistory(fullPlayer, container, filter = 'ALL') {
    container.innerHTML = '';
    container.scrollTop = 0; // Auto-scroll to top for new player
    if (!fullPlayer || !fullPlayer.matches) {
        container.innerHTML = '<div style="padding:10px; text-align:center; color:#888;">No data available</div>';
        return;
    }

    const { championId, killList, deathsList, assistsList, winList, gameMode, laneList, gameId, gameCreation } = fullPlayer.matches;
    let displayedCount = 0;

    for (let i = 0; i < championId.length; i++) {
        const mode = gameMode[i];
        const isSolo = mode === 420;
        const isFlex = mode === 440;
        const isNormal = [400, 430, 490].includes(mode);

        let passes = false;
        if (filter === 'ALL') {
            passes = isSolo || isFlex || isNormal;
        } else if (filter === 'SOLO') {
            passes = isSolo;
        } else if (filter === 'FLEX') {
            passes = isFlex;
        } else if (filter === 'NORMAL') {
            passes = isNormal;
        }

        if (!passes) continue;

        const isWin = String(winList[i]) === "true";
        const row = document.createElement('div');
        row.className = `nb-match-row ${isWin ? 'win' : 'loss'}`;
        row.dataset.gameId = gameId[i];
        row.style.cursor = 'pointer';
        row.onclick = () => openMatchDetail(gameId[i]);

        const lane = (laneList?.[i] || 'NONE').toUpperCase();
        const laneClass = lane === 'MIDDLE' ? 'mid' : (lane === 'JUNGLE' ? 'jng' : (lane === 'BOTTOM' ? 'bot' : (lane === 'UTILITY' ? 'sup' : lane.toLowerCase())));

        row.innerHTML = `
            <img src="/lol-game-data/assets/v1/champion-icons/${championId[i]}.png" class="nb-champ-icon" onerror="this.src='https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png'">
            <div class="nb-row-info">
                <span class="nb-result-label">${isWin ? 'WIN' : 'LOSS'}</span>
                <span class="nb-queue-label">${resolveQueueId(mode)}</span>
            </div>
            <div class="nb-lane-icon nb-lane-${laneClass}" style="margin-left: 10px; margin-right: 12px; flex-shrink:0;"></div>
            <div class="nb-match-date">${formatDate(gameCreation?.[i])}</div>
            <div class="nb-kda">${killList[i]} / ${deathsList[i]} / ${assistsList[i]}</div>
        `;
        container.appendChild(row);
        displayedCount++;
    }

    const loadBtn = document.createElement('div');
    loadBtn.className = 'nb-load-more';
    loadBtn.textContent = 'LOAD MORE (+10)';
    loadBtn.onclick = async () => {
        if (loadBtn.classList.contains('loading')) return;
        loadBtn.classList.add('loading');
        loadBtn.textContent = 'Loading...';
        try {
            const current = fullPlayer.matches.gameId.length;
            const newMatches = await queryMatch(fullPlayer.info.puuid, current, current + 9);
            if (newMatches && newMatches.gameId.length > 0) {
                const existing = new Set(fullPlayer.matches.gameId);
                const uniqueIndices = newMatches.gameId.map((id, idx) => !existing.has(id) ? idx : null).filter(x => x !== null);
                if (uniqueIndices.length > 0) {
                    const unique = {};
                    Object.keys(newMatches).forEach(key => unique[key] = uniqueIndices.map(idx => newMatches[key][idx]));
                    mergeMatchData(fullPlayer.matches, unique);
                    renderMatchHistory(fullPlayer, container, filter);
                } else {
                    loadBtn.textContent = 'No more matches';
                }
            } else {
                loadBtn.textContent = 'No more matches';
            }
        } catch (e) {
            loadBtn.classList.remove('loading');
            loadBtn.textContent = 'An error occurred';
        }
    };
    container.appendChild(loadBtn);
}

async function openMatchDetail(gameId) {
    isModalOpen = true;
    const modal = document.getElementById('matchDetailModal');
    const modalBody = document.getElementById('modalBody');
    if (!modal || !modalBody) return;

    // Highlight active row in history list
    document.querySelectorAll('.nb-match-row').forEach(r => {
        r.classList.remove('active');
        if (r.dataset.gameId == gameId) r.classList.add('active');
    });

    // If modal isn't visible, show it with loading
    if (!modal.classList.contains('visible')) {
        modalBody.innerHTML = '<div style="margin:auto; color:#c8aa6e; font-size:16px;">Loading match data...</div>';
        modal.classList.add('visible');
        updateCloseButtonsVisibility();
    } else {
        // If already visible, just slightly dim it to show work is happening
        modalBody.style.opacity = '0.5';
    }

    try {
        await StaticData.ensureLoaded();
        const game = await create('GET', `/lol-match-history/v1/games/${gameId}`);
        modalBody.style.opacity = '1';
        renderDetailModal(game, modalBody);
    } catch (e) {
        modalBody.style.opacity = '1';
        modalBody.innerHTML = '<div style="color:#ff5859; margin:auto;">Could not load match details.</div>';
    }
}

function renderDetailModal(game, container) {
    const duration = `${Math.floor(game.gameDuration / 60)}:${(game.gameDuration % 60).toString().padStart(2, '0')}`;
    document.getElementById('modalTitle').textContent = `${resolveQueueId(game.queueId)} (${duration})`;

    const team100 = game.participants.filter(p => p.teamId === 100);
    const team200 = game.participants.filter(p => p.teamId === 200);
    const team100Win = team100[0].stats.win;

    const stats = team => ({
        k: team.reduce((a, p) => a + p.stats.kills, 0),
        d: team.reduce((a, p) => a + p.stats.deaths, 0),
        a: team.reduce((a, p) => a + p.stats.assists, 0),
        g: (team.reduce((a, p) => a + p.stats.goldEarned, 0) / 1000).toFixed(1) + 'k'
    });

    const s1 = stats(team100), s2 = stats(team200);

    container.innerHTML = `
        <div class="nb-game-summary">
            <span style="color:${team100Win ? '#2deb90' : '#ff5859'}">${team100Win ? 'VICTORY' : 'DEFEAT'}</span>
            <span>${s1.k}/${s1.d}/${s1.a} <small>(${s1.g})</small></span>
            <span style="color:#888; font-size:12px;">VS</span>
            <span>${s2.k}/${s2.d}/${s2.a} <small>(${s2.g})</small></span>
            <span style="color:${!team100Win ? '#2deb90' : '#ff5859'}">${!team100Win ? 'VICTORY' : 'DEFEAT'}</span>
        </div>
        <div class="nb-teams-split">
            <div class="nb-team-block ${team100Win ? 'nb-team-win' : 'nb-team-loss'}">
                <div class="nb-team-header">BLUE TEAM</div>
                ${team100.map(p => renderDetailRow(p, game.participantIdentities, game.gameDuration)).join('')}
            </div>
            <div class="nb-team-block ${!team100Win ? 'nb-team-win' : 'nb-team-loss'}">
                <div class="nb-team-header">RED TEAM</div>
                ${team200.map(p => renderDetailRow(p, game.participantIdentities, game.gameDuration)).join('')}
            </div>
        </div>
    `;
}

function renderDetailRow(p, identities, duration) {
    const id = identities.find(i => i.participantId === p.participantId);
    const s = p.stats;
    const items = [0, 1, 2, 3, 4, 5].map(i => s[`item${i}`] ? `<img class="nb-item-icon" src="${StaticData.getItemIcon(s[`item${i}`])}">` : `<div class="nb-item-icon"></div>`).join('');
    const kda = s.deaths === 0 ? "Perfect" : ((s.kills + s.assists) / s.deaths).toFixed(2);

    const knownPlayer = currentLobbyPlayers.find(lp => {
        const lpName = lp.info.game_name?.toLowerCase().trim();
        const lpTag = lp.info.game_tag?.toLowerCase().trim();
        const idName = id.player?.gameName?.toLowerCase().trim();
        const idTag = id.player?.tagLine?.toLowerCase().trim();

        return (lp.info.puuid && id.player?.puuid && lp.info.puuid === id.player.puuid) ||
            (lpName === idName && lpTag === idTag);
    });
    const premadeLabel = knownPlayer?.premadeGroup
        ? `<div class="nb-detail-premade" style="border-color:${['#ff5859', '#2deb90', '#0acbe6', '#f0e6d2'][knownPlayer.premadeGroup % 4]}">PREMADE ${knownPlayer.premadeGroup}</div>`
        : '';

    return `
        <div class="nb-score-row">
             <div class="nb-row-top">
                <div class="nb-champ-container">
                    <img src="/lol-game-data/assets/v1/champion-icons/${p.championId}.png" class="nb-detail-icon">
                    <div class="nb-lvl-badge">${s.champLevel}</div>
                </div>
                <div class="nb-spells-runes" style="margin-left:8px;">
                    <div class="nb-spell-row">
                        <img class="nb-small-icon" src="${StaticData.getSpellIcon(p.spell1Id)}">
                        <img class="nb-small-icon" src="${StaticData.getSpellIcon(p.spell2Id)}">
                    </div>
                    <div class="nb-spell-row" style="margin-top:2px;">
                        <img class="nb-small-icon" src="${StaticData.getPerkIcon(s.perk0)}">
                        <img class="nb-small-icon" style="background:#333" src="${StaticData.getPerkStyleIcon(s.perkSubStyle)}">
                    </div>
                </div>
                <div class="nb-player-info">
                    <div class="nb-detail-name">${id.player.gameName}</div>
                    <div style="display:flex; align-items:center;">
                        <span style="color:#888; font-size:10px; margin-top:1px;">#${id.player.tagLine}</span>
                        <div class="nb-copy-btn" onclick="copyNickToClipboard('${id.player.gameName}#${id.player.tagLine}', this)" title="Copy Nick#Tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </div>
                    </div>
                    ${premadeLabel}
                </div>
                <div class="nb-kda-container">
                    <div class="nb-kda-score">${s.kills}/${s.deaths}/${s.assists}</div>
                    <div class="nb-kda-ratio">${kda} KDA</div>
                </div>
             </div>
             <div class="nb-row-bottom">
                <div class="nb-items-container">${items}<img class="nb-trinket-icon" src="${StaticData.getItemIcon(s.item6)}"></div>
                <div class="nb-stats-container">
                    <div>${s.totalMinionsKilled + s.neutralMinionsKilled} CS</div>
                    <div style="color:#c8aa6e">${(s.goldEarned / 1000).toFixed(1)}k Gold</div>
                </div>
             </div>
        </div>
    `;
}

function toggleCollapse(collapsed) {
    const ids = ['infoSidebar', 'historyPopover', 'matchDetailModal', 'countersPopover'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (collapsed) el.classList.add('collapsed');
            else el.classList.remove('collapsed');
        }
    });
}

export function removeSidebar() {
    ['infoSidebar', 'toggleButton', 'historyPopover', 'matchDetailModal', 'countersPopover'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
}
