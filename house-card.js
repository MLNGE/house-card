/*! House Card @version 1.41.3 */

// src/constants.js
var DEFAULT_IMAGE_PATH = "/local/house-card-images/";
var LEGACY_IMAGE_PATH = "/local/community/house-card/images/";
var POWER_STATION_SUFFIXES = [
  { suffix: "ac_charge_limit", domain: "number", label: "AC Charge Limit", icon: "mdi:current-ac" },
  { suffix: "ac_input_power", domain: "sensor", label: "AC Input", icon: "mdi:power-plug" },
  { suffix: "ac_output_power", domain: "sensor", label: "AC Output", icon: "mdi:power-socket-eu" },
  { suffix: "ac_output", domain: "switch", label: "AC Output", icon: "mdi:power" },
  { suffix: "battery", domain: "sensor", label: "Battery", icon: "mdi:battery" },
  { suffix: "bms_version", domain: "sensor", label: "BMS Version", icon: "mdi:chip" },
  { suffix: "charging_time", domain: "sensor", label: "Charging Time", icon: "mdi:timer-sand" },
  { suffix: "dc_car_output_power", domain: "sensor", label: "DC Car Output", icon: "mdi:car-electric" },
  { suffix: "dc_input_power", domain: "sensor", label: "DC Input", icon: "mdi:current-dc" },
  { suffix: "dc_output", domain: "switch", label: "DC Output", icon: "mdi:power" },
  { suffix: "usb_output", domain: "switch", label: "USB Output", icon: "mdi:usb" },
  { suffix: "inverter_version", domain: "sensor", label: "Inverter Version", icon: "mdi:chip" },
  { suffix: "output_frequency", domain: "select", label: "Output Frequency", icon: "mdi:sine-wave" },
  { suffix: "output_voltage", domain: "select", label: "Output Voltage", icon: "mdi:sine-wave" },
  { suffix: "remaining_time", domain: "sensor", label: "Remaining Time", icon: "mdi:timer-outline" },
  { suffix: "temperature", domain: "sensor", label: "Temperature", icon: "mdi:thermometer" },
  { suffix: "total_input_power", domain: "sensor", label: "Total Input", icon: "mdi:transmission-tower-import" },
  { suffix: "total_output_power", domain: "sensor", label: "Total Output", icon: "mdi:transmission-tower-export" }
];

