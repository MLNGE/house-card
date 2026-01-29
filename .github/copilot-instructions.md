# Copilot Instructions for Fork_U-House_Card

KEEP IN MINID THE VERSIONING WHEN CHANGING CODE. WATCH OUT ONLY ONE INCREMENT PER COMMIT.

Also think about updating the readme and changelog if necessary.

This project is a custom Lovelace card for Home Assistant, implemented as a vanilla JavaScript Web Component (`HTMLElement`). It visualizes a house with overlaid sensor badges and weather animations.

## Core Architecture

### Component Structure
- **Class:** `ForkUHouseCard` extends `HTMLElement`.
- **Shadow DOM:** Used for style isolation. Contains a container `.card`, a background image, a `<canvas>` for animations, and `.badge` elements.
- **Lifecycle:**
  - `setConfig(config)`: Validates and stores user configuration.
  - `set hass(hass)`: Main entry point for HA state updates. Reactively updates the UI when entities change.
  - `connectedCallback()`: Sets up `ResizeObserver` for the canvas.
  - `disconnectedCallback()`: Cleans up observers and animation loops.

### Rendering Strategy
1. **DOM**: Logic updates DOM elements (badges) only when their specific entity values change to minimize layout shifts.
2. **Canvas**: RequestAnimationFrame loop handles high-frequency weather animations (rain, snow, fog, lightning).
3. **Background**: Calculated dynamically in `_calculateImage()` based on season, sun position (day/night), and weather conditions.

## Key Files
- `house-card.js`: The entire codebase. Contains the class definition, canvas logic, and CSS styles (in-line).
- `config.md`: Documentation for YAML configuration.

## Development Patterns

### State Management
- Store the `hass` object locally (`this._hass`).
- Do NOT perform expensive operations in `set hass` unless necessary. Check if relevant entities have changed before re-rendering complex parts.
- Use `_t(key)` for localized strings (defined in `TRANSLATIONS` const).

### Canvas Animations
- **Context:** Stored in `this._ctx`.
- **State:** Animation objects (particles, clouds) are arrays (`this._particles`, `this._clouds`).
- **Loop:** `_draw()` function called via `requestAnimationFrame`. Ensure scaling factors are applied for high-DPI screens.

### Configuration
- Validation: Validate `config.rooms` in `setConfig`. Throw descriptive errors.
- Defaults: Use `static getStubConfig()` to provide a default configuration for the card picker in Lovelace.

## Home Assistant Integration
- **Entities:** Access via `this._hass.states['entity_id']`. Always handle `undefined` states safely (e.g., using `?.`).
- **Events:** To open valid HA "More Info" dialogs, fire the `hass-more-info` event on the card element.
- **Layout:** Support `getLayoutOptions()` to integrate nicely with HA's "Sections" view strategy.

## Conventions
- **Private Methods:** Prefix internal methods and properties with `_` (e.g., `_resizeCanvas`, `_render`).
- **Styles:** Defined in a `const` or method injected into Shadow Root. Use CSS variables for theming where possible.
- **Error Handling:** Use `try-catch` blocks for critical parsing logic and expose errors visually if `setConfig` fails.
