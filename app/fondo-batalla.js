// Campo de batalla animado para el hueco que queda sobre las cartas en el ordenador: obuses que cruzan
// de trinchera a trinchera, un biplano que suelta bombas, explosiones, humo y soldaditos corriendo.
// Es decorativo (aria-hidden) y se queda quieto si el sistema pide menos movimiento.

const TEAL = '#5ef0d0', ROSA = '#ff6ad5', ORO = '#ffd36a';

// Un soldadito corriendo: casco, cabeza, cuerpo, fusil y piernas que se mueven.
function soldadito(color, dur, retraso, haciaIzq, y = 0) {
  const ida = haciaIzq ? 'M1040 0 L-40 0' : 'M-40 0 L1040 0';
  return `<g transform="translate(0 ${244 + y})"><g opacity="0"><set attributeName="opacity" to="1" begin="${retraso}s"/>
    <animateMotion path="${ida}" dur="${dur}s" begin="${retraso}s" repeatCount="indefinite"/>
    <g transform="scale(${haciaIzq ? -1 : 1} 1)" opacity=".85">
      <g><animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur=".36s" repeatCount="indefinite"/>
        <path d="M-6 -27 a6 5 0 0 1 12 0 z" fill="${color}"/><circle cx="0" cy="-24" r="3.6" fill="#f0dcc8"/>
        <path d="M0 -20 L1 -10" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
        <path d="M-2 -17 L10 -22" stroke="#8a7a55" stroke-width="1.8" stroke-linecap="round"/></g>
      <path d="M1 -10 L-4 0" stroke="${color}" stroke-width="3" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="-28 1 -10;28 1 -10;-28 1 -10" dur=".36s" repeatCount="indefinite"/></path>
      <path d="M1 -10 L6 0" stroke="${color}" stroke-width="3" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="28 1 -10;-28 1 -10;28 1 -10" dur=".36s" repeatCount="indefinite"/></path>
    </g></g></g>`;
}