// src/card-styles.js
var CARD_STYLES = `
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

// src/canvas-effects.js
var withCanvasEffects = (Base) => class extends Base {
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      };
    }
    const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (shortResult) {
      return {
        r: parseInt(shortResult[1] + shortResult[1], 16),
        g: parseInt(shortResult[2] + shortResult[2], 16),
        b: parseInt(shortResult[3] + shortResult[3], 16)
      };
    }
    return null;
  }
  _getWindData() {
    let speed = 10, bearing = 270;
    if (this._config.wind_speed_entity && this._hass.states[this._config.wind_speed_entity])
      speed = parseFloat(this._hass.states[this._config.wind_speed_entity].state);
    else if (this._hass.states[this._config.weather_entity]?.attributes?.wind_speed)
      speed = parseFloat(this._hass.states[this._config.weather_entity].attributes.wind_speed);
    if (this._config.wind_direction_entity && this._hass.states[this._config.wind_direction_entity])
      bearing = parseFloat(this._hass.states[this._config.wind_direction_entity].state);
    else if (this._hass.states[this._config.weather_entity]?.attributes?.wind_bearing)
      bearing = parseFloat(this._hass.states[this._config.weather_entity].attributes.wind_bearing);
    return { speed: isNaN(speed) ? 5 : speed, bearing: isNaN(bearing) ? 270 : bearing };
  }
  _getCloudCoverage() {
    const cloudEnt = this._config.cloud_coverage_entity;
    if (cloudEnt && this._hass.states[cloudEnt]) {
      const val = parseFloat(this._hass.states[cloudEnt].state);
      return isNaN(val) ? 0 : val;
    }
    return 0;
  }
  _refreshAnimationState() {
    const wEnt = this._config.weather_entity;
    const wState = this._config.test_weather_state || (wEnt ? this._hass.states[wEnt]?.state : "");
    const { speed, bearing } = this._getWindData();
    const moveSpeed = Math.max(0.2, Math.min(6, speed / 15));
    const sunEnt = this._config.sun_entity || "sun.sun";
    const sunState = this._hass.states[sunEnt]?.state;
    const isNight = this._config.test_time_of_day ? this._config.test_time_of_day === "night" : sunState === "below_horizon";
    const seasonEntity = this._config.season_entity;
    const auroraEntity = this._config.aurora_entity;
    this._animationState = {
      wState,
      moveSpeed,
      windDirX: bearing > 180 || bearing < 0 ? 1 : -1,
      isNight,
      sunVisible: sunState === "above_horizon",
      coverage: this._getCloudCoverage(),
      season: this._config.test_season_state || this._hass.states[seasonEntity]?.state?.toLowerCase() || "summer",
      auroraActive: this._config.test_aurora === true || (auroraEntity ? this._hass.states[auroraEntity]?.state === "on" : false)
    };
  }
  _getSunElevation() {
    if (this._config.test_elevation !== void 0) {
      return this._config.test_elevation;
    }
    if (this._config.sun_elevation_entity) {
      const elevState = this._hass.states[this._config.sun_elevation_entity];
      if (elevState && elevState.state !== "unknown" && elevState.state !== "unavailable") {
        const elevation = parseFloat(elevState.state);
        if (!isNaN(elevation)) {
          return elevation;
        }
      }
    }
    const sunEnt = this._config.sun_entity || "sun.sun";
    const sunState = this._hass.states[sunEnt];
    if (sunState && sunState.attributes && sunState.attributes.elevation !== void 0) {
      const elevation = parseFloat(sunState.attributes.elevation);
      if (!isNaN(elevation)) {
        return elevation;
      }
    }
    return null;
  }
  _lerpColor(color1, color2, factor) {
    const c1 = this._hexToRgb(color1);
    const c2 = this._hexToRgb(color2);
    if (!c1 || !c2) return color1;
    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }
  _getSkyGradient(elevation) {
    let topColor, horizonColor, bottomColor;
    if (elevation === null || elevation === void 0) {
      const sunEnt = this._config.sun_entity || "sun.sun";
      const isNight = this._hass.states[sunEnt]?.state === "below_horizon";
      topColor = isNight ? "#0a1628" : "#87CEEB";
      horizonColor = isNight ? "#1a1f38" : "#B0E0E6";
      bottomColor = isNight ? "#0f1a2e" : "#E0F6FF";
    } else if (elevation < -18) {
      topColor = "#000814";
      horizonColor = "#0a1628";
      bottomColor = "#0f1a2e";
    } else if (elevation < -12) {
      topColor = "#0a1628";
      horizonColor = "#1a2645";
      bottomColor = "#1f2d4a";
    } else if (elevation < -6) {
      topColor = "#1a2645";
      horizonColor = "#2d3e66";
      bottomColor = "#3a4a73";
    } else if (elevation < -4) {
      topColor = "#1e3a5f";
      horizonColor = "#3d5a80";
      bottomColor = "#4a6380";
    } else if (elevation < -2) {
      topColor = "#2e4a6b";
      horizonColor = "#5d6d8e";
      bottomColor = "#7689a8";
    } else if (elevation < 0) {
      const factor = (elevation + 2) / 2;
      topColor = this._lerpColor("#3d5a80", "#4a5f8a", factor);
      horizonColor = this._lerpColor("#7689a8", "#cc8866", factor);
      bottomColor = this._lerpColor("#8fa3c0", "#dd9955", factor);
    } else if (elevation < 2) {
      const factor = elevation / 2;
      topColor = this._lerpColor("#4a5f8a", "#d47c5a", factor);
      horizonColor = this._lerpColor("#cc8866", "#ee9944", factor);
      bottomColor = this._lerpColor("#dd9955", "#ffaa66", factor);
    } else if (elevation < 4) {
      const factor = (elevation - 2) / 2;
      topColor = this._lerpColor("#d4685a", "#ee8855", factor);
      horizonColor = this._lerpColor("#ee9944", "#ffaa55", factor);
      bottomColor = this._lerpColor("#ffaa66", "#ffcc88", factor);
    } else if (elevation < 8) {
      const factor = (elevation - 4) / 4;
      topColor = this._lerpColor("#ee8855", "#87CEEB", factor);
      horizonColor = this._lerpColor("#ffaa55", "#B0E0E6", factor);
      bottomColor = this._lerpColor("#ffcc88", "#E0F6FF", factor);
    } else if (elevation < 15) {
      const factor = (elevation - 8) / 7;
      topColor = this._lerpColor("#87CEEB", "#5BA3D0", factor);
      horizonColor = this._lerpColor("#B0E0E6", "#a8d8ea", factor);
      bottomColor = this._lerpColor("#E0F6FF", "#d4ebf2", factor);
    } else {
      topColor = "#4A90D9";
      horizonColor = "#87CEEB";
      bottomColor = "#C8E6F5";
    }
    return { topColor, horizonColor, bottomColor };
  }
  _updateSkyGradient() {
    const skyLayer = this.shadowRoot.querySelector(".sky-gradient-layer");
    if (!skyLayer) return;
    if (this._config.sky_gradient === false) {
      if (skyLayer.style.background) skyLayer.style.background = "";
      this._lastSunElevation = null;
      this._lastSkyGradientKey = null;
      return;
    }
    const elevation = this._getSunElevation();
    const sunEnt = this._config.sun_entity || "sun.sun";
    const isNight = this._hass.states[sunEnt]?.state === "below_horizon";
    const intensity = this._config.sky_gradient_intensity ?? 0.8;
    const cacheElevation = elevation === null ? null : Math.round(elevation * 2) / 2;
    const gradientKey = `${cacheElevation}|${isNight}|${intensity}`;
    if (gradientKey === this._lastSkyGradientKey) return;
    this._lastSkyGradientKey = gradientKey;
    this._lastSunElevation = elevation;
    const { topColor, horizonColor, bottomColor } = this._getSkyGradient(elevation);
    const topRgba = this._hexToRgba(topColor, intensity);
    const bottomRgba = this._hexToRgba(bottomColor, intensity * 0.7);
    skyLayer.style.background = `linear-gradient(to bottom, ${topRgba} 0%, transparent 25%, transparent 75%, ${bottomRgba} 100%)`;
  }
  _hexToRgba(hex, alpha) {
    const rgb = this._hexToRgb(hex);
    if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }
  // Legacy method kept for compatibility - now calls _updateSkyGradient
  _drawSkyGradient() {
    this._updateSkyGradient();
  }
  // ───────────────────────────────────────────────────────────────────────────
  // CELESTIAL BODIES (Moon & Sun)
  // ───────────────────────────────────────────────────────────────────────────
  _getMoonPhase() {
    const moonEnt = this._config.moon_entity || "sensor.moon_phase";
    const entityPhase = this._hass.states[moonEnt]?.state;
    const now = Date.now();
    const cache = this._moonPhaseCache;
    if (cache && cache.entityPhase === entityPhase && now - cache.timestamp < 6e4) {
      return cache.phase;
    }
    const calculated = this._calculateMoonPhase();
    const phase = entityPhase ? { ...calculated, name: entityPhase } : calculated;
    this._moonPhaseCache = { entityPhase, timestamp: now, phase };
    return phase;
  }
  _calculateMoonPhase() {
    const knownNewMoon = (/* @__PURE__ */ new Date("2025-01-29T12:36:00Z")).getTime();
    const synodicMonth = 29.530588853;
    const now = Date.now();
    const daysSinceNew = (now - knownNewMoon) / (1e3 * 60 * 60 * 24);
    const moonAge = (daysSinceNew % synodicMonth + synodicMonth) % synodicMonth;
    const phaseValue = moonAge / synodicMonth;
    const illumination = (1 - Math.cos(phaseValue * 2 * Math.PI)) / 2;
    let name;
    if (phaseValue < 0.0625) name = "new_moon";
    else if (phaseValue < 0.1875) name = "waxing_crescent";
    else if (phaseValue < 0.3125) name = "first_quarter";
    else if (phaseValue < 0.4375) name = "waxing_gibbous";
    else if (phaseValue < 0.5625) name = "full_moon";
    else if (phaseValue < 0.6875) name = "waning_gibbous";
    else if (phaseValue < 0.8125) name = "last_quarter";
    else if (phaseValue < 0.9375) name = "waning_crescent";
    else name = "new_moon";
    return { name, illumination, phaseValue };
  }
  _drawMoon(cloudCoverage) {
    const sunEnt = this._config.sun_entity || "sun.sun";
    const isNight = this._hass.states[sunEnt]?.state === "below_horizon";
    if (!isNight) return;
    const phaseData = this._getMoonPhase();
    const phaseName = phaseData.name || phaseData;
    const illumination = phaseData.illumination ?? 0.5;
    if (phaseName === "new_moon") return;
    const posX = (this._config.moon_position_x ?? 85) / 100 * this._canvas.width;
    const posY = (this._config.moon_position_y ?? 15) / 100 * this._canvas.height;
    const baseSize = 18 * (this._config.moon_size ?? 1);
    const cloudOcclusion = Math.max(0, 1 - cloudCoverage / 100 * 0.8);
    if (cloudOcclusion <= 0.1) return;
    this._ctx.save();
    this._ctx.globalAlpha = cloudOcclusion;
    if (this._config.moon_glow !== false) {
      this._drawMoonGlow(posX, posY, baseSize, phaseName, illumination);
    }
    this._ctx.beginPath();
    this._ctx.arc(posX, posY, baseSize, 0, Math.PI * 2);
    const surfaceGrad = this._ctx.createRadialGradient(
      posX - baseSize * 0.3,
      posY - baseSize * 0.3,
      0,
      posX,
      posY,
      baseSize
    );
    surfaceGrad.addColorStop(0, "#FFFEF0");
    surfaceGrad.addColorStop(0.5, "#F5F5DC");
    surfaceGrad.addColorStop(1, "#E8E4D4");
    this._ctx.fillStyle = surfaceGrad;
    this._ctx.fill();
    this._drawMoonCraters(posX, posY, baseSize);
    this._drawPhaseShadow(posX, posY, baseSize, phaseName, illumination);
    this._ctx.restore();
  }
  _drawMoonGlow(x, y, size, phase, illumination = 0.5) {
    this._moonGlowPhase += 0.02;
    const glowPulse = 1 + Math.sin(this._moonGlowPhase) * 0.1;
    const glowIntensity = 0.2 + illumination * 0.4;
    const outerGlow = this._ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 4 * glowPulse);
    outerGlow.addColorStop(0, `rgba(255, 255, 240, ${glowIntensity * 0.5})`);
    outerGlow.addColorStop(0.4, `rgba(230, 230, 200, ${glowIntensity * 0.2})`);
    outerGlow.addColorStop(1, "rgba(200, 200, 180, 0)");
    this._ctx.fillStyle = outerGlow;
    this._ctx.beginPath();
    this._ctx.arc(x, y, size * 4 * glowPulse, 0, Math.PI * 2);
    this._ctx.fill();
    const innerGlow = this._ctx.createRadialGradient(x, y, size, x, y, size * 1.8);
    innerGlow.addColorStop(0, `rgba(255, 255, 245, ${glowIntensity})`);
    innerGlow.addColorStop(1, "rgba(255, 255, 240, 0)");
    this._ctx.fillStyle = innerGlow;
    this._ctx.beginPath();
    this._ctx.arc(x, y, size * 1.8, 0, Math.PI * 2);
    this._ctx.fill();
  }
  _drawSun(cloudCoverage) {
    const sunEnt = this._config.sun_entity || "sun.sun";
    const isDay = this._hass.states[sunEnt]?.state === "above_horizon";
    if (!isDay) return;
    const posX = (this._config.sun_position_x ?? 15) / 100 * this._canvas.width;
    const posY = (this._config.sun_position_y ?? 20) / 100 * this._canvas.height;
    const baseSize = 22 * (this._config.sun_size ?? 1);
    const cloudOcclusion = Math.max(0.15, 1 - cloudCoverage / 100 * 0.85);
    if (cloudOcclusion <= 0.1) return;
    this._ctx.save();
    this._ctx.globalAlpha = cloudOcclusion;
    if (this._config.sun_rays !== false) {
      this._drawSunRays(posX, posY, baseSize);
    }
    if (this._config.sun_glow !== false) {
      this._drawSunGlow(posX, posY, baseSize);
    }
    const coronaGrad = this._ctx.createRadialGradient(posX, posY, baseSize * 0.95, posX, posY, baseSize * 1.15);
    coronaGrad.addColorStop(0, "rgba(255, 242, 230, 0)");
    coronaGrad.addColorStop(0.5, "rgba(255, 225, 180, 0.4)");
    coronaGrad.addColorStop(1, "rgba(255, 200, 120, 0.2)");
    this._ctx.fillStyle = coronaGrad;
    this._ctx.beginPath();
    this._ctx.arc(posX, posY, baseSize * 1.15, 0, Math.PI * 2);
    this._ctx.fill();
    const sunGrad = this._ctx.createRadialGradient(
      posX - baseSize * 0.15,
      posY - baseSize * 0.15,
      0,
      posX,
      posY,
      baseSize
    );
    sunGrad.addColorStop(0, "#FFFEF8");
    sunGrad.addColorStop(0.4, "#FFFAED");
    sunGrad.addColorStop(0.7, "#FFEDBB");
    sunGrad.addColorStop(0.9, "#FFE082");
    sunGrad.addColorStop(1, "rgba(255, 210, 100, 0.95)");
    this._ctx.fillStyle = sunGrad;
    this._ctx.beginPath();
    this._ctx.arc(posX, posY, baseSize, 0, Math.PI * 2);
    this._ctx.fill();
    this._ctx.globalCompositeOperation = "source-over";
    const edgeBlur = this._ctx.createRadialGradient(posX, posY, baseSize * 0.88, posX, posY, baseSize * 1.02);
    edgeBlur.addColorStop(0, "rgba(255, 250, 235, 0)");
    edgeBlur.addColorStop(0.6, "rgba(255, 240, 210, 0.15)");
    edgeBlur.addColorStop(1, "rgba(255, 230, 180, 0)");
    this._ctx.fillStyle = edgeBlur;
    this._ctx.beginPath();
    this._ctx.arc(posX, posY, baseSize * 1.02, 0, Math.PI * 2);
    this._ctx.fill();
    this._ctx.restore();
  }
  _drawSunGlow(x, y, size) {
    this._sunGlowPhase += 8e-3;
    const atmospherePulse = 1 + Math.sin(this._sunGlowPhase) * 0.03;
    const farGlow = this._ctx.createRadialGradient(x, y, size * 1.5, x, y, size * 6 * atmospherePulse);
    farGlow.addColorStop(0, "rgba(255, 248, 225, 0.12)");
    farGlow.addColorStop(0.2, "rgba(255, 242, 200, 0.08)");
    farGlow.addColorStop(0.4, "rgba(255, 235, 180, 0.05)");
    farGlow.addColorStop(0.7, "rgba(255, 220, 150, 0.02)");
    farGlow.addColorStop(1, "rgba(255, 210, 130, 0)");
    this._ctx.fillStyle = farGlow;
    this._ctx.beginPath();
    this._ctx.arc(x, y, size * 6 * atmospherePulse, 0, Math.PI * 2);
    this._ctx.fill();
    const midGlow = this._ctx.createRadialGradient(x, y, size * 1.2, x, y, size * 3.5);
    midGlow.addColorStop(0, "rgba(255, 250, 235, 0.18)");
    midGlow.addColorStop(0.3, "rgba(255, 245, 215, 0.12)");
    midGlow.addColorStop(0.6, "rgba(255, 238, 190, 0.06)");
    midGlow.addColorStop(1, "rgba(255, 225, 165, 0)");
    this._ctx.fillStyle = midGlow;
    this._ctx.beginPath();
    this._ctx.arc(x, y, size * 3.5, 0, Math.PI * 2);
    this._ctx.fill();
    const nearGlow = this._ctx.createRadialGradient(x, y, size * 1.1, x, y, size * 2);
    nearGlow.addColorStop(0, "rgba(255, 252, 245, 0.25)");
    nearGlow.addColorStop(0.5, "rgba(255, 248, 225, 0.15)");
    nearGlow.addColorStop(1, "rgba(255, 240, 200, 0)");
    this._ctx.fillStyle = nearGlow;
    this._ctx.beginPath();
    this._ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    this._ctx.fill();
  }
  _drawSunRays(x, y, size) {
    this._sunRayRotation += 5e-4;
    this._ctx.save();
    this._ctx.translate(x, y);
    this._ctx.rotate(this._sunRayRotation);
    for (let layer = 0; layer < 3; layer++) {
      const layerSize = size * (2 + layer * 1.5);
      const layerOpacity = 0.015 - layer * 3e-3;
      const hazeGrad = this._ctx.createRadialGradient(0, 0, size * 1.2, 0, 0, layerSize);
      hazeGrad.addColorStop(0, `rgba(255, 250, 235, ${layerOpacity * 1.5})`);
      hazeGrad.addColorStop(0.3, `rgba(255, 245, 220, ${layerOpacity * 1})`);
      hazeGrad.addColorStop(0.6, `rgba(255, 240, 205, ${layerOpacity * 0.6})`);
      hazeGrad.addColorStop(1, "rgba(255, 235, 190, 0)");
      this._ctx.fillStyle = hazeGrad;
      this._ctx.beginPath();
      this._ctx.arc(0, 0, layerSize, 0, Math.PI * 2);
      this._ctx.fill();
    }
    const numDirections = 12;
    for (let i = 0; i < numDirections; i++) {
      const angle = i / numDirections * Math.PI * 2;
      const hazeLength = size * 3.5;
      this._ctx.save();
      this._ctx.rotate(angle);
      const dirGrad = this._ctx.createLinearGradient(size * 1.1, 0, size * 1.1 + hazeLength, 0);
      dirGrad.addColorStop(0, "rgba(255, 248, 230, 0.012)");
      dirGrad.addColorStop(0.5, "rgba(255, 243, 215, 0.006)");
      dirGrad.addColorStop(1, "rgba(255, 238, 200, 0)");
      const hazeSpread = size * 2;
      this._ctx.beginPath();
      this._ctx.moveTo(size * 1.1, -hazeSpread * 0.5);
      this._ctx.lineTo(size * 1.1 + hazeLength, -hazeSpread);
      this._ctx.lineTo(size * 1.1 + hazeLength, hazeSpread);
      this._ctx.lineTo(size * 1.1, hazeSpread * 0.5);
      this._ctx.closePath();
      this._ctx.fillStyle = dirGrad;
      this._ctx.fill();
      this._ctx.restore();
    }
    this._ctx.restore();
  }
  _drawMoonCraters(x, y, size) {
    const craters = [
      { dx: -0.3, dy: -0.2, r: 0.15, a: 0.08 },
      { dx: 0.2, dy: 0.3, r: 0.12, a: 0.06 },
      { dx: -0.1, dy: 0.4, r: 0.1, a: 0.05 },
      { dx: 0.35, dy: -0.1, r: 0.08, a: 0.04 },
      { dx: 0.1, dy: -0.35, r: 0.1, a: 0.05 }
    ];
    craters.forEach((c) => {
      this._ctx.beginPath();
      this._ctx.arc(x + c.dx * size, y + c.dy * size, c.r * size, 0, Math.PI * 2);
      this._ctx.fillStyle = `rgba(180, 175, 160, ${c.a})`;
      this._ctx.fill();
    });
  }
  _drawPhaseShadow(x, y, size, phase, illumination) {
    let shadowSide = "left";
    if (phase === "new_moon") {
      illumination = 0;
    } else if (phase === "full_moon" || illumination >= 0.99) {
      return;
    } else if (phase.includes("waning") || phase === "last_quarter") {
      shadowSide = "right";
    }
    this._ctx.save();
    this._ctx.beginPath();
    this._ctx.arc(x, y, size, 0, Math.PI * 2);
    this._ctx.clip();
    const terminatorBulge = size * Math.cos(illumination * Math.PI);
    this._ctx.beginPath();
    if (illumination < 0.5) {
      this._ctx.fillStyle = "rgba(15, 20, 30, 0.95)";
      this._ctx.fillRect(x - size - 1, y - size - 1, size * 2 + 2, size * 2 + 2);
      this._ctx.globalCompositeOperation = "destination-out";
      this._ctx.beginPath();
      if (shadowSide === "left") {
        this._ctx.arc(x, y, size, -Math.PI / 2, Math.PI / 2, false);
        this._ctx.ellipse(x, y, Math.abs(terminatorBulge), size, 0, Math.PI / 2, -Math.PI / 2, terminatorBulge > 0);
      } else {
        this._ctx.arc(x, y, size, Math.PI / 2, -Math.PI / 2, false);
        this._ctx.ellipse(x, y, Math.abs(terminatorBulge), size, 0, -Math.PI / 2, Math.PI / 2, terminatorBulge > 0);
      }
      this._ctx.closePath();
      this._ctx.fill();
      this._ctx.globalCompositeOperation = "source-over";
    } else {
      this._ctx.beginPath();
      if (shadowSide === "left") {
        this._ctx.arc(x, y, size, Math.PI / 2, -Math.PI / 2, false);
        this._ctx.ellipse(x, y, Math.abs(terminatorBulge), size, 0, -Math.PI / 2, Math.PI / 2, terminatorBulge < 0);
      } else {
        this._ctx.arc(x, y, size, -Math.PI / 2, Math.PI / 2, false);
        this._ctx.ellipse(x, y, Math.abs(terminatorBulge), size, 0, Math.PI / 2, -Math.PI / 2, terminatorBulge < 0);
      }
      this._ctx.closePath();
      this._ctx.fillStyle = "rgba(15, 20, 30, 0.95)";
      this._ctx.fill();
    }
    this._ctx.restore();
  }
  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────
  _render() {
    this.shadowRoot.innerHTML = `
                <style>${CARD_STYLES}</style>
        
        <div class="card">
          <div class="sky-gradient-layer"></div>
          <div class="bg-image"></div>
          <div class="gradient-layer"></div>
          <div class="dim-layer"></div>
          <div class="window-lights-layer"></div>
          <div class="power-stations-layer"></div>
          <div class="thermostat-badges-layer"></div>
          <div class="ambient-layer">
              <div class="ambient-light blob-1"></div>
              <div class="ambient-light blob-2"></div>
              <div class="ambient-light blob-3"></div>
          </div>
          <canvas id="weatherCanvas"></canvas>
          <div class="decorations-layer"></div>
          <div class="nav-links-layer"></div>
          <div class="badges-layer"></div>
        </div>
      `;
    this._cardElement = this.shadowRoot.querySelector(".card");
    this._bgImageElement = this.shadowRoot.querySelector(".bg-image");
    this._canvas = this.shadowRoot.getElementById("weatherCanvas");
    this._ctx = this._canvas.getContext("2d");
    setTimeout(() => this._resizeCanvas(), 100);
    this._observeCardSize();
  }
  _resizeCanvas() {
    if (!this._canvas) return;
    const card = this._cardElement || this.shadowRoot.querySelector(".card");
    if (!card || card.clientWidth <= 0 || card.clientHeight <= 0) return false;
    let resized = false;
    if (this._canvas.width !== card.clientWidth) {
      this._canvas.width = card.clientWidth;
      resized = true;
    }
    if (this._canvas.height !== card.clientHeight) {
      this._canvas.height = card.clientHeight;
      resized = true;
    }
    return resized;
  }
  // ───────────────────────────────────────────────────────────────────────────
  // CANVAS ANIMATIONS
  // ───────────────────────────────────────────────────────────────────────────
  // --- ANIMATIONS ---
  _initStars() {
    this._stars = [];
    for (let i = 0; i < 60; i++) {
      this._stars.push({
        x: Math.random() * (this._canvas ? this._canvas.width : 300),
        y: Math.random() * (this._canvas ? this._canvas.height : 200),
        size: Math.random() * 1.5,
        opacity: Math.random(),
        speed: 0.01 + Math.random() * 0.02
      });
    }
  }
  _animate(timestamp = performance.now()) {
    if (!this._ctx || !this._hass || !this._canvas) {
      this._animationFrame = null;
      return;
    }
    if (document.hidden || !this._isVisible) {
      this._animationFrame = null;
      return;
    }
    const now = timestamp;
    const { wState, windDirX, moveSpeed, isNight, coverage } = this._animationState;
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._updateSkyGradient();
    if (isNight) this._drawStars(coverage, now);
    if (isNight) this._drawAurora(now);
    if (isNight) this._drawMoon(coverage);
    if (!isNight) this._drawSun(coverage);
    if (isNight && this._config.shooting_stars !== false) this._handleShootingStars(coverage);
    if (this._config.seasonal_particles !== false) this._drawSeasonalParticles(windDirX, moveSpeed);
    if (wState === "fog" || isNight && ["rainy", "cloudy"].includes(wState)) this._drawFog(moveSpeed);
    if (wState && !["clear-night", "sunny"].includes(wState) || coverage > 20) {
      let density = 1;
      if (coverage > 50) density = 1.5;
      if (coverage > 80) density = 2;
      this._drawClouds(windDirX, moveSpeed, density);
    }
    if (["rainy", "pouring", "lightning", "lightning-rainy"].includes(wState)) {
      this._drawRain(wState === "pouring" ? 2 : 1, windDirX, moveSpeed);
    } else if (["snowy", "snowy-rainy"].includes(wState)) {
      this._drawSnow(windDirX, moveSpeed);
    }
    if (["lightning", "lightning-rainy"].includes(wState) || wState === "lightning") this._handleLightning();
    if (this._flashOpacity > 0) {
      this._ctx.fillStyle = `rgba(255, 255, 255, ${this._flashOpacity})`;
      this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
      this._flashOpacity -= 0.05;
    }
    this._animationFrame = this._hasAnimatedEffects() ? requestAnimationFrame((frameTimestamp) => this._animate(frameTimestamp)) : null;
  }
  _hasAnimatedEffects() {
    const { wState, isNight, coverage, season, auroraActive, sunVisible } = this._animationState;
    const seasonalEnabled = this._config.seasonal_particles !== false && (this._config.seasonal_particle_density ?? 1) > 0 && ["autumn", "fall", "spring"].includes(season);
    if (seasonalEnabled) return true;
    if (wState === "fog" || isNight && ["rainy", "cloudy"].includes(wState)) return true;
    if (wState && !["clear-night", "sunny"].includes(wState) || coverage > 20) return true;
    if (["rainy", "pouring", "lightning", "lightning-rainy", "snowy", "snowy-rainy"].includes(wState)) return true;
    if (isNight) {
      if (coverage < 80 || auroraActive) return true;
      if (this._config.shooting_stars !== false && (this._config.shooting_star_frequency ?? 2e-3) > 0 && coverage <= 70) return true;
      if (this._config.moon_glow !== false) {
        const phase = this._getMoonPhase();
        const cloudOcclusion = Math.max(0, 1 - coverage / 100 * 0.8);
        if (phase.name !== "new_moon" && cloudOcclusion > 0.1) return true;
      }
    } else if (sunVisible && (this._config.sun_rays !== false || this._config.sun_glow !== false)) {
      return true;
    }
    return false;
  }
  _drawStars(coverage, timestamp) {
    const visibility = Math.max(0, 1 - coverage / 80);
    if (visibility <= 0) return;
    this._ctx.fillStyle = "#FFF";
    this._stars.forEach((star) => {
      this._ctx.globalAlpha = Math.abs(Math.sin(timestamp * 1e-3 * star.speed + star.x)) * star.opacity * visibility;
      this._ctx.beginPath();
      this._ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this._ctx.fill();
    });
    this._ctx.globalAlpha = 1;
  }
  // --- WEATHER EFFECTS ---
  _drawFog(speed) {
    if (this._fogParticles.length < 10) {
      this._fogParticles.push({
        x: Math.random() * this._canvas.width,
        y: this._canvas.height - Math.random() * 50,
        radius: 50 + Math.random() * 50,
        speed: Math.random() * 0.2 + 0.05
      });
    }
    this._fogParticles.forEach((f) => {
      f.x += f.speed * (speed * 0.5);
      if (f.x > this._canvas.width + 100) f.x = -100;
      const g = this._ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
      g.addColorStop(0, "rgba(200, 200, 210, 0.15)");
      g.addColorStop(1, "rgba(200, 200, 210, 0)");
      this._ctx.fillStyle = g;
      this._ctx.beginPath();
      this._ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      this._ctx.fill();
    });
  }
  _drawClouds(dirX, baseSpeed, density) {
    const target = Math.floor(5 * density);
    if (this._clouds.length < target) {
      const newCloud = this._createCloud(false);
      newCloud.x = dirX > 0 ? -200 : this._canvas.width + 200;
      newCloud.dirX = dirX;
      this._clouds.push(newCloud);
    }
    if (this._clouds.length > target) this._clouds.pop();
    for (let i = this._clouds.length - 1; i >= 0; i--) {
      const cloud = this._clouds[i];
      cloud.x += baseSpeed * 0.3 * dirX;
      if (cloud.x > this._canvas.width + 200 || cloud.x < -200) {
        this._clouds.splice(i, 1);
        continue;
      }
      this._ctx.save();
      this._ctx.translate(cloud.x, cloud.y);
      this._ctx.scale(cloud.scale, cloud.scale);
      cloud.puffs.forEach((puff) => {
        const gradient = this._ctx.createRadialGradient(puff.xOffset, puff.yOffset, 0, puff.xOffset, puff.yOffset, puff.radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${puff.opacity * 0.8})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        this._ctx.fillStyle = gradient;
        this._ctx.beginPath();
        this._ctx.arc(puff.xOffset, puff.yOffset, puff.radius, 0, Math.PI * 2);
        this._ctx.fill();
      });
      this._ctx.restore();
    }
  }
  _createCloud(randomX) {
    const puffs = [];
    const numPuffs = 4 + Math.floor(Math.random() * 4);
    const cloudWidth = 100 + Math.random() * 80;
    for (let j = 0; j < numPuffs; j++) puffs.push({ xOffset: Math.random() * cloudWidth - cloudWidth / 2, yOffset: Math.random() * 30 - 15, radius: 25 + Math.random() * 20, opacity: 0.1 + Math.random() * 0.2 });
    return { x: randomX ? Math.random() * (this._canvas ? this._canvas.width : 300) : -150, y: Math.random() * 100, scale: 0.8 + Math.random() * 0.4, puffs };
  }
  _drawRain(intensity, windDirX, windSpeed) {
    if (this._particles.length < 150 * intensity) this._particles.push({ x: Math.random() * this._canvas.width, y: -20, speed: 15 + windSpeed, length: 15 + Math.random() * 10 });
    this._ctx.strokeStyle = "rgba(174, 194, 224, 0.6)";
    this._ctx.lineWidth = 1;
    this._ctx.beginPath();
    const angleX = windDirX * (windSpeed * 1.5);
    const canvasHeight = this._canvas.height;
    const canvasWidth = this._canvas.width;
    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      this._ctx.moveTo(p.x, p.y);
      this._ctx.lineTo(p.x + angleX, p.y + p.length);
      p.y += p.speed;
      p.x += angleX;
    }
    this._ctx.stroke();
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < this._particles.length; readIndex++) {
      const particle = this._particles[readIndex];
      if (particle.y <= canvasHeight && particle.x <= canvasWidth + 50 && particle.x >= -50) {
        this._particles[writeIndex++] = particle;
      }
    }
    this._particles.length = writeIndex;
  }
  _drawSnow(windDirX, windSpeed) {
    if (this._particles.length < 100) this._particles.push({ x: Math.random() * this._canvas.width, y: -10, speed: 1 + Math.random(), radius: 1.5 + Math.random() });
    this._ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this._ctx.beginPath();
    const canvasHeight = this._canvas.height;
    const canvasWidth = this._canvas.width;
    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      this._ctx.moveTo(p.x, p.y);
      this._ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      p.y += p.speed;
      p.x += Math.sin(p.y * 0.03) * 0.5 + windDirX * windSpeed * 0.5;
    }
    this._ctx.fill();
    let writeIndex = 0;
    for (let readIndex = 0; readIndex < this._particles.length; readIndex++) {
      const particle = this._particles[readIndex];
      if (particle.y <= canvasHeight && particle.x <= canvasWidth + 50 && particle.x >= -50) {
        this._particles[writeIndex++] = particle;
      }
    }
    this._particles.length = writeIndex;
  }
  // --- SHOOTING STARS ---
  _handleShootingStars(cloudCoverage) {
    if (cloudCoverage > 70) return;
    const frequency = this._config.shooting_star_frequency ?? 2e-3;
    this._shootingStarTimer++;
    if (this._shootingStarTimer > 60 && Math.random() < frequency) {
      this._spawnShootingStar();
      this._shootingStarTimer = 0;
    }
    for (let i = this._shootingStars.length - 1; i >= 0; i--) {
      const star = this._shootingStars[i];
      this._drawShootingStar(star);
      star.x += star.speedX;
      star.y += star.speedY;
      star.life--;
      star.trail.unshift({ x: star.x, y: star.y });
      if (star.trail.length > star.trailLength) star.trail.pop();
      if (star.life <= 0 || star.x > this._canvas.width + 50 || star.y > this._canvas.height + 50) {
        this._shootingStars.splice(i, 1);
      }
    }
  }
  _spawnShootingStar() {
    const startX = Math.random() * this._canvas.width * 0.8;
    const startY = Math.random() * this._canvas.height * 0.3;
    const angle = Math.PI / 6 + Math.random() * (Math.PI / 4);
    const speed = 8 + Math.random() * 6;
    this._shootingStars.push({
      x: startX,
      y: startY,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      size: 1.5 + Math.random() * 1.5,
      life: 40 + Math.random() * 30,
      trail: [],
      trailLength: 12 + Math.floor(Math.random() * 8),
      brightness: 0.8 + Math.random() * 0.2
    });
  }
  _drawShootingStar(star) {
    if (star.trail.length > 1) {
      this._ctx.beginPath();
      this._ctx.moveTo(star.x, star.y);
      for (let i = 0; i < star.trail.length; i++) {
        const point = star.trail[i];
        const alpha = (1 - i / star.trail.length) * star.brightness * 0.6;
        this._ctx.lineTo(point.x, point.y);
      }
      const gradient = this._ctx.createLinearGradient(
        star.x,
        star.y,
        star.trail[star.trail.length - 1]?.x || star.x,
        star.trail[star.trail.length - 1]?.y || star.y
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${star.brightness})`);
      gradient.addColorStop(0.3, `rgba(200, 220, 255, ${star.brightness * 0.6})`);
      gradient.addColorStop(1, "rgba(150, 180, 255, 0)");
      this._ctx.strokeStyle = gradient;
      this._ctx.lineWidth = star.size;
      this._ctx.lineCap = "round";
      this._ctx.stroke();
    }
    this._ctx.beginPath();
    this._ctx.arc(star.x, star.y, star.size * 1.2, 0, Math.PI * 2);
    this._ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    this._ctx.fill();
    const glow = this._ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
    glow.addColorStop(0, `rgba(200, 220, 255, ${star.brightness * 0.5})`);
    glow.addColorStop(1, "rgba(200, 220, 255, 0)");
    this._ctx.fillStyle = glow;
    this._ctx.beginPath();
    this._ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
    this._ctx.fill();
  }
  // --- SEASONAL PARTICLES ---
  _drawSeasonalParticles(windDirX, windSpeed) {
    const season = this._animationState?.season || "summer";
    if (season !== "autumn" && season !== "fall" && season !== "spring") {
      this._seasonalParticles = [];
      return;
    }
    const density = this._config.seasonal_particle_density ?? 1;
    const maxParticles = Math.floor(25 * density);
    if (this._seasonalParticles.length < maxParticles && Math.random() < 0.1) {
      this._spawnSeasonalParticle(season, windDirX);
    }
    for (let i = this._seasonalParticles.length - 1; i >= 0; i--) {
      const p = this._seasonalParticles[i];
      this._drawSeasonalParticle(p, season);
      p.x += windDirX * windSpeed * 0.8 + Math.sin(p.swayOffset + Date.now() * 2e-3) * p.swayAmount;
      p.y += p.fallSpeed;
      p.rotation += p.rotationSpeed;
      p.swayOffset += 0.02;
      if (p.y > this._canvas.height + 20 || p.x < -50 || p.x > this._canvas.width + 50) {
        this._seasonalParticles.splice(i, 1);
      }
    }
  }
  _spawnSeasonalParticle(season, windDirX) {
    const isAutumn = season === "autumn" || season === "fall";
    const fromSide = Math.random() < 0.3;
    const startX = fromSide ? windDirX > 0 ? -20 : this._canvas.width + 20 : Math.random() * this._canvas.width;
    const startY = fromSide ? Math.random() * this._canvas.height * 0.5 : -20;
    if (isAutumn) {
      const colors = [
        { fill: "#D2691E", stroke: "#8B4513" },
        // Brown/Sienna
        { fill: "#FF8C00", stroke: "#CC7000" },
        // Dark Orange
        { fill: "#CD853F", stroke: "#8B6914" },
        // Peru
        { fill: "#B22222", stroke: "#8B0000" },
        // Firebrick/Red
        { fill: "#DAA520", stroke: "#B8860B" },
        // Goldenrod
        { fill: "#FF6347", stroke: "#CD4F39" }
        // Tomato red
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this._seasonalParticles.push({
        type: "leaf",
        x: startX,
        y: startY,
        size: 6 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        fallSpeed: 0.8 + Math.random() * 1.2,
        swayAmount: 1 + Math.random() * 2,
        swayOffset: Math.random() * Math.PI * 2,
        color,
        leafShape: Math.floor(Math.random() * 3)
        // 0=maple, 1=oak, 2=simple
      });
    } else {
      const colors = [
        { fill: "rgba(255, 182, 193, 0.9)", stroke: "rgba(255, 105, 180, 0.6)" },
        // Pink
        { fill: "rgba(255, 255, 255, 0.9)", stroke: "rgba(255, 192, 203, 0.6)" },
        // White/Pink
        { fill: "rgba(255, 218, 233, 0.9)", stroke: "rgba(255, 160, 200, 0.6)" },
        // Light pink
        { fill: "rgba(230, 230, 250, 0.9)", stroke: "rgba(200, 180, 230, 0.6)" }
        // Lavender
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this._seasonalParticles.push({
        type: "petal",
        x: startX,
        y: startY,
        size: 4 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        fallSpeed: 0.5 + Math.random() * 0.8,
        swayAmount: 1.5 + Math.random() * 2,
        swayOffset: Math.random() * Math.PI * 2,
        color
      });
    }
  }
  _drawSeasonalParticle(p, season) {
    this._ctx.save();
    this._ctx.translate(p.x, p.y);
    this._ctx.rotate(p.rotation);
    if (p.type === "leaf") {
      this._drawLeaf(p);
    } else {
      this._drawPetal(p);
    }
    this._ctx.restore();
  }
  _drawLeaf(p) {
    const size = p.size;
    this._ctx.fillStyle = p.color.fill;
    this._ctx.strokeStyle = p.color.stroke;
    this._ctx.lineWidth = 0.5;
    this._ctx.beginPath();
    if (p.leafShape === 0) {
      this._ctx.moveTo(0, -size);
      this._ctx.quadraticCurveTo(size * 0.5, -size * 0.5, size, -size * 0.3);
      this._ctx.quadraticCurveTo(size * 0.6, 0, size * 0.8, size * 0.5);
      this._ctx.quadraticCurveTo(size * 0.3, size * 0.3, 0, size);
      this._ctx.quadraticCurveTo(-size * 0.3, size * 0.3, -size * 0.8, size * 0.5);
      this._ctx.quadraticCurveTo(-size * 0.6, 0, -size, -size * 0.3);
      this._ctx.quadraticCurveTo(-size * 0.5, -size * 0.5, 0, -size);
    } else if (p.leafShape === 1) {
      this._ctx.moveTo(0, -size);
      this._ctx.bezierCurveTo(size * 0.8, -size * 0.6, size * 0.6, size * 0.2, size * 0.3, size);
      this._ctx.lineTo(0, size * 0.7);
      this._ctx.lineTo(-size * 0.3, size);
      this._ctx.bezierCurveTo(-size * 0.6, size * 0.2, -size * 0.8, -size * 0.6, 0, -size);
    } else {
      this._ctx.ellipse(0, 0, size * 0.5, size, 0, 0, Math.PI * 2);
    }
    this._ctx.closePath();
    this._ctx.fill();
    this._ctx.stroke();
    this._ctx.beginPath();
    this._ctx.moveTo(0, -size * 0.8);
    this._ctx.lineTo(0, size * 0.8);
    this._ctx.strokeStyle = p.color.stroke;
    this._ctx.lineWidth = 0.3;
    this._ctx.stroke();
  }
  _drawPetal(p) {
    const size = p.size;
    this._ctx.fillStyle = p.color.fill;
    this._ctx.strokeStyle = p.color.stroke;
    this._ctx.lineWidth = 0.5;
    this._ctx.beginPath();
    this._ctx.moveTo(0, -size);
    this._ctx.bezierCurveTo(size * 0.8, -size * 0.5, size * 0.8, size * 0.5, 0, size);
    this._ctx.bezierCurveTo(-size * 0.8, size * 0.5, -size * 0.8, -size * 0.5, 0, -size);
    this._ctx.closePath();
    this._ctx.fill();
    this._ctx.stroke();
  }
  // --- AURORA BOREALIS ---
  _isAuroraActive() {
    if (this._config.test_aurora === true) return true;
    return this._animationState?.auroraActive || false;
  }
  _initAuroraWaves() {
    this._auroraWaves = [];
    const numWaves = 5;
    for (let i = 0; i < numWaves; i++) {
      this._auroraWaves.push({
        baseY: 0.015 + i * 0.04,
        // Vertical position (top portion of sky, 3%-19%)
        amplitude: 8 + Math.random() * 12,
        // Wave height in pixels
        frequency: 3e-3 + Math.random() * 4e-3,
        // Wave frequency
        speed: 4e-4 + Math.random() * 6e-4,
        // Animation speed
        phase: Math.random() * Math.PI * 2,
        // Phase offset
        thickness: 15 + Math.random() * 25,
        // Band thickness
        // Color: green-cyan core with purple edges, varying per wave
        hue: 120 + i * 15 - 10 + Math.random() * 20,
        // 110-185 range (green to cyan)
        opacity: 0.04 + Math.random() * 0.04,
        // Base opacity per wave
        points: new Float32Array(0)
      });
    }
    this._auroraInitialized = true;
  }
  _drawAurora(timestamp) {
    if (!this._isAuroraActive()) {
      if (this._auroraInitialized) {
        this._auroraWaves = [];
        this._auroraInitialized = false;
      }
      return;
    }
    if (!this._auroraInitialized || this._auroraWaves.length === 0) {
      this._initAuroraWaves();
    }
    const W = this._canvas.width;
    const H = this._canvas.height;
    const intensity = this._config.aurora_intensity ?? 1;
    this._auroraTime = timestamp * 1e-3;
    this._ctx.save();
    this._ctx.globalCompositeOperation = "screen";
    for (const wave of this._auroraWaves) {
      const t = this._auroraTime;
      const breathe = 0.6 + 0.4 * Math.sin(t * 0.3 + wave.phase);
      const alpha = wave.opacity * intensity * breathe;
      if (alpha <= 0.01) continue;
      this._ctx.beginPath();
      const steps = Math.max(1, Math.ceil(W / 4));
      if (wave.points.length !== (steps + 1) * 2) {
        wave.points = new Float32Array((steps + 1) * 2);
      }
      const baseY = wave.baseY * H;
      for (let i = 0; i <= steps; i++) {
        const x = i / steps * W;
        const y1 = Math.sin(x * wave.frequency + t * wave.speed * 1e3 + wave.phase) * wave.amplitude;
        const y2 = Math.sin(x * wave.frequency * 2.3 + t * wave.speed * 700 - wave.phase * 0.7) * (wave.amplitude * 0.4);
        const y3 = Math.sin(x * wave.frequency * 0.5 + t * wave.speed * 400 + wave.phase * 1.3) * (wave.amplitude * 0.6);
        const yOffset = y1 + y2 + y3;
        wave.points[i * 2] = baseY + yOffset;
        wave.points[i * 2 + 1] = baseY + yOffset + wave.thickness + Math.sin(x * 0.01 + t * 0.5) * 5;
      }
      this._ctx.moveTo(0, wave.points[0]);
      for (let i = 1; i <= steps; i++) {
        this._ctx.lineTo(i / steps * W, wave.points[i * 2]);
      }
      for (let i = steps; i >= 0; i--) {
        this._ctx.lineTo(i / steps * W, wave.points[i * 2 + 1]);
      }
      this._ctx.closePath();
      const midY = wave.baseY * H;
      const grad = this._ctx.createLinearGradient(0, midY - wave.amplitude, 0, midY + wave.thickness + wave.amplitude);
      const coreH = wave.hue;
      const edgeH = (wave.hue + 180) % 360;
      grad.addColorStop(0, `hsla(${edgeH}, 80%, 50%, ${alpha * 0.2})`);
      grad.addColorStop(0.2, `hsla(${coreH}, 90%, 55%, ${alpha * 0.7})`);
      grad.addColorStop(0.5, `hsla(${coreH}, 95%, 60%, ${alpha * 0.8})`);
      grad.addColorStop(0.8, `hsla(${coreH}, 90%, 55%, ${alpha * 0.7})`);
      grad.addColorStop(1, `hsla(${edgeH}, 80%, 50%, ${alpha * 0.2})`);
      this._ctx.fillStyle = grad;
      this._ctx.fill();
      this._ctx.shadowColor = `hsla(${coreH}, 90%, 60%, ${alpha * 0.3})`;
      this._ctx.shadowBlur = 15;
      this._ctx.fill();
      this._ctx.shadowBlur = 0;
    }
    this._ctx.restore();
  }
  // --- LIGHTNING ---
  _handleLightning() {
    this._lightningTimer++;
    if (this._lightningTimer > 200 && Math.random() > 0.98) {
      this._triggerLightning();
      this._lightningTimer = 0;
    }
    if (this._lightningBolt && this._lightningBolt.life > 0) {
      this._drawBolt(this._lightningBolt);
      this._lightningBolt.life--;
    }
  }
  _triggerLightning() {
    const startX = Math.random() * this._canvas.width;
    const path = [{ x: startX, y: 0 }];
    let currX = startX, currY = 0;
    while (currY < this._canvas.height * 0.8) {
      currY += Math.random() * 40 + 20;
      currX += Math.random() * 60 - 30;
      path.push({ x: currX, y: currY });
    }
    this._lightningBolt = { path, life: 10 };
    this._flashOpacity = 0.5;
  }
  _drawBolt(bolt) {
    this._ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    this._ctx.lineWidth = 2;
    this._ctx.beginPath();
    this._ctx.moveTo(bolt.path[0].x, bolt.path[0].y);
    for (let p of bolt.path) this._ctx.lineTo(p.x, p.y);
    this._ctx.stroke();
  }
};

// src/power-station.js
var POWER_STATION_SORTED_SUFFIXES = POWER_STATION_SUFFIXES.map((item) => item.suffix).sort((a, b) => b.length - a.length);
var withPowerStation = (Base) => class extends Base {
  _getPowerStationSelection() {
    const selectedDeviceId = this._config.power_station_device_id || null;
    const legacyEntityId = this._config.power_station_entity || null;
    const legacyDeviceId = legacyEntityId && this._hass?.entities?.[legacyEntityId]?.device_id ? this._hass.entities[legacyEntityId].device_id : null;
    return {
      deviceId: selectedDeviceId || legacyDeviceId,
      legacyEntityId,
      legacyPrefix: legacyEntityId ? this._resolvePowerStationPrefix(legacyEntityId) : null
    };
  }
  _getPowerStationEntityId(prefix, suffix, domain) {
    if (!prefix) return null;
    return `${domain || "sensor"}.${prefix}_${suffix}`;
  }
  _getPowerStationState(entityId) {
    if (!entityId || !this._hass?.states) return null;
    return this._hass.states[entityId] || null;
  }
  _resolvePowerStationPrefix(entityId) {
    if (!entityId) return null;
    const objectId = entityId.includes(".") ? entityId.split(".")[1] : entityId;
    for (const suffix of POWER_STATION_SORTED_SUFFIXES) {
      const suffixToken = `_${suffix}`;
      if (objectId.endsWith(suffixToken)) {
        return objectId.slice(0, -suffixToken.length);
      }
    }
    return objectId;
  }
  _getPowerStationDeviceName(deviceId) {
    if (!deviceId || !this._hass?.devices) return null;
    const device = this._hass.devices[deviceId];
    return device?.name_by_user || device?.name || device?.model || null;
  }
  _getPowerStationDeviceEntityIds(deviceId) {
    if (!deviceId || !this._hass) return [];
    const entityRegistry = this._hass.entities || {};
    const cached = this._powerStationEntityCache;
    if (cached?.deviceId === deviceId && cached.entityRegistry === entityRegistry) {
      return cached.entityIds;
    }
    const entityIds = Object.keys(entityRegistry).filter((entityId) => entityRegistry[entityId]?.device_id === deviceId);
    this._powerStationEntityCache = { deviceId, entityRegistry, entityIds, entityMap: null };
    return entityIds;
  }
  _findPowerStationEntityId(entityIds, suffix, domain) {
    const suffixToken = `_${suffix}`;
    return entityIds.find((entityId) => {
      const [entityDomain, objectId] = entityId.split(".");
      return (!domain || entityDomain === domain) && objectId.endsWith(suffixToken);
    }) || null;
  }
  _resolvePowerStationEntityMap() {
    const selection = this._getPowerStationSelection();
    if (selection.deviceId) {
      const entityRegistry = this._hass?.entities;
      let cache = this._powerStationEntityCache;
      if (cache?.deviceId !== selection.deviceId || cache.entityRegistry !== entityRegistry) {
        this._getPowerStationDeviceEntityIds(selection.deviceId);
        cache = this._powerStationEntityCache;
      }
      if (!cache) {
        cache = { deviceId: selection.deviceId, entityRegistry, entityIds: [], entityMap: null };
        this._powerStationEntityCache = cache;
      }
      if (!cache.entityMap) {
        const entities2 = {};
        for (const spec of POWER_STATION_SUFFIXES) {
          entities2[spec.suffix] = this._findPowerStationEntityId(cache.entityIds, spec.suffix, spec.domain);
        }
        cache.entityMap = entities2;
      }
      return {
        mode: "device",
        deviceId: selection.deviceId,
        title: this._getPowerStationDeviceName(selection.deviceId) || "Power Station",
        entities: cache.entityMap
      };
    }
    const legacyPrefix = selection.legacyPrefix;
    const entities = {};
    for (const spec of POWER_STATION_SUFFIXES) {
      entities[spec.suffix] = this._getPowerStationEntityId(legacyPrefix, spec.suffix, spec.domain);
    }
    return {
      mode: "legacy",
      deviceId: null,
      title: legacyPrefix ? legacyPrefix.replace(/_/g, "-").toUpperCase() : "Power Station",
      entities
    };
  }
  _formatPowerStationValue(state, fallback = "\u2014") {
    if (!state) return fallback;
    const raw = state.state;
    if (raw === void 0 || raw === null || raw === "unknown" || raw === "unavailable") return fallback;
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      const unit = state.attributes?.unit_of_measurement || "";
      if (unit === "%") return `${Math.round(numeric)}%`;
      if (unit === "W" || unit === "kW" || unit === "V" || unit === "A" || unit === "Hz") {
        return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}${unit}`;
      }
      return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}${unit ? ` ${unit}` : ""}`.trim();
    }
    return `${raw}${state.attributes?.unit_of_measurement ? ` ${state.attributes.unit_of_measurement}` : ""}`.trim();
  }
  _formatPowerStationRemainingValue(state, fallback = "\u2014") {
    if (!state) return fallback;
    const raw = state.state;
    if (raw === void 0 || raw === null || raw === "unknown" || raw === "unavailable") return fallback;
    const rawText = String(raw).trim().replace(/,/g, "").toLowerCase();
    const numericMatch = rawText.match(/-?\d*\.?\d+/);
    const numeric = numericMatch ? Number(numericMatch[0]) : Number(raw);
    if (!Number.isFinite(numeric)) return this._formatPowerStationValue(state, fallback);
    const unit = state.attributes?.unit_of_measurement || "";
    const normalizedUnit = String(unit).toLowerCase();
    const rawHasHourUnit = /\b(h|hr|hrs|hour|hours)\b/.test(rawText) || normalizedUnit === "h" || normalizedUnit === "hr" || normalizedUnit === "hrs" || normalizedUnit === "hour" || normalizedUnit === "hours";
    if (rawHasHourUnit) {
      return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)} hr`;
    }
    if (numeric > 99) {
      const hours = numeric / 60;
      const hourLabel = hours === 1 ? "hr" : "hrs";
      return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)} ${hourLabel}`;
    }
    return `${Math.round(numeric)} min`;
  }
  _formatPowerStationSummaryValue(value, fallback = "\u2014") {
    if (!value || value === fallback) return fallback;
    const match = String(value).match(/-?\d*\.?\d+/);
    return match ? match[0] : value;
  }
  _getPowerStationTitle(data, fallback = "Power Station") {
    const inputState = this._getPowerStationState(data?.entities?.total_input_power) || this._getPowerStationState(data?.entities?.ac_input_power) || this._getPowerStationState(data?.entities?.dc_input_power);
    const outputState = this._getPowerStationState(data?.entities?.total_output_power) || this._getPowerStationState(data?.entities?.ac_output_power) || this._getPowerStationState(data?.entities?.dc_car_output_power);
    const inputValue = Number(String(inputState?.state || "").replace(/[^\d.-]/g, ""));
    const outputValue = Number(String(outputState?.state || "").replace(/[^\d.-]/g, ""));
    if (Number.isFinite(inputValue) && Number.isFinite(outputValue)) {
      if (inputValue > outputValue) return "Charging";
      if (outputValue > inputValue) return "Discharging";
      if (inputValue === 0 && outputValue === 0) return "Idle";
      if (inputValue === outputValue) return "Idle";
    }
    const entityIds = /* @__PURE__ */ new Set(
      [...Object.values(data?.entities || {}).filter(Boolean), ...data?.deviceId ? this._getPowerStationDeviceEntityIds(data.deviceId) : []]
    );
    for (const entityId of entityIds) {
      const state = this._getPowerStationState(entityId);
      if (!state) continue;
      const entityName = String(entityId).split(".").slice(1).join(".").toLowerCase();
      const stateValue = String(state.state || "").toLowerCase();
      if (entityName.includes("discharging") || stateValue === "discharging") return "Discharging";
      if (entityName.includes("charging") || stateValue === "charging") return "Charging";
    }
    return data?.title || fallback;
  }
  _buildPowerStationStats() {
    const resolved = this._resolvePowerStationEntityMap();
    const stats = POWER_STATION_SUFFIXES.map((item) => {
      const entityId = resolved.entities[item.suffix];
      const state = this._getPowerStationState(entityId);
      return {
        ...item,
        entityId,
        state,
        value: this._formatPowerStationValue(state)
      };
    });
    return {
      ...resolved,
      stats,
      summary: {
        battery: this._formatPowerStationValue(this._getPowerStationState(resolved.entities.battery)),
        input: this._formatPowerStationValue(this._getPowerStationState(resolved.entities.total_input_power)),
        output: this._formatPowerStationValue(this._getPowerStationState(resolved.entities.total_output_power)),
        remaining: this._formatPowerStationRemainingValue(this._getPowerStationState(resolved.entities.remaining_time)),
        temperature: this._formatPowerStationValue(this._getPowerStationState(resolved.entities.temperature))
      },
      hasData: stats.some((item) => item.state && item.state.state !== "unknown" && item.state.state !== "unavailable" && item.state.state !== "offline")
    };
  }
  _updatePowerStationTile() {
    const container = this.shadowRoot.querySelector(".power-stations-layer");
    if (!container) return;
    const selection = this._getPowerStationSelection();
    const entityId = selection.deviceId || selection.legacyEntityId;
    if (!entityId) {
      if (container.firstChild) container.replaceChildren();
      return;
    }
    const data = this._buildPowerStationStats();
    const batteryState = this._getPowerStationState(data.entities.battery);
    const inputState = this._getPowerStationState(data.entities.total_input_power);
    const outputState = this._getPowerStationState(data.entities.total_output_power);
    const remainingState = this._getPowerStationState(data.entities.remaining_time);
    const temperatureState = this._getPowerStationState(data.entities.temperature);
    const acOutputState = this._getPowerStationState(data.entities.ac_output);
    const usbOutputState = this._getPowerStationState(data.entities.usb_output);
    const hash = [
      entityId,
      data.title,
      data.mode,
      batteryState?.state,
      inputState?.state,
      outputState?.state,
      remainingState?.state,
      temperatureState?.state,
      acOutputState?.state,
      usbOutputState?.state
    ].join("|");
    const posHash = [
      this._config.power_station_x,
      this._config.power_station_y,
      this._config.power_station_width,
      this._config.power_station_height
    ].join("|");
    const x = this._config.power_station_x ?? 26;
    const y = this._config.power_station_y ?? 84;
    const width = this._config.power_station_width ?? 34;
    const height = this._config.power_station_height ?? 18;
    if (this._lastPowerStationData === hash && container.querySelector(".power-station-tile")) {
      if (this._lastPowerStationPos !== posHash) {
        this._lastPowerStationPos = posHash;
        const existingTile = container.querySelector(".power-station-tile");
        if (existingTile) {
          existingTile.style.top = `${y}%`;
          existingTile.style.left = `${x}%`;
          existingTile.style.width = `${width}%`;
          existingTile.style.height = `${height}%`;
        }
      }
      return;
    }
    this._lastPowerStationData = hash;
    this._lastPowerStationPos = posHash;
    if (!data.hasData) {
      container.replaceChildren();
      return;
    }
    const inputSummary = this._formatPowerStationSummaryValue(data.summary.input);
    const outputSummary = this._formatPowerStationSummaryValue(data.summary.output);
    const batteryMatch = String(data.summary.battery).match(/-?\d*\.?\d+/);
    const batteryPercent = batteryMatch ? Math.max(0, Math.min(100, Number(batteryMatch[0]))) : 0;
    const powerTitle = this._getPowerStationTitle(data, data.title || "Power Station");
    container.innerHTML = `
          <div class="power-station-tile" data-entity="${entityId}" data-device-id="${data.deviceId || ""}" style="top: ${y}%; left: ${x}%; width: ${width}%; height: ${height}%">
            <div class="power-station-tile__header">
              <ha-icon icon="mdi:battery"></ha-icon>
              <div class="power-station-tile__title-wrap">
                <div class="power-station-tile__title">${powerTitle}</div>
                <div class="power-station-tile__subtitle">
                  <span class="power-station-tile__battery">
                    <span class="power-station-tile__battery-bar">
                      <span class="power-station-tile__battery-fill" style="width: ${batteryPercent}%"></span>
                    </span>
                    <span class="power-station-tile__battery-value">${data.summary.battery}</span>
                  </span>
                </div>
              </div>
            </div>
                        <div class="power-station-tile__summary">
                            <span class="power-station-tile__value power-station-tile__value--input">${inputSummary}</span>
                            <span class="power-station-tile__divider">/</span>
                            <span class="power-station-tile__value power-station-tile__value--output">${outputSummary}</span>
                            <span class="power-station-tile__unit power-station-tile__meta-value">W</span>
                        </div>
                        <div class="power-station-tile__meta">
                            <span>Remain <span class="power-station-tile__meta-value">${data.summary.remaining}</span></span>
                            <span class="power-station-tile__divider">/</span>
                            <span>Temp <span class="power-station-tile__meta-value">${data.summary.temperature}</span></span>
            </div>
          </div>`;
    this._attachPowerStationHandlers(container);
  }
  _attachPowerStationHandlers(container) {
    if (this._powerStationHandlersAttached) return;
    this._powerStationHandlersAttached = true;
    let pressedTile = null;
    let activePointerId = null;
    let startX = 0, startY = 0;
    let pressMoved = false;
    let longPressActive = false;
    let longPressTimer = null;
    const MOVE_THRESHOLD = 10;
    const clearPress = () => {
      if (longPressTimer) clearTimeout(longPressTimer);
      longPressTimer = null;
      pressedTile = null;
      activePointerId = null;
      pressMoved = false;
      longPressActive = false;
    };
    const handleStart = (e) => {
      if (!e.isPrimary || e.button !== 0) return;
      const tile = e.target.closest(".power-station-tile");
      if (!tile) return;
      clearPress();
      pressedTile = tile;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      tile.setPointerCapture(e.pointerId);
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        if (pressedTile !== tile || activePointerId !== e.pointerId || pressMoved) return;
        if (!tile.isConnected) {
          clearPress();
          return;
        }
        longPressActive = true;
        const deviceId = tile.getAttribute("data-device-id") || null;
        const entityId = tile.getAttribute("data-entity") || null;
        this._showPowerStationMenu(tile, deviceId, entityId);
      }, 500);
    };
    const handleMove = (e) => {
      if (e.pointerId !== activePointerId) return;
      if (Math.abs(e.clientX - startX) > MOVE_THRESHOLD || Math.abs(e.clientY - startY) > MOVE_THRESHOLD) {
        pressMoved = true;
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }
    };
    const handleEnd = (e) => {
      if (e.pointerId !== activePointerId || !pressedTile) return;
      const tile = pressedTile;
      const rect = tile.getBoundingClientRect();
      const releasedOnTile = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      const shouldOpenDetails = !longPressActive && !pressMoved && releasedOnTile;
      clearPress();
      if (!shouldOpenDetails) return;
      e.stopPropagation();
      const deviceId = tile.getAttribute("data-device-id") || null;
      const entityId = tile.getAttribute("data-entity") || null;
      this._openPowerStationPopup(deviceId, entityId);
    };
    const handleCancel = (e) => {
      if (e.pointerId === activePointerId) clearPress();
    };
    container.addEventListener("pointerdown", handleStart);
    container.addEventListener("pointermove", handleMove);
    container.addEventListener("pointerup", handleEnd);
    container.addEventListener("pointercancel", handleCancel);
    container.addEventListener("lostpointercapture", handleCancel);
  }
  _showPowerStationMenu(tile, deviceId, legacyEntityId) {
    const existingMenu = document.querySelector(".entity-menu");
    if (existingMenu) existingMenu.remove();
    this._ensureMenuStyles();
    const data = this._buildPowerStationStats();
    const TILE_SUFFIXES = ["battery", "total_input_power", "total_output_power", "remaining_time", "temperature"];
    const SWITCH_SUFFIXES = ["ac_output", "usb_output"];
    const ICONS = {
      battery: "mdi:battery",
      total_input_power: "mdi:transmission-tower-import",
      total_output_power: "mdi:transmission-tower-export",
      remaining_time: "mdi:timer-outline",
      temperature: "mdi:thermometer"
    };
    const availableStats = data.stats.filter((item) => TILE_SUFFIXES.includes(item.suffix) && item.entityId && this._getPowerStationState(item.entityId));
    const items = availableStats.map((item) => {
      const state = this._getPowerStationState(item.entityId);
      const val = this._formatPowerStationValue(state);
      return { id: item.entityId, label: `${item.label}: ${val}`, icon: ICONS[item.suffix] || "mdi:flash", action: "more-info" };
    });
    const switchStats = data.stats.filter((item) => SWITCH_SUFFIXES.includes(item.suffix) && item.entityId);
    const anyEntityId = availableStats[0]?.entityId;
    const autoEntryId = anyEntityId ? this._hass?.entities?.[anyEntityId]?.config_entry_id : null;
    const configEntryId = this._config.oukitel_integration_id || autoEntryId;
    if (items.length === 0 && switchStats.length === 0 && !configEntryId) return;
    const switchRows = switchStats.map((item) => {
      const isOn = this._getPowerStationState(item.entityId)?.state === "on";
      return `<div class="entity-menu-item entity-menu-item--switch" data-action="toggle" data-entity="${item.entityId}">
                <span class="switch-left"><ha-icon icon="${item.icon}"></ha-icon><span>${item.label}</span></span>
                <span class="switch-badge switch-badge--${isOn ? "on" : "off"}">${isOn ? "ON" : "OFF"}</span>
               </div>`;
    }).join("");
    const reloadRow = configEntryId ? `<div class="entity-menu-item entity-menu-item--reload" data-action="reload">
                <ha-icon icon="mdi:refresh"></ha-icon>
                <span>Reload device</span>
               </div>` : "";
    const menu = document.createElement("div");
    menu.className = "entity-menu";
    menu.innerHTML = items.map((ent) => `
            <div class="entity-menu-item" data-entity="${ent.id}">
                <ha-icon icon="${ent.icon}"></ha-icon>
                <span>${ent.label}</span>
            </div>`).join("") + (switchRows ? `<div class="entity-menu-separator"></div>${switchRows}` : "") + (reloadRow ? `<div class="entity-menu-separator"></div>${reloadRow}` : "");
    const rect = tile.getBoundingClientRect();
    document.body.appendChild(menu);
    const menuH = menu.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuH ? rect.bottom : Math.max(8, rect.top - menuH);
    menu.style.top = `${top}px`;
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 8))}px`;
    const handleMenuClick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const item = e.target.closest(".entity-menu-item");
      if (!item) return;
      if (item.dataset.action === "reload" && configEntryId) {
        setTimeout(() => {
          this._hass.callService("homeassistant", "reload_config_entry", { entry_id: configEntryId });
          menu.remove();
          cleanup();
        }, 50);
      } else if (item.dataset.action === "toggle" && item.dataset.entity) {
        this._hass.callService("switch", "toggle", {}, { entity_id: item.dataset.entity });
        menu.remove();
        cleanup();
      } else if (item.dataset.entity) {
        setTimeout(() => {
          this._fireMoreInfo(item.getAttribute("data-entity"));
          menu.remove();
          cleanup();
        }, 50);
      }
    };
    const closeMenu = (e) => {
      if (!e.target.closest(".entity-menu")) {
        menu.remove();
        cleanup();
      }
    };
    const cleanup = () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("touchstart", closeMenu);
      menu.removeEventListener("mousedown", handleMenuClick);
      menu.removeEventListener("touchstart", handleMenuClick);
    };
    menu.addEventListener("mousedown", handleMenuClick);
    menu.addEventListener("touchstart", handleMenuClick, { passive: false });
    setTimeout(() => {
      document.addEventListener("mousedown", closeMenu);
      document.addEventListener("touchstart", closeMenu, { passive: true });
    }, 150);
  }
  _openPowerStationPopup(deviceId, legacyEntityId = null) {
    const data = this._buildPowerStationStats();
    const infoEntities = data.stats.filter((item) => item.entityId && this._getPowerStationState(item.entityId)).map((item) => ({ entity: item.entityId }));
    const cards = [
      {
        type: "entities",
        title: data.title,
        show_header_toggle: false,
        entities: infoEntities
      }
    ];
    const graphEntities = data.stats.filter((item) => ["battery", "total_input_power", "total_output_power", "temperature"].includes(item.suffix) && item.entityId && this._getPowerStationState(item.entityId)).map((item) => ({ entity: item.entityId }));
    if (graphEntities.length > 0) {
      cards.push({
        type: "history-graph",
        title: "Recent Trends",
        entities: graphEntities,
        hours_to_show: 24
      });
    }
    if (!data.hasData) {
      cards.unshift({
        type: "markdown",
        content: `### ${data.title}

