import assert from 'node:assert/strict';
import test from 'node:test';
import { withCanvasEffects } from '../src/canvas-effects.js';

class CanvasCard extends withCanvasEffects(class {}) {}

test('animation stops scheduling frames when the page is hidden', () => {
    const card = new CanvasCard();
    card._ctx = {};
    card._canvas = { width: 10, height: 10 };
    card._hass = { states: {} };
    card._isVisible = true;
    card._animationFrame = 12;

    const previousDocument = globalThis.document;
    const previousRequestAnimationFrame = globalThis.requestAnimationFrame;
    let scheduledFrames = 0;
    globalThis.document = { hidden: true };
    globalThis.requestAnimationFrame = () => {
        scheduledFrames++;
        return scheduledFrames;
    };

    try {
        card._animate(100);
        assert.equal(card._animationFrame, null);
        assert.equal(scheduledFrames, 0);
    } finally {
        if (previousDocument === undefined) delete globalThis.document;
        else globalThis.document = previousDocument;
        if (previousRequestAnimationFrame === undefined) delete globalThis.requestAnimationFrame;
        else globalThis.requestAnimationFrame = previousRequestAnimationFrame;
    }
});

test('aurora point buffers are reused when canvas dimensions stay constant', () => {
    const card = new CanvasCard();
    card._hass = { states: {} };
    card._config = { aurora_intensity: 1 };
    card._animationState = { auroraActive: true };
    card._canvas = { width: 160, height: 100 };
    card._ctx = {
        save() {},
        restore() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        closePath() {},
        fill() {},
        createLinearGradient() {
            return { addColorStop() {} };
        },
        set globalCompositeOperation(value) {},
        set shadowColor(value) {},
        set shadowBlur(value) {}
    };

    card._drawAurora(1000);
    const buffers = card._auroraWaves.map((wave) => wave.points);
    card._drawAurora(1016);

    assert.equal(card._auroraWaves.length, 5);
    card._auroraWaves.forEach((wave, index) => {
        assert.equal(wave.points, buffers[index]);
        assert.equal(wave.points.length, (Math.ceil(160 / 4) + 1) * 2);
    });
});

test('a static clear daytime scene does not keep the canvas animation loop active', () => {
    const card = new CanvasCard();
    card._config = {
        seasonal_particles: false,
        sun_glow: false,
        sun_rays: false
    };
    card._animationState = {
        wState: 'sunny',
        isNight: false,
        sunVisible: true,
        coverage: 0,
        season: 'summer',
        auroraActive: false
    };

    assert.equal(card._hasAnimatedEffects(), false);
});

test('canvas dimensions are not reassigned when the card size is unchanged', () => {
    const card = new CanvasCard();
    let dimensionWrites = 0;
    const canvas = {
        _width: 160,
        _height: 100,
        get width() { return this._width; },
        set width(value) { dimensionWrites++; this._width = value; },
        get height() { return this._height; },
        set height(value) { dimensionWrites++; this._height = value; }
    };
    card._canvas = canvas;
    card._cardElement = { clientWidth: 160, clientHeight: 100 };

    assert.equal(card._resizeCanvas(), false);
    assert.equal(dimensionWrites, 0);

    card._cardElement.clientWidth = 200;
    assert.equal(card._resizeCanvas(), true);
    assert.equal(dimensionWrites, 1);
});
