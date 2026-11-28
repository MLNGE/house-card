import { DEFAULT_IMAGE_PATH, LEGACY_IMAGE_PATH } from './constants.js';
import { withCanvasEffects } from './canvas-effects.js';
import { withPowerStation } from './power-station.js';

const TRANSLATIONS = {
    en: { loading: "Loading...", home_median: "Home" }
};

class HouseCard extends withCanvasEffects(withPowerStation(HTMLElement)) {

    // ───────────────────────────────────────────────────────────────────────────
    // LIFECYCLE & CONFIGURATION
    // ───────────────────────────────────────────────────────────────────────────

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
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
      
      this._particles = []; this._clouds = []; this._stars = []; this._fogParticles = [];
      this._lightningTimer = 0; this._flashOpacity = 0; this._lightningBolt = null;
      
      // Shooting stars
      this._shootingStars = [];
      this._shootingStarTimer = 0;
      
      // Aurora borealis
      this._auroraWaves = [];
      this._auroraTime = 0;
      this._auroraInitialized = false;
      
      // Seasonal particles (leaves, petals)
      this._seasonalParticles = [];
      
      // Moon tracking
      this._moonGlowPhase = 0;
      
      // Sun tracking
      this._sunGlowPhase = 0;
      this._sunRayRotation = 0;
      
      // Sky gradient caching
      this._lastSunElevation = null;
      this._cachedSkyGradient = null;
      this._lastSkyGradientKey = null;
      this._moonPhaseCache = null;
      this._animationState = null;
      
      // Badge update throttling
      this._lastBadgeData = null;
      
      // Badge long press tracking
      this._longPressTimer = null;
      this._longPressTriggered = false;
      
      // Window lights update throttling
      this._lastWindowLightsData = null;
      this._lastNavLinksData = null;
      this._lastPowerStationData = null;
      this._lastPowerStationPos = null;
      this._lastThermostatBadgeData = null;
      this._lastThermostatBadgePos = null;
      this._powerStationEntityCache = null;
      
