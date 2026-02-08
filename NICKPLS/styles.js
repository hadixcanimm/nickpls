/**
 * CSS styles and injection for Nicklere Bakma v2
 */

export function injectStyles() {
    const existingStyle = document.getElementById('nb-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'nb-styles';
    style.textContent = `
        .nb-sidebar {
            position: fixed;
            top: 0; left: 0;
            width: 320px; height: 100%;
            background: rgba(8, 12, 16, 0.95);
            backdrop-filter: blur(16px);
            border-right: 1px solid rgba(200, 170, 110, 0.3);
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.6);
            z-index: 10005;
            padding: 24px;
            overflow: visible; /* Fix: Allow handle/triangle to be seen outside */
            color: #f0e6d2;
            font-family: "Beaufort for LOL", "Helvetica Neue", sans-serif;
            display: flex; flex-direction: column;
            transform: translateX(-100%);
            opacity: 0;
            pointer-events: none;
            box-sizing: border-box;
            transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.4s ease;
        }

        .nb-sidebar.visible {
            transform: translateX(0);
            opacity: 1;
            pointer-events: auto;
        }

        .nb-sidebar.visible.collapsed {
            transform: translateX(-316px); /* Only 4px of the sidebar strip stays visible */
            opacity: 1;
            pointer-events: auto;
            cursor: pointer;
            border-right: 1px solid rgba(200, 170, 110, 0.5);
            background: rgba(8, 12, 16, 0.95);
            box-shadow: none;
        }

        /* Prominent Side Handle for Collapsed State */
        .nb-sidebar.collapsed::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 100%;
            transform: translateY(-50%);
            width: 24px;
            height: 100px;
            background: linear-gradient(to right, #010a13, #1e2328);
            border: 2px solid #c8aa6e;
            border-left: none;
            border-radius: 0 12px 12px 0;
            cursor: pointer;
            box-shadow: 5px 0 20px rgba(0, 0, 0, 0.9), inset -2px 0 10px rgba(200, 170, 110, 0.1);
            z-index: 10006;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nb-sidebar.collapsed:hover::after {
            width: 32px;
            background: linear-gradient(to right, #010a13, #3c3c41);
            box-shadow: 10px 0 25px rgba(200, 170, 110, 0.25);
            border-color: #f0e6d2;
        }

        /* The arrow inside the handle */
        .nb-sidebar.collapsed::before {
            content: "»";
            position: absolute;
            top: 50%;
            left: calc(100% + 4px);
            transform: translateY(-50%);
            color: #c8aa6e;
            font-size: 24px;
            font-family: serif;
            font-weight: bold;
            z-index: 10007;
            pointer-events: none;
            text-shadow: 0 0 10px rgba(200, 170, 110, 0.8);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nb-sidebar.collapsed:hover::before {
            left: calc(100% + 10px);
            color: #f0e6d2;
            text-shadow: 0 0 15px #f0e6d2;
            transform: translateY(-50%) scale(1.2);
        }

        .nb-popover {
            position: fixed;
            top: 0;
            left: 320px; /* Sidebar width */
            width: 320px;
            height: 100%;
            background: rgba(8, 12, 16, 0.95); /* Dark theme */
            backdrop-filter: blur(16px);
            border: 1px solid rgba(200, 170, 110, 0.3);
            border-left: none; /* Merges with sidebar */
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.6);
            z-index: 10004; /* Below sidebar */
            padding: 0;
            color: #f0e6d2;
            font-family: inherit;
            display: flex;
            flex-direction: column;
            transform: translateX(-100%);
            opacity: 0;
            pointer-events: none;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-sizing: border-box;
        }


        .nb-toggle-btn {
            position: fixed;
            bottom: 25px;
            left: 365px; 
            width: 28px;
            height: 28px;
            background: rgba(1, 10, 19, 0.95);
            border: 1px solid #785a28;
            color: #c8aa6e;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 100; 
            transition: all 0.2s ease;
            box-shadow: 0 0 10px rgba(0,0,0,0.8);
            backdrop-filter: blur(4px);
        }

        .nb-toggle-btn svg {
            width: 14px;
            height: 14px;
        }

        .nb-toggle-btn:hover {
            box-shadow: 0 0 15px rgba(200, 170, 110, 0.6), inset 0 0 10px rgba(200, 170, 110, 0.2);
            color: #f0e6d2;
            border-color: #f0e6d2;
            background: rgba(1, 10, 19, 0.95);
            transform: scale(1.1);
        }

        .nb-popover.visible {
            opacity: 1;
            transform: translateX(0);
            pointer-events: auto;
        }

        .nb-popover.nb-split {
            width: 320px !important;
            overflow: hidden !important;
            border-bottom: none !important;
        }

        .nb-popover.nb-split-top {
            top: 0 !important;
            height: calc(50% + 20px) !important;
            border-bottom: 2px solid #785a28 !important;
        }

        .nb-popover.nb-split-bottom {
            top: calc(50% + 20px) !important;
            height: calc(50% - 20px) !important;
            bottom: 0 !important;
        }

        .nb-popover.visible.collapsed {
            transform: translateX(-640px);
            opacity: 0;
            pointer-events: none;
        }

        .nb-popover-close {
            position: absolute;
            top: 8px; /* Centered for 40px header (40-24)/2 */
            right: 8px;
            width: 24px; 
            height: 24px;
            background: rgba(30, 35, 40, 0.9);
            border: 1px solid #785a28;
            color: #c8aa6e;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            font-size: 14px;
            z-index: 10010;
            transition: all 0.2s;
            pointer-events: auto;
            border-radius: 2px;
        }

        .nb-popover-close:hover {
            background: #c8aa6e;
            color: #010a13;
        }

        .nb-filter-bar {
            padding: 6px;
            border-bottom: 1px solid rgba(200, 170, 110, 0.2);
            background: rgba(20, 25, 30, 0.95);
            display: flex;
            gap: 4px;
            justify-content: center;
        }

        .nb-filter-btn {
            background: #1e2328;
            border: 1px solid #785a28;
            color: #a09b8c;
            font-size: 10px;
            padding: 4px 10px;
            cursor: pointer;
            transition: all 0.2s;
            font-family: "Spiegel", sans-serif;
            text-transform: capitalize;
            border-radius: 2px;
        }

        .nb-filter-btn:hover {
            border-color: #c8aa6e;
            color: #f0e6d2;
            background: #3c3c41;
        }

        .nb-filter-btn.active {
            background: #1e2328;
            border: 2px solid #c8aa6e;
            color: #f0e6d2;
            box-shadow: inset 0 0 5px rgba(200, 170, 110, 0.2);
        }

        .nb-history-list {
            padding: 8px;
            padding-bottom: 80px; 
            overflow-y: auto;
            flex: 1; /* Take all remaining height */
        }

        .nb-history-list::-webkit-scrollbar { width: 6px; }
        .nb-history-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        .nb-history-list::-webkit-scrollbar-thumb { background: #c8aa6e; border-radius: 3px; }

        .nb-match-row {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            margin-bottom: 6px;
            background: linear-gradient(to right, rgba(1, 10, 19, 0.8), rgba(10, 14, 18, 0.6));
            border: 1px solid rgba(200, 170, 110, 0.1);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            border-radius: 0; /* Riot theme is very square */
        }
        
        .nb-match-row:hover {
            background: linear-gradient(to right, rgba(30, 35, 40, 0.9), rgba(10, 14, 18, 0.8));
            border-color: rgba(200, 170, 110, 0.4);
            transform: translateX(4px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        }

        .nb-match-row.win {
            border-left: 3px solid #00efff;
            background: linear-gradient(90deg, rgba(0, 239, 255, 0.05) 0%, rgba(1, 10, 19, 0.8) 100%);
        }

        .nb-match-row.loss {
            border-left: 3px solid #ff5859;
            background: linear-gradient(90deg, rgba(255, 88, 89, 0.05) 0%, rgba(1, 10, 19, 0.8) 100%);
        }

        .nb-match-row.win::after {
            content: ''; position: absolute; top:0; left:0; bottom:0; width: 40px;
            background: linear-gradient(to right, rgba(0, 239, 255, 0.05), transparent);
            pointer-events: none;
        }

        .nb-match-row.loss::after {
            content: ''; position: absolute; top:0; left:0; bottom:0; width: 40px;
            background: linear-gradient(to right, rgba(255, 88, 89, 0.05), transparent);
            pointer-events: none;
        }

        .nb-match-row.active {
            border: 1px solid #c8aa6e !important;
            border-left: 3px solid #c8aa6e !important;
            background: rgba(200, 170, 110, 0.1) !important;
            box-shadow: inset 0 0 15px rgba(200, 170, 110, 0.05), 0 0 20px rgba(0, 0, 0, 0.6);
        }

        .nb-champ-icon {
            width: 36px; height: 36px;
            border: 1px solid #c8aa6e;
            margin-right: 14px;
            flex-shrink: 0;
            box-shadow: 0 0 10px rgba(0,0,0,0.8);
            border-radius: 0;
            background: #010a13;
        }

        .nb-row-info {
            display: flex;
            flex-direction: column;
            width: 70px;
            flex-shrink: 0;
        }

        .nb-result-label {
            font-weight: 700;
            font-size: 13px;
            font-family: "Beaufort for LOL", serif;
            letter-spacing: 0.5px;
        }

        .win .nb-result-label { color: #00efff; text-shadow: 0 0 8px rgba(0, 239, 255, 0.3); }
        .loss .nb-result-label { color: #ff5859; text-shadow: 0 0 8px rgba(255, 88, 89, 0.3); }

        .nb-queue-label {
            font-size: 10px;
            color: #888;
            margin-top: -2px;
        }

        .nb-match-date {
            font-size: 8px;
            color: #666;
            flex: 1;
            text-align: right;
            padding-right: 10px;
            font-family: "Spiegel", sans-serif;
            line-height: 1.2;
            opacity: 0.8;
        }

        .nb-kda {
            font-weight: 700;
            color: #f0e6d2;
            font-size: 11px;
            width: 65px;
            text-align: right;
            font-family: "Beaufort for LOL", serif;
            letter-spacing: 0.2px;
            flex-shrink: 0;
        }


        .nb-close-btn {
            position: absolute; top: 20px; right: 20px;
            font-size: 24px; color: #888; cursor: pointer; transition: color 0.2s;
        }

        .nb-close-btn:hover { color: #fff; }

        .nb-content {
            margin-top: 5px;
            display: flex; flex-direction: column; gap: 4px;
            flex: 1;
            overflow: hidden;
        }

        .nb-content::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }

        .nb-player-card {
            position: relative;
            background: transparent;
            border: 1px solid rgba(200, 170, 110, 0.2);
            padding: 0;
            margin-bottom: 0;
            display: flex;
            flex-direction: column;
            gap: 0;
            transition: all 0.2s;
            cursor: pointer;
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
            flex-shrink: 0;
            overflow: hidden;
        }

        .nb-player-card::before {
            content: "";
            position: absolute;
            top: 0; left: 0; bottom: 0;
            width: 3px;
            background: #c8aa6e;
            opacity: 0.7;
        }

        .nb-player-card:hover {
            border-color: rgba(200, 170, 110, 0.8);
            background: rgba(30, 35, 40, 0.8);
            box-shadow: inset 0 0 15px rgba(200, 170, 110, 0.1);
        }

        .nb-player-card.pinned {
            border-color: #c8aa6e;
            background: rgba(200, 170, 110, 0.1);
            box-shadow: inset 0 0 20px rgba(200, 170, 110, 0.05);
        }

        .nb-player-card.pinned::before {
            opacity: 1;
            box-shadow: 0 0 10px #c8aa6e;
        }

        .nb-card-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding: 6px 10px;
            background: rgba(30, 35, 40, 0.6);
            transition: background 0.2s;
        }

        .nb-player-card:hover .nb-card-header {
            background: rgba(200, 170, 110, 0.08);
        }

        .nb-card-name {
            font-size: 15px;
            font-weight: 700;
            color: #f0e6d2;
            font-family: "Beaufort for LOL", serif;
        }

        .nb-card-tag {
            font-size: 11px;
            color: #888;
            font-weight: normal;
        }

        .nb-card-rank {
            font-size: 13px;
            color: #c8aa6e;
            font-weight: bold;
            font-family: "Beaufort for LOL", serif;
        }

        .nb-card-stats {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            background: rgba(1, 10, 19, 0.5);
        }

        .nb-stat-block {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .nb-stat-value {
            font-size: 11px;
            font-weight: bold;
            color: #f0e6d2;
            line-height: 1.2;
        }

        .nb-stat-label {
            font-size: 8px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 1px;
        }

        .nb-premade-badge {
            position: absolute;
            top: -8px; right: 5px;
            font-size: 8px;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 3px;
            background: #c8aa6e;
            color: #010a13;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
            pointer-events: none;
            z-index: 2;
        }

        .nb-sidebar-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 5px;
            border-bottom: 1px solid rgba(200, 170, 110, 0.3);
            padding-bottom: 6px;
        }

        .nb-title {
            color: #f0e6d2;
            font-size: 16px;
            font-family: "Beaufort for LOL", serif;
            font-weight: 700;
            margin: 0;
            letter-spacing: 3px;
            text-align: center;
            text-shadow: 0 0 10px rgba(200, 170, 110, 0.4);
            text-transform: uppercase;
        }

        .nb-header-links {
            display: flex;
            gap: 6px;
            margin-top: 8px;
            width: 100%;
        }

        .nb-header-links .nb-links {
            margin: 0;
            padding: 0;
            border: none;
            width: 100%;
            display: flex;
            gap: 8px;
        }

        .nb-header-links a {
            flex: 1;
            text-align: center;
            text-decoration: none;
            color: #f0e6d2;
            background: rgba(30, 35, 40, 0.6);
            border: 1px solid #785a28;
            padding: 6px 4px;
            font-size: 11px;
            font-weight: bold;
            transition: all 0.2s;
            box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
        }

        .nb-header-links a:hover {
            border-color: #c8aa6e;
            background: rgba(200, 170, 110, 0.1);
            color: #ffffff;
        }

        .nb-footer {
            margin-top: auto; 
            padding-top: 5px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            border-top: 1px solid rgba(200, 170, 110, 0.1);
        }

        .nb-footer-item {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #a09b8c;
            text-decoration: none;
            font-size: 11px;
            transition: all 0.2s;
            padding: 4px 0;
        }

        .nb-footer-item:hover {
            color: #c8aa6e;
        }

        .nb-counter-btn {
            margin-top: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px;
            background: #1e2328;
            border: 2px solid #785a28;
            color: #f0e6d2;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            letter-spacing: 1px;
            box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
            font-family: 'Beaufort for LOL', serif;
        }

        .nb-counter-btn:hover {
            border-color: #c8aa6e;
            background: #3c3c41;
            filter: brightness(1.1);
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        }

        .nb-footer-icon {
            width: 16px;
            height: 16px;
            stroke: currentColor;
        }

        .nb-links {
            margin-top: 25px; padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 11px; display: flex; gap: 10px;
        }

        .nb-links a {
            flex: 1;
            text-align: center;
            text-decoration: none;
            color: #f0e6d2;
            background: #1e2328;
            border: 2px solid #785a28;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 1px;
            transition: all 0.2s;
            box-shadow: inset 0 0 2px rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0;
        }

        .nb-links a:hover {
            background: #3c3c41;
            border-color: #c8aa6e;
            color: #ffffff;
            filter: brightness(1.1);
        }

        .nb-copy-all-btn {
            display: inline-block;
            margin-top: 10px;
            padding: 4px 12px;
            background: rgba(200, 170, 110, 0.03);
            border: 1px solid #785a28;
            color: #a09b8c;
            font-size: 9px;
            font-weight: bold;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            letter-spacing: 1px;
            font-family: "Beaufort for LOL", serif;
            border-radius: 2px;
        }

        .nb-copy-all-btn:hover {
            background: rgba(200, 170, 110, 0.15);
            border-color: #c8aa6e;
            color: #ffffff;
            box-shadow: 0 0 15px rgba(200, 170, 110, 0.1);
        }



        /* Lane Display on Slots */
        .nb-lane-display {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 2px;
            z-index: 2;
        }

        .nb-lane-icon {
            width: 14px;
            height: 14px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            filter: drop-shadow(0 0 2px rgba(0,0,0,0.8));
        }

        /* User Requested Role/Class Icons */
        .nb-lane-top {
            background-image: url('https://wiki.leagueoflegends.com/en-us/images/Top_icon.png');
        }
        .nb-lane-jng {
            background-image: url('https://wiki.leagueoflegends.com/en-us/images/Jungle_icon.png');
        }
        .nb-lane-mid {
            background-image: url('https://wiki.leagueoflegends.com/en-us/images/Middle_icon.png');
        }
        .nb-lane-adc {
            background-image: url('https://wiki.leagueoflegends.com/en-us/images/Marksman_icon.png?c4c84');
        }
        .nb-lane-sup {
            background-image: url('https://wiki.leagueoflegends.com/en-us/images/Support_icon.png?af1ff');
        }

        /* Search Suggestions */
        .nb-suggestion-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            cursor: pointer;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            transition: background 0.2s;
            justify-content: space-between;
        }
        .nb-suggestion-item:hover {
            background: rgba(200,170,110,0.1);
        }
        .nb-suggestion-item img {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1px solid #785a28;
        }
        .nb-suggestion-item span {
             color: #f0e6d2;
             font-size: 12px;
             flex: 1;
        }
        .nb-suggestion-lanes {
            display: flex;
            gap: 3px;
            align-items: center;
        }


        .red-slot {
            margin-top: 15px !important;
        }

        .nb-detail-modal {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: transparent;
            z-index: 11000;
            display: flex; justify-content: flex-start; align-items: flex-start;
            opacity: 0; 
            transform: translateX(30px);
            pointer-events: none;
            visibility: hidden;
            transition: opacity 0.3s, transform 0.3s, visibility 0.3s;
        }

        .nb-detail-modal.visible {
            opacity: 1;
            transform: translateX(0);
            visibility: visible;
        }

        .nb-detail-modal.visible .nb-modal-content {
            pointer-events: auto;
        }

        .nb-detail-modal.visible.collapsed {
            transform: translateX(-100%);
            opacity: 0;
            pointer-events: none;
        }

        .nb-modal-content {
            width: calc(100% - 640px); /* Fill remaining space after 320(sidebar) + 320(popover) */
            min-width: 600px;
            height: 100%; 
            margin-left: 640px;
            background: linear-gradient(135deg, #091416 0%, #0a1a1f 100%);
            border-left: 2px solid #785a28;
            box-shadow: -10px 0 30px rgba(0,0,0,0.8);
            display: flex; flex-direction: column; overflow: hidden;
            font-family: "Beaufort for LOL", " Spiegel", "Segoe UI", sans-serif;
            color: #f0e6d2;
            position: relative;
            pointer-events: none; /* Default to none, enabled only when parent is visible */
        }
        
        .nb-modal-content::before {
            content: "";
            position: absolute; top: 0; left: 0; right: 0; height: 2px;
            background: linear-gradient(90deg, transparent, #c8aa6e, transparent);
            z-index: 2;
        }

        .nb-modal-header {
            padding: 12px 20px;
            background: linear-gradient(to right, rgba(30, 35, 40, 0.9), rgba(15, 20, 25, 0.9));
            border-bottom: 1px solid #463714;
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            z-index: 5;
        }

        .nb-modal-title {
            color: #f0e6d2; font-size: 18px; font-weight: 700;
            letter-spacing: 1.5px;
        }

        .nb-modal-close { font-size: 24px; color: #888; cursor: pointer; transition: 0.2s; }
        .nb-modal-minimize { font-size: 24px; color: #888; cursor: pointer; transition: 0.2s; margin-right: 15px; display: flex; align-items: center; }
        .nb-modal-close:hover, .nb-modal-minimize:hover { color: #f0e6d2; transform: scale(1.1); }

        .nb-modal-body {
            flex: 1; padding: 10px; overflow-y: auto;
            display: flex; flex-direction: column; gap: 10px;
            scrollbar-width: thin; scrollbar-color: #5c5b57 #010a13;
        }

        .nb-teams-split { display: flex; flex-direction: row; gap: 20px; width: 100%; height: 100%; }
        .nb-team-block { flex: 1 1 0px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

        .nb-team-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 10px 15px; margin-bottom: 10px;
            font-weight: bold; font-size: 14px; letter-spacing: 1px;
            border: 1px solid rgba(255,255,255,0.1);
            position: relative; overflow: hidden;
        }
        
        .nb-team-win .nb-team-header {
            background: linear-gradient(90deg, rgba(16, 55, 68, 0.9) 0%, rgba(6, 28, 37, 0.8) 100%);
            border-left: 4px solid #0acbe6; color: #0acbe6;
            box-shadow: 0 0 10px rgba(10, 203, 230, 0.1);
        }
        
        .nb-team-loss .nb-team-header {
            background: linear-gradient(90deg, rgba(68, 16, 26, 0.9) 0%, rgba(37, 6, 12, 0.8) 100%);
            border-left: 4px solid #e84057; color: #e84057;
            box-shadow: 0 0 10px rgba(232, 64, 87, 0.1);
        }

        .nb-score-row {
            display: flex;
            flex-direction: column;
            padding: 8px;
            margin-bottom: 6px;
            background: rgba(13, 19, 24, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.2s;
            border-radius: 4px;
        }
        
        .nb-score-row:hover { background: rgba(30, 36, 42, 0.9); transform: translateX(2px); }

        .nb-row-top {
            display: flex;
            align-items: center;
            width: 100%;
            margin-bottom: 6px;
        }

        .nb-row-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-left: 0; /* Move left to align under icon */
            margin-top: 4px;
        }

        .nb-copy-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            margin-left: 6px;
            cursor: pointer;
            color: #888;
            transition: all 0.2s;
            vertical-align: middle;
            background: none;
            border: none;
            padding: 0;
            opacity: 0.6;
        }

        .nb-copy-btn:hover {
            color: #c8aa6e;
            opacity: 1;
            transform: scale(1.1);
        }

        .nb-champ-container { position: relative; width: 38px; height: 38px; }
        .nb-detail-icon { width: 100%; height: 100%; border-radius: 50%; border: 2px solid #5c4b26; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
        .nb-lvl-badge {
            position: absolute; bottom: -5px; right: -5px;
            background: #010a13; color: #c8aa6e; font-size: 9px;
            width: 18px; height: 18px; display: flex; justify-content: center; align-items: center;
            border-radius: 50%; border: 1px solid #c8aa6e; box-shadow: 0 2px 4px rgba(0,0,0,0.8);
            z-index: 2;
        }

        .nb-spells-runes { display: flex; flex-direction: column; gap: 2px; }
        .nb-spell-row { display: flex; gap: 2px; }
        .nb-small-icon { width: 16px; height: 16px; border-radius: 2px; border: 1px solid #1a1a1a; background: #000; }

        .nb-player-info { display: flex; flex-direction: column; justify-content: center; padding-left: 8px; }
        .nb-detail-name { font-weight: 700; color: #f0e6d2; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .nb-detail-premade {
            font-size: 9px;
            font-weight: bold;
            color: #c8aa6e;
            background: rgba(200, 170, 110, 0.1);
            border: 1px solid rgba(200, 170, 110, 0.3);
            padding: 1px 5px;
            border-radius: 4px;
            margin-top: 2px;
            display: inline-block;
            letter-spacing: 0.5px;
        }

        .nb-kda-container { flex: 1; text-align: right; padding-right: 15px; }
        .nb-kda-score { font-size: 13px; font-weight: bold; color: #fff; }
        .nb-kda-ratio { font-size: 10px; color: #888; font-weight: 600; }

        .nb-stats-container { display: flex; flex-direction: row; font-size: 11px; color: #9ca0a3; gap: 10px; flex-shrink: 0; }
        .nb-items-container { display: flex; gap: 2px; align-items: center; flex: 1; }
        .nb-item-icon { width: 22px; height: 22px; border-radius: 2px; border: 1px solid #3c3c41; background: rgba(10,10,10,0.4); box-sizing: border-box; }
        .nb-trinket-icon { width: 22px; height: 22px; border-radius: 50%; border: 1px solid #c8aa6e; margin-left: 6px; margin-right: 4px; background: rgba(10,10,10,0.4); box-sizing: border-box; }

        .nb-game-summary {
            display: flex; justify-content: space-between; padding: 10px 15px;
            font-size: 14px; font-weight: bold; color: #c8aa6e;
            background: linear-gradient(to right, rgba(0,0,0,0), rgba(200, 170, 110, 0.1), rgba(0,0,0,0));
            border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 10px;
            letter-spacing: 1px;
        }

        .nb-footer {
            margin-top: auto;
            border-top: 1px solid rgba(200, 170, 110, 0.2);
            padding-top: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .nb-footer-item {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #a09b8c;
            font-size: 13px;
            text-decoration: none;
            transition: all 0.2s ease-in-out;
            cursor: pointer;
            padding: 4px 0;
            width: fit-content;
        }
        
        .nb-footer-item:hover {
            color: #c8aa6e;
            text-shadow: 0 0 12px rgba(200, 170, 110, 0.5);
        }

        .nb-footer-item:hover .nb-footer-icon {
            opacity: 1;
            filter: drop-shadow(0 0 5px rgba(200, 170, 110, 0.8));
        }
        
        .nb-footer-icon {
            width: 20px;
            height: 20px;
            fill: currentColor;
            opacity: 0.6;
            transition: all 0.2s ease;
            flex-shrink: 0;
        }

        .nb-loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-top: 50px;
            gap: 15px;
            width: 100%;
        }

        .nb-loading-text {
            color: #c8aa6e;
            font-size: 14px;
            font-family: "Beaufort for LOL", serif;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .nb-progress-bg {
            width: 80%;
            height: 4px;
            background: rgba(30, 35, 40, 0.8);
            border: 1px solid rgba(200, 170, 110, 0.2);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }

        .nb-progress-fill {
            position: absolute;
            top: 0; left: 0; bottom: 0;
            width: 0%;
            background: linear-gradient(90deg, #785a28, #c8aa6e);
            box-shadow: 0 0 10px rgba(200, 170, 110, 0.5);
            transition: width 0.3s ease-out;
        }

        .nb-loading-status {
            font-size: 10px;
            color: #888;
            margin-top: 5px;
        }

        .nb-suggestion-item:hover {
            background: rgba(200, 170, 110, 0.2) !important;
            color: #c8aa6e !important;
        }

        /* Draft Analyzer Styles */
        .nb-draft-popover {
            width: 320px !important;
            background: rgba(1, 10, 19, 0.98) !important;
            border: 1px solid rgba(200, 170, 110, 0.3) !important;
            border-left: none !important;
            padding: 0 !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
        }

        .nb-draft-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
        }

        .nb-draft-header {
            height: 40px;
            background: linear-gradient(180deg, #1e2328 0%, #010a13 100%);
            color: #c8aa6e;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Beaufort for LOL', serif;
            font-weight: bold;
            border-bottom: 1px solid #785a28;
            letter-spacing: 2px;
            font-size: 12px;
            box-sizing: border-box;
            padding: 0 40px; /* Leave space for X button */
        }


        .nb-draft-layout {
            display: flex;
            flex: 1;
            min-height: 0;
        }

        .nb-draft-sidebar {
            width: 54px;
            background: rgba(0,0,0,0.5);
            border-right: 1px solid rgba(200, 170, 110, 0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 6px;
            padding-bottom: 6px;
            flex-shrink: 0;
            overflow: visible !important; /* Allow lane selector to stick out */
            position: relative;
        }

        .nb-draft-slots-vertical {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .nb-draft-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            background: radial-gradient(circle at top right, rgba(120, 90, 40, 0.05) 0%, transparent 70%);
        }

        .nb-team-side-title {
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 1.5px;
            font-family: 'Beaufort for LOL', serif;
            text-align: center;
        }

        .red { color: #ff5859; }

        .nb-enemy-slot {
            width: 32px; height: 32px;
            border: 1px solid #785a28;
            background: radial-gradient(circle at center, #1e2328 0%, #010a13 100%);
            box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5);
            border-radius: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; color: #c8aa6e; cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: visible;
        }

        .nb-enemy-slot.panel-open {
            transform: none !important;
            border-color: #c8aa6e;
        }

        .nb-enemy-slot::before {
            content: '';
            position: absolute;
            top: 1px; left: 1px; right: 1px; bottom: 1px;
            border: 1px solid rgba(200, 170, 110, 0.05);
            pointer-events: none;
        }

        .nb-enemy-slot:hover {
            border-color: #c8aa6e;
            box-shadow: inset 0 0 15px rgba(200,170,110,0.1), 0 0 20px rgba(200,170,110,0.3);
            color: #f0e6d2;
            transform: translateY(-2px);
        }

        .nb-enemy-slot.filled {
            border-color: #c8aa6e;
            box-shadow: 0 0 15px rgba(200,170,110,0.3);
        }

        .nb-enemy-slot.active {
            border-color: #f0e6d2 !important;
            box-shadow: 0 0 20px rgba(200, 170, 110, 0.8) !important;
            transform: scale(1.1);
            z-index: 100;
        }

        /* Large outer selection frame */
        .nb-enemy-slot.active::after {
            content: '';
            position: absolute;
            top: -4px; left: -4px; right: -4px; bottom: -4px;
            border: 2px solid #c8aa6e;
            pointer-events: none;
            animation: nb-selection-pulse 1s infinite alternate;
        }

        @keyframes nb-selection-pulse {
            from { opacity: 0.4; transform: scale(1); }
            to { opacity: 1; transform: scale(1.05); }
        }

        .red-slot.filled {
            border-color: #785a28; /* Keep hextech gold for consistency */
            color: #fff;
            background: #010a13;
        }

        .nb-draft-search-area {
            padding: 15px;
            background: rgba(30, 35, 40, 0.2);
            position: relative;
        }

        .nb-draft-sugg-box {
            position: absolute;
            top: 50px; left: 15px; right: 15px;
            background: #010a13;
            border: 1px solid #785a28;
            border-top: none;
            display: none;
            z-index: 9999;
            max-height: 250px;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            border-bottom-left-radius: 4px;
            border-bottom-right-radius: 4px;
        }

        .nb-suggestion-item {
            transition: all 0.2s;
        }

        .nb-suggestion-item:hover {
            background: rgba(200, 170, 110, 0.15) !important;
            color: #c8aa6e !important;
            padding-left: 20px !important; /* Slide-in effect on hover */
        }

        .nb-draft-results::-webkit-scrollbar,
        .nb-draft-sugg-box::-webkit-scrollbar {
            width: 4px;
        }

        .nb-draft-results::-webkit-scrollbar-thumb,
        .nb-draft-sugg-box::-webkit-scrollbar-thumb {
            background: #785a28;
            border-radius: 2px;
        }

        .nb-draft-results::-webkit-scrollbar-track,
        .nb-draft-sugg-box::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }

        .nb-draft-results {
            flex: 1;
            padding: 0 15px 15px 15px;
            overflow-y: auto !important;
            display: block;
            min-height: 0;
            scrollbar-width: thin;
            scrollbar-color: #785a28 rgba(0, 0, 0, 0.2);
        }

        /* Customize scrollbar for result area */
        .nb-draft-results::-webkit-scrollbar { width: 4px; }
        .nb-draft-results::-webkit-scrollbar-thumb { background: #785a28; border-radius: 2px; }
        .nb-draft-results::-webkit-scrollbar-track { background: transparent; }

        /* Lane Selector and Icons */
        .nb-lane-display {
            position: absolute;
            top: -8px; 
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 2px;
            pointer-events: none;
            z-index: 25;
        }

        .nb-lane-icon {
            width: 14px;
            height: 14px;
            background-size: contain;
            background-repeat: no-repeat;
            filter: drop-shadow(0 0 3px rgba(0,0,0,1));
            border: 1px solid rgba(200, 170, 110, 0.4);
            border-radius: 2px;
            background-color: #010a13;
        }

        .nb-lane-top { background-image: url('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png'); }
        .nb-lane-jng { background-image: url('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png'); }
        .nb-lane-mid { background-image: url('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png'); }
        .nb-lane-bot, .nb-lane-adc { background-image: url('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png'); }
        .nb-lane-sup { background-image: url('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png'); }

        .nb-lane-selector-panel {
            position: fixed;
            background: rgba(1, 10, 19, 0.98);
            border: 1px solid #785a28;
            padding: 6px;
            display: flex;
            flex-direction: row;
            gap: 6px;
            z-index: 200000;
            box-shadow: 0 8px 24px rgba(0,0,0,0.9);
            border-radius: 0;
            backdrop-filter: blur(12px);
            animation: nb-pop-in 0.1s ease-out forwards;
            pointer-events: auto;
        }

        @keyframes nb-pop-in {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        .nb-lane-option {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 1px solid #3c3c41;
            border-radius: 0;
            transition: all 0.15s;
            background: #1e2328;
            position: relative;
        }

        .nb-lane-option:hover {
            border-color: #c8aa6e;
            background: #3c3c41;
            transform: translateY(-2px);
        }

        .nb-lane-option.selected {
            border-color: #f0e6d2;
            background: rgba(200, 170, 110, 0.3);
            box-shadow: inset 0 0 12px rgba(200, 170, 110, 0.3), 0 0 10px rgba(200, 170, 110, 0.2);
        }

        .nb-lane-option.selected::after {
            content: '✓';
            position: absolute;
            top: -6px; right: -6px;
            font-size: 10px;
            color: #010a13;
            background: #c8aa6e;
            width: 14px; height: 14px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%;
            border: 1px solid #f0e6d2;
            font-weight: bold;
            z-index: 2;
        }

        .nb-enemy-slot-remove {
            position: absolute;
            top: -6px; right: -6px;
            width: 16px; height: 16px;
            background: #1a1a1a;
            border: 1.5px solid #ff5859;
            color: #ff5859;
            font-size: 11px;
            font-weight: bold;
            display: none;
            align-items: center; justify-content: center;
            cursor: pointer;
            z-index: 30;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0,0,0,0.8);
            transition: all 0.2s;
        }

        .nb-enemy-slot.filled:hover .nb-enemy-slot-remove {
            display: flex;
        }
        
        .nb-enemy-slot-remove:hover {
            background: #ff5859;
            color: #fff;
            transform: scale(1.2);
        }

        .nb-load-more {
            display: block; width: 100%; padding: 10px; box-sizing: border-box;
            margin-top: 15px; 
            background: #1e2328;
            border: 2px solid #785a28; 
            color: #f0e6d2;
            text-align: center; font-size: 12px; font-weight: bold;
            cursor: pointer; transition: all 0.2s;
            letter-spacing: 1px;
            border-radius: 0;
        }
        .nb-load-more:hover { 
            background: #3c3c41;
            border-color: #c8aa6e;
            filter: brightness(1.1);
        }
        .nb-load-more.loading { pointer-events: none; opacity: 0.6; cursor: wait; }

        /* Search Bar Shake & Full State */
        @keyframes nb-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-4px); }
            40%, 80% { transform: translateX(4px); }
        }

        .nb-search-shake {
            animation: nb-shake 0.3s ease-in-out;
            border-color: #ff5859 !important;
        }

        #counterSearch:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            border-color: rgba(200, 170, 110, 0.1) !important;
            background: rgba(1, 10, 19, 0.8) !important;
        }

        #counterSearch::placeholder {
            color: #666;
            font-size: 11px;
            font-style: italic;
        }

        /* Redesigned Profile Header (Hextech Premium) */
        .nb-profile-header {
            width: 100%;
            box-sizing: border-box;
        }
        
        .nb-profile-container {
            padding: 15px;
            background: linear-gradient(135deg, rgba(1, 10, 19, 0.98) 0%, rgba(10, 14, 18, 0.95) 100%);
            border-bottom: 2px solid #785a28;
            display: flex;
            flex-direction: column;
            gap: 12px;
            position: relative;
        }

        .nb-profile-top {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .nb-profile-icon-wrap {
            position: relative;
            width: 48px; height: 48px;
            flex-shrink: 0;
        }

        .nb-profile-img {
            width: 100%; height: 100%;
            border-radius: 50%;
            border: 2px solid #c8aa6e;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.8), 0 0 10px rgba(200, 170, 110, 0.2);
        }

        .nb-profile-level {
            position: absolute;
            bottom: -5px; left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(180deg, #1e2328 0%, #010a13 100%);
            border: 1px solid #c8aa6e;
            color: #f0e6d2;
            font-size: 10px;
            padding: 2px 10px;
            border-radius: 12px;
            font-family: 'Spiegel', sans-serif;
            white-space: nowrap;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }

        .nb-profile-info {
            flex: 1;
            min-width: 0;
        }

        .nb-profile-name-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .nb-profile-name {
            font-size: 16px;
            font-weight: 700;
            color: #f0e6d2;
            font-family: 'Beaufort for LOL', serif;
            letter-spacing: 0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .nb-profile-tagline {
            font-size: 11px;
            color: #a09b8c;
            font-family: 'Spiegel', sans-serif;
            margin-top: 2px;
            letter-spacing: 0.3px;
        }

        .nb-profile-rank-text {
            color: #c8aa6e;
            font-weight: 700;
            text-transform: uppercase;
        }

        .nb-profile-stats-grid {
            display: flex;
            align-items: stretch;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(200, 170, 110, 0.1);
            padding: 8px;
            gap: 6px;
            border-radius: 4px;
            box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.6);
        }

        .nb-stat-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .nb-stat-label {
            font-size: 9px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin-bottom: 4px;
            font-weight: bold;
        }

        .nb-stat-value {
            font-size: 12px;
            font-weight: 700;
            color: #f0e6d2;
            font-family: 'Beaufort for LOL', serif;
        }

        .nb-stat-divider {
            width: 1px;
            background: rgba(200, 170, 110, 0.1);
            margin: 4px 0;
        }

        .nb-stat-item.top-champs {
            flex: 1.5;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .nb-champs-list {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }

        .nb-stat-champ-icon {
            border-radius: 50%;
            border: 1.5px solid #c8aa6e;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.6);
            transition: transform 0.2s;
        }

        .nb-stat-champ-icon:hover {
            transform: scale(1.1);
            border-color: #f0e6d2;
            z-index: 2;
        }

        .nb-stat-champ-icon.main {
            width: 34px; height: 34px;
            border: 2px solid #c8aa6e;
            box-shadow: 0 0 10px rgba(200, 170, 110, 0.5);
            z-index: 1;
            margin: 0 4px;
        }

        .nb-stat-champ-icon.sub {
            width: 24px; height: 24px;
            opacity: 0.8;
            filter: grayscale(0.2);
            margin-top: 4px; /* Slight offset downwards */
        }
    `;
    document.head.appendChild(style);
}
