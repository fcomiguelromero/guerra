// Monigotes de la guerra: el soldado americano y el prusiano de la presentación, y las escenas
// en las que aparecen como mascotas (trinchera, alto el fuego, espía, Radio Macuto).

// Un monigote, en una caja de 100×100. o.dormido: ojos cerrados; o.sinFusil; o.mira: hacia dónde mira.
function figura(cual, o = {}) {
  const usa = cual === 'usa';
  // Morritos de beso: unos labios fruncidos hacia el lado de la pareja; se animan con CSS (.morro).
  const morro = (x, y) => `<g class="morro"><path d="M${x - 5} ${y} Q${x - 2.5} ${y - 4} ${x} ${y - 1.2} Q${x + 2.5} ${y - 4} ${x + 5} ${y} Q${x} ${y + 5.5} ${x - 5} ${y} Z" fill="#ff4fb8" stroke="#a8237a" stroke-width=".8"/><path d="M${x - 4} ${y} Q${x} ${y + 1.6} ${x + 4} ${y}" stroke="#a8237a" stroke-width=".9" fill="none"/></g>`;
  const c = usa ? '#6b3572' : '#2f6170', claro = usa ? '#9a58a3' : '#4d93a6', oscuro = usa ? '#3a1d3f' : '#1b3540';
  const cuerpo = `<path d="M14 100 C14 72 32 60 50 60 C68 60 86 72 86 100 Z" fill="${c}"/><circle cx="50" cy="36" r="18" fill="${c}"/>`;
  const ojos = (mira) => o.dormido ? `<path d="M39.5 37.5 Q43 40 46.5 37.5 M53.5 37.5 Q57 40 60.5 37.5" stroke="${oscuro}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    : `<circle cx="43" cy="37" r="3.1" fill="#f6f2ff"/><circle cx="57" cy="37" r="3.1" fill="#f6f2ff"/><circle cx="${43 + (o.mira ?? mira)}" cy="37.3" r="1.5" fill="${oscuro}"/><circle cx="${57 + (o.mira ?? mira)}" cy="37.3" r="1.5" fill="${oscuro}"/>`;
  if (usa) {
    return `${o.sinFusil ? '' : `<g stroke-linecap="round"><path d="M25 97 L15 36" stroke="${claro}" stroke-width="5"/><path d="M15 36 L11.5 13" stroke="${claro}" stroke-width="2.2"/><path d="M20 66 Q27 62 30 70" stroke="${claro}" stroke-width="1.6" fill="none"/></g>
      <g fill="#f6f2ff"><circle cx="11" cy="6.5" r="2.6"/><circle cx="15.3" cy="9.6" r="2.6"/><circle cx="13.6" cy="14.6" r="2.6"/><circle cx="8.4" cy="14.6" r="2.6"/><circle cx="6.7" cy="9.6" r="2.6"/></g><circle cx="11" cy="11" r="2.4" fill="#ffd36a"/>`}
      ${cuerpo}
      <path d="M33 30 Q35 52 50 55 Q65 52 67 30" stroke="${claro}" stroke-width="1.6" fill="none"/>
      ${ojos(1)}
      <path d="M38.5 31.5 Q43 29.5 47 31.8 M53 31.8 Q57 29.5 61.5 31.5" stroke="${oscuro}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <g transform="rotate(-9 50 27)"><path d="M32 27 Q34 8 50 8 Q66 8 68 27 Z" fill="${claro}"/><ellipse cx="50" cy="27" rx="28" ry="5.2" fill="${claro}"/><path d="M24 28.4 Q50 34 76 28.4" stroke="${oscuro}" stroke-width="1" fill="none" opacity=".45"/>
        <path fill="#f6f2ff" d="M50 11.5l1.7 3.6 3.9.5-2.9 2.7.8 3.9-3.5-1.9-3.5 1.9.8-3.9-2.9-2.7 3.9-.5z"/></g>
      ${o.dormido || o.sinChicle ? '' : '<circle cx="60" cy="48" r="7.5" fill="#ff6ad5"/><path d="M56.2 45.6 Q57.6 42.8 60.6 42.6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/>'}
      ${o.morritos ? morro(56, 47.5) : `<path d="M45 46.5 Q49 49.5 53 47.5" stroke="${oscuro}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`}
      <path d="M42 62.5 Q50 70 58 62.5" stroke="${claro}" stroke-width="1" fill="none"/><rect x="47.6" y="67.5" width="4.8" height="6.4" rx="1.2" fill="#ffd36a"/>`;
  }
  return `${o.sinFusil ? '' : `<g stroke-linecap="round"><path d="M75 97 L85 36" stroke="${claro}" stroke-width="5"/><path d="M85 36 L88.5 13" stroke="${claro}" stroke-width="2.2"/><path d="M88.5 13 L89.6 4" stroke="#f6f2ff" stroke-width="1.5"/>
      <path d="M83.5 9.5 L94.5 12.5" stroke="#ff9d7a" stroke-width="5.4"/><path d="M84.6 8.6 L93 10.9" stroke="#ffc7ad" stroke-width="1" opacity=".8"/><path d="M80 66 Q73 62 70 70" stroke="${claro}" stroke-width="1.6" fill="none"/></g>`}
    ${cuerpo}
    <path d="M32 29 Q32 9 50 9 Q68 9 68 29 Q50 33.5 32 29 Z" fill="${claro}"/><path d="M30 26.6 Q50 32.4 70 26.6 L70 28.8 Q50 34.8 30 28.8 Z" fill="${oscuro}" opacity=".55"/>
    <path d="M47.4 10 L50 -6 L52.6 10 Z" fill="#ffd36a"/><ellipse cx="50" cy="10.2" rx="5.6" ry="2.1" fill="#ffd36a"/>
    <path fill="#ffd36a" d="M50 15.5c2.6 0 3 2.2 5.6 1.6-.4 2.6-2 3.4-2 5.2 0 2-1.6 3.4-3.6 4.4-2-1-3.6-2.4-3.6-4.4 0-1.8-1.6-2.6-2-5.2 2.6.6 3-1.6 5.6-1.6z"/>
    ${ojos(-1)}
    <path d="M38.8 31.8 L46.6 34 M53.4 34 L61.2 31.8" stroke="${oscuro}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    ${o.dormido ? '' : '<circle cx="57" cy="37" r="5.3" fill="rgba(255,255,255,.14)" stroke="#ffd36a" stroke-width="1.3"/>'}<path d="M61.6 39.8 Q68 48 63.5 61" stroke="#ffd36a" stroke-width=".8" fill="none"/>
    <g stroke="#f6f2ff" stroke-width="3.1" fill="none" stroke-linecap="round"><path d="M50 46.6 Q43 51.5 36.5 47 Q32.5 44 35 40.2"/><path d="M50 46.6 Q57 51.5 63.5 47 Q67.5 44 65 40.2"/></g>${o.morritos ? morro(44, 52) : ''}
    <path d="M47.9 63.2h4.2v2.6h2.6v4.2h-2.6v2.6h-4.2v-2.6h-2.6v-4.2h2.6z" fill="#ffd36a"/>`;
}


// El monigote suelto, para las cartas de la presentación.
export function soldado(cual, o = {}) {
  return `<svg aria-hidden="true" viewBox="0 0 100 100" style="height:88%;overflow:visible">${figura(cual, o)}</svg>`;
}
// Coloca un monigote en una escena: x, y es la esquina de su caja de 100×100; t, el tamaño; giro, en grados.
const en = (cual, x, y, t, o = {}, giro = 0, espejo = false) =>
  `<g transform="translate(${x} ${y}) scale(${(espejo ? -1 : 1) * t / 100} ${t / 100})${espejo ? ' translate(-100 0)' : ''} rotate(${giro} 50 60)">${figura(cual, o)}</g>`;

const ESCENAS = {
  // Cumplido por hoy: los dos durmiendo en la trinchera, con las zetas subiendo.
  trinchera: () => `
    <circle cx="206" cy="26" r="13" fill="#ffd36a" opacity=".9"/><circle cx="212" cy="21" r="11" fill="#16132b"/>
    <g fill="#f2f0ff" opacity=".7"><circle cx="30" cy="20" r="1.4"/><circle cx="70" cy="38" r="1"/><circle cx="160" cy="16" r="1.2"/><circle cx="120" cy="30" r="1"/></g>
    ${en('usa', 46, 40, 86, { dormido: true, sinFusil: true }, -8)}
    ${en('prusia', 112, 42, 86, { dormido: true, sinFusil: true }, 9)}
    <path d="M0 112 Q20 96 44 104 Q70 92 98 104 Q124 94 150 104 Q178 92 204 104 Q226 96 240 106 V140 H0 Z" fill="#3a3166"/>
    <g fill="#4a4080" stroke="#2a2648" stroke-width="1.2">${[12, 52, 92, 132, 172, 212].map((x) => `<rect x="${x}" y="${110 + (x % 3)}" width="36" height="14" rx="7"/>`).join('')}${[32, 72, 112, 152, 192].map((x) => `<rect x="${x}" y="122" width="36" height="14" rx="7"/>`).join('')}</g>
    <g class="zetas" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" fill="#8f7bff"><text x="98" y="52" font-size="14">z</text><text x="108" y="38" font-size="18">z</text><text x="120" y="22" font-size="22">Z</text></g>`,
  // Bienvenida de la ofensiva: los dos saltan fuera de la trinchera, con la bandera al viento y el sol saliendo.
  asalto: () => `
    <g class="sol-sale"><circle cx="120" cy="30" r="26" fill="#ffd36a" opacity=".18"/><circle cx="120" cy="30" r="13" fill="#ffd36a" opacity=".9"/></g>
    <g class="salta"><g>${en('usa', 30, 6, 92, { mira: .8 }, -6)}</g></g>
    <g class="salta salta-2"><g>${en('prusia', 118, 8, 92, { mira: -.8 }, 7)}</g></g>
    <g class="bandera-asalto"><path d="M206 108 L206 34" stroke="#b3aecf" stroke-width="3" stroke-linecap="round"/><path d="M206 36 h30 l-7 9 7 9 h-30z" fill="#5ef0d0"><animate attributeName="d" values="M206 36 h30 l-7 9 7 9 h-30z;M206 36 q16 -5 30 2 l-7 9 7 9 q-14 -6 -30 -2z;M206 36 h30 l-7 9 7 9 h-30z" dur="1.2s" repeatCount="indefinite"/></path></g>
    <path d="M0 112 Q20 98 44 106 Q70 94 98 106 Q124 96 150 106 Q178 94 204 106 Q226 98 240 108 V140 H0 Z" fill="#3a3166"/>
    <g fill="#4a4080" stroke="#2a2648" stroke-width="1.2">${[12, 52, 92, 132, 172, 212].map((x) => `<rect x="${x}" y="${110 + (x % 3)}" width="36" height="14" rx="7"/>`).join('')}${[32, 72, 112, 152, 192].map((x) => `<rect x="${x}" y="122" width="36" height="14" rx="7"/>`).join('')}</g>`,
  // Alto el fuego: firmando el armisticio sobre una mesa.
  firma: () => `
    ${en('usa', 20, 22, 92, { sinFusil: true, mira: 1 })}
    ${en('prusia', 128, 22, 92, { sinFusil: true, mira: -1 })}
    <rect x="10" y="98" width="220" height="12" rx="4" fill="#4a4080"/><path d="M30 110 L24 140 M210 110 L216 140" stroke="#4a4080" stroke-width="6" stroke-linecap="round"/>
    <g transform="rotate(-4 120 92)"><rect x="88" y="66" width="64" height="34" rx="2" fill="#f2efe4"/><path d="M95 74h40M95 80h46M95 86h30" stroke="#b3aecf" stroke-width="1.6"/>
      <path class="firma-trazo" d="M98 94 q6 -8 10 0 t10 0 t10 -2 t12 1" stroke="#3a1d3f" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
    <g class="pluma"><path d="M102 94 L114 58" stroke="#ffd36a" stroke-width="3" stroke-linecap="round"/><path d="M114 58 Q118 40 124 32 Q122 46 118 60 Z" fill="#f6f2ff"/></g>
    <circle cx="100" cy="94" r="6.5" fill="#6b3572"/><circle cx="174" cy="86" r="7" fill="#2f6170"/>`,
  // El espía: detrás de un periódico, sólo asoman los ojos y el casco.
  periodico: () => `
    ${en('prusia', 70, 10, 110, { sinFusil: true, mira: 1.4 })}
    <g transform="rotate(-3 120 96)"><rect x="56" y="64" width="128" height="74" rx="3" fill="#f2efe4"/><path d="M120 64v74" stroke="#cfc9b5" stroke-width="1.5"/>
      <text x="62" y="80" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="10.5" fill="#16132b">LA TRINCHERA</text>
      <text x="140" y="80" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="12" fill="#ff6ad5">¡EXTRA!</text>
      <g stroke="#a39d8a" stroke-width="2">${[88, 95, 102, 109, 116, 123, 130].map((y) => `<path d="M62 ${y}h52M126 ${y}h52"/>`).join('')}</g>
      <rect x="66" y="86" width="28" height="18" fill="#cfc9b5"/></g>
    <g class="lupa"><circle cx="206" cy="58" r="12" fill="rgba(255,255,255,.12)" stroke="#ffd36a" stroke-width="3"/><path d="M196 67 L186 78" stroke="#ffd36a" stroke-width="4" stroke-linecap="round"/></g>`,
  // En el amor y en la guerra: el americano y el prusiano se besan sobre la trinchera, con los fusiles tirados y corazones subiendo.
  beso: () => `
    <g fill="#f2f0ff" opacity=".7"><circle cx="24" cy="22" r="1.3"/><circle cx="62" cy="10" r="1"/><circle cx="196" cy="14" r="1.2"/><circle cx="222" cy="40" r="1"/></g>
    <g class="beso-izq">${en('usa', 46, 18, 92, { dormido: true, sinFusil: true, sinChicle: true, morritos: true }, 22)}</g>
    <g class="beso-der">${en('prusia', 102, 18, 92, { dormido: true, sinFusil: true, morritos: true }, -22)}</g>
    <path class="beso-chispa" d="M120 14c-2.6-3.2-7.4-1.4-6.2 2.4.9 2.7 6.2 6.1 6.2 6.1s5.3-3.4 6.2-6.1c1.2-3.8-3.6-5.6-6.2-2.4z" fill="#ff6ad5"/>
    <g class="corazones" fill="#ff6ad5">
      <path d="M104 30c-2-2.5-5.8-1.1-4.8 1.9.7 2.1 4.8 4.7 4.8 4.7s4.1-2.6 4.8-4.7c1-3-2.8-4.4-4.8-1.9z"/>
      <path d="M128 22c-2.6-3.2-7.4-1.4-6.2 2.4.9 2.7 6.2 6.1 6.2 6.1s5.3-3.4 6.2-6.1c1.2-3.8-3.6-5.6-6.2-2.4z" fill="#ffa3e6"/>
      <path d="M146 34c-1.6-2-4.6-.9-3.8 1.5.6 1.7 3.8 3.8 3.8 3.8s3.2-2.1 3.8-3.8c.8-2.4-2.2-3.5-3.8-1.5z"/></g>
    <path d="M0 112 Q20 98 44 106 Q70 94 98 106 Q124 96 150 106 Q178 94 204 106 Q226 98 240 108 V140 H0 Z" fill="#3a3166"/>
    <g stroke-linecap="round"><path d="M18 118 L74 100" stroke="#9a58a3" stroke-width="4"/><path d="M222 118 L166 100" stroke="#4d93a6" stroke-width="4"/><path d="M162 99 L156 97" stroke="#ff9d7a" stroke-width="4"/></g>
    <g fill="#4a4080" stroke="#2a2648" stroke-width="1.2">${[12, 52, 92, 132, 172, 212].map((x) => `<rect x="${x}" y="${112 + (x % 3)}" width="36" height="14" rx="7"/>`).join('')}${[32, 72, 112, 152, 192].map((x) => `<rect x="${x}" y="124" width="36" height="14" rx="7"/>`).join('')}</g>
    <path d="M120 120c-2.6-3.2-7.4-1.4-6.2 2.4.9 2.7 6.2 6.1 6.2 6.1s5.3-3.4 6.2-6.1c1.2-3.8-3.6-5.6-6.2-2.4z" fill="#ff6ad5" stroke="#2a2648" stroke-width="1"/>`,
  // Radio Macuto: con un megáfono y las ondas saliendo.
  altavoz: () => `
    ${en('usa', 24, 24, 104, { sinFusil: true, sinChicle: true, mira: 1.6 })}
    <g transform="rotate(-14 120 70)"><path d="M98 64 L150 40 L150 100 L98 76 Z" fill="#ff6ad5"/><rect x="90" y="62" width="12" height="16" rx="3" fill="#c94aa6"/><ellipse cx="150" cy="70" rx="6" ry="30" fill="#ffa3e6"/>
      <path d="M108 78 L104 94" stroke="#c94aa6" stroke-width="5" stroke-linecap="round"/></g>
    <g class="ondas" fill="none" stroke="#ff6ad5" stroke-width="3.5" stroke-linecap="round"><path d="M172 38 Q186 56 176 78"/><path d="M186 26 Q206 52 190 86"/><path d="M200 16 Q226 50 204 94"/></g>`
};
// Una escena con su texto alternativo. Las animaciones se paran si el móvil pide menos movimiento.
export function escena(nombre, alt, alto = 140) {
  return `<figure class="escena escena-${nombre}" style="margin:0"><svg role="img" aria-label="${alt}" viewBox="0 0 240 140" width="100%" height="${alto}" style="overflow:visible">${ESCENAS[nombre]()}</svg></figure>`;
}
