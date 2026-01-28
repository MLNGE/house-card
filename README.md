# 🏠 House Card

A custom Lovelace card for Home Assistant that displays an animated isometric house with dynamic weather effects, sensor badges, interactive window lights, and navigation hotspots.

## Features

- 🌦️ **Weather Animations** - Rain, snow, fog, lightning, clouds, and stars
- 🌡️ **Sensor Badges** - Display temperature, humidity, CO2, power consumption
- 💡 **Window Lights** - Link light entities to windows (glow when on, dark when off)
- 🔗 **Navigation Links** - Clickable hotspots to navigate to other HA views
- 🎮 **Gaming/Party Mode** - Ambient lighting effects
- 🎄 **Seasonal Images** - Automatic day/night and seasonal background changes
- 🎅 **Christmas Mode** - Special images from Dec 14 - Jan 14

## Installation

### HACS (Recommended)
1. Add this repository to HACS as a custom repository
2. Install "House Card"
3. Add the resource to your Lovelace configuration

### Manual
1. Copy `house-card.js` to `/config/www/community/house-card/`
2. Add the resource in your Lovelace configuration

## Configuration

```yaml
type: custom:house-card
title: "My Residence"
language: "en"        # Options: 'en', 'pl'

# --- Global Visual Adjustments ---
scale: 1.0            # Scale factor for badges (0.8 = smaller, 1.2 = larger)
image_y_offset: 0     # Vertical shift for background image in pixels
background_zoom: 1.0  # Zoom factor for background image (e.g., 0.8 = zoom out, 1.2 = zoom in)

# --- Image Path ---
image_path: "/local/community/house-card/images/"

# --- Image Mapping Logic ---
# Checks: Season → Time of Day → Weather
# Example: If true, looks for "winter_fog_day.png"
img_winter_day_fog: true    
img_winter_night_fog: false 
# Supported: spring, summer, autumn, winter
# Weather: fog, rainy, snowy, lightning

# --- Core Entities ---
weather_entity: weather.forecast_home
season_entity: sensor.season
sun_entity: sun.sun
cloud_coverage_entity: sensor.openweathermap_cloud_coverage
party_mode_entity: input_boolean.gaming_mode

# --- Wind Entities (Animation Speed/Direction) ---
wind_speed_entity: sensor.wind_speed
wind_direction_entity: sensor.wind_bearing

# --- Rooms / Badges ---
rooms:
  - name: "Living Room"
    entity: sensor.living_room_temperature
    humidity_entity: sensor.living_room_humidity  # Optional
    co2_entity: sensor.living_room_co2            # Optional
    x: 50        # Horizontal position (%)
    y: 70        # Vertical position (%)

  - name: "Power"
    entity: sensor.power_consumption
    unit: "W"        # Shows spark icon for power
    decimals: 0
    x: 80
    y: 80

# --- Window Lights ---
# Link light entities to window areas on your house image
window_lights:
  - entity: light.living_room_lamp
    x: 25            # Position (%)
    y: 60
    width: 8         # Glow area size (%)
    height: 10
    color: "#FFA64D" # Warm orange (optional)

# --- Navigation Links ---
# Clickable hotspots that navigate to other views
nav_links:
  - path: /lovelace/garage
    x: 80
    y: 70
    width: 15
    height: 20
    icon: "mdi:garage"   # Optional
    label: "Garage"      # Optional

# --- Debug Modes ---
# window_lights_debug: true   # Red outlines for window positioning
# nav_links_debug: true       # Green outlines for nav link positioning
# test_weather_state: fog     # Force weather state for testing
```

## Position Reference

All positions use **percentages**:
- `x: 0` = left edge, `x: 100` = right edge
- `y: 0` = top edge, `y: 100` = bottom edge

Use debug modes to help with positioning overlays.

## Required Images

Place images in your configured `image_path`. Naming convention:
```
{season}_{timeofday}.png
{season}_{weather}_{timeofday}.png
winter_xmas_{timeofday}.png
```

Examples:
- `summer_day.png`
- `winter_night.png`
- `autumn_rainy_day.png`
- `winter_xmas_night.png`

## License

MIT
