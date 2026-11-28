import { CARD_STYLES } from './card-styles.js';

export const withCanvasEffects = (Base) => class extends Base {
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

    _refreshAnimationState() {
        const wEnt = this._config.weather_entity;
        const wState = this._config.test_weather_state || (wEnt ? this._hass.states[wEnt]?.state : '');
        const { speed, bearing } = this._getWindData();
        const moveSpeed = Math.max(0.2, Math.min(6, speed / 15));
        const sunEnt = this._config.sun_entity || 'sun.sun';
        const sunState = this._hass.states[sunEnt]?.state;
        const isNight = this._config.test_time_of_day
            ? this._config.test_time_of_day === 'night'
            : sunState === 'below_horizon';
        const seasonEntity = this._config.season_entity;
        const auroraEntity = this._config.aurora_entity;

        this._animationState = {
            wState,
            moveSpeed,
            windDirX: bearing > 180 || bearing < 0 ? 1 : -1,
            isNight,
            sunVisible: sunState === 'above_horizon',
            coverage: this._getCloudCoverage(),
            season: this._config.test_season_state
                || this._hass.states[seasonEntity]?.state?.toLowerCase()
                || 'summer',
            auroraActive: this._config.test_aurora === true
                || (auroraEntity ? this._hass.states[auroraEntity]?.state === 'on' : false)
        };
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
            if (skyLayer.style.background) skyLayer.style.background = '';
            this._lastSunElevation = null;
            this._lastSkyGradientKey = null;
            return;
        }
        
        const elevation = this._getSunElevation();
        const sunEnt = this._config.sun_entity || 'sun.sun';
        const isNight = this._hass.states[sunEnt]?.state === 'below_horizon';
        const intensity = this._config.sky_gradient_intensity ?? 0.8;
        const cacheElevation = elevation === null ? null : Math.round(elevation * 2) / 2;
        const gradientKey = `${cacheElevation}|${isNight}|${intensity}`;
        
        if (gradientKey === this._lastSkyGradientKey) return;
        
        this._lastSkyGradientKey = gradientKey;
        this._lastSunElevation = elevation;
        
        const { topColor, horizonColor, bottomColor } = this._getSkyGradient(elevation);
        
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
        const moonEnt = this._config.moon_entity || 'sensor.moon_phase';
        const entityPhase = this._hass.states[moonEnt]?.state;
        const now = Date.now();
        const cache = this._moonPhaseCache;
        if (cache && cache.entityPhase === entityPhase && now - cache.timestamp < 60000) {
            return cache.phase;
        }

        const calculated = this._calculateMoonPhase();
        const phase = entityPhase
            ? { ...calculated, name: entityPhase }
            : calculated;
        this._moonPhaseCache = { entityPhase, timestamp: now, phase };
        return phase;
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
        this._sunRayRotation += 0.0005;
        
        // Create multiple layers of soft hazes instead of distinct rays
        this._ctx.save();
        this._ctx.translate(x, y);
        this._ctx.rotate(this._sunRayRotation);
        
        // Outer haze layer - very subtle and diffuse
        for (let layer = 0; layer < 3; layer++) {
            const layerSize = size * (2 + layer * 1.5);
            const layerOpacity = 0.015 - layer * 0.003;
            
            const hazeGrad = this._ctx.createRadialGradient(0, 0, size * 1.2, 0, 0, layerSize);
            hazeGrad.addColorStop(0, `rgba(255, 250, 235, ${layerOpacity * 1.5})`);
            hazeGrad.addColorStop(0.3, `rgba(255, 245, 220, ${layerOpacity * 1.0})`);
            hazeGrad.addColorStop(0.6, `rgba(255, 240, 205, ${layerOpacity * 0.6})`);
            hazeGrad.addColorStop(1, 'rgba(255, 235, 190, 0)');
            
            this._ctx.fillStyle = hazeGrad;
            this._ctx.beginPath();
            this._ctx.arc(0, 0, layerSize, 0, Math.PI * 2);
            this._ctx.fill();
        }
        
        // Add very subtle directional haze (not distinct rays)
        const numDirections = 12;
        for (let i = 0; i < numDirections; i++) {
            const angle = (i / numDirections) * Math.PI * 2;
            const hazeLength = size * 3.5;
            
            this._ctx.save();
            this._ctx.rotate(angle);
            
            // Very soft directional gradient - more haze than ray
            const dirGrad = this._ctx.createLinearGradient(size * 1.1, 0, size * 1.1 + hazeLength, 0);
            dirGrad.addColorStop(0, 'rgba(255, 248, 230, 0.012)');
            dirGrad.addColorStop(0.5, 'rgba(255, 243, 215, 0.006)');
            dirGrad.addColorStop(1, 'rgba(255, 238, 200, 0)');
            
            // Draw as very wide, soft gradient (haze, not beam)
            const hazeSpread = size * 2;
            this._ctx.beginPath();
            this._ctx.moveTo(size * 1.1, -hazeSpread * 0.5);
            this._ctx.lineTo(size * 1.1 + hazeLength, -hazeSpread);
            this._ctx.lineTo(size * 1.1 + hazeLength, hazeSpread);
            this._ctx.lineTo(size * 1.1, hazeSpread * 0.5);
            this._ctx.closePath();
            
            this._ctx.fillStyle = dirGrad;
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
                <style>${CARD_STYLES}</style>
        
        <div class="card">
          <div class="sky-gradient-layer"></div>
          <div class="bg-image"></div>
          <div class="gradient-layer"></div>
          <div class="dim-layer"></div>
          <div class="window-lights-layer"></div>
          <div class="power-stations-layer"></div>
          <div class="thermostat-badges-layer"></div>
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
      this._cardElement = this.shadowRoot.querySelector('.card');
      this._bgImageElement = this.shadowRoot.querySelector('.bg-image');
      this._canvas = this.shadowRoot.getElementById('weatherCanvas');
      this._ctx = this._canvas.getContext('2d');
      setTimeout(() => this._resizeCanvas(), 100);
      this._observeCardSize();
    }
  
    _resizeCanvas() {
      if (!this._canvas) return;
      const card = this._cardElement || this.shadowRoot.querySelector('.card');
      if (!card || card.clientWidth <= 0 || card.clientHeight <= 0) return false;
      let resized = false;
      if (this._canvas.width !== card.clientWidth) {
          this._canvas.width = card.clientWidth;
          resized = true;
      }
      if (this._canvas.height !== card.clientHeight) {
          this._canvas.height = card.clientHeight;
          resized = true;
      }
      return resized;
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

    _animate(timestamp = performance.now()) {
      if (!this._ctx || !this._hass || !this._canvas) {
        // Missing required components - don't schedule next frame
        this._animationFrame = null;
        return;
      }
      
      if (document.hidden || !this._isVisible) {
        this._animationFrame = null;
        return;
      }
      
      const now = timestamp;
      
      const { wState, windDirX, moveSpeed, isNight, coverage } = this._animationState;

      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

      // Update sky gradient layer (CSS-based, behind bg-image)
      this._updateSkyGradient();

      if (isNight) this._drawStars(coverage, now);
      if (isNight) this._drawAurora(now);
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

      this._animationFrame = this._hasAnimatedEffects()
          ? requestAnimationFrame((frameTimestamp) => this._animate(frameTimestamp))
          : null;
    }

    _hasAnimatedEffects() {
        const { wState, isNight, coverage, season, auroraActive, sunVisible } = this._animationState;
        const seasonalEnabled = this._config.seasonal_particles !== false
            && (this._config.seasonal_particle_density ?? 1.0) > 0
            && ['autumn', 'fall', 'spring'].includes(season);
        if (seasonalEnabled) return true;

        if (wState === 'fog' || (isNight && ['rainy', 'cloudy'].includes(wState))) return true;
        if ((wState && !['clear-night', 'sunny'].includes(wState)) || coverage > 20) return true;
        if (['rainy', 'pouring', 'lightning', 'lightning-rainy', 'snowy', 'snowy-rainy'].includes(wState)) return true;

        if (isNight) {
            if (coverage < 80 || auroraActive) return true;
            if (this._config.shooting_stars !== false
                && (this._config.shooting_star_frequency ?? 0.002) > 0
                && coverage <= 70) return true;
            if (this._config.moon_glow !== false) {
                const phase = this._getMoonPhase();
                const cloudOcclusion = Math.max(0, 1 - (coverage / 100) * 0.8);
                if (phase.name !== 'new_moon' && cloudOcclusion > 0.1) return true;
            }
        } else if (sunVisible && (this._config.sun_rays !== false || this._config.sun_glow !== false)) {
            return true;
        }

        return false;
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
      
      let writeIndex = 0;
      for (let readIndex = 0; readIndex < this._particles.length; readIndex++) {
          const particle = this._particles[readIndex];
          if (particle.y <= canvasHeight && particle.x <= canvasWidth + 50 && particle.x >= -50) {
              this._particles[writeIndex++] = particle;
          }
      }
      this._particles.length = writeIndex;
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
      
      let writeIndex = 0;
      for (let readIndex = 0; readIndex < this._particles.length; readIndex++) {
          const particle = this._particles[readIndex];
          if (particle.y <= canvasHeight && particle.x <= canvasWidth + 50 && particle.x >= -50) {
              this._particles[writeIndex++] = particle;
          }
      }
      this._particles.length = writeIndex;
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
        const season = this._animationState?.season || 'summer';
        
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

    // --- AURORA BOREALIS ---
    _isAuroraActive() {
        // Test mode override
        if (this._config.test_aurora === true) return true;
        return this._animationState?.auroraActive || false;
    }

    _initAuroraWaves() {
        this._auroraWaves = [];
        const numWaves = 5;
        for (let i = 0; i < numWaves; i++) {
            this._auroraWaves.push({
                baseY: 0.015 + (i * 0.04),      // Vertical position (top portion of sky, 3%-19%)
                amplitude: 8 + Math.random() * 12,  // Wave height in pixels
                frequency: 0.003 + Math.random() * 0.004, // Wave frequency
                speed: 0.0004 + Math.random() * 0.0006,   // Animation speed
                phase: Math.random() * Math.PI * 2,        // Phase offset
                thickness: 15 + Math.random() * 25,        // Band thickness
                // Color: green-cyan core with purple edges, varying per wave
                hue: 120 + (i * 15) - 10 + Math.random() * 20, // 110-185 range (green to cyan)
                opacity: 0.04 + Math.random() * 0.04,     // Base opacity per wave
                points: new Float32Array(0),
            });
        }
        this._auroraInitialized = true;
    }

    _drawAurora(timestamp) {
        if (!this._isAuroraActive()) {
            // Reset when aurora becomes inactive so it re-initializes next time
            if (this._auroraInitialized) {
                this._auroraWaves = [];
                this._auroraInitialized = false;
            }
            return;
        }

        if (!this._auroraInitialized || this._auroraWaves.length === 0) {
            this._initAuroraWaves();
        }

        const W = this._canvas.width;
        const H = this._canvas.height;
        const intensity = this._config.aurora_intensity ?? 1.0;
        this._auroraTime = timestamp * 0.001; // Convert to seconds

        this._ctx.save();
        this._ctx.globalCompositeOperation = 'screen';

        for (const wave of this._auroraWaves) {
            const t = this._auroraTime;
            // Slowly oscillating master opacity for breathing effect
            const breathe = 0.6 + 0.4 * Math.sin(t * 0.3 + wave.phase);
            const alpha = wave.opacity * intensity * breathe;

            if (alpha <= 0.01) continue;

            // Draw the aurora band as a filled shape using sine curves
            this._ctx.beginPath();

            // Number of horizontal sample points
            const steps = Math.max(1, Math.ceil(W / 4));

            // Top edge of the band
            if (wave.points.length !== (steps + 1) * 2) {
                wave.points = new Float32Array((steps + 1) * 2);
            }
            const baseY = wave.baseY * H;
            for (let i = 0; i <= steps; i++) {
                const x = (i / steps) * W;

                // Compose multiple sine harmonics for organic movement
                const y1 = Math.sin(x * wave.frequency + t * wave.speed * 1000 + wave.phase) * wave.amplitude;
                const y2 = Math.sin(x * wave.frequency * 2.3 + t * wave.speed * 700 - wave.phase * 0.7) * (wave.amplitude * 0.4);
                const y3 = Math.sin(x * wave.frequency * 0.5 + t * wave.speed * 400 + wave.phase * 1.3) * (wave.amplitude * 0.6);

                const yOffset = y1 + y2 + y3;
                wave.points[i * 2] = baseY + yOffset;
                wave.points[i * 2 + 1] = baseY + yOffset + wave.thickness + Math.sin(x * 0.01 + t * 0.5) * 5;
            }

            // Build path: top edge left-to-right, bottom edge right-to-left
            this._ctx.moveTo(0, wave.points[0]);
            for (let i = 1; i <= steps; i++) {
                this._ctx.lineTo((i / steps) * W, wave.points[i * 2]);
            }
            for (let i = steps; i >= 0; i--) {
                this._ctx.lineTo((i / steps) * W, wave.points[i * 2 + 1]);
            }
            this._ctx.closePath();

            // Create vertical gradient within the band for color variation
            const midY = wave.baseY * H;
            const grad = this._ctx.createLinearGradient(0, midY - wave.amplitude, 0, midY + wave.thickness + wave.amplitude);

            // Purple/magenta top edge → green/cyan core → purple/magenta bottom edge
            const coreH = wave.hue;          // Green-cyan
            const edgeH = (wave.hue + 180) % 360; // Complementary (magenta-purple range)
            grad.addColorStop(0,   `hsla(${edgeH}, 80%, 50%, ${alpha * 0.2})`);
            grad.addColorStop(0.2, `hsla(${coreH}, 90%, 55%, ${alpha * 0.7})`);
            grad.addColorStop(0.5, `hsla(${coreH}, 95%, 60%, ${alpha * 0.8})`);
            grad.addColorStop(0.8, `hsla(${coreH}, 90%, 55%, ${alpha * 0.7})`);
            grad.addColorStop(1,   `hsla(${edgeH}, 80%, 50%, ${alpha * 0.2})`);

            this._ctx.fillStyle = grad;
            this._ctx.fill();

            // Add a soft glow around the band
            this._ctx.shadowColor = `hsla(${coreH}, 90%, 60%, ${alpha * 0.3})`;
            this._ctx.shadowBlur = 15;
            this._ctx.fill();
            this._ctx.shadowBlur = 0;
        }

        this._ctx.restore();
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
};