No available power station entities were found for the selected device.`
      });
    }
    if (this._hass?.services?.browser_mod?.popup) {
      this._hass.callService("browser_mod", "popup", {
        title: data.title,
        size: "wide",
        content: {
          type: "vertical-stack",
          cards
        }
      });
      return;
    }
    const fallbackEntity = infoEntities[0]?.entity || legacyEntityId;
    if (fallbackEntity) {
      this._fireMoreInfo(fallbackEntity);
    }
  }
  // ───────────────────────────────────────────────────────────────────────────
};

// src/house-card.js
var TRANSLATIONS = {
  en: { loading: "Loading...", home_median: "Home" }
};
var HouseCard = class extends withCanvasEffects(withPowerStation(HTMLElement)) {
  // ───────────────────────────────────────────────────────────────────────────
  // LIFECYCLE & CONFIGURATION
  // ───────────────────────────────────────────────────────────────────────────
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = {};
    this._animationFrame = null;
    this._canvas = null;
    this._ctx = null;
    this._resizeObserver = null;
    this._observedCard = null;
    this._cardElement = null;
    this._bgImageElement = null;
    this._lastImageCandidates = null;
    this._imageLoadToken = 0;
    this._lastBackgroundStyle = null;
    this._lastCardStyle = null;
    this._particles = [];
    this._clouds = [];
    this._stars = [];
    this._fogParticles = [];
    this._lightningTimer = 0;
    this._flashOpacity = 0;
    this._lightningBolt = null;
    this._shootingStars = [];
    this._shootingStarTimer = 0;
    this._auroraWaves = [];
    this._auroraTime = 0;
    this._auroraInitialized = false;
    this._seasonalParticles = [];
    this._moonGlowPhase = 0;
    this._sunGlowPhase = 0;
    this._sunRayRotation = 0;
    this._lastSunElevation = null;
    this._cachedSkyGradient = null;
    this._lastSkyGradientKey = null;
    this._moonPhaseCache = null;
    this._animationState = null;
    this._lastBadgeData = null;
    this._longPressTimer = null;
    this._longPressTriggered = false;
    this._lastWindowLightsData = null;
    this._lastNavLinksData = null;
    this._lastPowerStationData = null;
    this._lastPowerStationPos = null;
    this._lastThermostatBadgeData = null;
    this._lastThermostatBadgePos = null;
    this._powerStationEntityCache = null;
    this._isVisible = false;
    this._intersectionObserver = null;
    this._handleVisibilityChange = this._onVisibilityChange.bind(this);
  }
  static getConfigElement() {
    return document.createElement("house-card-editor");
  }
  static getStubConfig() {
    return {
      language: "en",
      scale: 1,
      background_zoom: 1,
      image_x_offset: 0,
      image_y_offset: 0,
      image_path: DEFAULT_IMAGE_PATH,
      weather_entity: "weather.forecast_home",
      season_entity: "sensor.season",
      sun_entity: "sun.sun",
      sun_elevation_entity: null,
      // Optional: sensor.sun_solar_elevation
      moon_entity: "sensor.moon_phase",
      moon_position_x: 85,
      moon_position_y: 15,
      moon_size: 1,
      moon_glow: true,
      sun_position_x: 15,
      sun_position_y: 20,
      sun_size: 1,
      sun_glow: true,
      sun_rays: true,
      sky_gradient: true,
      sky_gradient_intensity: 0.8,
      shooting_stars: true,
      shooting_star_frequency: 2e-3,
      seasonal_particles: true,
      seasonal_particle_density: 1,
      aurora_entity: null,
      // Optional: binary_sensor for NOAA aurora visibility
      aurora_intensity: 0.75,
      badge_opacity: 0.75,
      cloud_coverage_entity: "sensor.openweathermap_cloud_coverage",
      party_mode_entity: "input_boolean.gaming_mode",
      thermostat_entity: null,
      thermostat_title: "",
      thermostat_x: 50,
      thermostat_y: 50,
      power_station_device_id: null,
      power_station_x: 26,
      power_station_y: 84,
      power_station_width: 34,
      power_station_height: 18,
      rooms: [
        { name: "Living Room", entity: "sensor.salon_temp", humidity_entity: "sensor.salon_humidity", co2_entity: "sensor.salon_co2", x: 50, y: 50 },
        { name: "Power", entity: "sensor.power", x: 20, y: 80, unit: "W", decimals: 0 }
      ],
      window_glow_intensity: 1,
      window_glow_size: 1,
      window_glow_color: "#FFA64D",
      window_lights: [
        { entity: "light.living_room", x: 25, y: 60, width: 8, height: 10, color: "#FFA500" }
      ],
      nav_links: [
        { path: "/lovelace/garage", x: 80, y: 70, width: 15, height: 20, icon: "mdi:garage" }
      ],
      decorations: []
    };
  }
  // --- Enable Full Width in Sections View ---
  getLayoutOptions() {
    return {
      grid_columns: 4,
      grid_rows: 3
    };
  }
  setConfig(config) {
    const incomingConfig = config || {};
    const normalizedConfig = { ...this.constructor.getStubConfig(), ...incomingConfig };
    const previousPowerStationDeviceId = this._config.power_station_device_id;
    normalizedConfig.rooms = Array.isArray(incomingConfig.rooms) ? incomingConfig.rooms : [];
    if (normalizedConfig.power_station_device_id && typeof normalizedConfig.power_station_device_id === "object") {
      normalizedConfig.power_station_device_id = normalizedConfig.power_station_device_id.device_id || normalizedConfig.power_station_device_id.id || null;
    }
    if (typeof normalizedConfig.power_station_device_id === "string" && normalizedConfig.power_station_device_id.trim().startsWith("<")) {
      normalizedConfig.power_station_device_id = null;
    }
    if (!normalizedConfig.image_path && normalizedConfig.image) {
      normalizedConfig.image_path = normalizedConfig.image;
    }
    this._config = normalizedConfig;
    this._lang = incomingConfig.language || "en";
    if (previousPowerStationDeviceId !== normalizedConfig.power_station_device_id) {
      this._powerStationEntityCache = null;
    }
    if (!this.shadowRoot.querySelector(".card")) this._render();
    if (this._hass) this._updateData();
  }
  set hass(hass) {
    this._hass = hass;
    this._updateData();
  }
  _t(key, repl = {}) {
    let txt = TRANSLATIONS[this._lang]?.[key] || TRANSLATIONS["en"][key] || key;
    Object.keys(repl).forEach((k) => {
      txt = txt.replace(`{${k}}`, repl[k]);
    });
    return txt;
  }
  connectedCallback() {
    this._observeCardSize();
    document.addEventListener("visibilitychange", this._handleVisibilityChange);
    if (!this._intersectionObserver) {
      this._intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const wasVisible = this._isVisible;
          this._isVisible = entry.isIntersecting;
          this._updateDehumidifierFanVisibility();
          if (this._isVisible && !wasVisible) {
            this._restartAnimation();
          } else if (!this._isVisible && wasVisible) {
            this._stopAnimation();
          }
        });
      }, { threshold: 0.1 });
      this._intersectionObserver.observe(this);
    }
    this._updateDehumidifierFanVisibility();
  }
  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
      this._observedCard = null;
    }
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }
    this._isVisible = false;
    this._updateDehumidifierFanVisibility();
    this._stopAnimation();
    document.removeEventListener("visibilitychange", this._handleVisibilityChange);
  }
  _observeCardSize() {
    const card = this._cardElement || this.shadowRoot?.querySelector(".card");
    if (!card || this._observedCard === card || typeof ResizeObserver === "undefined") return;
    if (this._resizeObserver) this._resizeObserver.disconnect();
    this._resizeObserver = new ResizeObserver(() => {
      const resized2 = this._resizeCanvas();
      if (resized2 && this._hass && this._isVisible && !document.hidden) {
        this._restartAnimation();
      }
    });
    this._resizeObserver.observe(card);
    this._observedCard = card;
    const resized = this._resizeCanvas();
    if (resized && this._hass && this._isVisible && !document.hidden) {
      this._restartAnimation();
    }
  }
  _onVisibilityChange() {
    this._updateDehumidifierFanVisibility();
    if (document.hidden) {
      this._stopAnimation();
    } else if (this._isVisible) {
      this._restartAnimation();
    }
  }
  _updateDehumidifierFanVisibility() {
    const badgesLayer = this.shadowRoot?.querySelector(".badges-layer");
    if (badgesLayer) {
      badgesLayer.classList.toggle("dehumidifier-fan-visible", this._isVisible && !document.hidden);
    }
  }
  _stopAnimation() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  }
  _restartAnimation() {
    if (document.hidden || !this._isVisible) return;
    this._stopAnimation();
    if (this._canvas && this._ctx && this._hass) {
      this._resizeCanvas();
      if (this._stars.length === 0) this._initStars();
      this._animate();
    }
  }
  // ───────────────────────────────────────────────────────────────────────────
  // BACKGROUND IMAGE CALCULATION
  // ───────────────────────────────────────────────────────────────────────────
  _calculateImage() {
    const configuredPath = (this._config.image_path || "").trim();
    const pathCandidates = configuredPath ? [configuredPath] : this._currentImageUrl && this._currentImageUrl.startsWith(LEGACY_IMAGE_PATH) ? [LEGACY_IMAGE_PATH, DEFAULT_IMAGE_PATH] : [DEFAULT_IMAGE_PATH, LEGACY_IMAGE_PATH];
    const sunState = this._hass.states[this._config.sun_entity || "sun.sun"]?.state || "above_horizon";
    const timeOfDay = this._config.test_time_of_day || (sunState === "below_horizon" ? "night" : "day");
    const now = /* @__PURE__ */ new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    if (month === 12 && day >= 14 || month === 1 && day <= 14) {
      return pathCandidates.map((path) => `${path}winter_xmas_${timeOfDay}.png`);
    }
    let season = this._config.test_season_state || this._hass.states[this._config.season_entity]?.state || "summer";
    season = season.toLowerCase();
    const wStateRaw = this._hass.states[this._config.weather_entity]?.state;
    let weatherSuffix = null;
    if (wStateRaw) {
      const s = wStateRaw.toLowerCase();
      if (["lightning", "lightning-rainy"].includes(s)) weatherSuffix = "lightning";
      else if (["rainy", "pouring"].includes(s)) weatherSuffix = "rainy";
      else if (["snowy", "snowy-rainy"].includes(s)) weatherSuffix = "snowy";
      else if (s === "fog") weatherSuffix = "fog";
    }
    if (weatherSuffix) {
      const configKey = `img_${season}_${timeOfDay}_${weatherSuffix}`;
      if (this._config[configKey] === true) {
        return pathCandidates.map((path) => `${path}${season}_${weatherSuffix}_${timeOfDay}.png`);
      }
    }
    return pathCandidates.map((path) => `${path}${season}_${timeOfDay}.png`);
  }
  // ───────────────────────────────────────────────────────────────────────────
  // DATA UPDATES & STATE MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────
  _updateData() {
    if (!this._hass || !this._cardElement) return;
    this._refreshAnimationState();
    const newImageCandidates = this._calculateImage();
    const imageKey = newImageCandidates.slice().sort().join("\0");
    if (this._lastImageCandidates !== imageKey) {
      this._lastImageCandidates = imageKey;
      this._loadBackgroundImage(newImageCandidates);
    }
    this._updateVisualStyles();
    const roomsData = this._config.rooms.map((r) => {
      const s = this._hass.states[r.entity];
      const v = s ? parseFloat(s.state) : null;
      let hum = null;
      if (r.humidity_entity) {
        const hState = this._hass.states[r.humidity_entity];
        if (hState && !isNaN(parseFloat(hState.state))) hum = Math.round(parseFloat(hState.state));
      }
      let co2 = null;
      if (r.co2_entity) {
        const cState = this._hass.states[r.co2_entity];
        if (cState && !isNaN(parseFloat(cState.state))) co2 = Math.round(parseFloat(cState.state));
      }
      const dehumidifierState = r.dehumidifier_entity ? this._hass.states[r.dehumidifier_entity]?.state || null : null;
      return { ...r, value: v, humidity: hum, co2, dehumidifier_state: dehumidifierState, valid: Number.isFinite(v) };
    });
    this._updateBadges(roomsData);
    this._updateWindowLights();
    this._updateThermostatBadge();
    this._updatePowerStationTile();
    this._updateNavLinks();
    this._updateDecorations();
    this._handleGamingMode();
    this._handleDayNight();
    if (!this._animationFrame && this._canvas && this._ctx && this._isVisible && !document.hidden) {
      if (this._stars.length === 0) this._initStars();
      this._animate();
    }
  }
  _loadBackgroundImage(candidates) {
    const bgElement = this._bgImageElement;
    if (!bgElement || candidates.length === 0) return;
    const loadToken = ++this._imageLoadToken;
    const loadCandidate = (index) => {
      if (index >= candidates.length || loadToken !== this._imageLoadToken) return;
      const candidate = candidates[index];
      const image = new Image();
      image.onload = () => {
        if (loadToken !== this._imageLoadToken) return;
        this._currentImageUrl = candidate;
        bgElement.style.backgroundImage = `url('${candidate}')`;
      };
      image.onerror = () => {
        if (loadToken === this._imageLoadToken) loadCandidate(index + 1);
      };
      image.src = candidate;
    };
    loadCandidate(0);
  }
  _updateVisualStyles() {
    const imageXOffset = this._config.image_x_offset || 0;
    const imageYOffset = this._config.image_y_offset || 0;
    const backgroundZoom = this._config.background_zoom || 1;
    const backgroundStyle = `${imageXOffset}|${imageYOffset}|${backgroundZoom}`;
    if (this._lastBackgroundStyle !== backgroundStyle && this._bgImageElement) {
      this._bgImageElement.style.setProperty("--image-x-offset", `${imageXOffset}px`);
      this._bgImageElement.style.setProperty("--image-y-offset", `${imageYOffset}px`);
      this._bgImageElement.style.setProperty("--background-zoom", backgroundZoom);
      this._lastBackgroundStyle = backgroundStyle;
    }
    const scale = this._config.scale || 1;
    const badgeOpacity = this._config.badge_opacity ?? 0.75;
    const cardStyle = `${scale}|${badgeOpacity}`;
    if (this._lastCardStyle !== cardStyle && this._cardElement) {
      this._cardElement.style.setProperty("--badge-scale", scale);
      this._cardElement.style.setProperty("--badge-opacity", badgeOpacity);
      this._lastCardStyle = cardStyle;
    }
  }
  // ───────────────────────────────────────────────────────────────────────────
  // UI LAYER UPDATES (Badges, Windows, Nav, Decorations)
  // ───────────────────────────────────────────────────────────────────────────
  _updateBadges(rooms) {
    const container = this.shadowRoot.querySelector(".badges-layer");
    if (!container) return;
    const badgeDataHash = JSON.stringify(rooms.map((room) => [
      room.entity,
      room.name,
      room.value,
      room.humidity,
      room.co2,
      room.x,
      room.y,
      room.unit,
      room.decimals,
      room.flip_icon,
      room.dehumidifier_entity,
      room.dehumidifier_state,
      room.tap_action,
      room.valid
    ]));
    if (this._lastBadgeData === badgeDataHash && this._badgesDelegated) {
      return;
    }
    this._lastBadgeData = badgeDataHash;
    container.innerHTML = rooms.map((room, index) => {
      if (!room.valid) return "";
      const top = room.y ?? 50;
      const left = room.x ?? 50;
      const unit = room.unit !== void 0 ? room.unit : "\xB0";
      const decimals = room.decimals !== void 0 ? room.decimals : 1;
      const displayVal = room.value.toFixed(decimals);
      let finalValueString = `${displayVal}${unit}`;
      if (room.humidity !== null) {
        finalValueString += ` <span style="opacity:0.7; font-size: 0.9em;">|</span> ${room.humidity}%`;
      }
      if (room.co2 !== null) {
        const co2Color = this._getCo2Color(room.co2);
        finalValueString += ` <span style="opacity:0.7; font-size: 0.9em;">|</span> <span style="color: ${co2Color}">${room.co2}<span style="font-size:0.7em">ppm</span></span>`;
      }
      let visualHtml = "";
      let colorClass = "";
      if (unit === "W") {
        colorClass = "is-power";
        visualHtml = `
                <svg class="spark-icon" viewBox="0 0 24 24" fill="#FFD700">
                    <path d="M11 21l-1-7H4l9-12 1 7h6l-9 12z" />
                </svg>`;
      } else {
        colorClass = this._getTempColorClass(room.value);
        visualHtml = `<div class="badge-dot"></div>`;
      }
      const flipClass = room.flip_icon ? "flip-icon" : "";
      const dehumidifierStatus = room.dehumidifier_state === "on" ? "on" : room.dehumidifier_state === "off" ? "off" : "unavailable";
      const dehumidifierIndicator = room.dehumidifier_entity && dehumidifierStatus === "on" ? `<span class="dehumidifier-indicator dehumidifier-indicator--${dehumidifierStatus}" role="img" aria-label="Dehumidifier ${dehumidifierStatus}" title="Dehumidifier ${dehumidifierStatus}"><svg class="dehumidifier-fan" viewBox="0 0 24 24" aria-hidden="true"><g class="dehumidifier-fan__rotor"><ellipse cx="12" cy="6.4" rx="2.4" ry="4.3"/><ellipse cx="12" cy="6.4" rx="2.4" ry="4.3" transform="rotate(120 12 12)"/><ellipse cx="12" cy="6.4" rx="2.4" ry="4.3" transform="rotate(240 12 12)"/><circle cx="12" cy="12" r="2"/></g></svg></span>` : "";
      return `
          <div class="badge ${colorClass} ${flipClass}" data-index="${index}" data-entity="${room.entity}" style="top: ${top}%; left: ${left}%;">
            ${visualHtml}
            ${dehumidifierIndicator}
            <div class="badge-content">
              <span class="badge-name">${room.name}</span>
              <span class="badge-val">${finalValueString}</span>
            </div>
          </div>`;
    }).join("");
    if (!this._badgesDelegated) {
      let pressStartTime = 0;
      let pressedBadge = null;
      let longPressActive = false;
      let startX = 0;
      let startY = 0;
      const MOVE_THRESHOLD = 10;
      const handleStart = (e, isTouch) => {
        const touch = isTouch ? e.touches[0] : e;
        const badge = e.target.closest(".badge");
        if (!badge) return;
        pressedBadge = badge;
        pressStartTime = Date.now();
        longPressActive = false;
        startX = touch.clientX;
        startY = touch.clientY;
        if (this._longPressTimer) clearTimeout(this._longPressTimer);
        this._longPressTimer = setTimeout(() => {
          longPressActive = true;
          const index = parseInt(badge.getAttribute("data-index"));
          const room = this._config.rooms[index];
          if (room) {
            this._showEntityMenu(badge, room, touch);
          }
        }, 500);
      };
      const handleMove = (e, isTouch) => {
        if (!this._longPressTimer) return;
        const touch = isTouch ? e.touches[0] : e;
        const deltaX = Math.abs(touch.clientX - startX);
        const deltaY = Math.abs(touch.clientY - startY);
        if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
          clearTimeout(this._longPressTimer);
          this._longPressTimer = null;
        }
      };
      const handleEnd = (e, isTouch) => {
        if (this._longPressTimer) {
          clearTimeout(this._longPressTimer);
          this._longPressTimer = null;
        }
        if (longPressActive) {
          pressedBadge = null;
          pressStartTime = 0;
          longPressActive = false;
          return;
        }
        const badge = e.target.closest(".badge");
        if (!badge || badge !== pressedBadge) {
          pressedBadge = null;
          return;
        }
        const index = parseInt(badge.getAttribute("data-index"));
        const room = this._config.rooms[index];
        if (room && room.tap_action) {
          this._handleTapAction(room.tap_action, room);
        } else if (room) {
          this._fireMoreInfo(room.entity);
        }
        pressedBadge = null;
        pressStartTime = 0;
      };
      container.addEventListener("mousedown", (e) => handleStart(e, false));
      container.addEventListener("mousemove", (e) => handleMove(e, false));
      container.addEventListener("mouseup", (e) => handleEnd(e, false));
      container.addEventListener("touchstart", (e) => handleStart(e, true), { passive: true });
      container.addEventListener("touchmove", (e) => handleMove(e, true), { passive: true });
      container.addEventListener("touchend", (e) => handleEnd(e, true), { passive: true });
      this._badgesDelegated = true;
    }
  }
  _updateThermostatBadge() {
    const container = this.shadowRoot.querySelector(".thermostat-badges-layer");
    if (!container) return;
    const entityId = this._config.thermostat_entity;
    if (!entityId) {
      container.replaceChildren();
      this._lastThermostatBadgeData = null;
      this._lastThermostatBadgePos = null;
      return;
    }
    const entity = this._hass.states[entityId];
    const attributes = entity?.attributes || {};
    const isAvailable = typeof entity?.state === "string" && entity.state !== "unknown" && entity.state !== "unavailable";
    const temperatureUnit = attributes.temperature_unit || this._hass.config?.unit_system?.temperature || "\xB0";
    const formatTemperature = (value) => {
      if (!isAvailable || value === null || value === void 0 || value === "") return "--";
      const temperature = Number(value);
      return Number.isFinite(temperature) ? `${temperature.toFixed(1)} ${temperatureUnit}` : "--";
    };
    const currentTemperature = formatTemperature(attributes.current_temperature);
    const targetTemperature = formatTemperature(attributes.temperature);
    const mode = isAvailable ? entity.state : "unavailable";
    const modeLabel = mode.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    const configuredTitle = typeof this._config.thermostat_title === "string" ? this._config.thermostat_title.trim() : "";
    const friendlyName = typeof attributes.friendly_name === "string" ? attributes.friendly_name.trim() : "";
    const title = configuredTitle || friendlyName || "Thermostat";
    const hash = [
      entityId,
      entity?.state,
      currentTemperature,
      targetTemperature,
      temperatureUnit,
      title
    ].join("|");
    const positionHash = `${this._config.thermostat_x}|${this._config.thermostat_y}`;
    const normalizePosition = (value) => {
      if (value === null || value === void 0 || value === "") return 50;
      const position = Number(value);
      return Number.isFinite(position) ? Math.min(100, Math.max(0, position)) : 50;
    };
    const x = normalizePosition(this._config.thermostat_x);
    const y = normalizePosition(this._config.thermostat_y);
    const existingBadge = container.querySelector(".thermostat-badge");
    if (this._lastThermostatBadgeData === hash && existingBadge) {
      if (this._lastThermostatBadgePos !== positionHash) {
        existingBadge.style.left = `${x}%`;
        existingBadge.style.top = `${y}%`;
        this._lastThermostatBadgePos = positionHash;
      }
      return;
    }
    this._lastThermostatBadgeData = hash;
    this._lastThermostatBadgePos = positionHash;
    const badge = document.createElement("button");
    badge.type = "button";
    badge.className = "thermostat-badge";
    badge.setAttribute("data-hvac-mode", mode.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
    badge.style.left = `${x}%`;
    badge.style.top = `${y}%`;
    badge.setAttribute("aria-label", `${title}. Now ${currentTemperature}. Set ${targetTemperature}. Mode ${modeLabel}. Open thermostat details.`);
    const icon = document.createElement("ha-icon");
    icon.setAttribute("icon", "mdi:thermostat");
    icon.setAttribute("aria-hidden", "true");
    const content = document.createElement("span");
    content.className = "thermostat-badge__content";
    const name = document.createElement("span");
    name.className = "thermostat-badge__name";
    name.textContent = title;
    const details = document.createElement("span");
    details.className = "thermostat-badge__details";
    const current = document.createElement("span");
    current.className = "thermostat-badge__current";
    current.textContent = `Now ${currentTemperature}`;
    const target = document.createElement("span");
    target.className = "thermostat-badge__target";
    target.textContent = `Set ${targetTemperature}`;
    const modeElement = document.createElement("span");
    modeElement.className = "thermostat-badge__mode";
    modeElement.textContent = modeLabel;
    details.append(current, target, modeElement);
    content.append(name, details);
    badge.append(icon, content);
    badge.addEventListener("click", () => this._fireMoreInfo(entityId));
    container.replaceChildren(badge);
  }
  // ───────────────────────────────────────────────────────────────────────────
  // INTERACTIONS & EVENTS
  // ───────────────────────────────────────────────────────────────────────────
  _ensureMenuStyles() {
    if (document.getElementById("house-card-menu-styles")) return;
    const s = document.createElement("style");
    s.id = "house-card-menu-styles";
    s.textContent = `
            .entity-menu {
                position: fixed; z-index: 99999;
                background: rgba(30,30,30,0.98);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 8px; padding: 4px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                backdrop-filter: blur(10px);
                min-width: 150px;
                max-height: calc(100vh - 16px); overflow-y: auto; box-sizing: border-box;
                animation: hcMenuFadeIn 0.15s ease-out;
                pointer-events: auto;
            }
            .entity-menu--dehumidifier { width: 240px; max-width: calc(100vw - 16px); }
            @keyframes hcMenuFadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            .entity-menu-item {
                display: flex; align-items: center; gap: 8px;
                padding: 10px 12px; cursor: pointer; border-radius: 4px;
                transition: background 0.2s; color: #fff; font-size: 0.9rem;
                pointer-events: auto; user-select: none;
                -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
            }
            .entity-menu-item:hover { background: rgba(255,255,255,0.1); }
            .entity-menu-separator { height: 1px; background: rgba(255,255,255,0.12); margin: 4px 8px; }
            .entity-menu-item--reload ha-icon { color: #EF9A9A; }
            .entity-menu-item--switch { justify-content: space-between; }
            .entity-menu-item--switch .switch-left { display: flex; align-items: center; gap: 8px; }
            .entity-menu-item--switch .switch-badge { font-size: 0.75rem; font-weight: 600; padding: 2px 7px; border-radius: 10px; }
            .entity-menu-item--switch .switch-badge--on { background: rgba(76,175,80,0.25); color: #81C784; }
            .entity-menu-item--switch .switch-badge--off { background: rgba(255,255,255,0.08); color: #888; }
            .entity-menu-item--switch .switch-badge--unavailable { background: rgba(255,255,255,0.08); color: #888; }
            .entity-menu-item--switch[aria-disabled="true"] { cursor: default; opacity: 0.65; }
            .entity-menu-item ha-icon { --mdc-icon-size: 20px; color: #64B5F6; }
            .dehumidifier-stats-card {
                display: block; width: 100%; box-sizing: border-box; margin-top: 4px; padding: 10px 12px;
                border: 1px solid rgba(255,255,255,0.14); border-radius: 6px;
                background: rgba(255,255,255,0.04); color: #fff; cursor: pointer;
                font: inherit; text-align: left; -webkit-tap-highlight-color: transparent;
            }
            .dehumidifier-stats-card:hover { background: rgba(255,255,255,0.1); }
            .dehumidifier-stats-card:focus-visible { outline: 2px solid #90CAF9; outline-offset: 2px; }
            .dehumidifier-stats-card__header { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-weight: 600; }
            .dehumidifier-stats-card__header ha-icon { --mdc-icon-size: 18px; color: #90CAF9; }
            .dehumidifier-stats-card__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; margin-top: 10px; }
            .dehumidifier-stats-card__stat { display: flex; min-width: 0; flex-direction: column; gap: 2px; }
            .dehumidifier-stats-card__label { color: rgba(255,255,255,0.68); font-size: 0.72rem; }
            .dehumidifier-stats-card__value { font-size: 0.84rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
        `;
    document.head.appendChild(s);
  }
  _showEntityMenu(badge, room, event) {
    const existingMenu = document.querySelector(".entity-menu");
    if (existingMenu) existingMenu.remove();
    this._ensureMenuStyles();
    const entities = [];
    if (room.entity) {
      const state = this._hass.states[room.entity];
      const value = state ? `${Math.round(parseFloat(state.state))}${state.attributes?.unit_of_measurement || "\xB0C"}` : "\u2014";
      entities.push({ id: room.entity, label: value, icon: "mdi:thermometer" });
    }
    if (room.humidity_entity) {
      const state = this._hass.states[room.humidity_entity];
      const value = state ? `${Math.round(parseFloat(state.state))}${state.attributes?.unit_of_measurement || "%"}` : "\u2014";
      entities.push({ id: room.humidity_entity, label: value, icon: "mdi:water-percent" });
    }
    if (room.co2_entity) {
      const state = this._hass.states[room.co2_entity];
      const value = state ? `${Math.round(parseFloat(state.state))} ${state.attributes?.unit_of_measurement || "ppm"}` : "\u2014";
      entities.push({ id: room.co2_entity, label: value, icon: "mdi:molecule-co2" });
    }
    const dehumidifierEntity = room.dehumidifier_entity;
    const dehumidifierDomain = typeof dehumidifierEntity === "string" ? dehumidifierEntity.split(".")[0] : null;
    const isSupportedDehumidifier = dehumidifierDomain === "switch" || dehumidifierDomain === "humidifier";
    const dehumidifierState = isSupportedDehumidifier ? this._hass.states[dehumidifierEntity] : null;
    const dehumidifierAvailable = dehumidifierState && dehumidifierState.state !== "unknown" && dehumidifierState.state !== "unavailable";
    const dehumidifierStatus = !isSupportedDehumidifier ? "INVALID" : !dehumidifierAvailable ? "UNAVAILABLE" : dehumidifierState.state.toUpperCase();
    const deviceId = dehumidifierEntity ? this._hass.entities?.[dehumidifierEntity]?.device_id : null;
    const deviceInfo = deviceId ? this._hass.devices?.[deviceId] : null;
    const deviceName = deviceInfo?.name_by_user || deviceInfo?.name || "Dehumidifier";
    const dehumidifierStats = [];
    if (dehumidifierAvailable && dehumidifierState.state === "on") {
      const attributes = dehumidifierState.attributes || {};
      const addStat = (label, value, unit = "") => {
        if (value === void 0 || value === null || value === "") return;
        dehumidifierStats.push({ label, value: `${value}${unit}` });
      };
      addStat("Current humidity", attributes.current_humidity, "%");
      addStat("Target humidity", attributes.humidity ?? attributes.target_humidity, "%");
      if (attributes.mode) {
        const mode = String(attributes.mode).replace(/_/g, " ");
        addStat("Mode", mode.charAt(0).toUpperCase() + mode.slice(1));
      }
      const deviceEntityIds = deviceId ? Object.keys(this._hass.states).filter((entityId) => entityId !== dehumidifierEntity && this._hass.entities?.[entityId]?.device_id === deviceId && (entityId.startsWith("sensor.") || entityId.startsWith("binary_sensor."))) : [];
      deviceEntityIds.sort((a, b) => {
        const nameA = this._hass.states[a]?.attributes?.friendly_name || a;
        const nameB = this._hass.states[b]?.attributes?.friendly_name || b;
        return nameA.localeCompare(nameB);
      });
      deviceEntityIds.forEach((entityId) => {
        const state = this._hass.states[entityId];
        if (!state || state.state === "unknown" || state.state === "unavailable") return;
        const isBinarySensor = entityId.startsWith("binary_sensor.");
        const isHumiditySensor = state.attributes?.device_class === "humidity" || entityId.endsWith("_humidity");
        if (!isBinarySensor && isHumiditySensor && attributes.current_humidity != null) return;
        const rawName = state.attributes?.friendly_name || entityId.split(".")[1].replace(/_/g, " ");
        const label = rawName.toLowerCase().startsWith(deviceName.toLowerCase()) ? rawName.slice(deviceName.length).trim() : rawName;
        const unit = state.attributes?.unit_of_measurement;
        const value = isBinarySensor ? state.state.toUpperCase() : `${state.state}${unit ? ` ${unit}` : ""}`;
        addStat(label || rawName, value);
      });
    }
    if (entities.length === 0 && !dehumidifierEntity) return;
    if (entities.length === 1 && !dehumidifierEntity) {
      this._fireMoreInfo(entities[0].id);
      return;
    }
    const menu = document.createElement("div");
    menu.className = "entity-menu";
    const entityRows = entities.map((ent) => `
            <div class="entity-menu-item" data-entity="${ent.id}">
                <ha-icon icon="${ent.icon}"></ha-icon>
                <span>${ent.label}</span>
            </div>
        `).join("");
    const dehumidifierRow = dehumidifierEntity ? `<div class="entity-menu-item entity-menu-item--switch" data-action="toggle-dehumidifier" data-entity="${dehumidifierEntity}"${dehumidifierAvailable ? "" : ' aria-disabled="true"'}>
                <span class="switch-left"><ha-icon icon="mdi:air-humidifier"></ha-icon><span>Dehumidifier</span></span>
                <span class="switch-badge switch-badge--${dehumidifierAvailable ? dehumidifierState.state : "unavailable"}">${dehumidifierStatus}</span>
               </div>` : "";
    menu.innerHTML = entityRows + (entityRows && dehumidifierRow ? '<div class="entity-menu-separator"></div>' : "") + dehumidifierRow;
    if (dehumidifierStats.length > 0) {
      menu.classList.add("entity-menu--dehumidifier");
      const separator = document.createElement("div");
      separator.className = "entity-menu-separator";
      menu.appendChild(separator);
      const statsCard = document.createElement("button");
      statsCard.type = "button";
      statsCard.className = "dehumidifier-stats-card";
      statsCard.setAttribute("aria-label", deviceId ? `Open ${deviceName} device page` : `Open ${deviceName} details`);
      const heading = document.createElement("span");
      heading.className = "dehumidifier-stats-card__header";
      const title = document.createElement("span");
      title.textContent = deviceName;
      const openIcon = document.createElement("ha-icon");
      openIcon.setAttribute("icon", "mdi:open-in-new");
      heading.append(title, openIcon);
      statsCard.appendChild(heading);
      const statsGrid = document.createElement("span");
      statsGrid.className = "dehumidifier-stats-card__grid";
      dehumidifierStats.forEach((stat) => {
        const statElement = document.createElement("span");
        statElement.className = "dehumidifier-stats-card__stat";
        const label = document.createElement("span");
        label.className = "dehumidifier-stats-card__label";
        label.textContent = stat.label;
        const value = document.createElement("span");
        value.className = "dehumidifier-stats-card__value";
        value.textContent = stat.value;
        statElement.append(label, value);
        statsGrid.appendChild(statElement);
      });
      statsCard.appendChild(statsGrid);
      statsCard.addEventListener("click", (e) => {
        e.stopPropagation();
        if (deviceId) {
          history.pushState(null, "", `/config/devices/device/${encodeURIComponent(deviceId)}`);
          window.dispatchEvent(new Event("location-changed"));
        } else {
          this._fireMoreInfo(dehumidifierEntity);
        }
        menu.remove();
        cleanup();
      });
      menu.appendChild(statsCard);
    }
    const rect = badge.getBoundingClientRect();
    document.body.appendChild(menu);
    const menuH = menu.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuH ? rect.bottom : Math.max(8, rect.top - menuH);
    menu.style.top = `${top}px`;
    menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 8))}px`;
    const selectMenuItem = (item) => {
      const entityId = item.getAttribute("data-entity");
      if (entityId) {
        if (item.dataset.action === "toggle-dehumidifier") {
          const domain = entityId.split(".")[0];
          const state = this._hass.states[entityId];
          if (domain !== "switch" && domain !== "humidifier" || !state || state.state === "unknown" || state.state === "unavailable") return;
          this._hass.callService(domain, "toggle", {}, { entity_id: entityId });
          menu.remove();
          cleanup();
          return;
        }
        this._fireMoreInfo(entityId);
        menu.remove();
        cleanup();
      }
    };
    const handleMenuClick = (e) => {
      const item = e.target.closest(".entity-menu-item");
      if (!item) return;
      e.stopPropagation();
      e.preventDefault();
      setTimeout(() => selectMenuItem(item), 50);
    };
    const closeMenu = (e) => {
      const clickedMenu = e.target.closest(".entity-menu");
      if (!clickedMenu) {
        menu.remove();
        cleanup();
      }
    };
    const cleanup = () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("touchstart", closeMenu);
      menu.removeEventListener("mousedown", handleMenuClick);
      menu.removeEventListener("touchstart", handleMenuClick);
    };
    menu.addEventListener("mousedown", handleMenuClick);
    menu.addEventListener("touchstart", handleMenuClick, { passive: false });
    setTimeout(() => {
      document.addEventListener("mousedown", closeMenu);
      document.addEventListener("touchstart", closeMenu, { passive: true });
    }, 150);
    const observer = new MutationObserver((mutations) => {
      if (!menu.isConnected) {
        cleanup();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true });
  }
  _handleTapAction(action, room) {
    switch (action.action) {
      case "navigate":
        if (action.navigation_path) {
          history.pushState(null, "", action.navigation_path);
          window.dispatchEvent(new Event("location-changed"));
        }
        break;
      case "more-info":
        this._fireMoreInfo(action.entity || room.entity);
        break;
      case "more-info-all":
        this._openMultipleMoreInfo(room);
        break;
      default:
        this._fireMoreInfo(room.entity);
    }
  }
  _fireMoreInfo(entityId) {
    if (!entityId) return;
    const event = new Event("hass-more-info", {
      bubbles: true,
      composed: true
    });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }
  _openMultipleMoreInfo(room) {
    const entities = [room.entity];
    if (room.humidity_entity) entities.push(room.humidity_entity);
    if (room.co2_entity) entities.push(room.co2_entity);
    if (this._hass.services.browser_mod?.popup) {
      const content = {
        type: "vertical-stack",
        cards: entities.map((entity) => ({
          type: "history-graph",
          entities: [{ entity }],
          hours_to_show: 24
        }))
      };
      this._hass.callService("browser_mod", "popup", {
        title: room.name,
        content,
        size: "wide"
      });
    } else {
      this._fireMoreInfo(room.entity);
    }
  }
  // ───────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ───────────────────────────────────────────────────────────────────────────
  _getTempColorClass(t) {
    if (t < 19) return "is-cold";
    if (t < 23) return "is-optimal";
    if (t < 25) return "is-warm";
    return "is-hot";
  }
  _getCo2Color(level) {
    if (level < 1e3) return "var(--color-opt)";
    if (level < 1600) return "var(--color-warm)";
    return "var(--color-hot)";
  }
  _handleGamingMode() {
    const partyEntity = this._config.party_mode_entity;
    const isGaming = partyEntity && this._hass.states[partyEntity]?.state === "on";
    const card = this.shadowRoot.querySelector(".card");
    if (card) {
      isGaming ? card.classList.add("gaming-active") : card.classList.remove("gaming-active");
    }
    return isGaming;
  }
  _handleDayNight() {
    const sunEnt = this._config.sun_entity || "sun.sun";
    const isNight = this._hass.states[sunEnt]?.state === "below_horizon";
    const dimLayer = this.shadowRoot.querySelector(".dim-layer");
    if (dimLayer) dimLayer.style.opacity = isNight ? "0.1" : "0";
    const decorationsLayer = this.shadowRoot.querySelector(".decorations-layer");
    if (decorationsLayer) {
      decorationsLayer.classList.toggle("night-mode", isNight);
    }
    return isNight;
  }
  // ───────────────────────────────────────────────────────────────────────────
  // WINDOW LIGHTS
  // ───────────────────────────────────────────────────────────────────────────
  _updateWindowLights() {
    const container = this.shadowRoot.querySelector(".window-lights-layer");
    if (!container) return;
    const windowLights = Array.isArray(this._config.window_lights) ? this._config.window_lights : [];
    const debugMode = this._config.window_lights_debug || false;
    const glowIntensity = this._config.window_glow_intensity ?? 1;
    const glowSize = this._config.window_glow_size ?? 1;
    const defaultGlowColor = this._config.window_glow_color || "#FFA64D";
    const windowDataHash = JSON.stringify({
      debugMode,
      glowIntensity,
      glowSize,
      defaultGlowColor,
      lights: windowLights.map((win) => {
        const entity = this._hass.states[win.entity];
        return [
          win.entity,
          entity?.state,
          entity?.attributes?.brightness,
          win.x,
          win.y,
          win.width,
          win.height,
          win.color,
          win.skew_x,
          win.skew_y
        ];
      })
    });
    if (this._lastWindowLightsData === windowDataHash && this._windowLightsDelegated) {
      return;
    }
    this._lastWindowLightsData = windowDataHash;
    container.innerHTML = windowLights.map((win, index) => {
      const entity = this._hass.states[win.entity];
      const isOn = entity?.state === "on";
      const x = win.x ?? 50;
      const y = win.y ?? 50;
      const width = win.width ?? 10;
      const height = win.height ?? 12;
      const color = win.color || defaultGlowColor;
      const skewX = win.skew_x ?? 0;
      const skewY = win.skew_y ?? 0;
      const brightness = entity?.attributes?.brightness;
      let opacity = isOn ? 1 : 0;
      if (isOn && brightness !== void 0) {
        opacity = Math.max(0.3, brightness / 255);
      }
      const colorRGB = this._hexToRgb(color);
      const colorStyle = colorRGB ? `--window-color: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.9 * glowIntensity}); --window-color-mid: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.6 * glowIntensity}); --window-glow: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.8 * glowIntensity}); --window-glow-outer: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.4 * glowIntensity}); --window-blur: ${5 * glowSize}px; --window-glow-blur: ${20 * glowSize}px; --window-glow-scale: ${glowSize};` : "";
      const debugStyle = debugMode ? "border: 3px solid red !important; background: rgba(255,0,0,0.6) !important; mix-blend-mode: normal !important; filter: none !important; box-shadow: 0 0 10px red, inset 0 0 10px rgba(255,0,0,0.5) !important; z-index: 9999 !important;" : "";
      const transformStyle = `transform: translate(-50%, -50%) skewX(${skewX}deg) skewY(${skewY}deg);`;
      const offStyle = !isOn ? "filter: blur(6px);" : "";
      return `
              <div class="window-light ${isOn ? "is-on" : "is-off"}"
                   data-entity="${win.entity}"
                   data-index="${index}"
                   style="top: ${y}%; left: ${x}%; width: ${width}%; height: ${height}%; ${transformStyle} ${colorStyle} ${offStyle} ${debugStyle}">
              </div>`;
    }).join("");
    if (!this._windowLightsDelegated) {
      let pressStartTime = 0;
      let pressedWindow = null;
      let longPressActive = false;
      let startX = 0;
      let startY = 0;
      const MOVE_THRESHOLD = 10;
      let windowLongPressTimer = null;
      const handleStart = (e, isTouch) => {
        const touch = isTouch ? e.touches[0] : e;
        const windowEl = e.target.closest(".window-light");
        if (!windowEl) return;
        pressedWindow = windowEl;
        pressStartTime = Date.now();
        longPressActive = false;
        startX = touch.clientX;
        startY = touch.clientY;
        if (windowLongPressTimer) clearTimeout(windowLongPressTimer);
        windowLongPressTimer = setTimeout(() => {
          longPressActive = true;
          const entityId = windowEl.getAttribute("data-entity");
          if (entityId) {
            this._showLightControlPopup(entityId);
          }
        }, 500);
      };
      const handleMove = (e, isTouch) => {
        if (!windowLongPressTimer) return;
        const touch = isTouch ? e.touches[0] : e;
        const deltaX = Math.abs(touch.clientX - startX);
        const deltaY = Math.abs(touch.clientY - startY);
        if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
          clearTimeout(windowLongPressTimer);
          windowLongPressTimer = null;
        }
      };
      const handleEnd = (e, isTouch) => {
        if (windowLongPressTimer) {
          clearTimeout(windowLongPressTimer);
          windowLongPressTimer = null;
        }
        if (longPressActive) {
          pressedWindow = null;
          pressStartTime = 0;
          longPressActive = false;
          return;
        }
        const windowEl = e.target.closest(".window-light");
        if (!windowEl || windowEl !== pressedWindow) {
          pressedWindow = null;
          return;
        }
        e.stopPropagation();
        const entityId = windowEl.getAttribute("data-entity");
        if (entityId) {
          const domain = entityId.split(".")[0];
          this._hass.callService(domain, "toggle", { entity_id: entityId });
        }
        pressedWindow = null;
        pressStartTime = 0;
      };
      container.addEventListener("mousedown", (e) => handleStart(e, false));
      container.addEventListener("mousemove", (e) => handleMove(e, false));
      container.addEventListener("mouseup", (e) => handleEnd(e, false));
      container.addEventListener("touchstart", (e) => handleStart(e, true), { passive: true });
      container.addEventListener("touchmove", (e) => handleMove(e, true), { passive: true });
      container.addEventListener("touchend", (e) => handleEnd(e, true), { passive: true });
      this._windowLightsDelegated = true;
    }
  }
  _showLightControlPopup(entityId) {
    const entity = this._hass.states[entityId];
    if (!entity) return;
    const friendlyName = entity.attributes.friendly_name || entityId;
    const domain = entityId.split(".")[0];
    const entityName = entityId.split(".")[1];
    const isLight = domain === "light";
    const countdownEntity = `number.${entityName}_countdown`;
    const powerEntity = `sensor.${entityName}_power`;
    let cards = [];
    if (isLight) {
      cards.push({
        type: "light",
        entity: entityId
      });
    } else {
      cards.push({
        type: "entities",
        entities: [entityId],
        show_header_toggle: false
      });
      const powerState = this._hass.states[powerEntity];
      if (powerState) {
        cards.push({
          type: "entities",
          title: "Power Measurement",
          entities: [
            {
              entity: powerEntity,
              icon: "mdi:lightning-bolt"
            }
          ],
          show_header_toggle: false
        });
      }
    }
    const countdownState = this._hass.states[countdownEntity];
    if (countdownState) {
      cards.push({
        type: "entities",
        title: "Auto Off Timer",
        entities: [
          {
            entity: countdownEntity,
            icon: "mdi:timer-outline"
          }
        ],
        show_header_toggle: false
      });
      cards.push({
        type: "custom:house-countdown-presets",
        countdown_entity: countdownEntity,
        switch_entity: entityId
      });
    }
    const event = new Event("ll-custom", {
      composed: true,
      bubbles: true
    });
    event.detail = {
      browser_mod: {
        service: "popup",
        data: {
          title: friendlyName,
          content: {
            type: "vertical-stack",
            cards
          }
        }
      }
    };
    this.dispatchEvent(event);
  }
  _updateNavLinks() {
    const container = this.shadowRoot.querySelector(".nav-links-layer");
    if (!container) return;
    const navLinks = Array.isArray(this._config.nav_links) ? this._config.nav_links : [];
    const debugMode = this._config.nav_links_debug || false;
    const navLinksHash = JSON.stringify([navLinks, debugMode]);
    if (this._navLinksDelegated && this._lastNavLinksData === navLinksHash) return;
    this._lastNavLinksData = navLinksHash;
    container.innerHTML = navLinks.map((link, index) => {
      const x = link.x ?? 50;
      const y = link.y ?? 50;
      const width = link.width ?? 10;
      const height = link.height ?? 10;
      const icon = link.icon || "";
      const label = link.label || "";
      const debugStyle = debugMode ? "border: 2px dashed lime !important; background: rgba(0,255,0,0.2) !important;" : "";
      let iconHtml = "";
      if (icon) {
        iconHtml = `<ha-icon icon="${icon}" style="--mdc-icon-size: 24px; color: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));"></ha-icon>`;
      }
      if (label) {
        iconHtml += `<span class="nav-label">${label}</span>`;
      }
      return `
              <div class="nav-link"
                   data-path="${link.path}"
                   data-index="${index}"
                   style="top: ${y}%; left: ${x}%; width: ${width}%; height: ${height}%; ${debugStyle}">
                   ${iconHtml}
              </div>`;
    }).join("");
    if (!this._navLinksDelegated) {
      container.addEventListener("click", (e) => {
        const navEl = e.target.closest(".nav-link");
        if (navEl) {
          e.stopPropagation();
          const path = navEl.getAttribute("data-path");
          if (path) {
            history.pushState(null, "", path);
            window.dispatchEvent(new Event("location-changed"));
          }
        }
      });
      this._navLinksDelegated = true;
    }
  }
  // DECORATIONS
  // ───────────────────────────────────────────────────────────────────────────
  _updateDecorations() {
    const container = this.shadowRoot.querySelector(".decorations-layer");
    if (!container) return;
    const decorations = Array.isArray(this._config.decorations) ? this._config.decorations : [];
    const debugMode = this._config.decorations_debug || false;
    const decorationsHash = JSON.stringify([decorations, debugMode]);
    if (this._decorationsRendered && this._lastDecorationsHash === decorationsHash) return;
    this._lastDecorationsHash = decorationsHash;
    container.innerHTML = decorations.map((dec, index) => {
      const x = dec.x ?? 50;
      const y = dec.y ?? 50;
      const width = dec.width ?? 10;
      const height = dec.height ?? "auto";
      const image = dec.image || "";
      const animate = dec.animate || false;
      const flipX = dec.flip_x || false;
      const opacity = dec.opacity ?? 1;
      let animClass = "";
      if (animate === true || animate === "bounce") animClass = "animate-bounce";
      else if (animate === "sway") animClass = "animate-sway";
      else if (animate === "wag") animClass = "animate-wag";
      const debugStyle = debugMode ? "border: 2px dashed magenta !important; background: rgba(255,0,255,0.2) !important;" : "";
      const heightStyle = height === "auto" ? "height: auto;" : `height: ${height}%;`;
      const flipStyle = flipX ? "transform: translate(-50%, -50%) scaleX(-1);" : "";
      return `
              <div class="decoration ${animClass}"
                   data-index="${index}"
                   style="top: ${y}%; left: ${x}%; width: ${width}%; ${heightStyle} opacity: ${opacity}; ${flipStyle} ${debugStyle}">
                   <img src="${image}" alt="decoration" loading="lazy">
              </div>`;
    }).join("");
    this._decorationsRendered = true;
  }
};
customElements.define("house-card", HouseCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "house-card",
  name: "House Card",
  description: "Interactivity Enabled",
  preview: true
});

// src/countdown-presets.js
var HouseCountdownPresets = class extends HTMLElement {
  setConfig(config) {
    if (!config?.countdown_entity || !config?.switch_entity) {
      throw new Error("house-countdown-presets requires countdown_entity and switch_entity");
    }
    this._config = config;
    this._render();
  }
  set hass(hass) {
    this._hass = hass;
  }
  _render() {
    this.innerHTML = `
            <style>
                .presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
                button {
                    min-height: 48px;
                    padding: 8px 4px;
                    border: 0;
                    border-radius: 4px;
                    color: var(--primary-text-color);
                    background: var(--ha-card-background, var(--card-background-color, #fff));
                    box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.2));
                    cursor: pointer;
                    font: inherit;
                }
                button:active { transform: scale(0.98); }
            </style>
            <div class="presets">
                <button type="button" data-seconds="900">+15 min</button>
                <button type="button" data-seconds="1800">+30 min</button>
                <button type="button" data-seconds="2700">+45 min</button>
            </div>`;
    this.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => this._setCountdown(Number(button.dataset.seconds)));
    });
  }
  _setCountdown(seconds) {
    if (!this._hass) return;
    const { countdown_entity: countdownEntity, switch_entity: switchEntity } = this._config;
    if (this._hass.states[switchEntity]?.state !== "on") {
      this._hass.callService("switch", "turn_on", {}, { entity_id: switchEntity });
    }
    this._hass.callService("number", "set_value", { value: seconds }, { entity_id: countdownEntity });
  }
};
customElements.define("house-countdown-presets", HouseCountdownPresets);

