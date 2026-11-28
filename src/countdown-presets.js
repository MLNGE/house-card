class HouseCountdownPresets extends HTMLElement {
    setConfig(config) {
        if (!config?.countdown_entity || !config?.switch_entity) {
            throw new Error('house-countdown-presets requires countdown_entity and switch_entity');
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
        this.querySelectorAll('button').forEach((button) => {
            button.addEventListener('click', () => this._setCountdown(Number(button.dataset.seconds)));
        });
    }

    _setCountdown(seconds) {
        if (!this._hass) return;
        const { countdown_entity: countdownEntity, switch_entity: switchEntity } = this._config;
        if (this._hass.states[switchEntity]?.state !== 'on') {
            this._hass.callService('switch', 'turn_on', {}, { entity_id: switchEntity });
        }
        this._hass.callService('number', 'set_value', { value: seconds }, { entity_id: countdownEntity });
    }
}

customElements.define('house-countdown-presets', HouseCountdownPresets);
