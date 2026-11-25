// Caras enfadadas para la batalla estrella: la app busca sola los ojos y la boca de cada foto
// (con face-api, que se carga sólo cuando hace falta) y dibuja encima unos ojos y una boca de dibujo
// mirando al rival. Lo encontrado se guarda en el navegador para no repetirlo. Si no encuentra la cara,
// la foto se queda tal cual.
const RAIZ = new URL('../assets/caras/', import.meta.url).href;
const CLAVE = 'gn.caras';
let motor = null;
const pendientes = new Map();

function memoria() { try { return JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { return {}; } }
function recordar(id, dato) { try { const m = memoria(); m[id] = dato; localStorage.setItem(CLAVE, JSON.stringify(m)); } catch (e) { /* sin almacenamiento */ } }

// undefined: aún no se ha mirado; null: no hay cara; objeto: dónde están ojos y boca (en píxeles de la foto).
export function caraDe(fotoId) { return memoria()[fotoId]; }

function cargarMotor() {
  if (!motor) motor = (async () => {
    const fa = await import(RAIZ + 'face-api.esm.js');
    await fa.nets.tinyFaceDetector.loadFromUri(RAIZ);
    await fa.nets.faceLandmark68Net.loadFromUri(RAIZ);
    return fa;
  })();
  return motor;
}

const media = (pts) => pts.reduce((a, p) => [a[0] + p.x / pts.length, a[1] + p.y / pts.length], [0, 0]);

// Busca la cara de una foto (dataURL) y avisa con «listo» cuando termina. Sólo una búsqueda por foto a la vez.
export function buscarCara(fotoId, datos, listo) {
  if (caraDe(fotoId) !== undefined || pendientes.has(fotoId)) return;
  const tarea = (async () => {
    try {
      const fa = await cargarMotor();
      const img = new Image(); img.src = datos; await img.decode();
      const r = await fa.detectSingleFace(img, new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 })).withFaceLandmarks();
      if (!r) { recordar(fotoId, null); return; }
      const p = r.landmarks.positions;
      const ojoI = media(p.slice(36, 42)), ojoD = media(p.slice(42, 48)), boca = media(p.slice(48, 68));
      recordar(fotoId, { w: img.naturalWidth, h: img.naturalHeight, ojoI, ojoD, boca, anchoBoca: Math.hypot(p[54].x - p[48].x, p[54].y - p[48].y) });
    } catch (e) {
      // Si no se puede cargar el detector (sin conexión, navegador antiguo), no se vuelve a intentar en esta sesión.
      console.warn('Caras: no se ha podido buscar la cara', e && e.message);
      return;
    } finally { pendientes.delete(fotoId); }
    listo();
  })();
  pendientes.set(fotoId, tarea);
}

// Capa SVG sobre la foto, con las mismas proporciones que la imagen (como object-fit: cover).
// mira: 1 hacia la derecha, -1 hacia la izquierda (hacia el rival).
export function capaEnfadada(c, mira) {
  if (!c) return '';
  const [xi, yi] = c.ojoI, [xd, yd] = c.ojoD, [xb, yb] = c.boca;
  const d = Math.hypot(xd - xi, yd - yi), giro = Math.atan2(yd - yi, xd - xi) * 180 / Math.PI;
  const r = d * 0.28, cx = (xi + xd) / 2, cy = (yi + yd) / 2;
  const ojo = (x, y, lado) => {
    const pupila = r * 0.5 * mira;
    // Ceja: alta por fuera y baja hacia el entrecejo (lado -1 el ojo izquierdo de la foto, +1 el derecho).
    const x1 = x + r * 1.25 * lado, x2 = x - r * 1.05 * lado;
    return `<g><g class="ojo"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.78}" fill="#fff" stroke="#1a0f12" stroke-width="${r * 0.16}"/>
      <g class="pupila" style="--mira:${mira}"><circle cx="${x + pupila}" cy="${y + r * 0.08}" r="${r * 0.4}" fill="#1a0f12"/><circle cx="${x + pupila + r * 0.14}" cy="${y - r * 0.1}" r="${r * 0.11}" fill="#fff"/></g></g>
      <path class="ceja" d="M${x1} ${y - r * 1.45} L${x2} ${y - r * 0.72}" stroke="#1a0f12" stroke-width="${r * 0.42}" stroke-linecap="round"/></g>`;
  };
  // Boca: mueca de rabia, con los dientes apretados.
  const bw = Math.max(c.anchoBoca * 1.3, d * 0.85) / 2, bh = bw * 0.55;
  const boca = `<g class="boca"><path d="M${xb - bw} ${yb + bh * 0.35} Q${xb} ${yb - bh * 0.9} ${xb + bw} ${yb + bh * 0.35} Q${xb} ${yb + bh * 0.2} ${xb - bw} ${yb + bh * 0.35} Z" fill="#5a0f1e" stroke="#1a0f12" stroke-width="${r * 0.16}" stroke-linejoin="round"/>
    <path d="M${xb - bw * 0.72} ${yb + bh * 0.05} Q${xb} ${yb - bh * 0.6} ${xb + bw * 0.72} ${yb + bh * 0.05}" fill="none" stroke="#fff" stroke-width="${bh * 0.32}" stroke-linecap="round"/>
    ${[-0.36, 0, 0.36].map((k) => `<path d="M${xb + bw * k} ${yb - bh * 0.42 + Math.abs(k) * bh * 0.5} v${bh * 0.32}" stroke="#1a0f12" stroke-width="${r * 0.08}"/>`).join('')}</g>`;
  return `<svg class="cara-enfadada" viewBox="0 0 ${c.w} ${c.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="rotate(${giro.toFixed(1)} ${cx} ${cy})">${ojo(xi, yi, -1)}${ojo(xd, yd, 1)}</g>${boca}</svg>`;
}

