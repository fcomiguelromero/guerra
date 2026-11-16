// Iconos y miniilustraciones de la guerra: el mismo trazo en el plan, las ordenanzas y los extras.
export const ICONOS = {
  casco: '<path d="M4 14a8 8 0 0 1 16 0"/><path d="M2 14h20"/><path d="M6 14v2a2 2 0 0 0 2 2h1M18 14v2a2 2 0 0 1-2 2h-1"/><path d="M9 7.5l3-1.5 3 1.5"/>',
  tropa: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>',
  reglas: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M9 8h6"/>',
  extras: '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z"/>',
  correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  bandera: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
  visto: '<path d="M5 12l5 5 9-10"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>', atras: '<path d="M15 6l-6 6 6 6"/>', arriba: '<path d="M6 15l6-6 6 6"/>', abajo: '<path d="M6 9l6 6 6-6"/>',
  mas: '<path d="M12 5v14M5 12h14"/>', ojo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lapiz: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  porra: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
  espia: '<path d="M3 11h18"/><path d="M6 11l2-6h8l2 6"/><circle cx="8" cy="16" r="3"/><circle cx="16" cy="16" r="3"/><path d="M11 16h2"/>',
  desfile: '<ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v9c0 1.7 3.6 3 8 3s8-1.3 8-3V7"/><path d="M8 3l3 4M16 3l-3 4"/>',
  proclama: '<path d="M6 4h12a2 2 0 0 1 0 4h-1v10a2 2 0 0 1-2 2H5"/><path d="M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2"/><path d="M9 10h5M9 13h5M9 16h3"/>',
  medalla: '<path d="M8 3l4 6 4-6"/><circle cx="12" cy="15" r="5"/><path d="M12 13v4"/>',
  radio: '<path d="M3 10v4h3l10 5V5L6 10z"/><path d="M6 14l1.5 5h2.5l-1-4.2"/><path d="M19 9.5a3.5 3.5 0 0 1 0 5M21 7a7 7 0 0 1 0 10"/>',
  radiovieja: '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M7 9l10-5"/><circle cx="15" cy="14.5" r="2.5"/><path d="M6 13h4M6 16h4"/>',
  parte: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v9a2 2 0 0 1-2 2"/><path d="M7 9h7M7 12h7M7 15h4"/>',
  corneta: '<path d="M3 12h3l4-2h6l5-4v12l-5-4h-6l-4-2"/><path d="M8 12c0 3 2 5 5 5h3"/><path d="M6 10v4"/>',
  archivo: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 13h4"/>',
  cuartel: '<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M10 21v-5h4v5"/><path d="M12 5V2l3 1-3 1"/>',
  termo: '<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>',
  apuesta: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/>',
  micro: '<path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  diana: '<circle cx="12" cy="13" r="7"/><path d="M12 10v3l2 2"/><path d="M5 4L3 6M19 4l2 2"/>',
  candado: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  rayo: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  grados: '<path d="M6 14l6-4 6 4"/><path d="M6 19l6-4 6 4"/><path d="M6 9l6-4 6 4"/>',
  vs: '<rect x="2" y="5" width="8" height="13" rx="2"/><rect x="14" y="5" width="8" height="13" rx="2"/>',
  cuadro: '<path d="M3 5h5v4H3zM3 15h5v4H3z"/><path d="M8 7h3v10H8M11 12h4"/><path d="M15 10h6v4h-6z"/>',
  preguntas: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7"/><path d="M12 17h.01"/>',
  pergamino: '<path d="M8 4h10a2 2 0 0 1 2 2v1h-4"/><path d="M16 7v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1h10"/><path d="M8 4a2 2 0 0 0-2 2v11"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
};
// Color de cada icono en la explicación del juego (el mismo que en los correos).
export const COLOR_ICONO = { casco: '#5ef0d0', corneta: '#ffd36a', proclama: '#ffd36a', grados: '#8f7bff', micro: '#8f7bff', diana: '#ff6ad5', vs: '#5ef0d0', preguntas: '#8f7bff', cuadro: '#8f7bff', calendario: '#8f7bff', sol: '#ffd36a', rayo: '#ffd36a', candado: '#ff6ad5',
  desfile: '#ff6ad5', parte: '#8f7bff', medalla: '#ffd36a', porra: '#5ef0d0', espia: '#8f7bff', radio: '#ff6ad5', apuesta: '#ffd36a', termo: '#5ef0d0' };
// Lista de piezas {ic, t, x} con su icono: la explicación del juego en pantalla.
export function piezas(items) {
  return `<ul class="piezas">${items.map((p) => typeof p === 'string' ? `<li><span class="pieza-ico">${icono('visto', 20)}</span><span class="med t3">${esc0(p)}</span></li>`
    : `<li style="--c:${COLOR_ICONO[p.ic] || '#5ef0d0'}"><span class="pieza-ico">${icono(p.ic, 22, 1.9)}</span><span class="col" style="gap:2px"><b class="bc pieza-t">${esc0(p.t)}</b><span class="med t3">${esc0(p.x)}</span></span></li>`).join('')}</ul>`;
}
const esc0 = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function icono(nombre, tam = 22, grosor = 2) {
  return `<svg aria-hidden="true" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round">${ICONOS[nombre] || ICONOS.pergamino}</svg>`;
}

