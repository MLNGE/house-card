type: custom:fork-u-house-card
title: "My Residence" # Optional title (visual only)
language: "en"        # Options: 'en', 'pl'

# --- Global Visual Adjustments ---
scale: 1.0            # Scale factor for badges (e.g., 0.8 = smaller, 1.2 = larger)
image_y_offset: 0     # Vertical shift for background image in pixels (Negative = UP, Positive = DOWN)

# --- Image Mapping Logic ---
# Logic: Checks Season -> Time -> Weather.
# Example: If true, looks for "winter_fog_day.png". If false/missing, falls back to "winter_day.png".
img_winter_day_fog: true    
img_winter_night_fog: false 
# Repeat for other seasons (summer, autumn, spring) and weather types (rainy, snowy, lightning) if desired.

# Note: Christmas Mode is active Dec 14 - Jan 14.
# Ensure you have 'winter_xmas_day.png' and 'winter_xmas_night.png' in your folder.

# --- Testing ---
# Force a specific weather state to test animations (fog, lightning, snowy, rainy, pouring)
# test_weather_state: fog 

# --- Core Entities --- REQUIRED
weather_entity: weather.forecast_home
season_entity: sensor.season
sun_entity: sun.sun
cloud_coverage_entity: sensor.openweathermap_cloud_coverage # Optional (0-100%)
party_mode_entity: input_boolean.gaming_mode  # Optional: Toggles "Gaming Ambient" light effects

# --- Wind Entities (For Animation Speed/Direction) ---
wind_speed_entity: sensor.wind_speed    # Wind Speed (km/h)
wind_direction_entity: sensor.wind_bearing # Wind Bearing (degrees)

# --- Rooms / Badges Configuration ---
# Define sensors to display as badges over the house image.
# x: Horizontal position % (0 = left, 100 = right)
# y: Vertical position % (0 = top, 100 = bottom)
# unit: Custom unit string (default: "°"). Set to "W" for Power (Yellow Spark icon).
# decimals: Number of decimal places (default: 1). Set to 0 for integers.
# humidity_entity: Optional second value to display next to main value (e.g. "21° | 45%")
rooms:
  - name: "Living Room"
    entity: sensor.living_room_temperature
    humidity_entity: sensor.living_room_humidity # Optional: Displays humidity next to temp
    x: 50
    y: 70
    weight: 1 # 1 = Include in calculation (if used), 0 = Exclude

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