// Atajo para las cartas: si la foto ya tiene cara, la capa; si no, se busca y se repinta al terminar.
export function enfadar(fotoId, datos, mira, repintar) {
  if (!fotoId || !datos) return '';
  const c = caraDe(fotoId);
  if (c === undefined) { buscarCara(fotoId, datos, repintar); return ''; }
  return capaEnfadada(c, mira);
}

// Cara enamorada para el duelo doméstico (batalla entre parejas): ojos de corazón y morritos de beso
// hacia la pareja. Usa la misma cara encontrada que la batalla estrella.
const corazon = (x, y, t) => `M${x} ${y + t * 0.35}c${-t * 0.5} ${-t * 0.62} ${-t * 1.45} ${-t * 0.27} ${-t * 1.2} ${t * 0.47}c${t * 0.18} ${t * 0.52} ${t * 1.2} ${t * 1.18} ${t * 1.2} ${t * 1.18}s${t * 1.02} ${-t * 0.66} ${t * 1.2} ${-t * 1.18}c${t * 0.25} ${-t * 0.74} ${-t * 0.7} ${-t * 1.09} ${-t * 1.2} ${-t * 0.47}z`;
export function capaEnamorada(c, mira) {
  if (!c) return '';
  const [xi, yi] = c.ojoI, [xd, yd] = c.ojoD, [xb, yb] = c.boca;
  const d = Math.hypot(xd - xi, yd - yi), giro = Math.atan2(yd - yi, xd - xi) * 180 / Math.PI;
  const r = d * 0.3, cx = (xi + xd) / 2, cy = (yi + yd) / 2;
  const ojo = (x, y) => `<g class="ojo-amor"><path d="${corazon(x, y - r * 0.45, r * 0.95)}" fill="#ff2e9a" stroke="#7a0f4a" stroke-width="${r * 0.12}" stroke-linejoin="round"/>
    <ellipse cx="${x - r * 0.42}" cy="${y - r * 0.2}" rx="${r * 0.2}" ry="${r * 0.13}" fill="#fff" opacity=".85" transform="rotate(-35 ${x - r * 0.42} ${y - r * 0.2})"/></g>`;
  // Morritos: fruncidos y un poco girados hacia la pareja.
  const bw = Math.max(c.anchoBoca * 0.8, d * 0.5) / 2, bh = bw * 0.9, x = xb + mira * bw * 0.35;
  const boca = `<g class="morro-foto"><path d="M${x - bw} ${yb} Q${x - bw * 0.5} ${yb - bh * 0.9} ${x} ${yb - bh * 0.25} Q${x + bw * 0.5} ${yb - bh * 0.9} ${x + bw} ${yb} Q${x} ${yb + bh * 1.2} ${x - bw} ${yb} Z" fill="#ff2e9a" stroke="#7a0f4a" stroke-width="${r * 0.13}" stroke-linejoin="round"/>
    <path d="M${x - bw * 0.8} ${yb} Q${x} ${yb + bh * 0.35} ${x + bw * 0.8} ${yb}" fill="none" stroke="#7a0f4a" stroke-width="${r * 0.11}" stroke-linecap="round"/>
    <ellipse cx="${x - bw * 0.35}" cy="${yb + bh * 0.42}" rx="${bw * 0.22}" ry="${bh * 0.12}" fill="#fff" opacity=".6"/></g>`;
  return `<svg class="cara-amor" viewBox="0 0 ${c.w} ${c.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g transform="rotate(${giro.toFixed(1)} ${cx} ${cy})">${ojo(xi, yi)}${ojo(xd, yd)}</g>${boca}</svg>`;
}
export function enamorar(fotoId, datos, mira, repintar) {
  if (!fotoId || !datos) return '';
  const c = caraDe(fotoId);
  if (c === undefined) { buscarCara(fotoId, datos, repintar); return ''; }
  return capaEnamorada(c, mira);
}
// Corazones que suben flotando por la carta (con foto o sin ella).
export function corazonesFlotando() {
  return `<span class="corazones-carta" aria-hidden="true">${[[12, 0, 1], [70, 0.9, 0.8], [38, 1.7, 1.15], [84, 2.5, 0.7], [24, 3.2, 0.9], [56, 3.9, 1]].map(([x, t, e]) =>
    `<svg viewBox="0 0 24 24" style="left:${x}%;animation-delay:${t}s;--e:${e}"><path d="M12 20s-7-4.4-8.6-9A4.6 4.6 0 0 1 12 6.6 4.6 4.6 0 0 1 20.6 11C19 15.6 12 20 12 20z"/></svg>`).join('')}</span>`;
}
