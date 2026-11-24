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
    return `<g><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.78}" fill="#fff" stroke="#1a0f12" stroke-width="${r * 0.16}"/>
      <circle class="pupila" cx="${x + pupila}" cy="${y + r * 0.08}" r="${r * 0.4}" fill="#1a0f12"/><circle cx="${x + pupila + r * 0.14}" cy="${y - r * 0.1}" r="${r * 0.11}" fill="#fff"/>
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
