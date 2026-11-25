// Datos convertidos en dibujos: la línea del frente, la fila de rezagados, el tira y afloja,
// el anillo de victorias, la racha en casillas y la vitrina de medallas.
// Las cifras siguen estando en el texto, para quien no vea el dibujo.
import { esc } from './base.js?v=37';

const TEAL = '#5ef0d0', ROSA = '#ff6ad5', ORO = '#ffd36a', VIOLETA = '#8f7bff';

// Un número que sube desde cero al aparecer (ver animarContadores).
// clave: lo identifica entre repintados, para que sólo se anime la primera vez o cuando cambia.
export const cuenta = (n, sufijo = '', clave = '') => `<span class="cuenta" data-anim="${esc(clave ? clave + ':' + n : '')}" data-hasta="${Number(n) || 0}" data-sufijo="${esc(sufijo)}">${Number(n) || 0}${esc(sufijo)}</span>`;

// Progreso como una línea del frente: nuestro terreno (teal) avanza sobre el que queda por conquistar.
export function frente(hechos, total, texto) {
  const p = total ? Math.max(0, Math.min(1, hechos / total)) : 0, x = 8 + p * 284;
  const dientes = Array.from({ length: 7 }, (_, k) => `${x + (k % 2 ? 5 : -3)},${6 + k * 5}`).join(' ');
  return `<figure class="frente anima" data-anim="frente:${hechos}/${total}" style="margin:0"><svg viewBox="0 0 300 46" width="100%" height="56" role="img" aria-label="${esc(texto || `${hechos} de ${total}`)}">
      <defs><pattern id="tierra" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 8L8 0" stroke="#2a2648" stroke-width="2"/></pattern></defs>
      <rect x="8" y="6" width="284" height="30" rx="8" fill="#1c1836"/><rect x="8" y="6" width="284" height="30" rx="8" fill="url(#tierra)"/>
      <rect class="frente-avance" x="8" y="6" width="${x - 8}" height="30" rx="8" fill="${TEAL}" opacity=".85" style="--ancho:${x - 8}px"/>
      ${p > 0 && p < 1 ? `<polyline points="${dientes}" fill="none" stroke="#0d0b1a" stroke-width="2.4" stroke-linejoin="round"/>` : ''}
      <g transform="translate(${Math.min(x, 286)} 0)"><path d="M0 4V40" stroke="#fff" stroke-width="2"/><path d="M0 4h12l-3 4 3 4H0" fill="${p >= 1 ? ORO : ROSA}"/></g>
    </svg><figcaption class="fila entre peq t2"><span><b class="teal">${cuenta(hechos, '', 'frente')}</b> de ${total}${texto ? ' ' + esc(texto) : ''}</span><span>${Math.round(p * 100)}%</span></figcaption></figure>`;
}

// Rezagados: una fila de caras con las batallas que les faltan encima.
export function filaRezagados(lista, cara) {
  if (!lista.length) return '';
  return `<ul class="fila-rezagados">${lista.map((r) => `<li><span class="globo">${r.faltan}</span>${cara(r)}<span class="peq">${esc(r.nombre)}</span></li>`).join('')}</ul>`;
}

// Tira y afloja: la cuerda se va hacia quien más ha ganado.
export function tiraAfloja(a, b, nomA, nomB) {
  const t = a + b, p = t ? a / t : 0.5, x = 20 + p * 260;
  return `<figure class="tira anima" data-anim="tira:${esc(nomA)}:${esc(nomB)}:${a}:${b}" style="margin:0"><svg viewBox="0 0 300 54" width="100%" height="60" role="img" aria-label="${esc(nomA)} ${a}, ${esc(nomB)} ${b}">
      <rect x="20" y="22" width="260" height="10" rx="5" fill="${ROSA}" opacity=".9"/><rect class="tira-a" x="20" y="22" width="${x - 20}" height="10" rx="5" fill="${TEAL}"/>
      <path d="M150 12V42" stroke="#fff" stroke-width="2" stroke-dasharray="3 3" opacity=".6"/>
      <g class="tira-nudo" style="--x:${x}px"><circle cx="0" cy="27" r="9" fill="${ORO}" stroke="#0d0b1a" stroke-width="2"/><path d="M-4 23l8 8M4 23l-8 8" stroke="#0d0b1a" stroke-width="1.6"/></g>
      <text x="20" y="50" font-size="11" fill="${TEAL}" font-weight="700">${esc(nomA)}</text><text x="280" y="50" font-size="11" fill="${ROSA}" font-weight="700" text-anchor="end">${esc(nomB)}</text>
    </svg></figure>`;
}

