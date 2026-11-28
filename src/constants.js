export const DEFAULT_IMAGE_PATH = '/local/house-card-images/';
export const LEGACY_IMAGE_PATH = '/local/community/house-card/images/';

export const POWER_STATION_SUFFIXES = [
    { suffix: 'ac_charge_limit', domain: 'number', label: 'AC Charge Limit', icon: 'mdi:current-ac' },
    { suffix: 'ac_input_power', domain: 'sensor', label: 'AC Input', icon: 'mdi:power-plug' },
    { suffix: 'ac_output_power', domain: 'sensor', label: 'AC Output', icon: 'mdi:power-socket-eu' },
    { suffix: 'ac_output', domain: 'switch', label: 'AC Output', icon: 'mdi:power' },
    { suffix: 'battery', domain: 'sensor', label: 'Battery', icon: 'mdi:battery' },
    { suffix: 'bms_version', domain: 'sensor', label: 'BMS Version', icon: 'mdi:chip' },
    { suffix: 'charging_time', domain: 'sensor', label: 'Charging Time', icon: 'mdi:timer-sand' },
    { suffix: 'dc_car_output_power', domain: 'sensor', label: 'DC Car Output', icon: 'mdi:car-electric' },
    { suffix: 'dc_input_power', domain: 'sensor', label: 'DC Input', icon: 'mdi:current-dc' },
    { suffix: 'dc_output', domain: 'switch', label: 'DC Output', icon: 'mdi:power' },
    { suffix: 'usb_output', domain: 'switch', label: 'USB Output', icon: 'mdi:usb' },
    { suffix: 'inverter_version', domain: 'sensor', label: 'Inverter Version', icon: 'mdi:chip' },
    { suffix: 'output_frequency', domain: 'select', label: 'Output Frequency', icon: 'mdi:sine-wave' },
    { suffix: 'output_voltage', domain: 'select', label: 'Output Voltage', icon: 'mdi:sine-wave' },
    { suffix: 'remaining_time', domain: 'sensor', label: 'Remaining Time', icon: 'mdi:timer-outline' },
    { suffix: 'temperature', domain: 'sensor', label: 'Temperature', icon: 'mdi:thermometer' },
    { suffix: 'total_input_power', domain: 'sensor', label: 'Total Input', icon: 'mdi:transmission-tower-import' },
    { suffix: 'total_output_power', domain: 'sensor', label: 'Total Output', icon: 'mdi:transmission-tower-export' }
];