      // Visibility tracking
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
        scale: 1.0,
        background_zoom: 1.0,
        image_x_offset: 0,
        image_y_offset: 0,   
        image_path: DEFAULT_IMAGE_PATH,
        weather_entity: "weather.forecast_home",
        season_entity: "sensor.season",
        sun_entity: "sun.sun",
        sun_elevation_entity: null,  // Optional: sensor.sun_solar_elevation
        moon_entity: "sensor.moon_phase",
        moon_position_x: 85,
        moon_position_y: 15,
        moon_size: 1.0,
        moon_glow: true,
        sun_position_x: 15,
        sun_position_y: 20,
        sun_size: 1.0,
        sun_glow: true,
        sun_rays: true,
        sky_gradient: true,
        sky_gradient_intensity: 0.8,
        shooting_stars: true,
        shooting_star_frequency: 0.002,
        seasonal_particles: true,
        seasonal_particle_density: 1.0,
        aurora_entity: null,  // Optional: binary_sensor for NOAA aurora visibility
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
        window_glow_intensity: 1.0,
        window_glow_size: 1.0,
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
            grid_rows: 3,
        };
    }
  
        setConfig(config) {
            const incomingConfig = config || {};
            const normalizedConfig = { ...this.constructor.getStubConfig(), ...incomingConfig };
            const previousPowerStationDeviceId = this._config.power_station_device_id;
            normalizedConfig.rooms = Array.isArray(incomingConfig.rooms) ? incomingConfig.rooms : [];
            if (normalizedConfig.power_station_device_id && typeof normalizedConfig.power_station_device_id === 'object') {
                normalizedConfig.power_station_device_id = normalizedConfig.power_station_device_id.device_id || normalizedConfig.power_station_device_id.id || null;
            }
            if (typeof normalizedConfig.power_station_device_id === 'string' && normalizedConfig.power_station_device_id.trim().startsWith('<')) {
                normalizedConfig.power_station_device_id = null;
            }
            if (!normalizedConfig.image_path && normalizedConfig.image) {
                normalizedConfig.image_path = normalizedConfig.image;
            }
            this._config = normalizedConfig;
            this._lang = incomingConfig.language || 'en';
            if (previousPowerStationDeviceId !== normalizedConfig.power_station_device_id) {
                this._powerStationEntityCache = null;
            }
            if (!this.shadowRoot.querySelector('.card')) this._render();
            if (this._hass) this._updateData();
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
      this._observeCardSize();
      // Listen for tab visibility changes
      document.addEventListener('visibilitychange', this._handleVisibilityChange);
      
      // IntersectionObserver to detect when card is visible in viewport
      // This handles HA view switching better than visibility events
      if (!this._intersectionObserver) {
        this._intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const wasVisible = this._isVisible;
            this._isVisible = entry.isIntersecting;
            this._updateDehumidifierFanVisibility();
            
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
      document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    }

    _observeCardSize() {
      const card = this._cardElement || this.shadowRoot?.querySelector('.card');
      if (!card || this._observedCard === card || typeof ResizeObserver === 'undefined') return;

      if (this._resizeObserver) this._resizeObserver.disconnect();
      this._resizeObserver = new ResizeObserver(() => {
          const resized = this._resizeCanvas();
          if (resized && this._hass && this._isVisible && !document.hidden) {
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
        // Tab visible again and card is in viewport
        this._restartAnimation();
      }
    }

    _updateDehumidifierFanVisibility() {
      const badgesLayer = this.shadowRoot?.querySelector('.badges-layer');
      if (badgesLayer) {
        badgesLayer.classList.toggle('dehumidifier-fan-visible', this._isVisible && !document.hidden);
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

    // ───────────────────────────────────────────────────────────────────────────
    // BACKGROUND IMAGE CALCULATION
    // ───────────────────────────────────────────────────────────────────────────

    _calculateImage() {
        const configuredPath = (this._config.image_path || "").trim();
        const pathCandidates = configuredPath
            ? [configuredPath]
            : this._currentImageUrl && this._currentImageUrl.startsWith(LEGACY_IMAGE_PATH)
                ? [LEGACY_IMAGE_PATH, DEFAULT_IMAGE_PATH]
                : [DEFAULT_IMAGE_PATH, LEGACY_IMAGE_PATH];
        const sunState = this._hass.states[this._config.sun_entity || 'sun.sun']?.state || 'above_horizon';
        const timeOfDay = this._config.test_time_of_day || (sunState === 'below_horizon' ? 'night' : 'day');

        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        if ((month === 12 && day >= 14) || (month === 1 && day <= 14)) {
            return pathCandidates.map((path) => `${path}winter_xmas_${timeOfDay}.png`);
        }

        let season = this._config.test_season_state || this._hass.states[this._config.season_entity]?.state || 'summer';
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
      const imageKey = newImageCandidates.slice().sort().join('\u0000');
      if (this._lastImageCandidates !== imageKey) {
          this._lastImageCandidates = imageKey;
          this._loadBackgroundImage(newImageCandidates);
      }
      this._updateVisualStyles();

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
        const dehumidifierState = r.dehumidifier_entity
            ? this._hass.states[r.dehumidifier_entity]?.state || null
            : null;
        return { ...r, value: v, humidity: hum, co2: co2, dehumidifier_state: dehumidifierState, valid: Number.isFinite(v) };
      });
      
      this._updateBadges(roomsData);
      this._updateWindowLights();
      this._updateThermostatBadge();
      this._updatePowerStationTile();
      this._updateNavLinks();
      this._updateDecorations();
      this._handleGamingMode();
      this._handleDayNight();
      
      // Start animation if not running and card is visible
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
      const backgroundZoom = this._config.background_zoom || 1.0;
      const backgroundStyle = `${imageXOffset}|${imageYOffset}|${backgroundZoom}`;

      if (this._lastBackgroundStyle !== backgroundStyle && this._bgImageElement) {
          this._bgImageElement.style.setProperty('--image-x-offset', `${imageXOffset}px`);
          this._bgImageElement.style.setProperty('--image-y-offset', `${imageYOffset}px`);
          this._bgImageElement.style.setProperty('--background-zoom', backgroundZoom);
          this._lastBackgroundStyle = backgroundStyle;
      }

      const scale = this._config.scale || 1.0;
      const badgeOpacity = this._config.badge_opacity ?? 0.75;
      const cardStyle = `${scale}|${badgeOpacity}`;
      if (this._lastCardStyle !== cardStyle && this._cardElement) {
          this._cardElement.style.setProperty('--badge-scale', scale);
          this._cardElement.style.setProperty('--badge-opacity', badgeOpacity);
          this._lastCardStyle = cardStyle;
      }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // UI LAYER UPDATES (Badges, Windows, Nav, Decorations)
    // ───────────────────────────────────────────────────────────────────────────
  
    _updateBadges(rooms) {
      const container = this.shadowRoot.querySelector('.badges-layer');
      if (!container) return;
      
      const badgeDataHash = JSON.stringify(rooms.map((room) => [
        room.entity, room.name, room.value, room.humidity, room.co2,
        room.x, room.y, room.unit, room.decimals, room.flip_icon,
        room.dehumidifier_entity, room.dehumidifier_state, room.tap_action, room.valid
      ]));
      if (this._lastBadgeData === badgeDataHash && this._badgesDelegated) {
        return;
      }
      
      this._lastBadgeData = badgeDataHash;
      
      // 1. Generate HTML
      container.innerHTML = rooms.map((room, index) => {
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

        const flipClass = room.flip_icon ? 'flip-icon' : '';
        const dehumidifierStatus = room.dehumidifier_state === 'on'
            ? 'on'
            : room.dehumidifier_state === 'off'
                ? 'off'
                : 'unavailable';
        const dehumidifierIndicator = room.dehumidifier_entity && dehumidifierStatus === 'on'
            ? `<span class="dehumidifier-indicator dehumidifier-indicator--${dehumidifierStatus}" role="img" aria-label="Dehumidifier ${dehumidifierStatus}" title="Dehumidifier ${dehumidifierStatus}"><svg class="dehumidifier-fan" viewBox="0 0 24 24" aria-hidden="true"><g class="dehumidifier-fan__rotor"><ellipse cx="12" cy="6.4" rx="2.4" ry="4.3"/><ellipse cx="12" cy="6.4" rx="2.4" ry="4.3" transform="rotate(120 12 12)"/><ellipse cx="12" cy="6.4" rx="2.4" ry="4.3" transform="rotate(240 12 12)"/><circle cx="12" cy="12" r="2"/></g></svg></span>`
            : '';
        return `
          <div class="badge ${colorClass} ${flipClass}" data-index="${index}" data-entity="${room.entity}" style="top: ${top}%; left: ${left}%;">
            ${visualHtml}
            ${dehumidifierIndicator}
            <div class="badge-content">
              <span class="badge-name">${room.name}</span>
              <span class="badge-val">${finalValueString}</span>
            </div>
          </div>`;
      }).join('');

      // 2. Set up event delegation (only once)
      if (!this._badgesDelegated) {
          let pressStartTime = 0;
          let pressedBadge = null;
          let longPressActive = false;
          let startX = 0;
          let startY = 0;
          const MOVE_THRESHOLD = 10; // pixels - allow small movement before canceling
          
          // Mouse/touch down - start tracking
          const handleStart = (e, isTouch) => {
              const touch = isTouch ? e.touches[0] : e;
              const badge = e.target.closest('.badge');
              if (!badge) return;
              
              pressedBadge = badge;
              pressStartTime = Date.now();
              longPressActive = false;
              startX = touch.clientX;
              startY = touch.clientY;
              
              if (this._longPressTimer) clearTimeout(this._longPressTimer);
              
              this._longPressTimer = setTimeout(() => {
                  longPressActive = true;
                  const index = parseInt(badge.getAttribute('data-index'));
                  const room = this._config.rooms[index];
                  if (room) {
                      this._showEntityMenu(badge, room, touch);
                  }
              }, 500);
          };
          
          // Mouse/touch move - cancel only if moved significantly
          const handleMove = (e, isTouch) => {
              if (!this._longPressTimer) return;
              
              const touch = isTouch ? e.touches[0] : e;
              const deltaX = Math.abs(touch.clientX - startX);
              const deltaY = Math.abs(touch.clientY - startY);
              
              // Only cancel if moved more than threshold
              if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
                  clearTimeout(this._longPressTimer);
                  this._longPressTimer = null;
              }
          };
          
          // Mouse/touch up - determine action
          const handleEnd = (e, isTouch) => {
              if (this._longPressTimer) {
                  clearTimeout(this._longPressTimer);
                  this._longPressTimer = null;
              }
              
              // If long press menu is showing, ignore this release
              if (longPressActive) {
                  pressedBadge = null;
                  pressStartTime = 0;
                  longPressActive = false;
                  return;
              }
              
              const badge = e.target.closest('.badge');
              if (!badge || badge !== pressedBadge) {
                  pressedBadge = null;
                  return;
              }
              
              // Normal click - open primary entity
              const index = parseInt(badge.getAttribute('data-index'));
              const room = this._config.rooms[index];
              
              if (room && room.tap_action) {
                  this._handleTapAction(room.tap_action, room);
              } else if (room) {
                  this._fireMoreInfo(room.entity);
              }
              
              pressedBadge = null;
              pressStartTime = 0;
          };
          
          // Mouse events
          container.addEventListener('mousedown', (e) => handleStart(e, false));
          container.addEventListener('mousemove', (e) => handleMove(e, false));
          container.addEventListener('mouseup', (e) => handleEnd(e, false));
          
          // Touch events
          container.addEventListener('touchstart', (e) => handleStart(e, true), { passive: true });
          container.addEventListener('touchmove', (e) => handleMove(e, true), { passive: true });
          container.addEventListener('touchend', (e) => handleEnd(e, true), { passive: true });
          
          this._badgesDelegated = true;
      }
    }

    _updateThermostatBadge() {
        const container = this.shadowRoot.querySelector('.thermostat-badges-layer');
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
        const isAvailable = typeof entity?.state === 'string' && entity.state !== 'unknown' && entity.state !== 'unavailable';
        const temperatureUnit = attributes.temperature_unit || this._hass.config?.unit_system?.temperature || '°';
        const formatTemperature = (value) => {
            if (!isAvailable || value === null || value === undefined || value === '') return '--';
            const temperature = Number(value);
            return Number.isFinite(temperature) ? `${temperature.toFixed(1)} ${temperatureUnit}` : '--';
        };
        const currentTemperature = formatTemperature(attributes.current_temperature);
        const targetTemperature = formatTemperature(attributes.temperature);
        const mode = isAvailable ? entity.state : 'unavailable';
        const modeLabel = mode.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
        const configuredTitle = typeof this._config.thermostat_title === 'string'
            ? this._config.thermostat_title.trim()
            : '';
        const friendlyName = typeof attributes.friendly_name === 'string'
            ? attributes.friendly_name.trim()
            : '';
        const title = configuredTitle || friendlyName || 'Thermostat';
        const hash = [
            entityId,
            entity?.state,
            currentTemperature,
            targetTemperature,
            temperatureUnit,
            title
        ].join('|');
        const positionHash = `${this._config.thermostat_x}|${this._config.thermostat_y}`;
        const normalizePosition = (value) => {
            if (value === null || value === undefined || value === '') return 50;
            const position = Number(value);
            return Number.isFinite(position) ? Math.min(100, Math.max(0, position)) : 50;
        };
        const x = normalizePosition(this._config.thermostat_x);
        const y = normalizePosition(this._config.thermostat_y);
        const existingBadge = container.querySelector('.thermostat-badge');

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

        const badge = document.createElement('button');
        badge.type = 'button';
        badge.className = 'thermostat-badge';
        badge.setAttribute('data-hvac-mode', mode.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
        badge.style.left = `${x}%`;
        badge.style.top = `${y}%`;
        badge.setAttribute('aria-label', `${title}. Now ${currentTemperature}. Set ${targetTemperature}. Mode ${modeLabel}. Open thermostat details.`);

        const icon = document.createElement('ha-icon');
        icon.setAttribute('icon', 'mdi:thermostat');
        icon.setAttribute('aria-hidden', 'true');

        const content = document.createElement('span');
        content.className = 'thermostat-badge__content';

        const name = document.createElement('span');
        name.className = 'thermostat-badge__name';
        name.textContent = title;

        const details = document.createElement('span');
        details.className = 'thermostat-badge__details';

        const current = document.createElement('span');
        current.className = 'thermostat-badge__current';
        current.textContent = `Now ${currentTemperature}`;

        const target = document.createElement('span');
        target.className = 'thermostat-badge__target';
        target.textContent = `Set ${targetTemperature}`;

        const modeElement = document.createElement('span');
        modeElement.className = 'thermostat-badge__mode';
        modeElement.textContent = modeLabel;

        details.append(current, target, modeElement);
        content.append(name, details);
        badge.append(icon, content);
        badge.addEventListener('click', () => this._fireMoreInfo(entityId));
        container.replaceChildren(badge);
    }

    // ───────────────────────────────────────────────────────────────────────────
    // INTERACTIONS & EVENTS
    // ───────────────────────────────────────────────────────────────────────────
    
    _ensureMenuStyles() {
        if (document.getElementById('house-card-menu-styles')) return;
        const s = document.createElement('style');
        s.id = 'house-card-menu-styles';
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
        const existingMenu = document.querySelector('.entity-menu');
        if (existingMenu) existingMenu.remove();
        this._ensureMenuStyles();
        
        // Collect available entities with their current values
        const entities = [];
        if (room.entity) {
            const state = this._hass.states[room.entity];
            const value = state ? `${Math.round(parseFloat(state.state))}${state.attributes?.unit_of_measurement || '°C'}` : '—';
            entities.push({ id: room.entity, label: value, icon: 'mdi:thermometer' });
        }
        if (room.humidity_entity) {
            const state = this._hass.states[room.humidity_entity];
            const value = state ? `${Math.round(parseFloat(state.state))}${state.attributes?.unit_of_measurement || '%'}` : '—';
            entities.push({ id: room.humidity_entity, label: value, icon: 'mdi:water-percent' });
        }
        if (room.co2_entity) {
            const state = this._hass.states[room.co2_entity];
            const value = state ? `${Math.round(parseFloat(state.state))} ${state.attributes?.unit_of_measurement || 'ppm'}` : '—';
            entities.push({ id: room.co2_entity, label: value, icon: 'mdi:molecule-co2' });
        }

        const dehumidifierEntity = room.dehumidifier_entity;
        const dehumidifierDomain = typeof dehumidifierEntity === 'string' ? dehumidifierEntity.split('.')[0] : null;
        const isSupportedDehumidifier = dehumidifierDomain === 'switch' || dehumidifierDomain === 'humidifier';
        const dehumidifierState = isSupportedDehumidifier ? this._hass.states[dehumidifierEntity] : null;
        const dehumidifierAvailable = dehumidifierState &&
            dehumidifierState.state !== 'unknown' &&
            dehumidifierState.state !== 'unavailable';
        const dehumidifierStatus = !isSupportedDehumidifier
            ? 'INVALID'
            : !dehumidifierAvailable
                ? 'UNAVAILABLE'
                : dehumidifierState.state.toUpperCase();
        const deviceId = dehumidifierEntity ? this._hass.entities?.[dehumidifierEntity]?.device_id : null;
        const deviceInfo = deviceId ? this._hass.devices?.[deviceId] : null;
        const deviceName = deviceInfo?.name_by_user || deviceInfo?.name || 'Dehumidifier';
        const dehumidifierStats = [];

        if (dehumidifierAvailable && dehumidifierState.state === 'on') {
            const attributes = dehumidifierState.attributes || {};
            const addStat = (label, value, unit = '') => {
                if (value === undefined || value === null || value === '') return;
                dehumidifierStats.push({ label, value: `${value}${unit}` });
            };

            addStat('Current humidity', attributes.current_humidity, '%');
            addStat('Target humidity', attributes.humidity ?? attributes.target_humidity, '%');
            if (attributes.mode) {
                const mode = String(attributes.mode).replace(/_/g, ' ');
                addStat('Mode', mode.charAt(0).toUpperCase() + mode.slice(1));
            }

            const deviceEntityIds = deviceId
                ? Object.keys(this._hass.states).filter((entityId) =>
                    entityId !== dehumidifierEntity &&
                    this._hass.entities?.[entityId]?.device_id === deviceId &&
                    (entityId.startsWith('sensor.') || entityId.startsWith('binary_sensor.')))
                : [];
            deviceEntityIds.sort((a, b) => {
                const nameA = this._hass.states[a]?.attributes?.friendly_name || a;
                const nameB = this._hass.states[b]?.attributes?.friendly_name || b;
                return nameA.localeCompare(nameB);
            });

            deviceEntityIds.forEach((entityId) => {
                const state = this._hass.states[entityId];
                if (!state || state.state === 'unknown' || state.state === 'unavailable') return;

                const isBinarySensor = entityId.startsWith('binary_sensor.');
                const isHumiditySensor = state.attributes?.device_class === 'humidity' || entityId.endsWith('_humidity');
                if (!isBinarySensor && isHumiditySensor && attributes.current_humidity != null) return;

                const rawName = state.attributes?.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
                const label = rawName.toLowerCase().startsWith(deviceName.toLowerCase())
                    ? rawName.slice(deviceName.length).trim()
                    : rawName;
                const unit = state.attributes?.unit_of_measurement;
                const value = isBinarySensor
                    ? state.state.toUpperCase()
                    : `${state.state}${unit ? ` ${unit}` : ''}`;
                addStat(label || rawName, value);
            });
        }

        if (entities.length === 0 && !dehumidifierEntity) return;
        if (entities.length === 1 && !dehumidifierEntity) {
            this._fireMoreInfo(entities[0].id);
            return;
        }

        // Create menu
        const menu = document.createElement('div');
        menu.className = 'entity-menu';
        const entityRows = entities.map(ent => `
            <div class="entity-menu-item" data-entity="${ent.id}">
                <ha-icon icon="${ent.icon}"></ha-icon>
                <span>${ent.label}</span>
            </div>
        `).join('');
        const dehumidifierRow = dehumidifierEntity
            ? `<div class="entity-menu-item entity-menu-item--switch" data-action="toggle-dehumidifier" data-entity="${dehumidifierEntity}"${dehumidifierAvailable ? '' : ' aria-disabled="true"'}>
                <span class="switch-left"><ha-icon icon="mdi:air-humidifier"></ha-icon><span>Dehumidifier</span></span>
                <span class="switch-badge switch-badge--${dehumidifierAvailable ? dehumidifierState.state : 'unavailable'}">${dehumidifierStatus}</span>
               </div>`
            : '';
        menu.innerHTML = entityRows + (entityRows && dehumidifierRow ? '<div class="entity-menu-separator"></div>' : '') + dehumidifierRow;

        if (dehumidifierStats.length > 0) {
            menu.classList.add('entity-menu--dehumidifier');
            const separator = document.createElement('div');
            separator.className = 'entity-menu-separator';
            menu.appendChild(separator);

            const statsCard = document.createElement('button');
            statsCard.type = 'button';
            statsCard.className = 'dehumidifier-stats-card';
            statsCard.setAttribute('aria-label', deviceId ? `Open ${deviceName} device page` : `Open ${deviceName} details`);

            const heading = document.createElement('span');
            heading.className = 'dehumidifier-stats-card__header';
            const title = document.createElement('span');
            title.textContent = deviceName;
            const openIcon = document.createElement('ha-icon');
            openIcon.setAttribute('icon', 'mdi:open-in-new');
            heading.append(title, openIcon);
            statsCard.appendChild(heading);

            const statsGrid = document.createElement('span');
            statsGrid.className = 'dehumidifier-stats-card__grid';
            dehumidifierStats.forEach((stat) => {
                const statElement = document.createElement('span');
                statElement.className = 'dehumidifier-stats-card__stat';
                const label = document.createElement('span');
                label.className = 'dehumidifier-stats-card__label';
                label.textContent = stat.label;
                const value = document.createElement('span');
                value.className = 'dehumidifier-stats-card__value';
                value.textContent = stat.value;
                statElement.append(label, value);
                statsGrid.appendChild(statElement);
            });
            statsCard.appendChild(statsGrid);
            statsCard.addEventListener('click', (e) => {
                e.stopPropagation();
                if (deviceId) {
                    history.pushState(null, '', `/config/devices/device/${encodeURIComponent(deviceId)}`);
                    window.dispatchEvent(new Event('location-changed'));
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
        menu.style.top  = `${top}px`;
        menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 8))}px`;
        
        // Handle menu item selection
        const selectMenuItem = (item) => {
            const entityId = item.getAttribute('data-entity');
            if (entityId) {
                if (item.dataset.action === 'toggle-dehumidifier') {
                    const domain = entityId.split('.')[0];
                    const state = this._hass.states[entityId];
                    if ((domain !== 'switch' && domain !== 'humidifier') || !state || state.state === 'unknown' || state.state === 'unavailable') return;
                    this._hass.callService(domain, 'toggle', {}, { entity_id: entityId });
                    menu.remove();
                    cleanup();
                    return;
                }
                this._fireMoreInfo(entityId);
                menu.remove();
                cleanup();
            }
        };
        
        // Handle menu clicks (unified for mouse and touch)
        const handleMenuClick = (e) => {
            const item = e.target.closest('.entity-menu-item');
            if (!item) return;
            e.stopPropagation();
            e.preventDefault();
            // Small delay to ensure proper event handling on mobile
            setTimeout(() => selectMenuItem(item), 50);
        };
        
        // Close menu on outside click
        const closeMenu = (e) => {
            // Only close if click is outside the menu
            const clickedMenu = e.target.closest('.entity-menu');
            if (!clickedMenu) {
                menu.remove();
                cleanup();
            }
        };
        
        // Cleanup listeners
        const cleanup = () => {
            document.removeEventListener('mousedown', closeMenu);
            document.removeEventListener('touchstart', closeMenu);
            menu.removeEventListener('mousedown', handleMenuClick);
            menu.removeEventListener('touchstart', handleMenuClick);
        };
        
        // Attach menu handlers - use both mouse and touch
        menu.addEventListener('mousedown', handleMenuClick);
        menu.addEventListener('touchstart', handleMenuClick, { passive: false });
        
        // Delay adding outside click handlers to prevent immediate triggering
        setTimeout(() => {
            document.addEventListener('mousedown', closeMenu);
            document.addEventListener('touchstart', closeMenu, { passive: true });
        }, 150);
        
        // Also remove menu reference when element is removed
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
            case 'navigate':
                if (action.navigation_path) {
                    history.pushState(null, '', action.navigation_path);
                    window.dispatchEvent(new Event('location-changed'));
                }
                break;
            case 'more-info':
                // Open specific entity or default to room entity
                this._fireMoreInfo(action.entity || room.entity);
                break;
            case 'more-info-all':
                // Open more-info dialogs for all entities in sequence
                this._openMultipleMoreInfo(room);
                break;
            default:
                this._fireMoreInfo(room.entity);
        }
    }
    
    _fireMoreInfo(entityId) {
        if (!entityId) return;
        const event = new Event('hass-more-info', {
            bubbles: true,
            composed: true,
        });
        event.detail = { entityId };
        this.dispatchEvent(event);
    }
    
    _openMultipleMoreInfo(room) {
        // Collect all entities for this room
        const entities = [room.entity];
        if (room.humidity_entity) entities.push(room.humidity_entity);
        if (room.co2_entity) entities.push(room.co2_entity);
        
        // Open a browser_mod popup if available, otherwise show first entity
        if (this._hass.services.browser_mod?.popup) {
            // Use browser_mod popup with history graph
            const content = {
                type: 'vertical-stack',
                cards: entities.map(entity => ({
                    type: 'history-graph',
                    entities: [{ entity }],
                    hours_to_show: 24
                }))
            };
            this._hass.callService('browser_mod', 'popup', {
                title: room.name,
                content: content,
                size: 'wide'
            });
        } else {
            // Fallback: just open the first entity
            this._fireMoreInfo(room.entity);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // UTILITY METHODS
    // ───────────────────────────────────────────────────────────────────────────

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
        
        // Apply night mode to decorations
        const decorationsLayer = this.shadowRoot.querySelector('.decorations-layer');
        if (decorationsLayer) {
            decorationsLayer.classList.toggle('night-mode', isNight);
        }
        
        return isNight;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // WINDOW LIGHTS
    // ───────────────────────────────────────────────────────────────────────────

    _updateWindowLights() {
        const container = this.shadowRoot.querySelector('.window-lights-layer');
        if (!container) return;
        
        const windowLights = Array.isArray(this._config.window_lights) ? this._config.window_lights : [];
        const debugMode = this._config.window_lights_debug || false;
        const glowIntensity = this._config.window_glow_intensity ?? 1.0;
        const glowSize = this._config.window_glow_size ?? 1.0;
        const defaultGlowColor = this._config.window_glow_color || '#FFA64D';
        
        // Throttle: Create a hash of current window states to detect changes
        const windowDataHash = JSON.stringify({
            debugMode,
            glowIntensity,
            glowSize,
            defaultGlowColor,
            lights: windowLights.map(win => {
            const entity = this._hass.states[win.entity];
                return [
                    win.entity, entity?.state, entity?.attributes?.brightness,
                    win.x, win.y, win.width, win.height, win.color, win.skew_x, win.skew_y
                ];
            })
        });
        
        // Skip update if data hasn't changed
        if (this._lastWindowLightsData === windowDataHash && this._windowLightsDelegated) {
            return;
        }
        this._lastWindowLightsData = windowDataHash;
        
        // Build HTML for window lights
        container.innerHTML = windowLights.map((win, index) => {
            const entity = this._hass.states[win.entity];
            const isOn = entity?.state === 'on';
            const x = win.x ?? 50;
            const y = win.y ?? 50;
            const width = win.width ?? 10;
            const height = win.height ?? 12;
            const color = win.color || defaultGlowColor;
            const skewX = win.skew_x ?? 0;  // Skew for isometric perspective (deg)
            const skewY = win.skew_y ?? 0;  // Skew for isometric perspective (deg)
            const brightness = entity?.attributes?.brightness;
            
            // Calculate opacity based on brightness (0-255) if available
            let opacity = isOn ? 1 : 0;
            if (isOn && brightness !== undefined) {
                opacity = Math.max(0.3, brightness / 255);
            }
            
            // Parse color and create variations for gradient
            const colorRGB = this._hexToRgb(color);
            const colorStyle = colorRGB 
                ? `--window-color: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.9 * glowIntensity}); ` +
                  `--window-color-mid: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.6 * glowIntensity}); ` +
                  `--window-glow: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.8 * glowIntensity}); ` +
                  `--window-glow-outer: rgba(${colorRGB.r}, ${colorRGB.g}, ${colorRGB.b}, ${opacity * 0.4 * glowIntensity}); ` +
                  `--window-blur: ${5 * glowSize}px; --window-glow-blur: ${20 * glowSize}px; --window-glow-scale: ${glowSize};`
                : '';
            
            // Debug border to help with positioning - highly visible
            const debugStyle = debugMode ? 'border: 3px solid red !important; background: rgba(255,0,0,0.6) !important; mix-blend-mode: normal !important; filter: none !important; box-shadow: 0 0 10px red, inset 0 0 10px rgba(255,0,0,0.5) !important; z-index: 9999 !important;' : '';
            
            // Apply skew transform for isometric perspective
            const transformStyle = `transform: translate(-50%, -50%) skewX(${skewX}deg) skewY(${skewY}deg);`;
            
            // Apply extra blur for off windows
            const offStyle = !isOn ? 'filter: blur(6px);' : '';
            
            return `
              <div class="window-light ${isOn ? 'is-on' : 'is-off'}"
                   data-entity="${win.entity}"
                   data-index="${index}"
                   style="top: ${y}%; left: ${x}%; width: ${width}%; height: ${height}%; ${transformStyle} ${colorStyle} ${offStyle} ${debugStyle}">
              </div>`;
        }).join('');
        
        // Set up event delegation (only once)
        if (!this._windowLightsDelegated) {
            let pressStartTime = 0;
            let pressedWindow = null;
            let longPressActive = false;
            let startX = 0;
            let startY = 0;
            const MOVE_THRESHOLD = 10;
            let windowLongPressTimer = null;
            
            // Mouse/touch down
            const handleStart = (e, isTouch) => {
                const touch = isTouch ? e.touches[0] : e;
                const windowEl = e.target.closest('.window-light');
                if (!windowEl) return;
                
                pressedWindow = windowEl;
                pressStartTime = Date.now();
                longPressActive = false;
                startX = touch.clientX;
                startY = touch.clientY;
                
                if (windowLongPressTimer) clearTimeout(windowLongPressTimer);
                
                windowLongPressTimer = setTimeout(() => {
                    longPressActive = true;
                    const entityId = windowEl.getAttribute('data-entity');
                    if (entityId) {
                        this._showLightControlPopup(entityId);
                    }
                }, 500);
            };
            
            // Mouse/touch move
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
            
            // Mouse/touch up
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
                
                const windowEl = e.target.closest('.window-light');
                if (!windowEl || windowEl !== pressedWindow) {
                    pressedWindow = null;
                    return;
                }
                
                e.stopPropagation();
                const entityId = windowEl.getAttribute('data-entity');
                if (entityId) {
                    // Toggle the light or switch
                    const domain = entityId.split('.')[0];
                    this._hass.callService(domain, 'toggle', { entity_id: entityId });
                }
                
                pressedWindow = null;
                pressStartTime = 0;
            };
            
            // Mouse events
            container.addEventListener('mousedown', (e) => handleStart(e, false));
            container.addEventListener('mousemove', (e) => handleMove(e, false));
            container.addEventListener('mouseup', (e) => handleEnd(e, false));
            
            // Touch events
            container.addEventListener('touchstart', (e) => handleStart(e, true), { passive: true });
            container.addEventListener('touchmove', (e) => handleMove(e, true), { passive: true });
            container.addEventListener('touchend', (e) => handleEnd(e, true), { passive: true });
            
            this._windowLightsDelegated = true;
        }
    }

    _showLightControlPopup(entityId) {
        // Get entity state
        const entity = this._hass.states[entityId];
        if (!entity) return;
        
        const friendlyName = entity.attributes.friendly_name || entityId;
        const domain = entityId.split('.')[0];
        const entityName = entityId.split('.')[1];
        const isLight = domain === 'light';
        
        // Countdown entity for this device
        const countdownEntity = `number.${entityName}_countdown`;
        
        // Power measurement entity for switches
        const powerEntity = `sensor.${entityName}_power`;
        
        let cards = [];
        
        // Add main control card - use native HA cards
        if (isLight) {
            cards.push({
                type: 'light',
                entity: entityId
            });
        } else {
            cards.push({
                type: 'entities',
                entities: [entityId],
                show_header_toggle: false
            });
            
            // For switches: add power measurement if exists
            const powerState = this._hass.states[powerEntity];
            if (powerState) {
                cards.push({
                    type: 'entities',
                    title: 'Power Measurement',
                    entities: [
                        {
                            entity: powerEntity,
                            icon: 'mdi:lightning-bolt'
                        }
                    ],
                    show_header_toggle: false
                });
            }
        }
        
        // Add countdown timer if exists
        const countdownState = this._hass.states[countdownEntity];
        
        if (countdownState) {
            cards.push({
                type: 'entities',
                title: 'Auto Off Timer',
                entities: [
                    {
                        entity: countdownEntity,
                        icon: 'mdi:timer-outline'
                    }
                ],
                show_header_toggle: false
            });
            cards.push({
                type: 'custom:house-countdown-presets',
                countdown_entity: countdownEntity,
                switch_entity: entityId
            });
        }
        
        // Use fire-dom-event to trigger browser_mod popup on current browser only
        const event = new Event('ll-custom', {
            composed: true,
            bubbles: true,
        });
        event.detail = {
            browser_mod: {
                service: 'popup',
                data: {
                    title: friendlyName,
                    content: {
                        type: 'vertical-stack',
                        cards: cards
                    }
                }
            }
        };
        this.dispatchEvent(event);
    }

    _updateNavLinks() {
        const container = this.shadowRoot.querySelector('.nav-links-layer');
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
            const icon = link.icon || '';
            const label = link.label || '';
            
            // Debug border to help with positioning
            const debugStyle = debugMode ? 'border: 2px dashed lime !important; background: rgba(0,255,0,0.2) !important;' : '';
            
            // Icon HTML (uses HA icon if provided)
            let iconHtml = '';
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
        }).join('');
        
        // Set up event delegation (only once)
        if (!this._navLinksDelegated) {
            container.addEventListener('click', (e) => {
                const navEl = e.target.closest('.nav-link');
                if (navEl) {
                    e.stopPropagation();
                    const path = navEl.getAttribute('data-path');
                    if (path) {
                        // Navigate to the specified path
                        history.pushState(null, '', path);
                        window.dispatchEvent(new Event('location-changed'));
                    }
                }
            });
            this._navLinksDelegated = true;
        }
    }

    // DECORATIONS
    // ───────────────────────────────────────────────────────────────────────────

    _updateDecorations() {
        const container = this.shadowRoot.querySelector('.decorations-layer');
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
            const height = dec.height ?? 'auto';
            const image = dec.image || '';
            const animate = dec.animate || false;
            const flipX = dec.flip_x || false;
            const opacity = dec.opacity ?? 1.0;
            
            // Animation class
            let animClass = '';
            if (animate === true || animate === 'bounce') animClass = 'animate-bounce';
            else if (animate === 'sway') animClass = 'animate-sway';
            else if (animate === 'wag') animClass = 'animate-wag';
            
            // Debug border to help with positioning
            const debugStyle = debugMode ? 'border: 2px dashed magenta !important; background: rgba(255,0,255,0.2) !important;' : '';
            
            // Size styling
            const heightStyle = height === 'auto' ? 'height: auto;' : `height: ${height}%;`;
            const flipStyle = flipX ? 'transform: translate(-50%, -50%) scaleX(-1);' : '';
            
            return `
              <div class="decoration ${animClass}"
                   data-index="${index}"
                   style="top: ${y}%; left: ${x}%; width: ${width}%; ${heightStyle} opacity: ${opacity}; ${flipStyle} ${debugStyle}">
                   <img src="${image}" alt="decoration" loading="lazy">
              </div>`;
        }).join('');
        
        this._decorationsRendered = true;
    }
    

}

customElements.define('house-card', HouseCard);
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'house-card',
    name: 'House Card',
    description: 'Interactivity Enabled',
    preview: true
});