// Anillo de porcentaje, con la cifra dentro.
export function anillo(pct, titulo, color = TEAL) {
  const r = 34, l = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct));
  return `<figure class="anillo anima" data-anim="anillo:${esc(titulo)}:${pct}" style="margin:0"><svg viewBox="0 0 90 90" width="120" height="120" role="img" aria-label="${esc(titulo)}: ${v}%">
      <circle cx="45" cy="45" r="${r}" fill="none" stroke="#2a2648" stroke-width="10"/>
      <circle class="anillo-arco" cx="45" cy="45" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" transform="rotate(-90 45 45)" stroke-dasharray="${l}" stroke-dashoffset="${l * (1 - v / 100)}" style="--l:${l}"/>
      <text x="45" y="50" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="22" fill="#fff">${v}%</text>
    </svg><figcaption class="peq t2 centro">${esc(titulo)}</figcaption></figure>`;
}

// Racha: una casilla por batalla, verde si ganó, roja si perdió y gris si empató. Las últimas, a la derecha.
export function casillasRacha(serie, max = 30) {
  const ult = serie.slice(-max);
  if (!ult.length) return '';
  return `<div class="racha anima" data-anim="racha:${ult.join('')}" role="img" aria-label="Últimas ${ult.length} batallas: ${ult.filter((x) => x === 'g').length} victorias, ${ult.filter((x) => x === 'p').length} derrotas">
    ${ult.map((x, k) => `<i class="r-${x}" style="--k:${k}"></i>`).join('')}</div>`;
}

// Medalla dibujada: cinta de color y disco con el icono o la inicial.
const CINTAS = { rebelde: [ROSA, '#c94aa6'], borrego: ['#b3aecf', '#6b6596'], tardon: [VIOLETA, '#5b49c9'], adivino: [TEAL, '#2bb89a'], titulo: [ORO, '#c99a2e'], podio: ['#d9d5f2', '#8d88ab'], porra: [TEAL, '#2bb89a'] };
export function medalla(tipo, letra, tam = 56) {
  const [c1, c2] = CINTAS[tipo] || [ORO, '#c99a2e'];
  return `<svg aria-hidden="true" viewBox="0 0 60 80" width="${tam * 0.75}" height="${tam}">
    <path d="M14 0h14l6 30H20z" fill="${c1}"/><path d="M32 0h14l-6 30H26z" fill="${c2}"/>
    <circle cx="30" cy="52" r="20" fill="${ORO}" stroke="#c99a2e" stroke-width="3"/><circle cx="30" cy="52" r="14" fill="none" stroke="#fff3cf" stroke-width="1.5" opacity=".7"/>
    <text x="30" y="59" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="800" font-size="18" fill="#7a5a12">${esc(letra)}</text></svg>`;
}
// Vitrina: estantes de cristal con las medallas colgadas; vacía, enseña los huecos.
export function vitrina(piezas) {
  const huecos = Math.max(0, 4 - piezas.length);
  return `<div class="vitrina">${piezas.map((p) => `<figure class="vitrina-pieza" title="${esc(p.titulo)}">${medalla(p.tipo, p.letra)}<figcaption>${esc(p.titulo)}</figcaption>${p.sub ? `<span class="peq t2">${esc(p.sub)}</span>` : ''}</figure>`).join('')}
    ${Array.from({ length: huecos }, () => '<figure class="vitrina-pieza hueco" aria-hidden="true"><span></span><figcaption>&nbsp;</figcaption></figure>').join('')}</div>`;
}

