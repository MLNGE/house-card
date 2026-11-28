import { DEFAULT_IMAGE_PATH } from './constants.js';

const EDITOR_SCHEMA = [
    { name: "title", selector: { text: {} } },
    { name: "language", selector: { select: { options: ["en", "de", "fr", "nl", "es"] } } },
    { name: "image_path", default: DEFAULT_IMAGE_PATH, selector: { text: {} } },
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

const EDITOR_LABELS = {
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

const EDITOR_GROUPS = [
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

const EDITOR_MAPPINGS = [
    { name: "rooms", title: "Rooms" },
    { name: "window_lights", title: "Window Lights" },
    { name: "nav_links", title: "Navigation Links" },
    { name: "decorations", title: "Decorations" }
];

class HouseCardEditor extends HTMLElement {
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
}

customElements.define("house-card-editor", HouseCardEditor);
