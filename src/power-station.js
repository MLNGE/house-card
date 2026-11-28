import { POWER_STATION_SUFFIXES } from './constants.js';

const POWER_STATION_SORTED_SUFFIXES = POWER_STATION_SUFFIXES
    .map((item) => item.suffix)
    .sort((a, b) => b.length - a.length);

export const withPowerStation = (Base) => class extends Base {
    _getPowerStationSelection() {
        const selectedDeviceId = this._config.power_station_device_id || null;
        const legacyEntityId = this._config.power_station_entity || null;
        const legacyDeviceId = legacyEntityId && this._hass?.entities?.[legacyEntityId]?.device_id
            ? this._hass.entities[legacyEntityId].device_id
            : null;

        return {
            deviceId: selectedDeviceId || legacyDeviceId,
            legacyEntityId,
            legacyPrefix: legacyEntityId ? this._resolvePowerStationPrefix(legacyEntityId) : null
        };
    }

    _getPowerStationEntityId(prefix, suffix, domain) {
        if (!prefix) return null;
        return `${domain || 'sensor'}.${prefix}_${suffix}`;
    }

    _getPowerStationState(entityId) {
        if (!entityId || !this._hass?.states) return null;
        return this._hass.states[entityId] || null;
    }

    _resolvePowerStationPrefix(entityId) {
        if (!entityId) return null;
        const objectId = entityId.includes('.') ? entityId.split('.')[1] : entityId;
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

        const entityIds = Object.keys(entityRegistry)
            .filter((entityId) => entityRegistry[entityId]?.device_id === deviceId);
        this._powerStationEntityCache = { deviceId, entityRegistry, entityIds, entityMap: null };
        return entityIds;
    }

    _findPowerStationEntityId(entityIds, suffix, domain) {
        const suffixToken = `_${suffix}`;
        return entityIds.find((entityId) => {
            const [entityDomain, objectId] = entityId.split('.');
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
                const entities = {};
                for (const spec of POWER_STATION_SUFFIXES) {
                    entities[spec.suffix] = this._findPowerStationEntityId(cache.entityIds, spec.suffix, spec.domain);
                }
                cache.entityMap = entities;
            }

            return {
                mode: 'device',
                deviceId: selection.deviceId,
                title: this._getPowerStationDeviceName(selection.deviceId) || 'Power Station',
                entities: cache.entityMap
            };
        }

        const legacyPrefix = selection.legacyPrefix;
        const entities = {};
        for (const spec of POWER_STATION_SUFFIXES) {
            entities[spec.suffix] = this._getPowerStationEntityId(legacyPrefix, spec.suffix, spec.domain);
        }

        return {
            mode: 'legacy',
            deviceId: null,
            title: legacyPrefix ? legacyPrefix.replace(/_/g, '-').toUpperCase() : 'Power Station',
            entities
        };
    }

    _formatPowerStationValue(state, fallback = '—') {
        if (!state) return fallback;
        const raw = state.state;
        if (raw === undefined || raw === null || raw === 'unknown' || raw === 'unavailable') return fallback;
        const numeric = Number(raw);
        if (Number.isFinite(numeric)) {
            const unit = state.attributes?.unit_of_measurement || '';
            if (unit === '%') return `${Math.round(numeric)}%`;
            if (unit === 'W' || unit === 'kW' || unit === 'V' || unit === 'A' || unit === 'Hz') {
                return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}${unit}`;
            }
            return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}${unit ? ` ${unit}` : ''}`.trim();
        }
        return `${raw}${state.attributes?.unit_of_measurement ? ` ${state.attributes.unit_of_measurement}` : ''}`.trim();
    }

    _formatPowerStationRemainingValue(state, fallback = '—') {
        if (!state) return fallback;
        const raw = state.state;
        if (raw === undefined || raw === null || raw === 'unknown' || raw === 'unavailable') return fallback;

        const rawText = String(raw).trim().replace(/,/g, '').toLowerCase();
        const numericMatch = rawText.match(/-?\d*\.?\d+/);
        const numeric = numericMatch ? Number(numericMatch[0]) : Number(raw);
        if (!Number.isFinite(numeric)) return this._formatPowerStationValue(state, fallback);

        const unit = state.attributes?.unit_of_measurement || '';
        const normalizedUnit = String(unit).toLowerCase();
        const rawHasHourUnit = /\b(h|hr|hrs|hour|hours)\b/.test(rawText) || normalizedUnit === 'h' || normalizedUnit === 'hr' || normalizedUnit === 'hrs' || normalizedUnit === 'hour' || normalizedUnit === 'hours';

        if (rawHasHourUnit) {
            return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)} hr`;
        }

        if (numeric > 99) {
            const hours = numeric / 60;
            const hourLabel = hours === 1 ? 'hr' : 'hrs';
            return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)} ${hourLabel}`;
        }

        return `${Math.round(numeric)} min`;
    }

    _formatPowerStationSummaryValue(value, fallback = '—') {
        if (!value || value === fallback) return fallback;
        const match = String(value).match(/-?\d*\.?\d+/);
        return match ? match[0] : value;
    }

    _getPowerStationTitle(data, fallback = 'Power Station') {
        const inputState = this._getPowerStationState(data?.entities?.total_input_power)
            || this._getPowerStationState(data?.entities?.ac_input_power)
            || this._getPowerStationState(data?.entities?.dc_input_power);
        const outputState = this._getPowerStationState(data?.entities?.total_output_power)
            || this._getPowerStationState(data?.entities?.ac_output_power)
            || this._getPowerStationState(data?.entities?.dc_car_output_power);

        const inputValue = Number(String(inputState?.state || '').replace(/[^\d.-]/g, ''));
        const outputValue = Number(String(outputState?.state || '').replace(/[^\d.-]/g, ''));

        if (Number.isFinite(inputValue) && Number.isFinite(outputValue)) {
            if (inputValue > outputValue) return 'Charging';
            if (outputValue > inputValue) return 'Discharging';
            if (inputValue === 0 && outputValue === 0) return 'Idle';
            if (inputValue === outputValue) return 'Idle';
        }

        const entityIds = new Set(
            [...Object.values(data?.entities || {}).filter(Boolean), ...(data?.deviceId ? this._getPowerStationDeviceEntityIds(data.deviceId) : [])]
        );

        for (const entityId of entityIds) {
            const state = this._getPowerStationState(entityId);
            if (!state) continue;

            const entityName = String(entityId).split('.').slice(1).join('.').toLowerCase();
            const stateValue = String(state.state || '').toLowerCase();

            if (entityName.includes('discharging') || stateValue === 'discharging') return 'Discharging';
            if (entityName.includes('charging') || stateValue === 'charging') return 'Charging';
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
            hasData: stats.some((item) => item.state && item.state.state !== 'unknown' && item.state.state !== 'unavailable' && item.state.state !== 'offline')
        };
    }

    _updatePowerStationTile() {
        const container = this.shadowRoot.querySelector('.power-stations-layer');
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
        ].join('|');

        const posHash = [
            this._config.power_station_x,
            this._config.power_station_y,
            this._config.power_station_width,
            this._config.power_station_height
        ].join('|');

        const x = this._config.power_station_x ?? 26;
        const y = this._config.power_station_y ?? 84;
        const width = this._config.power_station_width ?? 34;
        const height = this._config.power_station_height ?? 18;

        // Position-only change: update styles in-place without re-rendering
        if (this._lastPowerStationData === hash && container.querySelector('.power-station-tile')) {
            if (this._lastPowerStationPos !== posHash) {
                this._lastPowerStationPos = posHash;
                const existingTile = container.querySelector('.power-station-tile');
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
        const powerTitle = this._getPowerStationTitle(data, data.title || 'Power Station');

        container.innerHTML = `
          <div class="power-station-tile" data-entity="${entityId}" data-device-id="${data.deviceId || ''}" style="top: ${y}%; left: ${x}%; width: ${width}%; height: ${height}%">
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
            const tile = e.target.closest('.power-station-tile');
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
                const deviceId = tile.getAttribute('data-device-id') || null;
                const entityId = tile.getAttribute('data-entity') || null;
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
            const releasedOnTile = e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom;
            const shouldOpenDetails = !longPressActive && !pressMoved && releasedOnTile;
            clearPress();
            if (!shouldOpenDetails) return;

            e.stopPropagation();
            const deviceId = tile.getAttribute('data-device-id') || null;
            const entityId = tile.getAttribute('data-entity') || null;
            this._openPowerStationPopup(deviceId, entityId);
        };

        const handleCancel = (e) => {
            if (e.pointerId === activePointerId) clearPress();
        };

        container.addEventListener('pointerdown', handleStart);
        container.addEventListener('pointermove', handleMove);
        container.addEventListener('pointerup', handleEnd);
        container.addEventListener('pointercancel', handleCancel);
        container.addEventListener('lostpointercapture', handleCancel);
    }

    _showPowerStationMenu(tile, deviceId, legacyEntityId) {
        const existingMenu = document.querySelector('.entity-menu');
        if (existingMenu) existingMenu.remove();
        this._ensureMenuStyles();

        const data = this._buildPowerStationStats();

        const TILE_SUFFIXES = ['battery', 'total_input_power', 'total_output_power', 'remaining_time', 'temperature'];
        const SWITCH_SUFFIXES = ['ac_output', 'usb_output'];

        const ICONS = {
            battery: 'mdi:battery',
            total_input_power: 'mdi:transmission-tower-import',
            total_output_power: 'mdi:transmission-tower-export',
            remaining_time: 'mdi:timer-outline',
            temperature: 'mdi:thermometer',
        };

        const availableStats = data.stats.filter(item =>
            TILE_SUFFIXES.includes(item.suffix) && item.entityId && this._getPowerStationState(item.entityId));
        const items = availableStats.map(item => {
                const state = this._getPowerStationState(item.entityId);
                const val = this._formatPowerStationValue(state);
                return { id: item.entityId, label: `${item.label}: ${val}`, icon: ICONS[item.suffix] || 'mdi:flash', action: 'more-info' };
            });

        const switchStats = data.stats.filter(item =>
            SWITCH_SUFFIXES.includes(item.suffix) && item.entityId);

        // Prefer explicitly configured Oukitel entry ID, fall back to auto-resolved one
        const anyEntityId = availableStats[0]?.entityId;
        const autoEntryId = anyEntityId ? this._hass?.entities?.[anyEntityId]?.config_entry_id : null;
        const configEntryId = this._config.oukitel_integration_id || autoEntryId;

        if (items.length === 0 && switchStats.length === 0 && !configEntryId) return;

        const switchRows = switchStats.map(item => {
            const isOn = this._getPowerStationState(item.entityId)?.state === 'on';
            return `<div class="entity-menu-item entity-menu-item--switch" data-action="toggle" data-entity="${item.entityId}">
                <span class="switch-left"><ha-icon icon="${item.icon}"></ha-icon><span>${item.label}</span></span>
                <span class="switch-badge switch-badge--${isOn ? 'on' : 'off'}">${isOn ? 'ON' : 'OFF'}</span>
               </div>`;
        }).join('');

        const reloadRow = configEntryId
            ? `<div class="entity-menu-item entity-menu-item--reload" data-action="reload">
                <ha-icon icon="mdi:refresh"></ha-icon>
                <span>Reload device</span>
               </div>`
            : '';

        const menu = document.createElement('div');
        menu.className = 'entity-menu';
        menu.innerHTML = items.map(ent => `
            <div class="entity-menu-item" data-entity="${ent.id}">
                <ha-icon icon="${ent.icon}"></ha-icon>
                <span>${ent.label}</span>
            </div>`).join('')
            + (switchRows ? `<div class="entity-menu-separator"></div>${switchRows}` : '')
            + (reloadRow ? `<div class="entity-menu-separator"></div>${reloadRow}` : '');

        const rect = tile.getBoundingClientRect();
        document.body.appendChild(menu);
        const menuH = menu.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom;
        const top = spaceBelow >= menuH ? rect.bottom : Math.max(8, rect.top - menuH);
        menu.style.top  = `${top}px`;
        menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - menu.offsetWidth - 8))}px`;

        const handleMenuClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const item = e.target.closest('.entity-menu-item');
            if (!item) return;
            if (item.dataset.action === 'reload' && configEntryId) {
                setTimeout(() => {
                    this._hass.callService('homeassistant', 'reload_config_entry', { entry_id: configEntryId });
                    menu.remove();
                    cleanup();
                }, 50);
            } else if (item.dataset.action === 'toggle' && item.dataset.entity) {
                this._hass.callService('switch', 'toggle', {}, { entity_id: item.dataset.entity });
                menu.remove();
                cleanup();
            } else if (item.dataset.entity) {
                setTimeout(() => { this._fireMoreInfo(item.getAttribute('data-entity')); menu.remove(); cleanup(); }, 50);
            }
        };
        const closeMenu = (e) => { if (!e.target.closest('.entity-menu')) { menu.remove(); cleanup(); } };
        const cleanup = () => {
            document.removeEventListener('mousedown', closeMenu);
            document.removeEventListener('touchstart', closeMenu);
            menu.removeEventListener('mousedown', handleMenuClick);
            menu.removeEventListener('touchstart', handleMenuClick);
        };
        menu.addEventListener('mousedown', handleMenuClick);
        menu.addEventListener('touchstart', handleMenuClick, { passive: false });
        setTimeout(() => {
            document.addEventListener('mousedown', closeMenu);
            document.addEventListener('touchstart', closeMenu, { passive: true });
        }, 150);
    }

    _openPowerStationPopup(deviceId, legacyEntityId = null) {
        const data = this._buildPowerStationStats();
        const infoEntities = data.stats
            .filter((item) => item.entityId && this._getPowerStationState(item.entityId))
            .map((item) => ({ entity: item.entityId }));

        const cards = [
            {
                type: 'entities',
                title: data.title,
                show_header_toggle: false,
                entities: infoEntities
            }
        ];

        const graphEntities = data.stats
            .filter((item) => ['battery', 'total_input_power', 'total_output_power', 'temperature'].includes(item.suffix) && item.entityId && this._getPowerStationState(item.entityId))
            .map((item) => ({ entity: item.entityId }));

        if (graphEntities.length > 0) {
            cards.push({
                type: 'history-graph',
                title: 'Recent Trends',
                entities: graphEntities,
                hours_to_show: 24
            });
        }

        if (!data.hasData) {
            cards.unshift({
                type: 'markdown',
                content: `### ${data.title}\n\nNo available power station entities were found for the selected device.`
            });
        }

        if (this._hass?.services?.browser_mod?.popup) {
            this._hass.callService('browser_mod', 'popup', {
                title: data.title,
                size: 'wide',
                content: {
                    type: 'vertical-stack',
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
