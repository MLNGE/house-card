export const CARD_STYLES = `
                    :host { display: block; position: relative; z-index: 0; --fork-u-bg: #1e2024; --color-cold: #60A5FA; --color-opt: #34D399; --color-warm: #FBBF24; --color-hot: #F87171; }
          .card {
              position: relative; display: flex; flex-direction: column; width: 100%; height: 350px;
              overflow: hidden;
              text-shadow: rgba(0,0,0,0.4) 0 1px 0px;
              box-shadow: 0 4px 2px rgba(0,0,0,0.3);
              background: var(--card-background-color,var(--fork-u-bg));
              border-radius: var(--ha-card-border-radius,var(--ha-border-radius-lg,20px));
          }
          .sky-gradient-layer {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 1; pointer-events: none; transition: background 2s ease;
          }
          .gradient-layer {
              background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40px);
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 2; transition: all 0.5s ease;
          }
          .bg-image {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              background-size: cover; 
              background-position: calc(50% + var(--image-x-offset, 0px)) calc(50% + var(--image-y-offset, 0px));
              transform: scale(var(--background-zoom, 1));
              z-index: 0; transition: all 0.5s ease;
          }
          .dim-layer {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              background: #000; opacity: 0; z-index: 3; pointer-events: none; transition: opacity 2s ease;
          }
          
          /* WINDOW LIGHTS */
          .window-lights-layer {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 4; pointer-events: none;
          }
          .window-light {
              position: absolute;
              border-radius: 2px;
              transition: all 0.8s ease;
              pointer-events: auto;
              cursor: pointer;
          }
          .window-light.is-on {
              background: radial-gradient(ellipse at center, 
                  var(--window-color, rgba(255, 220, 150, 1.0)) 0%, 
                  var(--window-color, rgba(255, 200, 120, 0.7)) 30%,
                  var(--window-color-mid, rgba(255, 180, 100, 0.4)) 60%,
                  transparent 100%);
              mix-blend-mode: screen;
              filter: blur(var(--window-blur, 5px));
          }
          .window-light.is-on::after {
              content: '';
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%) scale(var(--window-glow-scale, 1));
              width: 300%; height: 300%;
              background: radial-gradient(ellipse at center,
                  var(--window-glow-outer, rgba(255, 180, 100, 0.5)) 0%,
                  var(--window-glow-outer, rgba(255, 180, 100, 0.3)) 40%,
                  transparent 80%);
              mix-blend-mode: screen;
              filter: blur(var(--window-glow-blur, 20px));
              pointer-events: none;
          }
          .window-light.is-off {
              background: radial-gradient(ellipse at center,
                  rgba(0, 5, 10, 0.85) 0%,
                  rgba(0, 5, 10, 0.5) 50%,
                  transparent 90%);
              filter: blur(2px);
              mix-blend-mode: multiply;
          }
          
          /* NAV LINKS */
          .nav-links-layer {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 5; pointer-events: none;
          }
          .nav-link {
              position: absolute;
              --thermostat-mode-color: #bae6fd;
              --thermostat-mode-background: rgba(125, 211, 252, 0.12);
              transform: translate(-50%, -50%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4px;
              pointer-events: auto;
              cursor: pointer;
              border-radius: 8px;
              transition: all 0.2s ease;
          }
          .nav-link:hover {
              background: rgba(255, 255, 255, 0.1);
          }
          .nav-link:active {
              transform: translate(-50%, -50%) scale(0.95);
          }
          .nav-link .nav-label {
              font-size: 0.65rem;
              color: white;
              text-shadow: 0 1px 3px rgba(0,0,0,0.8);
              text-transform: uppercase;
              letter-spacing: 0.5px;
          }
          
          /* DECORATIONS */
          .decorations-layer {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 2; pointer-events: none;
          }
          .decoration {
              position: absolute;
              transform: translate(-50%, -50%);
              pointer-events: none;
              image-rendering: auto;
          }
          .decoration img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              transition: filter 1s ease;
          }
          .decorations-layer.night-mode .decoration img {
              filter: brightness(0.7) saturate(0.85);
          }
          .decoration.animate-bounce {
              animation: decorationBounce 2s ease-in-out infinite;
          }
          .decoration.animate-sway {
              animation: decorationSway 3s ease-in-out infinite;
          }
          .decoration.animate-wag {
              animation: decorationWag 0.5s ease-in-out infinite;
          }
          @keyframes decorationBounce {
              0%, 100% { transform: translate(-50%, -50%) translateY(0); }
              50% { transform: translate(-50%, -50%) translateY(-3px); }
          }
          @keyframes decorationSway {
              0%, 100% { transform: translate(-50%, -50%) rotate(-2deg); }
              50% { transform: translate(-50%, -50%) rotate(2deg); }
          }
          @keyframes decorationWag {
              0%, 100% { transform: translate(-50%, -50%) rotate(-5deg); }
              50% { transform: translate(-50%, -50%) rotate(5deg); }
          }
          
          /* GAMING AMBIENT */
          .ambient-layer {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 2; pointer-events: none; opacity: 0; transition: opacity 1.5s ease;
          }
          .card.gaming-active .ambient-layer { opacity: 1; }
          .ambient-light {
             position: absolute; border-radius: 50%; filter: blur(70px);
             mix-blend-mode: color-dodge; animation-iteration-count: infinite; animation-timing-function: ease-in-out;
          }
          .blob-1 { top: 20%; left: 10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(120,50,255,0.8) 0%, rgba(0,0,0,0) 70%); animation: float-1 6s infinite alternate; }
          .blob-2 { bottom: 10%; right: 10%; width: 350px; height: 350px; background: radial-gradient(circle, rgba(255,0,150,0.7) 0%, rgba(0,0,0,0) 70%); animation: float-2 7s infinite alternate; }
          .blob-3 { top: 40%; left: 40%; width: 250px; height: 250px; background: radial-gradient(circle, rgba(0,255,255,0.5) 0%, rgba(0,0,0,0) 70%); animation: pulse-3 5s infinite; mix-blend-mode: overlay; }
          @keyframes float-1 { 0% { transform: translate(0,0) scale(1); opacity: 0.7; } 100% { transform: translate(20px, 30px) scale(1.1); opacity: 0.9; } }
          @keyframes float-2 { 0% { transform: translate(0,0) scale(1); opacity: 0.6; } 100% { transform: translate(-30px, -20px) scale(1.15); opacity: 0.8; } }
          @keyframes pulse-3 { 0% { transform: scale(0.9); opacity: 0.4; } 50% { transform: scale(1.2); opacity: 0.7; } 100% { transform: scale(0.9); opacity: 0.4; } }

          canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; }
          
          .badges-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 5; pointer-events: none; }
          .power-stations-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 6; pointer-events: none; }
          .thermostat-badges-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 7; pointer-events: none; }

          .thermostat-badge {
              position: absolute;
              transform: translate(-50%, -50%);
              display: flex;
              align-items: center;
              gap: 6px;
              max-width: min(215px, calc(100% - 12px));
              padding: 6px 8px;
              border: 1px solid rgba(255,255,255, calc(var(--badge-opacity, 0.75) * 0.2));
              border-radius: 12px;
              background: rgba(20, 20, 25, var(--badge-opacity, 0.75));
              box-shadow: 0 4px 8px rgba(0,0,0, calc(var(--badge-opacity, 0.75) * 0.53));
              backdrop-filter: blur(8px);
              color: #fff;
              font: inherit;
              text-align: left;
              cursor: pointer;
              pointer-events: auto;
              transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .thermostat-badge:hover {
              transform: translate(-50%, -50%) scale(1.03);
              box-shadow: 0 6px 12px rgba(0,0,0, calc(var(--badge-opacity, 0.75) * 0.6));
          }
          .thermostat-badge:focus-visible {
              outline: 2px solid var(--primary-color, #03a9f4);
              outline-offset: 3px;
          }
          .thermostat-badge ha-icon {
              --mdc-icon-size: 18px;
              flex: 0 0 auto;
              color: var(--thermostat-mode-color);
          }
          .thermostat-badge[data-hvac-mode="heat"] {
              --thermostat-mode-color: #fdba74;
              --thermostat-mode-background: rgba(249, 115, 22, 0.18);
          }
          .thermostat-badge[data-hvac-mode="cool"] {
              --thermostat-mode-color: #93c5fd;
              --thermostat-mode-background: rgba(59, 130, 246, 0.18);
          }
          .thermostat-badge[data-hvac-mode="heat_cool"] {
              --thermostat-mode-color: #d8b4fe;
              --thermostat-mode-background: rgba(168, 85, 247, 0.18);
          }
          .thermostat-badge[data-hvac-mode="auto"] {
              --thermostat-mode-color: #5eead4;
              --thermostat-mode-background: rgba(20, 184, 166, 0.16);
          }
          .thermostat-badge[data-hvac-mode="off"] {
              --thermostat-mode-color: #cbd5e1;
              --thermostat-mode-background: rgba(148, 163, 184, 0.14);
          }
          .thermostat-badge[data-hvac-mode="dry"] {
              --thermostat-mode-color: #fde047;
              --thermostat-mode-background: rgba(234, 179, 8, 0.16);
          }
          .thermostat-badge[data-hvac-mode="fan_only"] {
              --thermostat-mode-color: #86efac;
              --thermostat-mode-background: rgba(34, 197, 94, 0.15);
          }
          .thermostat-badge[data-hvac-mode="emergency_heat"] {
              --thermostat-mode-color: #fca5a5;
              --thermostat-mode-background: rgba(239, 68, 68, 0.17);
          }
          .thermostat-badge[data-hvac-mode="unavailable"] {
              --thermostat-mode-color: #fcd34d;
              --thermostat-mode-background: rgba(245, 158, 11, 0.15);
          }
          .thermostat-badge__content {
              display: flex;
              flex-direction: column;
              gap: 3px;
              min-width: 0;
          }
          .thermostat-badge__name {
              overflow: hidden;
              color: rgba(255, 255, 255, 0.72);
              font-size: 0.55rem;
              font-weight: 600;
              line-height: 1.1;
              text-overflow: ellipsis;
              text-transform: uppercase;
              white-space: nowrap;
          }
          .thermostat-badge__details {
              display: flex;
              align-items: baseline;
              flex-wrap: wrap;
              gap: 2px 5px;
              font-size: 0.64rem;
              line-height: 1.1;
          }
          .thermostat-badge__current {
              font-weight: 700;
              font-variant-numeric: tabular-nums;
          }
          .thermostat-badge__target {
              color: rgba(255, 255, 255, 0.78);
              font-variant-numeric: tabular-nums;
          }
          .thermostat-badge__mode {
              padding: 2px 5px;
              border-radius: 999px;
              background: var(--thermostat-mode-background);
              color: var(--thermostat-mode-color);
              font-size: 0.52rem;
              font-weight: 700;
              text-transform: uppercase;
          }
          @media (prefers-reduced-motion: reduce) {
              .thermostat-badge { transition: none; }
          }
          
          /* BADGE STYLES */
          .badge {
              position: absolute; 
              transform: translate(-50%, -50%) scale(var(--badge-scale, 1));
              padding: 6px 12px;
              border-radius: 16px;
              background: rgba(20, 20, 25, var(--badge-opacity, 0.75)); 
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255,255,255, calc(var(--badge-opacity, 0.75) * 0.2));
              box-shadow: 0 4px 8px rgba(0,0,0, calc(var(--badge-opacity, 0.75) * 0.53));
              display: flex; align-items: center; gap: 8px; pointer-events: auto;
              transition: transform 0.3s ease; 
              cursor: pointer; /* Change cursor on hover */
          }
          .badge.flip-icon { flex-direction: row-reverse; } /* Flip icon to right side */
          .badge:active { transform: translate(-50%, -50%) scale(var(--badge-scale, 1)) scale(0.95); } /* Press effect */
          
          .badge-dot { width: 8px; height: 8px; border-radius: 50%; }
          .is-cold .badge-dot { background: var(--color-cold); box-shadow: 0 0 5px var(--color-cold); }
          .is-optimal .badge-dot { background: var(--color-opt); box-shadow: 0 0 5px var(--color-opt); }
          .is-warm .badge-dot { background: var(--color-warm); box-shadow: 0 0 5px var(--color-warm); }
          .is-hot .badge-dot { background: var(--color-hot); box-shadow: 0 0 5px var(--color-hot); }
          .dehumidifier-indicator {
              position: absolute; top: 50%; left: 10px; z-index: 1;
              display: grid; width: 12px; height: 12px; place-items: center;
              transform: translateY(-50%); pointer-events: none;
          }
          .flip-icon .dehumidifier-indicator { left: auto; right: 10px; }
          .dehumidifier-fan { display: block; width: 11px; height: 11px; overflow: visible; }
          .dehumidifier-indicator--on { color: #81C784; }
          .dehumidifier-indicator--off { color: #9E9E9E; }
          .dehumidifier-indicator--unavailable { color: #FFB74D; }
          .dehumidifier-indicator--on .dehumidifier-fan__rotor {
              transform-box: view-box; transform-origin: 50% 50%;
              animation: hcDehumidifierFanSpin 1s linear infinite paused;
          }
          .badges-layer.dehumidifier-fan-visible .dehumidifier-indicator--on .dehumidifier-fan__rotor { animation-play-state: running; }
          @keyframes hcDehumidifierFanSpin { to { transform: rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) {
              .dehumidifier-indicator--on .dehumidifier-fan__rotor { animation: none; }
          }
          
          /* SPARK ICON STYLE */
          .spark-icon {
            width: 12px; height: 12px; margin-right: 4px; 
            filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
            animation: pulse-spark 2s infinite ease-in-out;
          }
          .flip-icon .spark-icon { margin-right: 0; margin-left: 4px; } /* Flip margin when badge is flipped */
          @keyframes pulse-spark {
            0% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0.8; transform: scale(1); }
          }
          
          .badge-content { display: flex; flex-direction: column; line-height: 1; }
          .flip-icon .badge-content { align-items: flex-end; } /* Align text to right when flipped */
          .badge-name { font-size: 0.55rem; color: #aaa; text-transform: uppercase; margin-bottom: 2px; }
          .badge-val { font-size: 0.80rem; font-weight: 700; color: #fff; white-space: nowrap; }

          /* POWER STATION TILE */
          .power-station-tile {
              position: absolute;
              transform: translate(-50%, -50%);
              pointer-events: auto;
              cursor: pointer;
              padding: 6px 10px;
              border-radius: 14px;
              background: rgba(20, 20, 25, var(--badge-opacity, 0.82));
              border: 1px solid rgba(255,255,255, calc(var(--badge-opacity, 0.82) * 0.2));
              box-shadow: 0 4px 8px rgba(0,0,0, calc(var(--badge-opacity, 0.82) * 0.53));
              backdrop-filter: blur(8px);
              color: #fff;
              display: flex;
              flex-direction: column;
              gap: 4px;
              transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          }
          .power-station-tile:hover {
              transform: translate(-50%, -50%) scale(1.02);
              border-color: rgba(255,255,255, calc(var(--badge-opacity, 0.82) * 0.35));
              box-shadow: 0 6px 12px rgba(0,0,0, calc(var(--badge-opacity, 0.82) * 0.6));
          }
          .power-station-tile__header {
              display: flex;
              align-items: center;
              gap: 6px;
          }
          .power-station-tile__header ha-icon {
              --mdc-icon-size: 16px;
              color: #4ade80;
              flex: 0 0 auto;
              filter: drop-shadow(0 0 3px rgba(74, 222, 128, 0.45));
          }
          .power-station-tile__title-wrap {
              display: flex;
              flex-direction: column;
              min-width: 0;
          }
          .power-station-tile__title {
              font-size: 0.7rem;
              font-weight: 800;
              letter-spacing: 0.03em;
              line-height: 1.1;
              text-transform: uppercase;
          }
          .power-station-tile__subtitle {
              display: flex;
              align-items: center;
              font-size: 0.54rem;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: rgba(255, 255, 255, 0.52);
          }
          .power-station-tile__battery {
              display: flex;
              align-items: center;
              gap: 5px;
              width: 100%;
          }
          .power-station-tile__battery-bar {
              display: inline-block;
              position: relative;
              width: 42px;
              height: 7px;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.12);
              border: 1px solid rgba(255, 255, 255, 0.15);
              overflow: hidden;
              vertical-align: middle;
          }
          .power-station-tile__battery-fill {
              position: absolute;
              inset: 0 auto 0 0;
              border-radius: inherit;
              background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
              box-shadow: 0 0 8px rgba(74, 222, 128, 0.7);
          }
          .power-station-tile__battery-value {
              font-weight: 800;
              color: rgba(255, 255, 255, 0.9);
              white-space: nowrap;
          }
          .power-station-tile__summary,
          .power-station-tile__meta {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 3px 5px;
              font-size: 0.6rem;
              line-height: 1.1;
              color: rgba(255, 255, 255, 0.9);
          }
          .power-station-tile__summary {
              font-size: 0.7rem;
              font-weight: 700;
          }
          .power-station-tile__meta-value {
              font-weight: 800;
              color: #ffffff;
          }
          .power-station-tile__value {
              min-width: 0;
              font-variant-numeric: tabular-nums;
              font-weight: 600;
              color: #ffffff;
          }
          .power-station-tile__value--input {
              color: #4ade80;
          }
          .power-station-tile__value--output {
              color: #f87171;
          }
          .power-station-tile__unit {
              color: #ffffff;
              font-size: 0.58rem;
              font-weight: 600;
          }
          .power-station-tile--empty {
              justify-content: space-between;
          }
          .power-station-tile__empty-state {
              font-size: 0.58rem;
              line-height: 1.2;
              color: rgba(255, 255, 255, 0.72);
              padding: 0;
              border-radius: 0;
              background: rgba(255, 255, 255, 0.05);
              border: none;
          }
          .power-station-tile__divider {
              opacity: 0.5;
              color: rgba(255, 255, 255, 0.8);
          }
`;