// Tras cada repintado: lo que ya se vio no se vuelve a animar (sólo lo nuevo o lo que ha cambiado),
// y los contadores suben desde cero la primera vez.
const vistos = new Set();
export function animarContadores(raiz = document) {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  raiz.querySelectorAll('[data-anim]').forEach((el) => {
    const k = el.dataset.anim;
    if (!k) return;
    if (vistos.has(k) || quieto) { el.classList.add('sin-anim'); return; }
    vistos.add(k);
    if (!el.classList.contains('cuenta')) return;
    const hasta = Number(el.dataset.hasta), suf = el.dataset.sufijo || '', t0 = performance.now(), dur = 800;
    if (!hasta) return;
    const paso = (t) => { const f = Math.min(1, (t - t0) / dur); el.textContent = Math.round(hasta * (1 - Math.pow(1 - f, 3))) + suf; if (f < 1 && el.isConnected) requestAnimationFrame(paso); else el.textContent = hasta + suf; };
    el.textContent = '0' + suf; requestAnimationFrame(paso);
  });
}

// Confeti dorado: una lluvia corta de papelitos sobre la pantalla. Se va solo.
export function confeti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const capa = document.createElement('div');
  capa.className = 'confeti'; capa.setAttribute('aria-hidden', 'true');
  const colores = ['#ffd36a', '#ffe9a8', '#f5b93a', '#5ef0d0', '#ff6ad5'];
  capa.innerHTML = Array.from({ length: 70 }, (_, k) => `<i style="left:${Math.random() * 100}%;background:${colores[k % 5 < 3 ? k % 3 : k % 5]};animation-delay:${Math.random() * 0.5}s;animation-duration:${1.6 + Math.random()}s;--giro:${Math.random() > 0.5 ? 1 : -1};--deriva:${Math.round(Math.random() * 80 - 40)}px"></i>`).join('');
  document.body.appendChild(capa);
  setTimeout(() => capa.remove(), 3200);
}

// Mapa de campaña: las ofensivas como un camino serpenteante con banderas. Las hechas, con bandera turquesa;
// la de ahora, con el casco latiendo; las que faltan, como puntos. etiqueta(k) da el texto para lectores de pantalla.
// El camino es un SVG estirado; los hitos, elementos HTML encima, para que no se deformen.
export function mapaCampana(total, actual, hecha, etiqueta = (k) => 'Ofensiva ' + k) {
  const px = (k) => (total > 1 ? 3 + 94 * (k - 1) / (total - 1) : 50), py = (k) => (k % 2 ? 24 : 12);
  const linea = (n) => Array.from({ length: n }, (_, i) => `${i ? 'L' : 'M'}${px(i + 1).toFixed(2)} ${py(i + 1)}`).join(' ');
  const hechas = Array.from({ length: total }, (_, i) => i + 1).filter((k) => hecha(k)).length;
  const hitos = Array.from({ length: total }, (_, i) => {
    const k = i + 1, est = k === actual ? 'ahora' : hecha(k) ? 'hecha' : 'falta';
    return `<span class="hito-mapa ${est}" style="left:${px(k).toFixed(2)}%;top:${py(k)}px"></span>`;
  }).join('');
  return `<div class="mapa-campana" role="img" aria-label="${esc(etiqueta(actual))} de ${total}; ${hechas} completadas">
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" width="100%" height="36" aria-hidden="true">
      <path d="${linea(total)}" fill="none" stroke="#3a3566" stroke-width="2" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>
      <path d="${linea(Math.max(1, actual))}" fill="none" stroke="#5ef0d0" stroke-width="2.4" vector-effect="non-scaling-stroke" opacity=".7"/></svg>${hitos}</div>`;
}
