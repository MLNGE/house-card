const SCHEMA = [
    { name: "title", selector: { text: {} } },
    { name: "language", selector: { select: { options: ["en"] } } },
    { name: "image_path", default: "/local/community/house-card/images/", selector: { text: {} } },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "scale", default: 1.0, selector: { number: { min: 0.1, max: 3, step: 0.1, mode: "slider" } } },
            { name: "background_zoom", default: 1.0, selector: { number: { min: 0.1, max: 3, step: 0.1, mode: "slider" } } },
            { name: "badge_opacity", default: 0.75, selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } } },
            { name: "image_x_offset", default: 0, selector: { number: { min: -1000, max: 1000, step: 1, mode: "box" } } },
            { name: "image_y_offset", default: 0, selector: { number: { min: -1000, max: 1000, step: 1, mode: "box" } } }
        ]
    },
    { name: "weather_entity", selector: { entity: { domain: "weather" } } },
    { name: "season_entity", selector: { entity: { domain: "sensor" } } },
    { name: "sun_entity", selector: { entity: { domain: "sun" } } },
    { name: "sun_elevation_entity", selector: { entity: { domain: "sensor" } } },
    { name: "moon_entity", selector: { entity: { domain: "sensor" } } },
    { name: "aurora_entity", selector: { entity: { domain: "binary_sensor" } } },
    { name: "cloud_coverage_entity", selector: { entity: { domain: "sensor" } } },
    { name: "party_mode_entity", selector: { entity: { domain: "input_boolean" } } },
    {
        type: "grid",
        name: "",
        schema: [
            { name: "moon_glow", default: true, selector: { boolean: {} } },
            { name: "sun_glow", default: true, selector: { boolean: {} } },
            { name: "sun_rays", default: true, selector: { boolean: {} } },
            { name: "sky_gradient", default: true, selector: { boolean: {} } },
            { name: "shooting_stars", default: true, selector: { boolean: {} } },
            { name: "seasonal_particles", default: true, selector: { boolean: {} } }
        ]
    },
    { name: "rooms", selector: { object: {} } },
    { name: "window_lights", selector: { object: {} } },
    { name: "nav_links", selector: { object: {} } },
    { name: "decorations", selector: { object: {} } }
];

class HouseCardEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._config = {};
        this._hass = null;
    }

    setConfig(config) {
        this._config = config;
        this.render();
    }

    set hass(hass) {
        this._hass = hass;
        if (this._form) {
            this._form.hass = hass;
        }
    }

    get _schema() {
        return SCHEMA;
    }

    render() {
        if (!this._form) {
            this._form = document.createElement("ha-form");
            this._form.schema = this._schema;
            
            this._form.computeLabel = (s) => {
                const labels = {
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
                    sun_elevation_entity: "Sun Elevation Sensor (Optional)",
                    moon_entity: "Moon Phase Sensor (Optional)",
                    aurora_entity: "Aurora Binary Sensor (Optional)",
                    cloud_coverage_entity: "Cloud Coverage Sensor (Optional)",
                    party_mode_entity: "Party/Gaming Mode Boolean (Optional)",
                    moon_glow: "Moon Glow",
                    sun_glow: "Sun Glow",
                    sun_rays: "Sun Rays",
                    sky_gradient: "Sky Gradients",
                    shooting_stars: "Shooting Stars",
                    seasonal_particles: "Seasonal Particles",
                    rooms: "Rooms (YAML)",
                    window_lights: "Window Lights (YAML)",
                    nav_links: "Navigation Links (YAML)",
                    decorations: "Decorations (YAML)"
                };
                return labels[s.name] || s.name;
            };

            this._form.addEventListener("value-changed", (ev) => {
                this._config = ev.detail.value;
                this.dispatchEvent(new CustomEvent("config-changed", {
                    detail: { config: this._config },
                    bubbles: true,
                    composed: true
                }));
            });
            this.shadowRoot.appendChild(this._form);
        }
        this._form.data = this._config;
        if (this._hass) this._form.hass = this._hass;
    }
}

customElements.define("house-card-editor", HouseCardEditor);