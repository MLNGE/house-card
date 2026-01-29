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
title: "My Residence"  # Optional title (visual only)
language: "en"

# --- Global Visual Adjustments ---
scale: 1.0            # Scale factor for badges (0.8 = smaller, 1.2 = larger)
background_zoom: 1.0  # Zoom factor for background image (0.8 = zoom out, 1.2 = zoom in)
image_y_offset: 0     # Vertical shift for background image in pixels (Negative = UP, Positive = DOWN)

# --- Image Path ---
image_path: "/local/community/house-card/images/"

# --- Image Mapping Logic ---
# Logic: Checks Season → Time of Day → Weather
# Example: If true, looks for "winter_fog_day.png". If false/missing, falls back to "winter_day.png".
img_winter_day_fog: true    
img_winter_night_fog: false 
# Repeat for other seasons (summer, autumn, spring) and weather types (rainy, snowy, lightning) if desired.

# Note: Christmas Mode is active Dec 14 - Jan 14.
# Ensure you have 'winter_xmas_day.png' and 'winter_xmas_night.png' in your folder.

# --- Testing ---
# Force a specific weather state to test animations (fog, lightning, snowy, rainy, pouring)
# test_weather_state: fog 

# --- Core Entities (REQUIRED) ---
weather_entity: weather.forecast_home
season_entity: sensor.season
sun_entity: sun.sun
cloud_coverage_entity: sensor.openweathermap_cloud_coverage  # Optional (0-100%)
party_mode_entity: input_boolean.gaming_mode  # Optional: Toggles "Gaming Ambient" light effects

# --- Wind Entities (For Animation Speed/Direction) ---
wind_speed_entity: sensor.wind_speed      # Wind Speed (km/h)
wind_direction_entity: sensor.wind_bearing  # Wind Bearing (degrees)

# --- Rooms / Badges Configuration ---
# Define sensors to display as badges over the house image.
# x: Horizontal position % (0 = left, 100 = right)
# y: Vertical position % (0 = top, 100 = bottom)
# unit: Custom unit string (default: "°"). Set to "W" for Power (Yellow Spark icon).
# decimals: Number of decimal places (default: 1). Set to 0 for integers.
# humidity_entity: Optional second value to display next to main value (e.g. "21° | 45%")
# weight: 1 = Include in calculation, 0 = Exclude
rooms:
  - name: "Living Room"
    entity: sensor.living_room_temperature
    humidity_entity: sensor.living_room_humidity  # Optional: Displays humidity next to temp
    x: 50
    y: 70
    weight: 1

  - name: "Bedroom"
    entity: sensor.bedroom_temperature
    x: 20
    y: 30
    weight: 1

  - name: "Total Power"
    entity: sensor.power_consumption
    unit: "W"        # Shows Yellow Spark icon instead of colored temp dot
    decimals: 0      # Shows "2050 W" instead of "2050.0 W"
    x: 80
    y: 80
    weight: 0

# --- Window Lights Configuration ---
# Link light entities to specific window regions on the house image.
# When the light is ON, the window glows. When OFF, the window appears dark.
# Clicking a window will toggle the light entity.
# color: Glow color when light is on (hex format, default: "#FFA64D" warm orange)
window_lights:
  - entity: light.living_room_lamp
    x: 25          # Position of window center (percentage)
    y: 60
    width: 8       # Size of the glow area
    height: 10
    color: "#FFA64D"  # Warm orange glow (optional)

  - entity: light.bedroom
    x: 70
    y: 45
    width: 6
    height: 8
    color: "#FFFACD"  # Soft warm white

# --- Navigation Links Configuration ---
# Create invisible clickable hotspots that navigate to different HA views/tabs.
# Clicking the hotspot navigates to the specified path.
nav_links:
  - path: /lovelace/garage   # The HA view path to navigate to
    x: 80                     # Position of hotspot center (percentage)
    y: 70
    width: 15                 # Size of clickable area
    height: 20
    icon: "mdi:garage"        # Optional icon
    label: "Garage"           # Optional label

  - path: /lovelace/car
    x: 85
    y: 85
    width: 10
    height: 12

# --- Debug Modes ---
# Enable these to see colored outlines for positioning overlays:
# window_lights_debug: true   # Red dashed outlines for window lights
# nav_links_debug: true       # Green dashed outlines for navigation links
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
