/**
 * House Card (Interactivity)
 * * FEAT: Click badges to open 'More Info' dialog.
 * * FEAT: Full Width Support (Sections View).
 * * FEAT: Global Scale & Y-Offset.
 * * FEAT: Humidity & Custom Units.
 */

const TRANSLATIONS = {
    en: { loading: "Loading...", home_median: "Home" },
    pl: { loading: "Ładowanie...", home_median: "Dom" }
};

class HouseCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._hass = null;
      this._config = {};
      this._animationFrame = null;
      this._canvas = null;
      this._ctx = null;
      this._resizeObserver = null;
      
      this._particles = []; this._clouds = []; this._stars = []; this._fogParticles = [];
      this._lightningTimer = 0; this._flashOpacity = 0; this._lightningBolt = null;
      
      // Visibility tracking
      this._isVisible = false;
      this._intersectionObserver = null;
      this._handleVisibilityChange = this._onVisibilityChange.bind(this);
    }
  
    static getStubConfig() {
      return {
        language: "pl",
        scale: 1.0,          
        image_y_offset: 0,   
        image: "/local/community/house-card/images/",
        weather_entity: "weather.forecast_home",
        season_entity: "sensor.season",
        sun_entity: "sun.sun",
        cloud_coverage_entity: "sensor.openweathermap_cloud_coverage",
        party_mode_entity: "input_boolean.gaming_mode",
        rooms: [
            { name: "Salon", entity: "sensor.salon_temp", humidity_entity: "sensor.salon_humidity", co2_entity: "sensor.salon_co2", x: 50, y: 50 },
            { name: "Moc", entity: "sensor.power", x: 20, y: 80, unit: "W", decimals: 0 }
        ],
        window_lights: [
            { entity: "light.living_room", x: 25, y: 60, width: 8, height: 10, color: "#FFA500" }
        ]
      };
    }

    // --- Enable Full Width in Sections View ---
    getLayoutOptions() {
        return {
            grid_columns: 4,
            grid_rows: 3,
        };
    }
  
    setConfig(config) {
      if (!config.rooms || !Array.isArray(config.rooms)) throw new Error("Missing 'rooms' list.");
      this._config = config;
      this._lang = config.language || 'en';
      this._render();
    }
  
    set hass(hass) {
      this._hass = hass;
      this._updateData();
    }

    _t(key, repl = {}) {
        let txt = TRANSLATIONS[this._lang]?.[key] || TRANSLATIONS['en'][key] || key;
        Object.keys(repl).forEach(k => { txt = txt.replace(`{${k}}`, repl[k]); });
        return txt;
    }
  
    connectedCallback() {
      if (this.shadowRoot && !this._resizeObserver) {
          const card = this.shadowRoot.querySelector('.card');
          if (card) {
              this._resizeObserver = new ResizeObserver(() => this._resizeCanvas());
              this._resizeObserver.observe(card);
          }
      }
      // Listen for tab visibility changes
      document.addEventListener('visibilitychange', this._handleVisibilityChange);
      
      // IntersectionObserver to detect when card is visible in viewport
      // This handles HA view switching better than visibility events
      if (!this._intersectionObserver) {
        this._intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const wasVisible = this._isVisible;
            this._isVisible = entry.isIntersecting;
            
            if (this._isVisible && !wasVisible) {
              // Card just became visible - restart animation
              this._restartAnimation();
            } else if (!this._isVisible && wasVisible) {
              // Card is now hidden - stop animation
              this._stopAnimation();
            }
          });
        }, { threshold: 0.1 });
        this._intersectionObserver.observe(this);
      }
    }
  
    disconnectedCallback() {
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._intersectionObserver) {
        this._intersectionObserver.disconnect();
        this._intersectionObserver = null;
      }
      this._stopAnimation();
      document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    }

    _onVisibilityChange() {
      if (document.hidden) {
        this._stopAnimation();
      } else if (this._isVisible) {
        // Tab visible again and card is in viewport
        this._restartAnimation();
      }
    }

    _stopAnimation() {
      if (this._animationFrame) {
        cancelAnimationFrame(this._animationFrame);
        this._animationFrame = null;
      }
    }

    _restartAnimation() {
      // Don't restart if document is hidden or card is not visible
      if (document.hidden || !this._isVisible) return;
      
      // Cancel any existing frame first
      this._stopAnimation();
      
      // Restart if we have the necessary components
      if (this._canvas && this._ctx && this._hass) {
        this._resizeCanvas();
        if (this._stars.length === 0) this._initStars();
        this._animate();
      }
    }

    _calculateImage() {
        const path = this._config.image_path || "/local/community/fork_u-house_card/images/";
        const sunState = this._hass.states[this._config.sun_entity || 'sun.sun']?.state || 'above_horizon';
        const timeOfDay = sunState === 'below_horizon' ? 'night' : 'day';

        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        if ((month === 12 && day >= 14) || (month === 1 && day <= 14)) {
            return `${path}winter_xmas_${timeOfDay}.png`;
        }

        let season = this._hass.states[this._config.season_entity]?.state || 'summer';
        const seasonMap = { 'wiosna': 'spring', 'lato': 'summer', 'jesień': 'autumn', 'zima': 'winter' };
        if (seasonMap[season]) season = seasonMap[season];
        season = season.toLowerCase();

        const wStateRaw = this._hass.states[this._config.weather_entity]?.state;
        let weatherSuffix = null;

        if (wStateRaw) {
            const s = wStateRaw.toLowerCase();
            if (['lightning', 'lightning-rainy'].includes(s)) weatherSuffix = 'lightning';
            else if (['rainy', 'pouring'].includes(s)) weatherSuffix = 'rainy';
            else if (['snowy', 'snowy-rainy'].includes(s)) weatherSuffix = 'snowy';
            else if (s === 'fog') weatherSuffix = 'fog';
        }

        if (weatherSuffix) {
            const configKey = `img_${season}_${timeOfDay}_${weatherSuffix}`;
            if (this._config[configKey] === true) {
                return `${path}${season}_${weatherSuffix}_${timeOfDay}.png`;
            }
        }
        return `${path}${season}_${timeOfDay}.png`;
    }

    _updateData() {
      if (!this._hass || !this.shadowRoot.querySelector('.card')) return;

      const newImage = this._calculateImage();
      
      if (this._currentImageUrl !== newImage || 
          this._lastYOffset !== this._config.image_y_offset ||
          this._lastScale !== this._config.scale) {
          
          this._currentImageUrl = newImage;
          this._lastYOffset = this._config.image_y_offset;
          this._lastScale = this._config.scale;
          
          const bgEl = this.shadowRoot.querySelector('.bg-image');
          if (bgEl) {
              const img = new Image();
              img.onload = () => { 
                  bgEl.style.backgroundImage = `url('${newImage}')`;
                  const yOffset = this._config.image_y_offset || 0;
                  bgEl.style.setProperty('--image-y-offset', `${yOffset}px`);
              };
              img.src = newImage;
          }

          const card = this.shadowRoot.querySelector('.card');
          if (card) {
             const scale = this._config.scale || 1.0;
             card.style.setProperty('--badge-scale', scale);
          }
      }

      const roomsData = this._config.rooms.map(r => {
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
        return { ...r, value: v, humidity: hum, co2: co2, valid: !isNaN(v) };
      });
      
      this._updateBadges(roomsData);
      this._updateWindowLights();
      this._handleGamingMode();
      this._handleDayNight();
      
      // Start animation if not running and card is visible
      if (!this._animationFrame && this._canvas && this._ctx && this._isVisible && !document.hidden) {
        if (this._stars.length === 0) this._initStars();
        this._animate();
      }
    }
  
    _updateBadges(rooms) {
      const container = this.shadowRoot.querySelector('.badges-layer');
      if (!container) return;
      
      // 1. Generate HTML
      container.innerHTML = rooms.map(room => {
        if (!room.valid) return '';
        const top = room.y ?? 50; 
        const left = room.x ?? 50;

        const unit = room.unit !== undefined ? room.unit : '°';
        const decimals = room.decimals !== undefined ? room.decimals : 1;
        const displayVal = room.value.toFixed(decimals);
        
        let finalValueString = `${displayVal}${unit}`;
        if (room.humidity !== null) {
            finalValueString += ` <span style="opacity:0.7; font-size: 0.9em;">|</span> ${room.humidity}%`;
        }
        if (room.co2 !== null) {
            const co2Color = this._getCo2Color(room.co2);
            finalValueString += ` <span style="opacity:0.7; font-size: 0.9em;">|</span> <span style="color: ${co2Color}">${room.co2}<span style="font-size:0.7em">ppm</span></span>`;
        }

        let visualHtml = '';
        let colorClass = '';

        if (unit === 'W') {
            colorClass = 'is-power';
            visualHtml = `
                <svg class="spark-icon" viewBox="0 0 24 24" fill="#FFD700">
                    <path d="M11 21l-1-7H4l9-12 1 7h6l-9 12z" />
                </svg>`;
        } else {
            colorClass = this._getTempColorClass(room.value);
            visualHtml = `<div class="badge-dot"></div>`;
        }

        return `
          <div class="badge ${colorClass}" data-entity="${room.entity}" style="top: ${top}%; left: ${left}%;">
            ${visualHtml}
            <div class="badge-content">
              <span class="badge-name">${room.name}</span>
              <span class="badge-val">${finalValueString}</span>
            </div>
          </div>`;
      }).join('');

      // 2. Attach Click Listeners
      container.querySelectorAll('.badge').forEach(badge => {
          badge.addEventListener('click', (e) => {
              e.stopPropagation(); // Prevent card tap
              const entityId = badge.getAttribute('data-entity');
              if (entityId) {
                  const event = new Event('hass-more-info', {
                      bubbles: true,
                      composed: true,
                  });
                  event.detail = { entityId };
                  this.dispatchEvent(event);
              }
          });
      });
    }
    
    _getTempColorClass(t) {
      if (t < 19) return 'is-cold'; if (t < 23) return 'is-optimal'; if (t < 25) return 'is-warm'; return 'is-hot';
    }

    _getCo2Color(level) {
        if (level < 1000) return 'var(--color-opt)'; // Good
        if (level < 1600) return 'var(--color-warm)'; // Moderate/Warning
        return 'var(--color-hot)'; // Bad/Danger
    }

    _handleGamingMode() {
        const partyEntity = this._config.party_mode_entity;
        const isGaming = partyEntity && this._hass.states[partyEntity]?.state === 'on';
        const card = this.shadowRoot.querySelector('.card');
        if (card) {
            isGaming ? card.classList.add('gaming-active') : card.classList.remove('gaming-active');
        }
        return isGaming;
    }

    _handleDayNight() {
        const sunEnt = this._config.sun_entity || 'sun.sun';
        const isNight = this._hass.states[sunEnt]?.state === 'below_horizon';
        const dimLayer = this.shadowRoot.querySelector('.dim-layer');
        if (dimLayer) dimLayer.style.opacity = isNight ? '0.1' : '0';
        return isNight;
    }

    _updateWindowLights() {
        const container = this.shadowRoot.querySelector('.window-lights-layer');
        if (!container || !this._config.window_lights) return;
        
        const windowLights = this._config.window_lights;
        const debugMode = this._config.window_lights_debug || false;
        
        // Build HTML for window lights
        container.innerHTML = windowLights.map((win, index) => {
            const entity = this._hass.states[win.entity];
            const isOn = entity?.state === 'on';
            const x = win.x ?? 50;
            const y = win.y ?? 50;
            const width = win.width ?? 10;
            const height = win.height ?? 12;
            const color = win.color || '#FFA64D';
            const brightness = entity?.attributes?.brightness;
            
            // Calculate opacity based on brightness (0-255) if available
            let opacity = isOn ? 1 : 0;
            if (isOn && brightness !== undefined) {
                opacity = Math.max(0.3, brightness / 255);
            }
            
            // Parse color and create variations for gradient
            const colorRGB = this._hexToRgb(color);
            const colorStyle = colorRGB 
                ? `--window-color: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.9}); ` +
                  `--window-color-mid: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.6}); ` +
                  `--window-glow: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.8}); ` +
                  `--window-glow-outer: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.4});`
                : '';
            
            // Debug border to help with positioning
            const debugStyle = debugMode ? 'border: 2px dashed red !important; background: rgba(255,0,0,0.3) !important;' : '';
            
            return `
              <div class="window-light ${isOn ? 'is-on' : 'is-off'}" 
                   data-entity="${win.entity}"
                   data-index="${index}"
                   style="top: ${y}%; left: ${x}%; width: ${width}%; height: ${height}%; ${colorStyle} ${debugStyle}">
              </div>`;
        }).join('');
        
        // Attach click listeners to toggle lights
        container.querySelectorAll('.window-light').forEach(windowEl => {
            windowEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const entityId = windowEl.getAttribute('data-entity');
                if (entityId) {
                    // Toggle the light
                    this._hass.callService('light', 'toggle', { entity_id: entityId });
                }
            });
        });
    }
    
    _hexToRgb(hex) {
        // Handle both #RGB and #RRGGBB formats
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            };
        }
        // Try short format #RGB
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
        if(this._config.wind_speed_entity && this._hass.states[this._config.wind_speed_entity]) 
            speed = parseFloat(this._hass.states[this._config.wind_speed_entity].state);
        else if(this._hass.states[this._config.weather_entity]?.attributes?.wind_speed) 
            speed = parseFloat(this._hass.states[this._config.weather_entity].attributes.wind_speed);

        if(this._config.wind_direction_entity && this._hass.states[this._config.wind_direction_entity]) 
            bearing = parseFloat(this._hass.states[this._config.wind_direction_entity].state);
        else if(this._hass.states[this._config.weather_entity]?.attributes?.wind_bearing) 
            bearing = parseFloat(this._hass.states[this._config.weather_entity].attributes.wind_bearing);
            
        return { speed: isNaN(speed)?5:speed, bearing: isNaN(bearing)?270:bearing };
    }

    _getCloudCoverage() {
        const cloudEnt = this._config.cloud_coverage_entity;
        if (cloudEnt && this._hass.states[cloudEnt]) {
            const val = parseFloat(this._hass.states[cloudEnt].state);
            return isNaN(val) ? 0 : val;
        }
        return 0;
    }

    _render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; --fork-u-bg: #1e2024; --color-cold: #60A5FA; --color-opt: #34D399; --color-warm: #FBBF24; --color-hot: #F87171; }
          .card {
              position: relative; display: flex; flex-direction: column; width: 100%; height: 350px;
              overflow: hidden;
              text-shadow: rgba(0,0,0,0.4) 0 1px 0px;
              box-shadow: 0 4px 2px rgba(0,0,0,0.3);
              background: var(--card-background-color,var(--fork-u-bg));
              border-radius: var(--ha-card-border-radius,var(--ha-border-radius-lg,20px));
          }
          .gradient-layer {
              background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40px);
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 0; transition: all 0.5s ease;
          }
          .bg-image {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              background-size: cover; 
              background-position: center calc(50% + var(--image-y-offset, 0px));
              z-index: 0; transition: all 0.5s ease;
          }
          .dim-layer {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              background: #000; opacity: 0; z-index: 1; pointer-events: none; transition: opacity 2s ease;
          }
          
          /* WINDOW LIGHTS */
          .window-lights-layer {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 4; pointer-events: none;
          }
          .window-light {
              position: absolute;
              transform: translate(-50%, -50%);
              border-radius: 2px;
              transition: all 0.8s ease;
              pointer-events: auto;
              cursor: pointer;
          }
          .window-light.is-on {
              background: radial-gradient(ellipse at center, 
                  var(--window-color, rgba(255, 220, 150, 0.85)) 0%, 
                  var(--window-color, rgba(255, 200, 120, 0.5)) 30%,
                  var(--window-color-mid, rgba(255, 180, 100, 0.2)) 60%,
                  transparent 100%);
              mix-blend-mode: screen;
              filter: blur(3px);
          }
          .window-light.is-on::after {
              content: '';
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%);
              width: 200%; height: 200%;
              background: radial-gradient(ellipse at center,
                  var(--window-glow-outer, rgba(255, 180, 100, 0.25)) 0%,
                  transparent 70%);
              mix-blend-mode: screen;
              filter: blur(10px);
              pointer-events: none;
          }
          .window-light.is-off {
              background: radial-gradient(ellipse at center,
                  rgba(15, 20, 30, 0.25) 0%,
                  rgba(15, 20, 30, 0.15) 50%,
                  transparent 100%);
              filter: blur(2px);
              mix-blend-mode: multiply;
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
          
          /* BADGE STYLES */
          .badge {
              position: absolute; 
              transform: translate(-50%, -50%) scale(var(--badge-scale, 1));
              padding: 6px 12px;
              border-radius: 16px;
              background: rgba(20, 20, 25, 0.75); 
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255,255,255,0.15);
              box-shadow: 0 4px 8px rgba(0,0,0,0.4);
              display: flex; align-items: center; gap: 8px; pointer-events: auto;
              transition: transform 0.3s ease; 
              cursor: pointer; /* Change cursor on hover */
          }
          .badge:active { transform: translate(-50%, -50%) scale(var(--badge-scale, 1)) scale(0.95); } /* Press effect */
          
          .badge-dot { width: 8px; height: 8px; border-radius: 50%; }
          .is-cold .badge-dot { background: var(--color-cold); box-shadow: 0 0 5px var(--color-cold); }
          .is-optimal .badge-dot { background: var(--color-opt); box-shadow: 0 0 5px var(--color-opt); }
          .is-warm .badge-dot { background: var(--color-warm); box-shadow: 0 0 5px var(--color-warm); }
          .is-hot .badge-dot { background: var(--color-hot); box-shadow: 0 0 5px var(--color-hot); }
          
          /* SPARK ICON STYLE */
          .spark-icon {
            width: 12px; height: 12px; margin-right: 4px; 
            filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.6));
            animation: pulse-spark 2s infinite ease-in-out;
          }
          @keyframes pulse-spark {
            0% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0.8; transform: scale(1); }
          }
          
          .badge-content { display: flex; flex-direction: column; line-height: 1; }
          .badge-name { font-size: 0.55rem; color: #aaa; text-transform: uppercase; margin-bottom: 2px; }
          .badge-val { font-size: 0.80rem; font-weight: 700; color: #fff; white-space: nowrap; }
        </style>
        
        <div class="card">
          <div class="bg-image"></div>
          <div class="gradient-layer"></div>
          <div class="dim-layer"></div>
          <div class="window-lights-layer"></div>
          <div class="ambient-layer">
              <div class="ambient-light blob-1"></div>
              <div class="ambient-light blob-2"></div>
              <div class="ambient-light blob-3"></div>
          </div>
          <canvas id="weatherCanvas"></canvas>
          <div class="badges-layer"></div>
        </div>
      `;
      this._canvas = this.shadowRoot.getElementById('weatherCanvas');
      this._ctx = this._canvas.getContext('2d');
      // Assume visible on initial render (IntersectionObserver will update this)
      this._isVisible = true;
      setTimeout(() => this._resizeCanvas(), 100);
      this.connectedCallback();
    }
  
    _resizeCanvas() {
      if (!this._canvas) return;
      const card = this.shadowRoot.querySelector('.card');
      if (card) { this._canvas.width = card.clientWidth; this._canvas.height = card.clientHeight; }
    }

    // --- ANIMATIONS ---
    _initStars() {
        this._stars = [];
        for (let i = 0; i < 60; i++) {
            this._stars.push({
                x: Math.random() * (this._canvas ? this._canvas.width : 300),
                y: Math.random() * (this._canvas ? this._canvas.height : 200),
                size: Math.random() * 1.5, opacity: Math.random(), speed: 0.01 + Math.random() * 0.02
            });
        }
    }

    _animate() {
      if (!this._ctx || !this._hass || !this._canvas) {
        // Missing required components - don't schedule next frame
        this._animationFrame = null;
        return;
      }
      
      const wEnt = this._config.weather_entity;
      let wState = this._config.test_weather_state || (wEnt ? this._hass.states[wEnt]?.state : "");
      const { speed, bearing } = this._getWindData();
      const windDirX = (bearing > 180 || bearing < 0) ? 1 : -1;
      let moveSpeed = speed / 15; if (moveSpeed < 0.2) moveSpeed = 0.2; if (moveSpeed > 6) moveSpeed = 6;
      
      const sunEnt = this._config.sun_entity || 'sun.sun';
      const isNight = this._hass.states[sunEnt]?.state === 'below_horizon';
      const coverage = this._getCloudCoverage();

      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

      if (isNight) this._drawStars(coverage);
      if (wState === 'fog' || (isNight && ['rainy','cloudy'].includes(wState))) this._drawFog(moveSpeed);

      if ((wState && !['clear-night','sunny'].includes(wState)) || coverage > 20) {
         let density = 1; if(coverage>50) density=1.5; if(coverage>80) density=2;
         this._drawClouds(windDirX, moveSpeed, density);
      }
      if (['rainy','pouring','lightning','lightning-rainy'].includes(wState)) {
          this._drawRain(wState === 'pouring' ? 2 : 1, windDirX, moveSpeed);
      } else if (['snowy','snowy-rainy'].includes(wState)) {
          this._drawSnow(windDirX, moveSpeed);
      } 
      if (['lightning','lightning-rainy'].includes(wState) || wState === 'lightning') this._handleLightning();
      
      if (this._flashOpacity > 0) {
          this._ctx.fillStyle = `rgba(255, 255, 255, ${this._flashOpacity})`;
          this._ctx.fillRect(0,0, this._canvas.width, this._canvas.height);
          this._flashOpacity -= 0.05;
      }

      this._animationFrame = requestAnimationFrame(() => this._animate());
    }

    _drawStars(coverage) {
        const visibility = Math.max(0, 1 - (coverage / 80)); 
        if (visibility <= 0) return;
        this._ctx.fillStyle = "#FFF";
        this._stars.forEach(star => {
            this._ctx.globalAlpha = Math.abs(Math.sin(Date.now() * 0.001 * star.speed + star.x)) * star.opacity * visibility;
            this._ctx.beginPath();
            this._ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this._ctx.fill();
        });
        this._ctx.globalAlpha = 1.0;
    }

    _drawFog(speed) {
        if (this._fogParticles.length < 10) {
            this._fogParticles.push({
                x: Math.random() * this._canvas.width,
                y: this._canvas.height - (Math.random() * 50),
                radius: 50 + Math.random() * 50,
                speed: (Math.random() * 0.2) + 0.05
            });
        }
        
        this._fogParticles.forEach(f => {
            f.x += f.speed * (speed * 0.5);
            if (f.x > this._canvas.width + 100) f.x = -100;
            
            const g = this._ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
            g.addColorStop(0, 'rgba(200, 200, 210, 0.15)');
            g.addColorStop(1, 'rgba(200, 200, 210, 0)');
            
            this._ctx.fillStyle = g;
            this._ctx.beginPath();
            this._ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
            this._ctx.fill();
        });
    }

    _drawClouds(dirX, baseSpeed, density) {
        const target = Math.floor(5 * density);
        if (this._clouds.length < target) {
             const newCloud = this._createCloud(false); newCloud.x = dirX > 0 ? -200 : this._canvas.width + 200;
             this._clouds.push(newCloud);
        }
        if (this._clouds.length > target) this._clouds.pop();
        this._clouds.forEach((cloud, index) => {
            cloud.x += baseSpeed * 0.3 * dirX; 
            if ((dirX > 0 && cloud.x > this._canvas.width + 200) || (dirX < 0 && cloud.x < -200)) { this._clouds.splice(index, 1); return; }
            this._ctx.save(); this._ctx.translate(cloud.x, cloud.y); this._ctx.scale(cloud.scale, cloud.scale);
            cloud.puffs.forEach(puff => {
                const gradient = this._ctx.createRadialGradient(puff.xOffset, puff.yOffset, 0, puff.xOffset, puff.yOffset, puff.radius);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${puff.opacity * 0.8})`); gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this._ctx.fillStyle = gradient; this._ctx.beginPath(); this._ctx.arc(puff.xOffset, puff.yOffset, puff.radius, 0, Math.PI * 2); this._ctx.fill();
            });
            this._ctx.restore();
        });
    }
    _createCloud(randomX) {
        const puffs = []; const numPuffs = 4 + Math.floor(Math.random() * 4); const cloudWidth = 100 + Math.random() * 80;
        for (let j = 0; j < numPuffs; j++) puffs.push({ xOffset: (Math.random() * cloudWidth) - (cloudWidth/2), yOffset: (Math.random() * 30) - 15, radius: 25 + Math.random() * 20, opacity: 0.1 + Math.random() * 0.2 });
        return { x: randomX ? Math.random() * (this._canvas ? this._canvas.width : 300) : -150, y: Math.random() * 100, scale: 0.8 + Math.random() * 0.4, puffs: puffs };
    }

    _drawRain(intensity, windDirX, windSpeed) {
      if (this._particles.length < 150 * intensity) this._particles.push({ x: Math.random() * this._canvas.width, y: -20, speed: 15 + windSpeed, length: 15 + Math.random() * 10 });
      this._ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)'; this._ctx.lineWidth = 1; this._ctx.beginPath();
      const angleX = windDirX * (windSpeed * 1.5);
      for (let i = 0; i < this._particles.length; i++) {
          const p = this._particles[i];
          this._ctx.moveTo(p.x, p.y); this._ctx.lineTo(p.x + angleX, p.y + p.length);
          p.y += p.speed; p.x += angleX;
          if (p.y > this._canvas.height || p.x > this._canvas.width + 50 || p.x < -50) { this._particles.splice(i, 1); i--; }
      }
      this._ctx.stroke();
    }

    _drawSnow(windDirX, windSpeed) {
      if (this._particles.length < 100) this._particles.push({ x: Math.random() * this._canvas.width, y: -10, speed: 1 + Math.random(), radius: 1.5 + Math.random() });
      this._ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; this._ctx.beginPath();
      for (let i = 0; i < this._particles.length; i++) {
          const p = this._particles[i];
          this._ctx.moveTo(p.x, p.y); this._ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          p.y += p.speed; p.x += (Math.sin(p.y * 0.03) * 0.5) + (windDirX * windSpeed * 0.5);
          if (p.y > this._canvas.height || p.x > this._canvas.width + 50 || p.x < -50) { this._particles.splice(i, 1); i--; }
      }
      this._ctx.fill();
    }
    
    _handleLightning() {
        this._lightningTimer++;
        if (this._lightningTimer > 200 && Math.random() > 0.98) { this._triggerLightning(); this._lightningTimer = 0; }
        if (this._lightningBolt && this._lightningBolt.life > 0) { this._drawBolt(this._lightningBolt); this._lightningBolt.life--; }
    }
    _triggerLightning() {
        const startX = Math.random() * this._canvas.width; const path = [{x: startX, y: 0}]; let currX = startX, currY = 0;
        while(currY < this._canvas.height * 0.8) { currY += Math.random() * 40 + 20; currX += (Math.random() * 60) - 30; path.push({x: currX, y: currY}); }
        this._lightningBolt = { path, life: 10 }; this._flashOpacity = 0.5;
    }
    _drawBolt(bolt) {
        this._ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; this._ctx.lineWidth = 2; this._ctx.beginPath();
        this._ctx.moveTo(bolt.path[0].x, bolt.path[0].y); for(let p of bolt.path) this._ctx.lineTo(p.x, p.y); this._ctx.stroke();
    }
  }
  
  customElements.define('house-card', HouseCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "house-card", name: "House Card", description: "Interactivity Enabled" });