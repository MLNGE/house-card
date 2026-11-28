import assert from 'node:assert/strict';
import test from 'node:test';
import { withPowerStation } from '../src/power-station.js';

class PowerStationCard extends withPowerStation(class {}) {
    constructor() {
        super();
        this._config = { power_station_device_id: 'device-1' };
        this._hass = null;
        this._powerStationEntityCache = null;
    }
}

test('power-station entity mapping is reused while the registry is stable', () => {
    const entities = {
        'sensor.station_battery': { device_id: 'device-1' },
        'sensor.station_total_input_power': { device_id: 'device-1' }
    };
    const card = new PowerStationCard();
    card._hass = { entities, states: {}, devices: {} };

    const first = card._resolvePowerStationEntityMap();
    card._hass.states = { 'sensor.station_battery': { state: '82' } };
    const second = card._resolvePowerStationEntityMap();

    assert.equal(first.entities, second.entities);
    assert.equal(second.entities.battery, 'sensor.station_battery');
    assert.equal(second.entities.total_input_power, 'sensor.station_total_input_power');
    assert.equal(card._getPowerStationState(second.entities.battery).state, '82');
});

test('power-station entity mapping refreshes when the registry changes', () => {
    const card = new PowerStationCard();
    card._hass = {
        entities: { 'sensor.station_battery': { device_id: 'device-1' } },
        states: {},
        devices: {}
    };
    const first = card._resolvePowerStationEntityMap();

    card._hass.entities = {
        'sensor.station_battery': { device_id: 'device-1' },
        'sensor.station_temperature': { device_id: 'device-1' }
    };
    const second = card._resolvePowerStationEntityMap();

    assert.notEqual(first.entities, second.entities);
    assert.equal(second.entities.temperature, 'sensor.station_temperature');
});

test('legacy power-station entity IDs resolve the longest matching suffix', () => {
    const card = new PowerStationCard();

    assert.equal(
        card._resolvePowerStationPrefix('sensor.my_station_total_input_power'),
        'my_station'
    );
});
