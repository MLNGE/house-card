/**
 * House Card (Interactivity)
 * * FEAT: Click badges to open 'More Info' dialog.
 * * FEAT: Full Width Support (Sections View).
 * * FEAT: Global Scale & Y-Offset.
 * * FEAT: Humidity & Custom Units.
 * * FEAT: Moon phases with realistic rendering.
 * * FEAT: Shooting stars at night.
 * * FEAT: Seasonal particles (autumn leaves, spring petals).
 * * FEAT: Sun rendering with realistic atmospheric design.
 * * FEAT: Dynamic sky gradients with smooth sunrise/sunset transitions.
 * * FIX: Moon phase now renders actual illumination percentage.
 * * PERF: Throttle badge and window light updates (skip if unchanged).
 * * PERF: Sky gradient caching to prevent recreating on every frame.
 * 
 * @version 1.24.3
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const TRANSLATIONS = {
    en: { loading: "Loading...", home_median: "Home" }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOUSE CARD CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class HouseCard extends HTMLElement {

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
      
      this._particles = []; this._clouds = []; this._stars = []; this._fogParticles = [];
      this._lightningTimer = 0; this._flashOpacity = 0; this._lightningBolt = null;
      
      // Shooting stars
      this._shootingStars = [];
      this._shootingStarTimer = 0;
      
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
      
      // Badge update throttling
      this._lastBadgeData = null;
      this._lastBadgeUpdate = 0;
      
      // Badge long press tracking
      this._longPressTimer = null;
      this._longPressTriggered = false;
      
      // Window lights update throttling
      this._lastWindowLightsData = null;
      
      // Visibility tracking
      this._isVisible = false;
      this._intersectionObserver = null;
      this._handleVisibilityChange = this._onVisibilityChange.bind(this);
    }
  
    static getStubConfig() {
      return {
        language: "en",
        scale: 1.0,
        background_zoom: 1.0,
        image_x_offset: 0,
        image_y_offset: 0,   
        image: "/local/community/house-card/images/",
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
        sky_gradient_intensity: 0.2,
        shooting_stars: true,
        shooting_star_frequency: 0.002,
        seasonal_particles: true,
        seasonal_particle_density: 1.0,
        badge_opacity: 0.75,
        cloud_coverage_entity: "sensor.openweathermap_cloud_coverage",
        party_mode_entity: "input_boolean.gaming_mode",
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
      if (!config.rooms || !Array.isArray(config.rooms)) throw new Error("Missing 'rooms' list.");
      this._config = config;
      this._lang = config.language || 'en';
      this._decorationsRendered = false; // Reset so decorations re-render on config change
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

    // ───────────────────────────────────────────────────────────────────────────
    // BACKGROUND IMAGE CALCULATION
    // ───────────────────────────────────────────────────────────────────────────

    _calculateImage() {
        const path = this._config.image_path || "/local/community/house-card/images/";
        const sunState = this._hass.states[this._config.sun_entity || 'sun.sun']?.state || 'above_horizon';
        const timeOfDay = this._config.test_time_of_day || (sunState === 'below_horizon' ? 'night' : 'day');

        const now = new Date();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        if ((month === 12 && day >= 14) || (month === 1 && day <= 14)) {
            return `${path}winter_xmas_${timeOfDay}.png`;
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
                return `${path}${season}_${weatherSuffix}_${timeOfDay}.png`;
            }
        }
        return `${path}${season}_${timeOfDay}.png`;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // DATA UPDATES & STATE MANAGEMENT
    // ───────────────────────────────────────────────────────────────────────────

    _updateData() {
      if (!this._hass || !this.shadowRoot.querySelector('.card')) return;

      const newImage = this._calculateImage();
      
      if (this._currentImageUrl !== newImage || 
          this._lastXOffset !== this._config.image_x_offset ||
          this._lastYOffset !== this._config.image_y_offset ||
          this._lastScale !== this._config.scale ||
          this._lastBackgroundZoom !== this._config.background_zoom) {
          
          this._currentImageUrl = newImage;
          this._lastXOffset = this._config.image_x_offset;
          this._lastYOffset = this._config.image_y_offset;
          this._lastScale = this._config.scale;
          this._lastBackgroundZoom = this._config.background_zoom;
          
          const bgEl = this.shadowRoot.querySelector('.bg-image');
          if (bgEl) {
              const img = new Image();
              img.onload = () => { 
                  bgEl.style.backgroundImage = `url('${newImage}')`;
                  const xOffset = this._config.image_x_offset || 0;
                  const yOffset = this._config.image_y_offset || 0;
                  const bgZoom = this._config.background_zoom || 1.0;
                  bgEl.style.setProperty('--image-x-offset', `${xOffset}px`);
                  bgEl.style.setProperty('--image-y-offset', `${yOffset}px`);
                  bgEl.style.setProperty('--background-zoom', bgZoom);
              };
              img.src = newImage;
          }

          const card = this.shadowRoot.querySelector('.card');
          if (card) {
             const scale = this._config.scale || 1.0;
             card.style.setProperty('--badge-scale', scale);
             const badgeOpacity = this._config.badge_opacity ?? 0.75;
             card.style.setProperty('--badge-opacity', badgeOpacity);
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
      this._updateNavLinks();
      if (!this._decorationsRendered) this._updateDecorations();
      this._handleGamingMode();
      this._handleDayNight();
      
      // Start animation if not running and card is visible
      if (!this._animationFrame && this._canvas && this._ctx && this._isVisible && !document.hidden) {
        if (this._stars.length === 0) this._initStars();
        this._animate();
      }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // UI LAYER UPDATES (Badges, Windows, Nav, Decorations)
    // ───────────────────────────────────────────────────────────────────────────
  
    _updateBadges(rooms) {
      const container = this.shadowRoot.querySelector('.badges-layer');
      if (!container) return;
      
      // Throttle: Create a hash of current badge data to detect changes
      const badgeDataHash = rooms.map(r => 
        `${r.entity}:${r.value}:${r.humidity}:${r.co2}:${r.x}:${r.y}`
      ).join('|');
      
      // Skip update if data hasn't changed (throttle DOM updates)
      const now = Date.now();
      if (this._lastBadgeData === badgeDataHash && 
          this._badgesDelegated && 
          (now - this._lastBadgeUpdate) < 1000) {
        return;
      }
      
      // Only do full DOM rebuild if data actually changed
      if (this._lastBadgeData === badgeDataHash && this._badgesDelegated) {
        return;
      }
      
      this._lastBadgeData = badgeDataHash;
      this._lastBadgeUpdate = now;
      
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

        return `
          <div class="badge ${colorClass}" data-index="${index}" data-entity="${room.entity}" style="top: ${top}%; left: ${left}%;">
            ${visualHtml}
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

    // ───────────────────────────────────────────────────────────────────────────
    // INTERACTIONS & EVENTS
    // ───────────────────────────────────────────────────────────────────────────
    
    _showEntityMenu(badge, room, event) {
        // Remove any existing menu
        const existingMenu = this.shadowRoot.querySelector('.entity-menu');
        if (existingMenu) existingMenu.remove();
        
        // Collect available entities
        const entities = [];
        if (room.entity) {
            const state = this._hass.states[room.entity];
            const name = state?.attributes?.friendly_name || 'Temperature';
            entities.push({ id: room.entity, label: name, icon: 'mdi:thermometer' });
        }
        if (room.humidity_entity) {
            const state = this._hass.states[room.humidity_entity];
            const name = state?.attributes?.friendly_name || 'Humidity';
            entities.push({ id: room.humidity_entity, label: name, icon: 'mdi:water-percent' });
        }
        if (room.co2_entity) {
            const state = this._hass.states[room.co2_entity];
            const name = state?.attributes?.friendly_name || 'CO₂';
            entities.push({ id: room.co2_entity, label: name, icon: 'mdi:molecule-co2' });
        }
        
        if (entities.length <= 1) {
            // No menu needed, just one entity
            this._fireMoreInfo(room.entity);
            return;
        }
        
        // Create menu
        const menu = document.createElement('div');
        menu.className = 'entity-menu';
        menu.innerHTML = entities.map(ent => `
            <div class="entity-menu-item" data-entity="${ent.id}">
                <ha-icon icon="${ent.icon}"></ha-icon>
                <span>${ent.label}</span>
            </div>
        `).join('');
        
        // Position menu near the badge
        const rect = badge.getBoundingClientRect();
        const containerRect = this.shadowRoot.querySelector('.card').getBoundingClientRect();
        menu.style.top = `${rect.top - containerRect.top + rect.height}px`;
        menu.style.left = `${rect.left - containerRect.left}px`;
        
        // Add to shadow DOM
        this.shadowRoot.querySelector('.card').appendChild(menu);
        
        // Handle menu item selection
        const selectMenuItem = (item) => {
            const entityId = item.getAttribute('data-entity');
            if (entityId) {
                this._fireMoreInfo(entityId);
                menu.remove();
                cleanup();
            }
        };
        
        // Handle menu clicks (unified for mouse and touch)
        const handleMenuClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const item = e.target.closest('.entity-menu-item');
            if (item) {
                // Small delay to ensure proper event handling on mobile
                setTimeout(() => selectMenuItem(item), 50);
            }
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
        observer.observe(this.shadowRoot.querySelector('.card'), { childList: true });
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
        if (!container || !this._config.window_lights) return;
        
        const windowLights = this._config.window_lights;
        const debugMode = this._config.window_lights_debug || false;
        const glowIntensity = this._config.window_glow_intensity ?? 1.0;
        const glowSize = this._config.window_glow_size ?? 1.0;
        const defaultGlowColor = this._config.window_glow_color || '#FFA64D';
        
        // Throttle: Create a hash of current window states to detect changes
        const windowDataHash = windowLights.map(win => {
            const entity = this._hass.states[win.entity];
            return `${win.entity}:${entity?.state}:${entity?.attributes?.brightness}`;
        }).join('|');
        
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
            container.addEventListener('click', (e) => {
                const windowEl = e.target.closest('.window-light');
                if (windowEl) {
                    e.stopPropagation();
                    const entityId = windowEl.getAttribute('data-entity');
                    if (entityId) {
                        // Toggle the light or switch
                        const domain = entityId.split('.')[0];
                        this._hass.callService(domain, 'toggle', { entity_id: entityId });
                    }
                }
            });
            this._windowLightsDelegated = true;
        }
    }

    _updateNavLinks() {
        const container = this.shadowRoot.querySelector('.nav-links-layer');
        if (!container || !this._config.nav_links) return;
        
        const navLinks = this._config.nav_links;
        const debugMode = this._config.nav_links_debug || false;
        
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

    // ───────────────────────────────────────────────────────────────────────────
    // DECORATIONS
    // ───────────────────────────────────────────────────────────────────────────

    _updateDecorations() {
        const container = this.shadowRoot.querySelector('.decorations-layer');
        if (!container || !this._config.decorations) return;
        
        const decorations = this._config.decorations;
        const debugMode = this._config.decorations_debug || false;
        
        // Only render if not already done (decorations are static)
        if (this._decorationsRendered && container.children.length > 0) return;
        
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

    _getSunElevation() {
        // Check for test override first
        if (this._config.test_elevation !== undefined) {
            return this._config.test_elevation;
        }
        
        // Option 1: Dedicated elevation sensor (e.g., sensor.sun_solar_elevation)
        if (this._config.sun_elevation_entity) {
            const elevState = this._hass.states[this._config.sun_elevation_entity];
            if (elevState && elevState.state !== 'unknown' && elevState.state !== 'unavailable') {
                const elevation = parseFloat(elevState.state);
                if (!isNaN(elevation)) {
                    return elevation;
                }
            }
        }
        
        // Option 2: Standard sun.sun entity with elevation attribute
        const sunEnt = this._config.sun_entity || 'sun.sun';
        const sunState = this._hass.states[sunEnt];
        
        if (sunState && sunState.attributes && sunState.attributes.elevation !== undefined) {
            const elevation = parseFloat(sunState.attributes.elevation);
            if (!isNaN(elevation)) {
                return elevation;
            }
        }
        
        return null;
    }

    _lerpColor(color1, color2, factor) {
        // Linear interpolation between two colors
        const c1 = this._hexToRgb(color1);
        const c2 = this._hexToRgb(color2);
        if (!c1 || !c2) return color1;
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    _getSkyGradient(elevation) {
        // Define color schemes for different sun elevations
        // Based on atmospheric Rayleigh scattering
        
        let topColor, horizonColor, bottomColor;
        
        if (elevation === null || elevation === undefined) {
            // Fallback to simple day/night
            const sunEnt = this._config.sun_entity || 'sun.sun';
            const isNight = this._hass.states[sunEnt]?.state === 'below_horizon';
            topColor = isNight ? '#0a1628' : '#87CEEB';
            horizonColor = isNight ? '#1a1f38' : '#B0E0E6';
            bottomColor = isNight ? '#0f1a2e' : '#E0F6FF';
        } else if (elevation < -18) {
            // Night - Astronomical twilight
            topColor = '#000814';
            horizonColor = '#0a1628';
            bottomColor = '#0f1a2e';
        } else if (elevation < -12) {
            // Late night - Nautical twilight
            topColor = '#0a1628';
            horizonColor = '#1a2645';
            bottomColor = '#1f2d4a';
        } else if (elevation < -6) {
            // Deep twilight - Civil twilight begins
            topColor = '#1a2645';
            horizonColor = '#2d3e66';
            bottomColor = '#3a4a73';
        } else if (elevation < -4) {
            // Civil twilight - deep blue with purple hints
            topColor = '#1e3a5f';
            horizonColor = '#3d5a80';
            bottomColor = '#4a6380';
        } else if (elevation < -2) {
            // Early dawn/late dusk - blue to purple
            topColor = '#2e4a6b';
            horizonColor = '#5d6d8e';
            bottomColor = '#7689a8';
        } else if (elevation < 0) {
            // Sunrise/sunset approaching - purple and orange begin
            const factor = (elevation + 2) / 2; // 0 to 1
            topColor = this._lerpColor('#3d5a80', '#4a5f8a', factor);
            horizonColor = this._lerpColor('#7689a8', '#cc8866', factor);
            bottomColor = this._lerpColor('#8fa3c0', '#dd9955', factor);
        } else if (elevation < 2) {
            // Sunrise/sunset - golden hour begins
            const factor = elevation / 2; // 0 to 1
            topColor = this._lerpColor('#4a5f8a', '#d47c5a', factor);
            horizonColor = this._lerpColor('#cc8866', '#ee9944', factor);
            bottomColor = this._lerpColor('#dd9955', '#ffaa66', factor);
        } else if (elevation < 4) {
            // Golden hour - intense oranges and pinks
            const factor = (elevation - 2) / 2;
            topColor = this._lerpColor('#d4685a', '#ee8855', factor);
            horizonColor = this._lerpColor('#ee9944', '#ffaa55', factor);
            bottomColor = this._lerpColor('#ffaa66', '#ffcc88', factor);
        } else if (elevation < 8) {
            // Late golden hour - transitioning to day
            const factor = (elevation - 4) / 4;
            topColor = this._lerpColor('#ee8855', '#87CEEB', factor);
            horizonColor = this._lerpColor('#ffaa55', '#B0E0E6', factor);
            bottomColor = this._lerpColor('#ffcc88', '#E0F6FF', factor);
        } else if (elevation < 15) {
            // Early day - light blue
            const factor = (elevation - 8) / 7;
            topColor = this._lerpColor('#87CEEB', '#5BA3D0', factor);
            horizonColor = this._lerpColor('#B0E0E6', '#a8d8ea', factor);
            bottomColor = this._lerpColor('#E0F6FF', '#d4ebf2', factor);
        } else {
            // Full daylight - clear blue sky
            topColor = '#4A90D9';
            horizonColor = '#87CEEB';
            bottomColor = '#C8E6F5';
        }
        
        return { topColor, horizonColor, bottomColor };
    }

    _updateSkyGradient() {
        const skyLayer = this.shadowRoot.querySelector('.sky-gradient-layer');
        if (!skyLayer) return;
        
        // Skip if disabled
        if (this._config.sky_gradient === false) {
            skyLayer.style.background = '';
            this._lastSunElevation = null;
            return;
        }
        
        const elevation = this._getSunElevation();
        
        // Cache gradient if elevation hasn't changed significantly (throttle updates)
        if (this._lastSunElevation !== null && 
            elevation !== null &&
            Math.abs(elevation - this._lastSunElevation) < 0.5 &&
            skyLayer.style.background !== '') {
            return; // Use existing CSS gradient
        }
        
        // Update cache
        this._lastSunElevation = elevation;
        
        const { topColor, horizonColor, bottomColor } = this._getSkyGradient(elevation);
        const intensity = this._config.sky_gradient_intensity ?? 0.3;
        
        // Convert hex to rgba with intensity
        const topRgba = this._hexToRgba(topColor, intensity);
        const bottomRgba = this._hexToRgba(bottomColor, intensity * 0.7);
        
        // Create edge glow effect - top and bottom with transparent center
        // Top glow fades from color to transparent
        // Bottom glow fades from transparent to color
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
        // Always calculate the astronomical phase for accurate illumination
        const calculated = this._calculateMoonPhase();
        
        // Try to get phase name from Home Assistant entity (more reliable for name)
        const moonEnt = this._config.moon_entity || 'sensor.moon_phase';
        if (this._hass.states[moonEnt]) {
            return {
                name: this._hass.states[moonEnt].state,
                illumination: calculated.illumination,
                phaseValue: calculated.phaseValue
            };
        }
        return calculated;
    }

    _calculateMoonPhase() {
        // Astronomical calculation based on synodic month
        // Use a recent known new moon for better accuracy (reduces cumulative drift)
        // Known new moon: January 29, 2025 12:36 UTC (verified astronomical data)
        const knownNewMoon = new Date('2025-01-29T12:36:00Z').getTime();
        const synodicMonth = 29.530588853; // Average synodic month in days (more precise)
        const now = Date.now();
        const daysSinceNew = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
        const moonAge = ((daysSinceNew % synodicMonth) + synodicMonth) % synodicMonth; // Handle negative values
        const phaseValue = moonAge / synodicMonth; // 0 to 1
        
        // Calculate illumination: 0 at new moon, 1 at full moon, 0 at next new moon
        // Use cosine function for smooth transition
        const illumination = (1 - Math.cos(phaseValue * 2 * Math.PI)) / 2;
        
        // Map to phase names
        let name;
        if (phaseValue < 0.0625) name = 'new_moon';
        else if (phaseValue < 0.1875) name = 'waxing_crescent';
        else if (phaseValue < 0.3125) name = 'first_quarter';
        else if (phaseValue < 0.4375) name = 'waxing_gibbous';
        else if (phaseValue < 0.5625) name = 'full_moon';
        else if (phaseValue < 0.6875) name = 'waning_gibbous';
        else if (phaseValue < 0.8125) name = 'last_quarter';
        else if (phaseValue < 0.9375) name = 'waning_crescent';
        else name = 'new_moon';
        
        return { name, illumination, phaseValue };
    }

    _drawMoon(cloudCoverage) {
        const sunEnt = this._config.sun_entity || 'sun.sun';
        const isNight = this._hass.states[sunEnt]?.state === 'below_horizon';
        if (!isNight) return; // Only draw moon at night
        
        const phaseData = this._getMoonPhase();
        const phaseName = phaseData.name || phaseData;
        const illumination = phaseData.illumination ?? 0.5;
        
        if (phaseName === 'new_moon') return; // New moon is not visible
        
        const posX = (this._config.moon_position_x ?? 85) / 100 * this._canvas.width;
        const posY = (this._config.moon_position_y ?? 15) / 100 * this._canvas.height;
        const baseSize = 18 * (this._config.moon_size ?? 1.0);
        
        // Cloud occlusion - reduce visibility when cloudy
        const cloudOcclusion = Math.max(0, 1 - (cloudCoverage / 100) * 0.8);
        if (cloudOcclusion <= 0.1) return;
        
        this._ctx.save();
        this._ctx.globalAlpha = cloudOcclusion;
        
        // Draw glow first (behind the moon)
        if (this._config.moon_glow !== false) {
            this._drawMoonGlow(posX, posY, baseSize, phaseName, illumination);
        }
        
        // Draw moon base (lit portion)
        this._ctx.beginPath();
        this._ctx.arc(posX, posY, baseSize, 0, Math.PI * 2);
        
        // Moon surface gradient
        const surfaceGrad = this._ctx.createRadialGradient(
            posX - baseSize * 0.3, posY - baseSize * 0.3, 0,
            posX, posY, baseSize
        );
        surfaceGrad.addColorStop(0, '#FFFEF0');
        surfaceGrad.addColorStop(0.5, '#F5F5DC');
        surfaceGrad.addColorStop(1, '#E8E4D4');
        this._ctx.fillStyle = surfaceGrad;
        this._ctx.fill();
        
        // Draw subtle crater texture
        this._drawMoonCraters(posX, posY, baseSize);
        
        // Draw phase shadow using actual illumination
        this._drawPhaseShadow(posX, posY, baseSize, phaseName, illumination);
        
        this._ctx.restore();
    }

    _drawMoonGlow(x, y, size, phase, illumination = 0.5) {
        // Animate glow intensity
        this._moonGlowPhase += 0.02;
        const glowPulse = 1 + Math.sin(this._moonGlowPhase) * 0.1;
        
        // Glow intensity based on actual illumination (0.2 to 0.6 range)
        const glowIntensity = 0.2 + illumination * 0.4;
        
        // Outer glow
        const outerGlow = this._ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 4 * glowPulse);
        outerGlow.addColorStop(0, `rgba(255, 255, 240, ${glowIntensity * 0.5})`);
        outerGlow.addColorStop(0.4, `rgba(230, 230, 200, ${glowIntensity * 0.2})`);
        outerGlow.addColorStop(1, 'rgba(200, 200, 180, 0)');
        
        this._ctx.fillStyle = outerGlow;
        this._ctx.beginPath();
        this._ctx.arc(x, y, size * 4 * glowPulse, 0, Math.PI * 2);
        this._ctx.fill();
        
        // Inner halo
        const innerGlow = this._ctx.createRadialGradient(x, y, size, x, y, size * 1.8);
        innerGlow.addColorStop(0, `rgba(255, 255, 245, ${glowIntensity})`);
        innerGlow.addColorStop(1, 'rgba(255, 255, 240, 0)');
        
        this._ctx.fillStyle = innerGlow;
        this._ctx.beginPath();
        this._ctx.arc(x, y, size * 1.8, 0, Math.PI * 2);
        this._ctx.fill();
    }

    _drawSun(cloudCoverage) {
        const sunEnt = this._config.sun_entity || 'sun.sun';
        const isDay = this._hass.states[sunEnt]?.state === 'above_horizon';
        if (!isDay) return; // Only draw sun during daytime
        
        const posX = (this._config.sun_position_x ?? 15) / 100 * this._canvas.width;
        const posY = (this._config.sun_position_y ?? 20) / 100 * this._canvas.height;
        const baseSize = 22 * (this._config.sun_size ?? 1.0);
        
        // Cloud occlusion - reduce visibility when cloudy
        const cloudOcclusion = Math.max(0.15, 1 - (cloudCoverage / 100) * 0.85);
        if (cloudOcclusion <= 0.1) return;
        
        this._ctx.save();
        this._ctx.globalAlpha = cloudOcclusion;
        
        // Draw atmospheric light rays first (behind everything)
        if (this._config.sun_rays !== false) {
            this._drawSunRays(posX, posY, baseSize);
        }
        
        // Draw glow and atmospheric haze
        if (this._config.sun_glow !== false) {
            this._drawSunGlow(posX, posY, baseSize);
        }
        
        // Draw realistic sun body with atmospheric corona
        // Outer corona - subtle atmospheric scattering
        const coronaGrad = this._ctx.createRadialGradient(posX, posY, baseSize * 0.95, posX, posY, baseSize * 1.15);
        coronaGrad.addColorStop(0, 'rgba(255, 242, 230, 0)');
        coronaGrad.addColorStop(0.5, 'rgba(255, 225, 180, 0.4)');
        coronaGrad.addColorStop(1, 'rgba(255, 200, 120, 0.2)');
        this._ctx.fillStyle = coronaGrad;
        this._ctx.beginPath();
        this._ctx.arc(posX, posY, baseSize * 1.15, 0, Math.PI * 2);
        this._ctx.fill();
        
        // Main sun body - realistic solar disk
        const sunGrad = this._ctx.createRadialGradient(
            posX - baseSize * 0.15, posY - baseSize * 0.15, 0,
            posX, posY, baseSize
        );
        // Bright white-yellow core transitioning to warmer edges
        sunGrad.addColorStop(0, '#FFFEF8');      // Nearly pure white center
        sunGrad.addColorStop(0.4, '#FFFAED');    // Soft cream
        sunGrad.addColorStop(0.7, '#FFEDBB');    // Warm pale yellow
        sunGrad.addColorStop(0.9, '#FFE082');    // Golden edge
        sunGrad.addColorStop(1, 'rgba(255, 210, 100, 0.95)'); // Soft atmospheric edge
        
        this._ctx.fillStyle = sunGrad;
        this._ctx.beginPath();
        this._ctx.arc(posX, posY, baseSize, 0, Math.PI * 2);
        this._ctx.fill();
        
        // Soft edge blur for atmospheric blending
        this._ctx.globalCompositeOperation = 'source-over';
        const edgeBlur = this._ctx.createRadialGradient(posX, posY, baseSize * 0.88, posX, posY, baseSize * 1.02);
        edgeBlur.addColorStop(0, 'rgba(255, 250, 235, 0)');
        edgeBlur.addColorStop(0.6, 'rgba(255, 240, 210, 0.15)');
        edgeBlur.addColorStop(1, 'rgba(255, 230, 180, 0)');
        this._ctx.fillStyle = edgeBlur;
        this._ctx.beginPath();
        this._ctx.arc(posX, posY, baseSize * 1.02, 0, Math.PI * 2);
        this._ctx.fill();
        
        this._ctx.restore();
    }

    _drawSunGlow(x, y, size) {
        // Subtle breathing animation for atmospheric effect
        this._sunGlowPhase += 0.008;
        const atmospherePulse = 1 + Math.sin(this._sunGlowPhase) * 0.03;
        
        // Extended atmospheric glow - very subtle and diffuse
        const farGlow = this._ctx.createRadialGradient(x, y, size * 1.5, x, y, size * 6 * atmospherePulse);
        farGlow.addColorStop(0, 'rgba(255, 248, 225, 0.12)');
        farGlow.addColorStop(0.2, 'rgba(255, 242, 200, 0.08)');
        farGlow.addColorStop(0.4, 'rgba(255, 235, 180, 0.05)');
        farGlow.addColorStop(0.7, 'rgba(255, 220, 150, 0.02)');
        farGlow.addColorStop(1, 'rgba(255, 210, 130, 0)');
        
        this._ctx.fillStyle = farGlow;
        this._ctx.beginPath();
        this._ctx.arc(x, y, size * 6 * atmospherePulse, 0, Math.PI * 2);
        this._ctx.fill();
        
        // Mid-range atmospheric scattering
        const midGlow = this._ctx.createRadialGradient(x, y, size * 1.2, x, y, size * 3.5);
        midGlow.addColorStop(0, 'rgba(255, 250, 235, 0.18)');
        midGlow.addColorStop(0.3, 'rgba(255, 245, 215, 0.12)');
        midGlow.addColorStop(0.6, 'rgba(255, 238, 190, 0.06)');
        midGlow.addColorStop(1, 'rgba(255, 225, 165, 0)');
        
        this._ctx.fillStyle = midGlow;
        this._ctx.beginPath();
        this._ctx.arc(x, y, size * 3.5, 0, Math.PI * 2);
        this._ctx.fill();
        
        // Close atmospheric halo - brightest layer
        const nearGlow = this._ctx.createRadialGradient(x, y, size * 1.1, x, y, size * 2);
        nearGlow.addColorStop(0, 'rgba(255, 252, 245, 0.25)');
        nearGlow.addColorStop(0.5, 'rgba(255, 248, 225, 0.15)');
        nearGlow.addColorStop(1, 'rgba(255, 240, 200, 0)');
        
        this._ctx.fillStyle = nearGlow;
        this._ctx.beginPath();
        this._ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        this._ctx.fill();
    }

    _drawSunRays(x, y, size) {
        // Very slow rotation for subtle movement
        this._sunRayRotation += 0.001;
        
        // Fewer, more realistic atmospheric beams
        const numBeams = 8;
        const beamLength = size * 4;
        
        this._ctx.save();
        this._ctx.translate(x, y);
        this._ctx.rotate(this._sunRayRotation);
        
        for (let i = 0; i < numBeams; i++) {
            const angle = (i / numBeams) * Math.PI * 2;
            
            // Subtle individual beam animation
            const beamPhase = Math.sin(this._sunGlowPhase * 0.7 + i * 0.8) * 0.08;
            const currentBeamLength = beamLength * (1 + beamPhase);
            const beamOpacity = 0.06 + beamPhase * 0.02;
            
            this._ctx.save();
            this._ctx.rotate(angle);
            
            // Create soft atmospheric beam gradient
            const beamGrad = this._ctx.createLinearGradient(size * 1.3, 0, size * 1.3 + currentBeamLength, 0);
            beamGrad.addColorStop(0, `rgba(255, 248, 230, ${beamOpacity * 1.2})`);
            beamGrad.addColorStop(0.3, `rgba(255, 243, 215, ${beamOpacity * 0.8})`);
            beamGrad.addColorStop(0.6, `rgba(255, 238, 200, ${beamOpacity * 0.4})`);
            beamGrad.addColorStop(1, 'rgba(255, 235, 190, 0)');
            
            // Draw wide, soft beam (like crepuscular rays)
            const beamWidth = size * 0.35;
            this._ctx.beginPath();
            this._ctx.moveTo(size * 1.3, -beamWidth * 0.3);
            this._ctx.lineTo(size * 1.3 + currentBeamLength, -beamWidth);
            this._ctx.lineTo(size * 1.3 + currentBeamLength, beamWidth);
            this._ctx.lineTo(size * 1.3, beamWidth * 0.3);
            this._ctx.closePath();
            
            this._ctx.fillStyle = beamGrad;
            this._ctx.fill();
            
            this._ctx.restore();
        }
        
        this._ctx.restore();
    }

    _drawMoonCraters(x, y, size) {
        // Subtle crater marks
        const craters = [
            { dx: -0.3, dy: -0.2, r: 0.15, a: 0.08 },
            { dx: 0.2, dy: 0.3, r: 0.12, a: 0.06 },
            { dx: -0.1, dy: 0.4, r: 0.1, a: 0.05 },
            { dx: 0.35, dy: -0.1, r: 0.08, a: 0.04 },
            { dx: 0.1, dy: -0.35, r: 0.1, a: 0.05 },
        ];
        
        craters.forEach(c => {
            this._ctx.beginPath();
            this._ctx.arc(x + c.dx * size, y + c.dy * size, c.r * size, 0, Math.PI * 2);
            this._ctx.fillStyle = `rgba(180, 175, 160, ${c.a})`;
            this._ctx.fill();
        });
    }

    _drawPhaseShadow(x, y, size, phase, illumination) {
        // Determine shadow side based on phase name (waxing = shadow on left, waning = shadow on right)
        let shadowSide = 'left';
        
        if (phase === 'new_moon') {
            illumination = 0;
        } else if (phase === 'full_moon' || illumination >= 0.99) {
            return; // No shadow needed for full moon
        } else if (phase.includes('waning') || phase === 'last_quarter') {
            shadowSide = 'right';
        }
        // waxing phases and first_quarter keep shadowSide = 'left'
        
        // Create clipping region for the moon circle
        this._ctx.save();
        this._ctx.beginPath();
        this._ctx.arc(x, y, size, 0, Math.PI * 2);
        this._ctx.clip();
        
        // The terminator (shadow edge) is drawn as an ellipse
        // At 50% illumination, terminator is a vertical line through center (ellipse width = 0)
        // At 0% or 100%, terminator ellipse width = full moon width
        // The key insight: the terminator position stays at center, but its "bulge" changes
        
        // Calculate how much the terminator bulges: 0 at quarter, ±size at new/full
        const terminatorBulge = size * Math.cos(illumination * Math.PI);
        
        this._ctx.beginPath();
        
        if (illumination < 0.5) {
            // Less than half lit - draw dark background, then carve out lit crescent
            this._ctx.fillStyle = 'rgba(15, 20, 30, 0.95)';
            this._ctx.fillRect(x - size - 1, y - size - 1, size * 2 + 2, size * 2 + 2);
            
            // The lit crescent: draw arc on lit side + terminator ellipse
            this._ctx.globalCompositeOperation = 'destination-out';
            this._ctx.beginPath();
            
            // Start from top, draw the lit edge (right side for waxing, left for waning)
            if (shadowSide === 'left') {
                // Waxing: lit part is on the right
                this._ctx.arc(x, y, size, -Math.PI/2, Math.PI/2, false); // right semicircle
                this._ctx.ellipse(x, y, Math.abs(terminatorBulge), size, 0, Math.PI/2, -Math.PI/2, terminatorBulge > 0);
            } else {
                // Waning: lit part is on the left
                this._ctx.arc(x, y, size, Math.PI/2, -Math.PI/2, false); // left semicircle
                this._ctx.ellipse(x, y, Math.abs(terminatorBulge), size, 0, -Math.PI/2, Math.PI/2, terminatorBulge > 0);
            }
            this._ctx.closePath();
            this._ctx.fill();
            this._ctx.globalCompositeOperation = 'source-over';
        } else {
            // More than half lit - just draw the shadow crescent
            this._ctx.beginPath();
            
            if (shadowSide === 'left') {
                // Waxing gibbous: shadow on left
                this._ctx.arc(x, y, size, Math.PI/2, -Math.PI/2, false); // left semicircle  
                this._ctx.ellipse(x, y, Math.abs(terminatorBulge), size, 0, -Math.PI/2, Math.PI/2, terminatorBulge < 0);
            } else {
                // Waning gibbous: shadow on right
                this._ctx.arc(x, y, size, -Math.PI/2, Math.PI/2, false); // right semicircle
                this._ctx.ellipse(x, y, Math.abs(terminatorBulge), size, 0, Math.PI/2, -Math.PI/2, terminatorBulge < 0);
            }
            this._ctx.closePath();
            this._ctx.fillStyle = 'rgba(15, 20, 30, 0.95)';
            this._ctx.fill();
        }
        
        this._ctx.restore();
    }

    // ───────────────────────────────────────────────────────────────────────────
    // RENDER
    // ───────────────────────────────────────────────────────────────────────────

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
          .sky-gradient-layer {
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 0; pointer-events: none; transition: background 2s ease;
          }
          .gradient-layer {
              background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40px);
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              z-index: 1; transition: all 0.5s ease;
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
              background: #000; opacity: 0; z-index: 2; pointer-events: none; transition: opacity 2s ease;
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
              z-index: 4; pointer-events: none;
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
          
          /* ENTITY MENU */
          .entity-menu {
              position: absolute;
              background: rgba(30, 30, 30, 0.98);
              border: 1px solid rgba(255, 255, 255, 0.15);
              border-radius: 8px;
              padding: 4px;
              z-index: 1000;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
              backdrop-filter: blur(10px);
              min-width: 150px;
              animation: menuFadeIn 0.15s ease-out;
              pointer-events: auto;
          }
          
          @keyframes menuFadeIn {
              from { opacity: 0; transform: translateY(-5px); }
              to { opacity: 1; transform: translateY(0); }
          }
          
          .entity-menu-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 12px;
              cursor: pointer;
              border-radius: 4px;
              transition: background 0.2s;
              color: #fff;
              font-size: 0.9rem;
              pointer-events: auto;
              user-select: none;
              -webkit-user-select: none;
              -webkit-tap-highlight-color: transparent;
          }
          
          .entity-menu-item:hover {
              background: rgba(255, 255, 255, 0.1);
          }
          
          .entity-menu-item ha-icon {
              --mdc-icon-size: 20px;
              color: #64B5F6;
          }
        </style>
        
        <div class="card">
          <div class="sky-gradient-layer"></div>
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
          <div class="decorations-layer"></div>
          <div class="nav-links-layer"></div>
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
      
      // Cache timestamp for performance
      const now = Date.now();
      
      const wEnt = this._config.weather_entity;
      let wState = this._config.test_weather_state || (wEnt ? this._hass.states[wEnt]?.state : "");
      const { speed, bearing } = this._getWindData();
      const windDirX = (bearing > 180 || bearing < 0) ? 1 : -1;
      let moveSpeed = speed / 15; if (moveSpeed < 0.2) moveSpeed = 0.2; if (moveSpeed > 6) moveSpeed = 6;
      
      const sunEnt = this._config.sun_entity || 'sun.sun';
      const isNight = this._config.test_time_of_day 
          ? this._config.test_time_of_day === 'night'
          : this._hass.states[sunEnt]?.state === 'below_horizon';
      const coverage = this._getCloudCoverage();

      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

      // Update sky gradient layer (CSS-based, behind bg-image)
      this._updateSkyGradient();

      if (isNight) this._drawStars(coverage, now);
      if (isNight) this._drawMoon(coverage);
      if (!isNight) this._drawSun(coverage);
      if (isNight && this._config.shooting_stars !== false) this._handleShootingStars(coverage);
      if (this._config.seasonal_particles !== false) this._drawSeasonalParticles(windDirX, moveSpeed);
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

    _drawStars(coverage, timestamp) {
        const visibility = Math.max(0, 1 - (coverage / 80)); 
        if (visibility <= 0) return;
        this._ctx.fillStyle = "#FFF";
        this._stars.forEach(star => {
            this._ctx.globalAlpha = Math.abs(Math.sin(timestamp * 0.001 * star.speed + star.x)) * star.opacity * visibility;
            this._ctx.beginPath();
            this._ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this._ctx.fill();
        });
        this._ctx.globalAlpha = 1.0;
    }

    // --- WEATHER EFFECTS ---
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
             const newCloud = this._createCloud(false); 
             newCloud.x = dirX > 0 ? -200 : this._canvas.width + 200;
             newCloud.dirX = dirX;
             this._clouds.push(newCloud);
        }
        if (this._clouds.length > target) this._clouds.pop();
        
        // Update and draw clouds
        for (let i = this._clouds.length - 1; i >= 0; i--) {
            const cloud = this._clouds[i];
            cloud.x += baseSpeed * 0.3 * dirX;
            
            // Remove clouds that have exited the screen
            if (cloud.x > this._canvas.width + 200 || cloud.x < -200) {
                this._clouds.splice(i, 1);
                continue;
            }
            
            this._ctx.save();
            this._ctx.translate(cloud.x, cloud.y);
            this._ctx.scale(cloud.scale, cloud.scale);
            cloud.puffs.forEach(puff => {
                const gradient = this._ctx.createRadialGradient(puff.xOffset, puff.yOffset, 0, puff.xOffset, puff.yOffset, puff.radius);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${puff.opacity * 0.8})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this._ctx.fillStyle = gradient;
                this._ctx.beginPath();
                this._ctx.arc(puff.xOffset, puff.yOffset, puff.radius, 0, Math.PI * 2);
                this._ctx.fill();
            });
            this._ctx.restore();
        }
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
      const canvasHeight = this._canvas.height;
      const canvasWidth = this._canvas.width;
      
      for (let i = 0; i < this._particles.length; i++) {
          const p = this._particles[i];
          this._ctx.moveTo(p.x, p.y); this._ctx.lineTo(p.x + angleX, p.y + p.length);
          p.y += p.speed; p.x += angleX;
      }
      this._ctx.stroke();
      
      // Filter out off-screen particles
      this._particles = this._particles.filter(p => 
          p.y <= canvasHeight && p.x <= canvasWidth + 50 && p.x >= -50
      );
    }

    _drawSnow(windDirX, windSpeed) {
      if (this._particles.length < 100) this._particles.push({ x: Math.random() * this._canvas.width, y: -10, speed: 1 + Math.random(), radius: 1.5 + Math.random() });
      this._ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; this._ctx.beginPath();
      const canvasHeight = this._canvas.height;
      const canvasWidth = this._canvas.width;
      
      for (let i = 0; i < this._particles.length; i++) {
          const p = this._particles[i];
          this._ctx.moveTo(p.x, p.y); this._ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          p.y += p.speed; p.x += (Math.sin(p.y * 0.03) * 0.5) + (windDirX * windSpeed * 0.5);
      }
      this._ctx.fill();
      
      // Filter out off-screen particles
      this._particles = this._particles.filter(p => 
          p.y <= canvasHeight && p.x <= canvasWidth + 50 && p.x >= -50
      );
    }

    // --- SHOOTING STARS ---
    _handleShootingStars(cloudCoverage) {
        // Don't show shooting stars when too cloudy
        if (cloudCoverage > 70) return;
        
        const frequency = this._config.shooting_star_frequency ?? 0.002;
        
        // Randomly spawn shooting stars
        this._shootingStarTimer++;
        if (this._shootingStarTimer > 60 && Math.random() < frequency) {
            this._spawnShootingStar();
            this._shootingStarTimer = 0;
        }
        
        // Draw and update shooting stars
        for (let i = this._shootingStars.length - 1; i >= 0; i--) {
            const star = this._shootingStars[i];
            this._drawShootingStar(star);
            
            // Update position
            star.x += star.speedX;
            star.y += star.speedY;
            star.life--;
            star.trail.unshift({ x: star.x, y: star.y });
            if (star.trail.length > star.trailLength) star.trail.pop();
            
            // Remove dead stars
            if (star.life <= 0 || star.x > this._canvas.width + 50 || star.y > this._canvas.height + 50) {
                this._shootingStars.splice(i, 1);
            }
        }
    }
    
    _spawnShootingStar() {
        // Start from random position in upper portion of sky
        const startX = Math.random() * this._canvas.width * 0.8;
        const startY = Math.random() * this._canvas.height * 0.3;
        
        // Random angle (generally downward diagonal)
        const angle = (Math.PI / 6) + Math.random() * (Math.PI / 4); // 30-75 degrees
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
        // Draw the trail with fading effect
        if (star.trail.length > 1) {
            this._ctx.beginPath();
            this._ctx.moveTo(star.x, star.y);
            
            for (let i = 0; i < star.trail.length; i++) {
                const point = star.trail[i];
                const alpha = (1 - i / star.trail.length) * star.brightness * 0.6;
                
                this._ctx.lineTo(point.x, point.y);
            }
            
            // Create gradient for trail
            const gradient = this._ctx.createLinearGradient(
                star.x, star.y,
                star.trail[star.trail.length - 1]?.x || star.x,
                star.trail[star.trail.length - 1]?.y || star.y
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${star.brightness})`);
            gradient.addColorStop(0.3, `rgba(200, 220, 255, ${star.brightness * 0.6})`);
            gradient.addColorStop(1, 'rgba(150, 180, 255, 0)');
            
            this._ctx.strokeStyle = gradient;
            this._ctx.lineWidth = star.size;
            this._ctx.lineCap = 'round';
            this._ctx.stroke();
        }
        
        // Draw the bright head
        this._ctx.beginPath();
        this._ctx.arc(star.x, star.y, star.size * 1.2, 0, Math.PI * 2);
        this._ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        this._ctx.fill();
        
        // Glow effect
        const glow = this._ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 4);
        glow.addColorStop(0, `rgba(200, 220, 255, ${star.brightness * 0.5})`);
        glow.addColorStop(1, 'rgba(200, 220, 255, 0)');
        this._ctx.fillStyle = glow;
        this._ctx.beginPath();
        this._ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
        this._ctx.fill();
    }

    // --- SEASONAL PARTICLES ---
    _drawSeasonalParticles(windDirX, windSpeed) {
        const seasonEnt = this._config.season_entity;
        const season = this._config.test_season_state || this._hass.states[seasonEnt]?.state?.toLowerCase() || 'summer';
        
        // Only show particles in autumn and spring
        if (season !== 'autumn' && season !== 'fall' && season !== 'spring') {
            this._seasonalParticles = [];
            return;
        }
        
        const density = this._config.seasonal_particle_density ?? 1.0;
        const maxParticles = Math.floor(25 * density);
        
        // Spawn new particles
        if (this._seasonalParticles.length < maxParticles && Math.random() < 0.1) {
            this._spawnSeasonalParticle(season, windDirX);
        }
        
        // Draw and update particles
        for (let i = this._seasonalParticles.length - 1; i >= 0; i--) {
            const p = this._seasonalParticles[i];
            this._drawSeasonalParticle(p, season);
            
            // Update position with swaying motion
            p.x += (windDirX * windSpeed * 0.8) + Math.sin(p.swayOffset + Date.now() * 0.002) * p.swayAmount;
            p.y += p.fallSpeed;
            p.rotation += p.rotationSpeed;
            p.swayOffset += 0.02;
            
            // Remove particles that are off screen
            if (p.y > this._canvas.height + 20 || p.x < -50 || p.x > this._canvas.width + 50) {
                this._seasonalParticles.splice(i, 1);
            }
        }
    }
    
    _spawnSeasonalParticle(season, windDirX) {
        const isAutumn = season === 'autumn' || season === 'fall';
        
        // Spawn from top or side depending on wind
        const fromSide = Math.random() < 0.3;
        const startX = fromSide 
            ? (windDirX > 0 ? -20 : this._canvas.width + 20)
            : Math.random() * this._canvas.width;
        const startY = fromSide 
            ? Math.random() * this._canvas.height * 0.5
            : -20;
        
        if (isAutumn) {
            // Autumn leaf colors
            const colors = [
                { fill: '#D2691E', stroke: '#8B4513' }, // Brown/Sienna
                { fill: '#FF8C00', stroke: '#CC7000' }, // Dark Orange
                { fill: '#CD853F', stroke: '#8B6914' }, // Peru
                { fill: '#B22222', stroke: '#8B0000' }, // Firebrick/Red
                { fill: '#DAA520', stroke: '#B8860B' }, // Goldenrod
                { fill: '#FF6347', stroke: '#CD4F39' }, // Tomato red
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this._seasonalParticles.push({
                type: 'leaf',
                x: startX,
                y: startY,
                size: 6 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.08,
                fallSpeed: 0.8 + Math.random() * 1.2,
                swayAmount: 1 + Math.random() * 2,
                swayOffset: Math.random() * Math.PI * 2,
                color: color,
                leafShape: Math.floor(Math.random() * 3) // 0=maple, 1=oak, 2=simple
            });
        } else {
            // Spring petal colors
            const colors = [
                { fill: 'rgba(255, 182, 193, 0.9)', stroke: 'rgba(255, 105, 180, 0.6)' }, // Pink
                { fill: 'rgba(255, 255, 255, 0.9)', stroke: 'rgba(255, 192, 203, 0.6)' }, // White/Pink
                { fill: 'rgba(255, 218, 233, 0.9)', stroke: 'rgba(255, 160, 200, 0.6)' }, // Light pink
                { fill: 'rgba(230, 230, 250, 0.9)', stroke: 'rgba(200, 180, 230, 0.6)' }, // Lavender
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this._seasonalParticles.push({
                type: 'petal',
                x: startX,
                y: startY,
                size: 4 + Math.random() * 4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                fallSpeed: 0.5 + Math.random() * 0.8,
                swayAmount: 1.5 + Math.random() * 2,
                swayOffset: Math.random() * Math.PI * 2,
                color: color
            });
        }
    }
    
    _drawSeasonalParticle(p, season) {
        this._ctx.save();
        this._ctx.translate(p.x, p.y);
        this._ctx.rotate(p.rotation);
        
        if (p.type === 'leaf') {
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
            // Maple-like leaf (simplified)
            this._ctx.moveTo(0, -size);
            this._ctx.quadraticCurveTo(size * 0.5, -size * 0.5, size, -size * 0.3);
            this._ctx.quadraticCurveTo(size * 0.6, 0, size * 0.8, size * 0.5);
            this._ctx.quadraticCurveTo(size * 0.3, size * 0.3, 0, size);
            this._ctx.quadraticCurveTo(-size * 0.3, size * 0.3, -size * 0.8, size * 0.5);
            this._ctx.quadraticCurveTo(-size * 0.6, 0, -size, -size * 0.3);
            this._ctx.quadraticCurveTo(-size * 0.5, -size * 0.5, 0, -size);
        } else if (p.leafShape === 1) {
            // Oak-like leaf (rounded lobes)
            this._ctx.moveTo(0, -size);
            this._ctx.bezierCurveTo(size * 0.8, -size * 0.6, size * 0.6, size * 0.2, size * 0.3, size);
            this._ctx.lineTo(0, size * 0.7);
            this._ctx.lineTo(-size * 0.3, size);
            this._ctx.bezierCurveTo(-size * 0.6, size * 0.2, -size * 0.8, -size * 0.6, 0, -size);
        } else {
            // Simple oval leaf
            this._ctx.ellipse(0, 0, size * 0.5, size, 0, 0, Math.PI * 2);
        }
        
        this._ctx.closePath();
        this._ctx.fill();
        this._ctx.stroke();
        
        // Draw vein
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
        
        // Draw petal shape (teardrop/oval)
        this._ctx.beginPath();
        this._ctx.moveTo(0, -size);
        this._ctx.bezierCurveTo(size * 0.8, -size * 0.5, size * 0.8, size * 0.5, 0, size);
        this._ctx.bezierCurveTo(-size * 0.8, size * 0.5, -size * 0.8, -size * 0.5, 0, -size);
        this._ctx.closePath();
        this._ctx.fill();
        this._ctx.stroke();
    }

    // --- LIGHTNING ---
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