// src/editor.js
var EDITOR_SCHEMA = [
  { name: "title", selector: { text: {} } },
  { name: "language", selector: { select: { options: ["en", "de", "fr", "nl", "es"] } } },
  { name: "image_path", default: DEFAULT_IMAGE_PATH, selector: { text: {} } },
  {
    type: "grid",
    name: "",
    schema: [
      { name: "scale", default: 1, selector: { number: { min: 0.1, max: 3, step: 0.1, mode: "slider" } } },
      { name: "background_zoom", default: 1, selector: { number: { min: 0.1, max: 3, step: 0.1, mode: "slider" } } },
      { name: "badge_opacity", default: 0.75, selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } },
      { name: "image_x_offset", default: 0, selector: { number: { min: -1e3, max: 1e3, step: 1, mode: "box" } } },
      { name: "image_y_offset", default: 0, selector: { number: { min: -1e3, max: 1e3, step: 1, mode: "box" } } }
    ]
  },
  { name: "weather_entity", selector: { entity: { domain: "weather" } } },
  { name: "season_entity", selector: { entity: { domain: "sensor" } } },
  { name: "sun_entity", selector: { entity: { domain: "sun" } } },
  { name: "aurora_entity", selector: { entity: { domain: "binary_sensor" } } },
  { name: "thermostat_entity", selector: { entity: { domain: "climate" } } },
  { name: "thermostat_title", selector: { text: {} } },
  {
    type: "grid",
    name: "Thermostat Position",
    schema: [
      { name: "thermostat_x", default: 50, selector: { number: { min: 0, max: 100, step: 1, mode: "slider" } } },
      { name: "thermostat_y", default: 50, selector: { number: { min: 0, max: 100, step: 1, mode: "slider" } } }
    ]
  },
  { name: "power_station_device_id", selector: { device: {} } },
  { name: "oukitel_integration_id", selector: { text: {} } },
  {
    type: "grid",
    name: "Visual Effects",
    schema: [
      { name: "moon_glow", default: true, selector: { boolean: {} } },
      { name: "sun_glow", default: true, selector: { boolean: {} } },
      { name: "sun_rays", default: true, selector: { boolean: {} } },
      { name: "sky_gradient", default: true, selector: { boolean: {} } },
      { name: "shooting_stars", default: true, selector: { boolean: {} } },
      { name: "seasonal_particles", default: true, selector: { boolean: {} } }
    ]
  },
  {
    type: "grid",
    name: "Debug",
    schema: [
      { name: "window_lights_debug", default: false, selector: { boolean: {} } },
      { name: "nav_links_debug", default: false, selector: { boolean: {} } },
      { name: "decorations_debug", default: false, selector: { boolean: {} } }
    ]
  },
  { name: "rooms", selector: { object: {} } },
  { name: "window_lights", selector: { object: {} } },
  { name: "nav_links", selector: { object: {} } },
  { name: "decorations", selector: { object: {} } }
];
var EDITOR_LABELS = {
  title: "Title (Optional)",
  language: "Language",
  image_path: "Background Image Path",
  scale: "Badge Scale",
  background_zoom: "Background Zoom",
  badge_opacity: "Badge Opacity",
  image_x_offset: "Background X Offset",
  image_y_offset: "Background Y Offset",
  weather_entity: "Weather Entity",
  season_entity: "Season Entity",
  sun_entity: "Sun Entity",
  aurora_entity: "Aurora Binary Sensor",
  thermostat_entity: "Thermostat Climate Entity",
  thermostat_title: "Thermostat Badge Title",
  thermostat_x: "Thermostat Position X (%)",
  thermostat_y: "Thermostat Position Y (%)",
  power_station_device_id: "Power Station Device",
  oukitel_integration_id: "Oukitel Integration Entry ID",
  moon_glow: "Moon Glow",
  sun_glow: "Sun Glow",
  sun_rays: "Sun Rays",
  sky_gradient: "Sky Gradients",
  shooting_stars: "Shooting Stars",
  seasonal_particles: "Seasonal Particles",
  window_lights_debug: "Debug Window Lights",
  nav_links_debug: "Debug Nav Links",
  decorations_debug: "Debug Decorations",
  rooms: "Rooms (YAML)",
  window_lights: "Window Lights (YAML)",
  nav_links: "Navigation Links (YAML)",
  decorations: "Decorations (YAML)"
};
var EDITOR_GROUPS = [
  {
    title: "Appearance",
    description: "Choose the background and tune the card's scale and positioning.",
    expanded: true,
    fields: ["title", "language", "image_path", "scale", "background_zoom", "badge_opacity", "image_x_offset", "image_y_offset"]
  },
  {
    title: "Weather & Integrations",
    description: "Connect the entities and devices that power the card.",
    fields: ["weather_entity", "season_entity", "sun_entity", "aurora_entity", "power_station_device_id", "oukitel_integration_id"]
  },
  {
    title: "Thermostat Badge",
    description: "Choose a climate entity, badge title, and position on the house image.",
    fields: ["thermostat_entity", "thermostat_title", "thermostat_x", "thermostat_y"]
  },
  {
    title: "Visual Effects",
    description: "Enable or disable ambient effects shown on the card.",
    fields: ["moon_glow", "sun_glow", "sun_rays", "sky_gradient", "shooting_stars", "seasonal_particles"]
  },
  {
    title: "Debug",
    description: "Show layout guides while configuring interactive elements.",
    fields: ["window_lights_debug", "nav_links_debug", "decorations_debug"]
  }
];
var EDITOR_MAPPINGS = [
  { name: "rooms", title: "Rooms" },
  { name: "window_lights", title: "Window Lights" },
  { name: "nav_links", title: "Navigation Links" },
  { name: "decorations", title: "Decorations" }
];
var HouseCardEditor = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._forms = [];
    this._psSlidersContainer = null;
  }
  setConfig(config) {
    this._config = config || {};
    this.render();
  }
  set hass(hass) {
    this._hass = hass;
    this._forms.forEach((form) => {
      form.hass = hass;
    });
  }
  _dispatchConfig() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }
  _renderPsSliders() {
    const fields = [
      { key: "power_station_x", label: "Position X (%)", min: 0, max: 100, step: 1, def: 26 },
      { key: "power_station_y", label: "Position Y (%)", min: 0, max: 100, step: 1, def: 84 },
      { key: "power_station_width", label: "Width (%)", min: 10, max: 100, step: 1, def: 34 },
      { key: "power_station_height", label: "Height (%)", min: 8, max: 40, step: 1, def: 18 }
    ];
    if (!this._psSlidersContainer) return;
    this._psSlidersContainer.replaceChildren();
    fields.forEach((field) => {
      const value = this._config[field.key] ?? field.def;
      const row = document.createElement("div");
      row.className = "ps-row";
      const label = document.createElement("label");
      label.htmlFor = `house-card-${field.key}`;
      label.textContent = field.label;
      const input = document.createElement("input");
      input.id = label.htmlFor;
      input.type = "range";
      input.min = String(field.min);
      input.max = String(field.max);
      input.step = String(field.step);
      input.value = String(value);
      input.dataset.key = field.key;
      const output = document.createElement("output");
      output.htmlFor = input.id;
      output.className = "ps-val";
      output.textContent = String(value);
      input.addEventListener("input", () => {
        output.value = input.value;
        output.textContent = input.value;
      });
      input.addEventListener("change", () => {
        this._config = { ...this._config, [field.key]: Number(input.value) };
        this._dispatchConfig();
      });
      row.append(label, input, output);
      this._psSlidersContainer.appendChild(row);
    });
  }
  _getSchema(fields) {
    const selected = new Set(fields);
    return EDITOR_SCHEMA.reduce((schema, field) => {
      if (field.type === "grid") {
        const nestedSchema = field.schema.filter((nestedField) => selected.has(nestedField.name));
        if (nestedSchema.length) schema.push({ ...field, name: "", schema: nestedSchema });
      } else if (selected.has(field.name)) {
        schema.push(field);
      }
      return schema;
    }, []);
  }
  _createForm(schema) {
    const form = document.createElement("ha-form");
    form.schema = schema;
    form.computeLabel = (field) => EDITOR_LABELS[field.name] || field.name;
    form.addEventListener("value-changed", (event) => {
      this._config = { ...this._config, ...event.detail.value };
      this._dispatchConfig();
    });
    this._forms.push(form);
    return form;
  }
  _createSection(title, description, expanded = false) {
    const section = document.createElement("details");
    section.className = "editor-section";
    section.open = expanded;
    const summary = document.createElement("summary");
    summary.className = "section-summary";
    const heading = document.createElement("span");
    heading.className = "section-title";
    heading.textContent = title;
    const supportingText = document.createElement("span");
    supportingText.className = "section-description";
    supportingText.textContent = description;
    summary.append(heading, supportingText);
    section.appendChild(summary);
    const content = document.createElement("div");
    content.className = "section-content";
    section.appendChild(content);
    return { section, content };
  }
  _buildEditor() {
    this.shadowRoot.innerHTML = `<style>
            :host {
                display: block;
                color: var(--primary-text-color);
            }
            .editor-section {
                border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.28));
            }
            .editor-section:first-child {
                border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.28));
            }
            .section-summary {
                cursor: pointer;
                padding: 14px 12px;
                border-radius: 4px;
            }
            .section-summary:hover {
                background: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
            }
            .section-summary:focus-visible,
            .mapping-summary:focus-visible {
                outline: 2px solid var(--primary-color, #03a9f4);
                outline-offset: 2px;
            }
            .section-title {
                font-weight: 600;
            }
            .section-description {
                display: block;
                margin: 3px 0 0 1.1em;
                color: var(--secondary-text-color);
                font-size: 0.9em;
                line-height: 1.4;
            }
            .section-content {
                padding: 0 12px 16px 28px;
            }
            .section-hint {
                margin: 0 0 12px;
                color: var(--secondary-text-color);
                font-size: 0.9em;
                line-height: 1.45;
            }
            .mapping-entry {
                border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
            }
            .mapping-summary {
                cursor: pointer;
                padding: 12px 8px;
                font-weight: 500;
            }
            .mapping-entry[open] > .mapping-summary {
                padding-bottom: 4px;
            }
            .mapping-form {
                padding: 0 8px 12px;
            }
            .ps-sliders {
                padding-top: 4px;
            }
            .ps-row {
                display: grid;
                grid-template-columns: minmax(110px, 140px) minmax(80px, 1fr) 3.5em;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            .ps-row label,
            .ps-val {
                color: var(--primary-text-color);
                font-size: 14px;
            }
            .ps-row input[type="range"] {
                width: 100%;
                min-width: 0;
                accent-color: var(--primary-color);
            }
            .ps-val {
                text-align: right;
                font-variant-numeric: tabular-nums;
            }
            @media (max-width: 420px) {
                .section-content {
                    padding-left: 20px;
                }
                .ps-row {
                    grid-template-columns: minmax(0, 1fr) 3.5em;
                    gap: 6px 12px;
                }
                .ps-row label {
                    grid-column: 1 / -1;
                }
            }
        </style>`;
    EDITOR_GROUPS.forEach((group) => {
      if (group.title === "Debug") return;
      const { section, content } = this._createSection(
        group.title,
        group.description,
        group.expanded
      );
      content.appendChild(this._createForm(this._getSchema(group.fields)));
      this.shadowRoot.appendChild(section);
    });
    const { section: mappingsSection, content: mappingsContent } = this._createSection(
      "Rooms & Interactive Elements",
      "Configure room badges, window lights, navigation links, and decorations."
    );
    const mappingHint = document.createElement("p");
    mappingHint.className = "section-hint";
    mappingHint.textContent = "Each mapping opens its own YAML editor. Existing and custom configuration keys are preserved.";
    mappingsContent.appendChild(mappingHint);
    EDITOR_MAPPINGS.forEach((mapping) => {
      const entry = document.createElement("details");
      entry.className = "mapping-entry";
      const summary = document.createElement("summary");
      summary.className = "mapping-summary";
      summary.textContent = `${mapping.title} (YAML)`;
      entry.appendChild(summary);
      const form = this._createForm(this._getSchema([mapping.name]));
      form.classList.add("mapping-form");
      entry.appendChild(form);
      mappingsContent.appendChild(entry);
    });
    this.shadowRoot.appendChild(mappingsSection);
    const { section: powerStationSection, content: powerStationContent } = this._createSection(
      "Power Station Tile",
      "Set the tile's size and position on the background."
    );
    this._psSlidersContainer = document.createElement("div");
    this._psSlidersContainer.className = "ps-sliders";
    powerStationContent.appendChild(this._psSlidersContainer);
    this.shadowRoot.appendChild(powerStationSection);
    const debugGroup = EDITOR_GROUPS.find((group) => group.title === "Debug");
    const { section: debugSection, content: debugContent } = this._createSection(
      debugGroup.title,
      debugGroup.description
    );
    debugContent.appendChild(this._createForm(this._getSchema(debugGroup.fields)));
    this.shadowRoot.appendChild(debugSection);
  }
  render() {
    if (!this._psSlidersContainer) this._buildEditor();
    this._forms.forEach((form) => {
      form.data = { ...this._config };
      if (this._hass) form.hass = this._hass;
    });
    this._renderPsSliders();
  }
};
customElements.define("house-card-editor", HouseCardEditor);
