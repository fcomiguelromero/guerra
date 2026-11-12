// Dirección del motor del juego (Google Apps Script). En el ordenador de desarrollo se usa un motor local de pruebas.
const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
export const API = local ? '/api' : 'https://script.google.com/macros/s/AKfycbzgYrRs_vY-492LmNMrM8q6_GG8e4yxn4KuGFlDPq9dS35OFRfQiQxOr1ZeVjWMvtOV/exec';