// Miniilustraciones para las tarjetas de reglas. Todas en una caja de 100×60.
const caja = (alto, dentro, extra = '') => `<svg aria-hidden="true" viewBox="0 0 100 60" width="100%" height="${alto}" ${extra}>${dentro}</svg>`;
export const ILU = {
  liga: (c, h = 64) => caja(h, Array.from({ length: 4 }, (_, i) => `<rect x="8" y="${8 + i * 13}" width="84" height="9" rx="3" fill="${i === 0 ? c : '#3a3566'}"/><circle cx="16" cy="${12.5 + i * 13}" r="2.6" fill="#0d0b1a"/>`).join('')),
  torneo: (c, h = 64) => caja(h, `<g fill="none" stroke-width="2.4" stroke-linecap="round"><g stroke="#3a3566"><path d="M6 8h16v12H6M6 40h16v12H6M22 14h12M22 46h12M34 14v32"/><path d="M94 8H78v12h16M94 40H78v12h16M78 14h-4M78 46h-4M74 14v32"/></g>
    <g stroke="${c}"><path d="M34 30h18"/><path d="M52 22h22v16H52z" fill="${c}" fill-opacity=".18"/></g></g><path d="M63 21l2.2 3.6 4-.8-2.8 3 1.6 3.8-3.8-1.6-3.6 2 .6-4-3-2.8 4-.4z" fill="${c}" transform="translate(0 -1)"/>`),
  golpe: (c, h = 64) => caja(h, Array.from({ length: 5 }, (_, i) => `<rect x="${14 + i * 12}" y="${10 + i * 3}" width="26" height="36" rx="4" fill="#1c1836" stroke="${i === 4 ? c : '#3a3566'}" stroke-width="2" transform="rotate(${-12 + i * 6} ${27 + i * 12} ${28 + i * 3})"/>`).join('')),
  dia: (c, h = 64) => caja(h, `<circle cx="50" cy="18" r="8" fill="${c}"/><g stroke="${c}" stroke-width="2.2" stroke-linecap="round"><path d="M50 3v3M50 30v3M35 18h3M62 18h3M39.4 7.4l2.1 2.1M58.5 26.5l2.1 2.1M39.4 28.6l2.1-2.1M58.5 9.5l2.1-2.1"/></g>` +
    Array.from({ length: 5 }, (_, i) => `<rect x="${10 + i * 17}" y="40" width="13" height="13" rx="3" fill="${i < 3 ? c : '#1c1836'}" stroke="${i < 3 ? c : '#3a3566'}" stroke-width="1.6" opacity="${i === 2 ? 0.55 : 1}"/>`).join('')),
  p310: (c, h = 64) => caja(h, `<g font-family="Barlow Condensed, sans-serif" font-weight="800" text-anchor="middle"><text x="22" y="44" font-size="38" fill="${c}">3</text><text x="50" y="44" font-size="38" fill="#b3aecf">1</text><text x="78" y="44" font-size="38" fill="#5a5490">0</text></g>
    <g font-family="Inter, sans-serif" font-weight="600" font-size="6.5" fill="#b3aecf" text-anchor="middle" letter-spacing="0"><text x="20" y="57">GANA</text><text x="50" y="57">EMPATA</text><text x="80" y="57">PIERDE</text></g>`),
  votos: (c, h = 64) => caja(h, `<g fill="none" stroke-width="2.2" stroke-linejoin="round"><rect x="30" y="26" width="40" height="28" rx="4" fill="#1c1836" stroke="#3a3566"/><path d="M40 26h20" stroke="#0d0b1a" stroke-width="4"/>
    <g transform="rotate(8 50 17)"><rect x="42" y="6" width="16" height="22" rx="2" fill="${c}" fill-opacity=".2" stroke="${c}"/><path d="M46 15l3 3 5-6" stroke="${c}" stroke-linecap="round"/></g></g>`),
  personas: (c, h = 64) => caja(h, [[30, '#3a3566'], [50, c], [70, '#3a3566']].map(([x, f]) => `<circle cx="${x}" cy="22" r="8" fill="${f}"/><path d="M${x - 14} 54c0-12 6-18 14-18s14 6 14 18z" fill="${f}"/>`).join('')),
  cosas: (c, h = 64) => caja(h, `<rect x="16" y="14" width="28" height="36" rx="5" fill="#1c1836" stroke="${c}" stroke-width="2"/><rect x="56" y="14" width="28" height="36" rx="5" fill="#1c1836" stroke="#3a3566" stroke-width="2"/>
    <path d="M24 38l6-8 5 5 3-3 4 6z" fill="${c}"/><circle cx="36" cy="24" r="3" fill="${c}"/><path d="M64 38l6-8 5 5 3-3 4 6z" fill="#3a3566"/>`),
  vs: (c1, c2, h = 120) => caja(h, `<g transform="rotate(-8 30 30)"><rect x="12" y="6" width="34" height="48" rx="6" fill="#23204a" stroke="${c1}" stroke-width="2.5"/><circle cx="29" cy="24" r="7" fill="#4a4496"/><path d="M17 54c0-10 5-16 12-16s12 6 12 16z" fill="#4a4496"/></g>
    <g transform="rotate(8 70 30)"><rect x="54" y="6" width="34" height="48" rx="6" fill="#23204a" stroke="${c2}" stroke-width="2.5"/><circle cx="71" cy="24" r="7" fill="#4a4496"/><path d="M59 54c0-10 5-16 12-16s12 6 12 16z" fill="#4a4496"/></g>
    <circle cx="50" cy="31" r="10" fill="#ffd36a"/><text x="50" y="35.5" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="12" fill="#0d0b1a">VS</text>`)
};