// Explosión en (x, y) que ocurre en el tramo [t0, t1] (fracciones del ciclo) de un ciclo de «dur» segundos.
function explosion(x, y, dur, retraso, t0, color) {
  const t1 = Math.min(0.99, t0 + 0.12), t2 = Math.min(0.995, t0 + 0.3);
  const kt = `0;${t0};${t1};${t2};1`, b = `${retraso}s`;
  return `<g>
    <circle cx="${x}" cy="${y}" r="0" fill="${color}" opacity="0"><animate attributeName="r" values="0;0;34;44;44" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0;.9;0;0" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/></circle>
    <circle cx="${x}" cy="${y}" r="0" fill="#fff6d8" opacity="0"><animate attributeName="r" values="0;0;16;6;6" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/></circle>
    ${[-14, 4, 18].map((dx, k) => `<circle cx="${x + dx}" cy="${y - 6}" r="0" fill="#4a4270" opacity="0">
      <animate attributeName="r" values="0;0;10;${20 + k * 4};${20 + k * 4}" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/>
      <animate attributeName="cy" values="${y - 6};${y - 6};${y - 20};${y - 70 - k * 14};${y - 70 - k * 14}" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0;.7;0;0" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/></circle>`).join('')}
    ${[[-24, -30], [20, -36], [-6, -44], [30, -14]].map(([dx, dy]) => `<rect x="${x}" y="${y}" width="4" height="4" fill="#2a2244" opacity="0">
      <animate attributeName="x" values="${x};${x};${x + dx};${x + dx * 1.6};${x + dx * 1.6}" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/>
      <animate attributeName="y" values="${y};${y};${y + dy};${y + 6};${y + 6}" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="${kt}" dur="${dur}s" begin="${b}" repeatCount="indefinite"/></rect>`).join('')}
  </g>`;
}

// Un obús que sale de una trinchera y cae en tierra de nadie, con su estela y su explosión.
function obus(desde, hasta, alto, dur, retraso, color) {
  const [x0, y0] = desde, [x1, y1] = hasta, cx = (x0 + x1) / 2, vuelo = 0.42;
  const ruta = `M${x0} ${y0} Q${cx} ${alto} ${x1} ${y1}`;
  return `<path d="${ruta}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 7" opacity="0">
      <animate attributeName="opacity" values="0;.35;.35;0;0" keyTimes="0;0.02;${vuelo};${vuelo + 0.08};1" dur="${dur}s" begin="${retraso}s" repeatCount="indefinite"/></path>
    <circle r="4.5" fill="${ORO}" opacity="0">
      <animateMotion path="${ruta}" keyPoints="0;1;1" keyTimes="0;${vuelo};1" calcMode="linear" dur="${dur}s" begin="${retraso}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;${vuelo - 0.01};${vuelo};1" dur="${dur}s" begin="${retraso}s" repeatCount="indefinite"/></circle>
    <circle cx="${x0}" cy="${y0 - 4}" r="0" fill="${ORO}" opacity="0"><animate attributeName="r" values="0;9;0;0" keyTimes="0;0.03;0.08;1" dur="${dur}s" begin="${retraso}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;.9;0;0" keyTimes="0;0.03;0.08;1" dur="${dur}s" begin="${retraso}s" repeatCount="indefinite"/></circle>
    ${explosion(x1, y1, dur, retraso, vuelo, color)}`;
}

// El biplano cruza el cielo y suelta una bomba a mitad de camino.
function biplano(dur, retraso) {
  const caida = 0.5, impacto = 0.6;
  return `<g opacity="0"><set attributeName="opacity" to=".85" begin="${retraso}s"/><animateMotion path="M-90 -40 C200 -60 700 -20 1090 -50" dur="${dur}s" begin="${retraso}s" repeatCount="indefinite"/>
      <g fill="#b3aecf" transform="scale(1.35)"><rect x="-22" y="-4" width="40" height="8" rx="4"/><rect x="-10" y="-14" width="10" height="28" rx="3"/><path d="M-22 -4 L-32 -10 L-30 4 Z"/>
        <rect x="18" y="-8" width="3" height="16" fill="#8f7bff"><animate attributeName="height" values="16;2;16" dur=".12s" repeatCount="indefinite"/></rect>
        <circle cx="-2" cy="-7" r="3" fill="${ROSA}"/></g></g>
    <circle cx="500" cy="-34" r="4" fill="#2a2244" stroke="${ORO}" stroke-width="1.5" opacity="0">
      <animate attributeName="cy" values="-34;-34;250;250" keyTimes="0;${caida};${impacto};1" calcMode="spline" keySplines="0 0 1 1;.5 0 1 1;0 0 1 1" dur="${dur}s" begin="${retraso}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${caida - 0.005};${caida};${impacto - 0.005};${impacto};1" dur="${dur}s" begin="${retraso}s" repeatCount="indefinite"/></circle>
    ${explosion(500, 250, dur, retraso, impacto, ROSA)}`;
}

export function campoBatalla() {
  const sacos = (x0, n, y) => Array.from({ length: n }, (_, k) => `<rect x="${x0 + k * 26}" y="${y + (k % 2) * 2}" width="28" height="12" rx="6"/>`).join('');
  return `<div class="campo-fondo" aria-hidden="true"><svg viewBox="0 -100 1000 400" preserveAspectRatio="xMidYMax meet" width="100%" height="100%">
    <defs><linearGradient id="cf-tierra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2348"/><stop offset="1" stop-color="#161229" stop-opacity="0"/></linearGradient></defs>
    <path d="M0 200 Q120 160 260 190 Q380 150 520 186 Q660 152 800 184 Q900 166 1000 190 V300 H0 Z" fill="#1d1836" opacity=".7"/>
    <g fill="#241e42" opacity=".9"><path d="M300 190 l6 -40 l6 40 z"/><path d="M308 160 l-10 -6 M308 168 l10 -8" stroke="#241e42" stroke-width="3"/><path d="M690 186 l5 -34 l5 34 z"/></g>
    <path d="M0 252 Q250 240 500 252 Q750 262 1000 248 V300 H0 Z" fill="url(#cf-tierra)"/>
    <g stroke="#3a3264" stroke-width="2" fill="none" opacity=".8">${Array.from({ length: 11 }, (_, k) => `<path d="M${330 + k * 34} 240 l8 -8 l8 8 l8 -8 l8 8"/>`).join('')}</g>
    <g fill="#3a3166" stroke="#1d1836" stroke-width="1.5">${sacos(20, 6, 232)}${sacos(34, 5, 220)}${sacos(830, 6, 232)}${sacos(844, 5, 220)}</g>
    <g><path d="M60 220 L60 170" stroke="#4a4080" stroke-width="2"/><path d="M60 170 h28 l-6 8 l6 8 h-28" fill="${TEAL}" opacity=".8"><animate attributeName="d" values="M60 170 h28 l-6 8 l6 8 h-28;M60 170 h26 q-4 9 2 16 h-28;M60 170 h28 l-6 8 l6 8 h-28" dur="1.6s" repeatCount="indefinite"/></path></g>
    <g><path d="M940 220 L940 170" stroke="#4a4080" stroke-width="2"/><path d="M940 170 h-28 l6 8 l-6 8 h28" fill="${ROSA}" opacity=".8"><animate attributeName="d" values="M940 170 h-28 l6 8 l-6 8 h28;M940 170 h-26 q4 9 -2 16 h28;M940 170 h-28 l6 8 l-6 8 h28" dur="1.7s" repeatCount="indefinite"/></path></g>
    ${biplano(17, 2)}
    ${obus([150, 222], [560, 248], -150, 6.5, 0, TEAL)}
    ${obus([850, 222], [400, 250], -110, 7.3, 2.6, ROSA)}
    ${obus([140, 224], [700, 252], -60, 8.1, 4.4, TEAL)}
    ${obus([860, 224], [300, 248], -20, 9.2, 1.2, ROSA)}
    ${soldadito(TEAL, 11, 0, false)}${soldadito(TEAL, 13, 5.5, false, 4)}${soldadito(ROSA, 12, 2.5, true, 2)}${soldadito(ROSA, 14, 8, true, 5)}${soldadito(TEAL, 15, 9.5, false, 1)}
  </svg></div>`;
}
