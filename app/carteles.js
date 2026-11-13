// Carteles para WhatsApp y diploma de la cruz al mérito: se dibujan en el propio dispositivo (1080×1350)
// y se comparten como imagen, o se descargan si el navegador no sabe compartir archivos.
import { S, esc, plural, enumerar, porId, tinte, GRADOS, ico, pintar, aviso, accion } from './base.js';

const W = 1080, H = 1350, M = 72;
const C = { fondo: '#0d0b1a', sup: '#16132b', borde: '#2a2648', txt: '#f2f0ff', t2: '#b3aecf', t3: '#cdc8e6', teal: '#5ef0d0', violeta: '#8f7bff', rosa: '#ff6ad5', oro: '#ffd36a' };
const BC = '"Barlow Condensed", "Arial Narrow", sans-serif', IN = 'Inter, system-ui, sans-serif';
const may = (s) => String(s).toLocaleUpperCase('es');

// ---------------------------------------------------------------- utilidades de dibujo

const cache = {};
function imagen(src) {
  if (!cache[src]) {
    cache[src] = new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; });
  }
  return cache[src];
}
async function fuentes() {
  const pedir = ['800 80px', '700 40px', '600 30px'].map((f) => document.fonts.load(f + ' ' + BC, 'ÁÉÍÓÚÑ'))
    .concat(['400 24px', '600 24px', '700 24px', 'italic 400 24px'].map((f) => document.fonts.load(f + ' ' + IN, 'ÁÉÍÓÚÑ')));
  await Promise.race([Promise.all(pedir), new Promise((r) => setTimeout(r, 2500))]);
}
function lienzo() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  return [c, c.getContext('2d')];
}
async function fondo(x, tipo, brillos) {
  x.fillStyle = C.fondo; x.fillRect(0, 0, W, H);
  try {
    if (tipo === 'a') {
      const img = await imagen('assets/fondo-mapa-pc.svg');
      for (let y = 0; y < H; y += 880) x.drawImage(img, -100, y, 1280, 880);
    } else {
      const img = await imagen('assets/fondo-reflectores-pc.svg'), esc2 = Math.max(W / 1280, H / 860);
      x.drawImage(img, (W - 1280 * esc2) / 2, H - 860 * esc2, 1280 * esc2, 860 * esc2);
    }
  } catch (e) { /* sin fondo, queda el color liso */ }
  (brillos || []).forEach(([cx, cy, r, color]) => {
    const g = x.createRadialGradient(cx * W, cy * H, 0, cx * W, cy * H, r * Math.max(W, H));
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  });
}
function caja(x, a, b, w, h, r) { x.beginPath(); x.roundRect(a, b, w, h, r); }
function holo(x, a, b, w, h, colores) {
  const ang = 160 * Math.PI / 180, dx = Math.sin(ang), dy = -Math.cos(ang), cx = a + w / 2, cy = b + h / 2, l = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const g = x.createLinearGradient(cx - dx * l, cy - dy * l, cx + dx * l, cy + dy * l);
  const cs = colores || [[0, C.teal], [0.35, C.violeta], [0.65, C.rosa], [1, C.oro]];
  cs.forEach(([p, c]) => g.addColorStop(p, c));
  return g;
}
// Texto con espaciado entre letras y recorte al ancho disponible.
function texto(x, s, a, b, o = {}) {
  x.font = o.font; x.fillStyle = o.color || C.txt; x.textBaseline = o.base || 'alphabetic';
  let t = o.may ? may(s) : String(s);
  const esp = o.esp || 0, ancho = (u) => x.measureText(u).width + esp * Math.max(0, [...u].length - 1);
  if (o.max) { while (t.length > 1 && ancho(t) > o.max) t = t.slice(0, -2) + '…'; }
  const w = ancho(t);
  let x0 = o.align === 'center' ? a - w / 2 : o.align === 'right' ? a - w : a;
  if (!esp) { x.textAlign = 'left'; x.fillText(t, x0, b); return w; }
  x.textAlign = 'left';
  for (const ch of t) { x.fillText(ch, x0, b); x0 += x.measureText(ch).width + esp; }
  return w;
}
function lineas(x, s, font, max) {
  x.font = font;
  const res = [];
  String(s).split(/\n/).forEach((parr) => {
    let linea = '';
    parr.split(/\s+/).forEach((pal) => {
      const prueba = linea ? linea + ' ' + pal : pal;
      if (x.measureText(prueba).width > max && linea) { res.push(linea); linea = pal; } else linea = prueba;
    });
    if (linea) res.push(linea);
  });
  return res;
}
function parrafo(x, s, a, b, o) {
  const ls = lineas(x, o.may ? may(s) : s, o.font, o.max).slice(0, o.maxLineas || 99);
  ls.forEach((l, k) => texto(x, l, a, b + k * o.alto, { font: o.font, color: o.color, align: o.align }));
  return ls.length * o.alto;
}
async function retrato(x, g, a, b, w, h) {
  x.save(); x.beginPath(); x.rect(a, b, w, h); x.clip();
  x.fillStyle = tinte(g.id)[0]; x.fillRect(a, b, w, h);
  const foto = g.foto && S.fotos[g.foto];
  if (foto) {
    try {
      const img = await imagen(foto), e = Math.max(w / img.width, h / img.height);
      x.drawImage(img, a + (w - img.width * e) / 2, b + (h - img.height * e) / 3, img.width * e, img.height * e);
    } catch (e) { /* foto ilegible: silueta */ }
  }
  if (!foto) {
    const s = Math.min(w, h) * 0.92, ox = a + (w - s) / 2, oy = b + h - s, c = tinte(g.id)[1];
    x.fillStyle = c;
    x.beginPath(); x.arc(ox + 0.5 * s, oy + 0.36 * s, 0.18 * s, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(ox + 0.14 * s, oy + s);
    x.bezierCurveTo(ox + 0.14 * s, oy + 0.72 * s, ox + 0.32 * s, oy + 0.6 * s, ox + 0.5 * s, oy + 0.6 * s);
    x.bezierCurveTo(ox + 0.68 * s, oy + 0.6 * s, ox + 0.86 * s, oy + 0.72 * s, ox + 0.86 * s, oy + s); x.closePath(); x.fill();
  }
  x.restore();
}
// Carta holográfica con foto y nombre debajo.
async function cartita(x, g, a, b, w, hFoto, tamNombre, o = {}) {
  const borde = o.borde || 4, hNombre = tamNombre * 1.05 + 18 + (o.pie ? o.pieTam * 1.4 + 6 : 0), h = hFoto + hNombre + borde * 2;
  if (o.brillo) { x.save(); x.shadowColor = 'rgba(255,211,106,0.55)'; x.shadowBlur = 60; caja(x, a, b, w, h, 20); x.fillStyle = C.oro; x.fill(); x.restore(); }
  caja(x, a, b, w, h, 18); x.fillStyle = o.gris ? '#3a3566' : holo(x, a, b, w, h, o.colores); x.fill();
  caja(x, a + borde, b + borde, w - borde * 2, h - borde * 2, 14); x.fillStyle = C.sup; x.fill();
  x.save(); caja(x, a + borde, b + borde, w - borde * 2, h - borde * 2, 14); x.clip();
  await retrato(x, g, a + borde, b + borde, w - borde * 2, hFoto);
  x.restore();
  texto(x, g.nombre, a + w / 2, b + borde + hFoto + 10 + tamNombre * 0.9, { font: `800 ${tamNombre}px ${BC}`, may: true, align: 'center', max: w - 20, color: o.gris ? C.t2 : '#fff' });
  if (o.pie) texto(x, o.pie, a + w / 2, b + borde + hFoto + 10 + tamNombre * 1.05 + o.pieTam * 1.3, { font: `400 ${o.pieTam}px ${IN}`, color: o.pieColor || C.t3, align: 'center', max: w - 20 });
  return h;
}
function sello(x, s, cx, cy, tam, color, giro) {
  x.save(); x.translate(cx, cy); x.rotate(giro * Math.PI / 180);
  x.font = `800 ${tam}px ${BC}`;
  const w = x.measureText(may(s)).width + tam * 0.1 * (s.length - 1) + tam * 0.9, h = tam * 1.3;
  caja(x, -w / 2, -h / 2, w, h, tam * 0.25); x.lineWidth = tam * 0.12; x.strokeStyle = color; x.stroke();
  x.fillStyle = 'rgba(13,11,26,0.35)'; x.fill();
  texto(x, s, 0, tam * 0.36, { font: `800 ${tam}px ${BC}`, may: true, align: 'center', color, esp: tam * 0.1 });
  x.restore();
}

// ---------------------------------------------------------------- los cuatro carteles

async function cartelGuerra(e) {
  const [cv, x] = lienzo();
  await fondo(x, 'b', [[0.15, 0.12, 0.4, 'rgba(94,240,208,0.18)'], [0.88, 0.92, 0.42, 'rgba(255,106,213,0.18)']]);
  texto(x, '¡Comienza la guerra!', W / 2, M + 30, { font: `700 30px ${IN}`, may: true, align: 'center', color: C.teal, esp: 6.6 });
  texto(x, 'Todas las ofensivas, abiertas desde hoy', W / 2, M + 74, { font: `400 26px ${IN}`, align: 'center', color: C.t2 });
  const cs = e.gente.filter((g) => g.combate), n = cs.length, porFila = Math.min(6, Math.max(3, Math.ceil(n / 2))), filas = Math.ceil(n / porFila);
  const gap = 18, cw = (W - 2 * M - gap * (porFila - 1)) / porFila, nomT = cw > 200 ? 36 : cw > 150 ? 30 : 24;
  const fotoH = Math.min(cw * 1.05, (H - 2 * M - 300 - 130 - (filas - 1) * 22) / filas - nomT - 30);
  const cartaH = fotoH + nomT * 1.05 + 18 + 8, banda = 130, arriba = Math.ceil(filas / 2);
  const total = filas * cartaH + (filas - 1) * 22 + banda + 44, y0 = (H - total) / 2 + 10;
  let y = y0;
  const fila = async (lista) => {
    const off = (W - (lista.length * cw + (lista.length - 1) * gap)) / 2;
    for (let k = 0; k < lista.length; k++) await cartita(x, lista[k], off + k * (cw + gap), y, cw, fotoH, nomT);
    y += cartaH + 22;
  };
  for (let f = 0; f < arriba; f++) await fila(cs.slice(f * porFila, (f + 1) * porFila));
  y += 0;
  x.fillStyle = holo(x, M - 24, y, W - 2 * M + 48, banda, [[0, C.teal], [0.35, C.violeta], [0.65, C.rosa], [1, C.oro]]); x.fillRect(M - 24, y, W - 2 * M + 48, banda);
  x.fillStyle = C.fondo; x.fillRect(M - 24, y + 3, W - 2 * M + 48, banda - 6);
  const nl = lineas(x, may(e.guerra.nombre), `800 84px ${BC}`, W - 2 * M);
  const tam = nl.length > 1 ? 56 : 84;
  parrafo(x, e.guerra.nombre, W / 2, y + banda / 2 + tam * 0.33 - (lineas(x, may(e.guerra.nombre), `800 ${tam}px ${BC}`, W - 2 * M).length - 1) * tam * 0.48, { font: `800 ${tam}px ${BC}`, may: true, align: 'center', max: W - 2 * M, alto: tam * 0.95, maxLineas: 2 });
  y += banda + 22;
  for (let f = arriba; f < filas; f++) await fila(cs.slice(f * porFila, (f + 1) * porFila));
  const nb = n * (n - 1) / 2;
  let yp = H - M - 118;
  parrafo(x, e.guerra.pregunta, W / 2, yp, { font: `700 44px ${BC}`, may: true, align: 'center', max: W - 2 * M, alto: 46, maxLineas: 1 });
  texto(x, 'Entra con el enlace de este mensaje y a votar', W / 2, yp + 52, { font: `400 26px ${IN}`, align: 'center', color: C.t3 });
  texto(x, `${plural(n, e.guerra.modo === 'cosas' ? 'contendiente' : 'combatiente', e.guerra.modo === 'cosas' ? 'contendientes' : 'combatientes')} · ${nb} batallas · ¡Sólo puede quedar uno!`, W / 2, yp + 104, { font: `700 30px ${BC}`, may: true, align: 'center', color: C.oro, esp: 1 });
  return cv;
}

async function cartelParte(e) {
  const [cv, x] = lienzo(), G = porId(e.gente), pr = e.progreso;
  await fondo(x, 'a', [[0.5, 0.3, 0.45, 'rgba(255,211,106,0.16)']]);
  texto(x, e.guerra.nombre, M, M + 24, { font: `600 24px ${IN}`, may: true, color: C.t2, esp: 4.8, max: W - 2 * M });
  x.font = `800 84px ${BC}`;
  sello(x, 'Parte de guerra', M + (x.measureText(may('Parte de guerra')).width + 8.4 * 14 + 76) / 2, M + 120, 84, C.rosa, -3);
  texto(x, 'A mitad de contienda', M, M + 250, { font: `700 44px ${BC}`, may: true, color: '#fff' });
  texto(x, String(pr.emitidos), M, M + 450, { font: `800 180px ${BC}`, color: C.oro });
  x.font = `800 180px ${BC}`;
  const wN = x.measureText(String(pr.emitidos)).width;
  texto(x, `de ${pr.total} batallas`, M + wN + 24, M + 380, { font: `700 46px ${BC}`, may: true, color: '#fff' });
  texto(x, 'libradas', M + wN + 24, M + 430, { font: `700 46px ${BC}`, may: true, color: '#fff' });
  const pct = pr.total ? pr.emitidos / pr.total : 0, by = M + 490;
  caja(x, M, by, W - 2 * M - 140, 24, 12); x.fillStyle = C.borde; x.fill();
  const gb = x.createLinearGradient(M, 0, W - M - 140, 0); [[0, C.teal], [0.33, C.violeta], [0.66, C.rosa], [1, C.oro]].forEach(([p, c]) => gb.addColorStop(p, c));
  caja(x, M, by, Math.max(24, (W - 2 * M - 140) * pct), 24, 12); x.fillStyle = gb; x.fill();
  texto(x, Math.round(pct * 100) + ' %', W - M, by + 22, { font: `800 40px ${BC}`, align: 'right' });
  // Vanguardia: quienes ya han votado todo. Retaguardia: los que más deben.
  const votan = e.gente.filter((g) => g.vota && g.estado === 'activo'), rez = porId(pr.rezagados);
  const suyas = (id) => e.batallas.filter((b) => b.a !== id && b.b !== id).length;
  const listos = votan.filter((g) => !rez[g.id]);
  const columna = async (titulo, sub, color, lista, extra, a) => {
    const cw = (W - 2 * M - 28) / 2, cy = M + 560, ch = 410;
    caja(x, a, cy, cw, ch, 24); x.fillStyle = 'rgba(22,19,43,0.92)'; x.fill(); x.lineWidth = 2; x.strokeStyle = color; x.stroke();
    texto(x, titulo, a + 30, cy + 70, { font: `800 46px ${BC}`, may: true, color });
    texto(x, sub, a + 30, cy + 108, { font: `400 22px ${IN}`, color: C.t2, max: cw - 60 });
    let yy = cy + 140;
    for (const it of lista.slice(0, 3)) {
      x.save(); x.beginPath(); x.arc(a + 58, yy + 28, 28, 0, Math.PI * 2); x.clip(); await retrato(x, it.g, a + 30, yy, 56, 56); x.restore();
      x.beginPath(); x.arc(a + 58, yy + 28, 28, 0, Math.PI * 2); x.lineWidth = 3; x.strokeStyle = color; x.stroke();
      texto(x, it.g.nombre, a + 102, yy + (it.barra != null ? 26 : 40), { font: `700 34px ${BC}`, may: true, max: cw - 230 });
      if (it.barra != null) {
        caja(x, a + 102, yy + 40, cw - 240, 8, 4); x.fillStyle = C.borde; x.fill();
        if (it.barra > 0) { caja(x, a + 102, yy + 40, Math.max(8, (cw - 240) * it.barra), 8, 4); x.fillStyle = color; x.fill(); }
      }
      texto(x, it.marca, a + cw - 30, yy + 38, { font: `700 28px ${BC}`, color, align: 'right' });
      yy += 72;
    }
    if (!lista.length) texto(x, extra.vacio, a + 30, yy + 30, { font: `400 22px ${IN}`, color: C.t2, max: cw - 60 });
    if (lista.length > 3) texto(x, `y ${lista.length - 3} más`, a + 30, yy + 24, { font: `400 22px ${IN}`, color: C.t2 });
  };
  await columna('Vanguardia', 'Ya han librado todas sus batallas', C.teal, listos.map((g) => ({ g, marca: suyas(g.id) + '/' + suyas(g.id) })), { vacio: 'Nadie ha terminado todavía.' }, M);
  await columna('Retaguardia', 'Se les reclama en el frente', C.rosa, pr.rezagados.map((r) => ({ g: G[r.id], marca: (r.de - r.faltan) + '/' + r.de, barra: r.de ? (r.de - r.faltan) / r.de : 0 })), { vacio: 'Nadie se queda atrás.' }, W / 2 + 14);
  texto(x, 'Ni un solo resultado desvelado: el parte final, ' + (e.guerra.extras.desfile ? 'en el desfile de la victoria.' : 'cuando acabe la guerra.'), W / 2, H - M - 150, { font: `400 24px ${IN}`, align: 'center', color: C.t3, max: W - 2 * M });
  caja(x, M + 60, H - M - 118, W - 2 * M - 120, 72, 20); x.fillStyle = 'rgba(13,11,26,0.85)'; x.fill(); x.lineWidth = 3; x.strokeStyle = C.teal; x.stroke();
  texto(x, 'Entra con el enlace de este mensaje y a votar', W / 2, H - M - 70, { font: `700 36px ${BC}`, may: true, align: 'center', color: C.teal, max: W - 2 * M - 160 });
  texto(x, '¡Sólo puede quedar uno!', W / 2, H - M - 4, { font: `800 34px ${BC}`, may: true, align: 'center', esp: 2 });
  return cv;
}

async function cartelPodio(e) {
  const [cv, x] = lienzo(), r = e.resultado, G = porId(e.gente), t = r.tabla;
  await fondo(x, 'b', [[0.5, 0.38, 0.46, 'rgba(255,211,106,0.22)'], [0.1, 0.95, 0.4, 'rgba(143,123,255,0.18)']]);
  texto(x, e.guerra.nombre, W / 2, M + 28, { font: `700 28px ${IN}`, may: true, align: 'center', color: C.t2, esp: 6, max: W - 2 * M });
  texto(x, 'Cuadro de honor', W / 2, M + 140, { font: `800 112px ${BC}`, may: true, align: 'center' });
  const base = 930;
  const puesto = async (f, cx, w, fotoH, nomT, alto, color, num, numT, colores, pie, pieColor, brillo) => {
    if (!f) return;
    const hCarta = fotoH + nomT * 1.05 + 18 + 24 * 1.4 + 6 + 8;
    await cartita(x, G[f.id], cx - w / 2, base - alto - 16 - hCarta, w, fotoH, nomT, { colores, pie, pieTam: w > 300 ? 24 : 22, pieColor, brillo });
    const g = x.createLinearGradient(0, base - alto, 0, base);
    g.addColorStop(0, color + '55'); g.addColorStop(1, color + '0d');
    x.beginPath(); x.roundRect(cx - w / 2, base - alto, w, alto, [14, 14, 0, 0]); x.fillStyle = g; x.fill(); x.lineWidth = 2; x.strokeStyle = color; x.stroke();
    texto(x, num, cx, base - alto / 2 + numT * 0.36, { font: `800 ${numT}px ${BC}`, align: 'center', color });
  };
  await puesto(t[1], W / 2 - 320, 260, 190, 46, 120, C.teal, '2', 80, [[0, C.teal], [0.55, C.violeta], [1, C.rosa]], plural(t[1] ? t[1].pts : 0, 'punto', 'puntos'), C.t3);
  await puesto(t[2], W / 2 + 320, 260, 190, 46, 80, C.rosa, '3', 68, [[0, C.rosa], [0.55, C.violeta], [1, C.teal]], plural(t[2] ? t[2].pts : 0, 'punto', 'puntos'), C.t3);
  await puesto(t[0], W / 2, 320, 240, 58, 180, C.oro, '1', 104, [[0, C.oro], [0.45, C.rosa], [0.75, C.violeta], [1, C.teal]], plural(t[0].pts, 'punto', 'puntos') + (e.guerra.premio ? ' · ' + e.guerra.premio : ''), C.oro, true);
  x.fillStyle = C.borde; x.fillRect(M, base + 40, W - 2 * M, 2);
  let y = base + 110;
  if (r.porra.gana.length) {
    texto(x, `Porra: ${enumerar(r.porra.gana.map((id) => G[id].nombre))}, a ${plural(r.porra.lista[0].suma, 'puesto', 'puestos')}`, W / 2, y, { font: `400 34px ${IN}`, align: 'center', max: W - 2 * M });
    y += 64;
  }
  const premios = [['rebelde', 'Más rebelde'], ['borrego', 'Más borrego'], ['tardon', 'Más tardón']].filter(([k]) => r.premios[k]).map(([k, t2]) => t2 + ': ' + G[r.premios[k].id].nombre);
  if (premios.length) { parrafo(x, premios.join(' · '), W / 2, y, { font: `400 26px ${IN}`, align: 'center', color: C.t3, max: W - 2 * M, alto: 36, maxLineas: 2 }); y += 70; }
  if (r.desertores.length) {
    const nombres = enumerar(r.desertores.map((d) => G[d.id].nombre));
    x.font = `400 30px ${IN}`;
    const wn = x.measureText(nombres).width, wTot = wn + 24 + 190, x0 = W / 2 - wTot / 2;
    texto(x, nombres, x0, y, { font: `400 30px ${IN}`, color: C.t2 });
    x.fillStyle = C.t2; x.fillRect(x0, y - 10, wn, 2);
    sello(x, r.desertores.length > 1 ? 'Desertores' : 'Desertor', x0 + wn + 24 + 95, y - 10, 30, C.rosa, -4);
  }
  return cv;
}

async function diploma(e) {
  const [cv, x] = lienzo(), r = e.resultado, G = porId(e.gente), f = r.tabla[0], g = G[f.id];
  await fondo(x, 'b', [[0.5, 0.26, 0.46, 'rgba(255,211,106,0.24)'], [0.12, 0.94, 0.4, 'rgba(143,123,255,0.18)']]);
  const a = 56, b = 56, w = W - 112, h = H - 112;
  caja(x, a, b, w, h, 30); x.fillStyle = holo(x, a, b, w, h); x.fill();
  caja(x, a + 4, b + 4, w - 8, h - 8, 26); x.fillStyle = 'rgba(18,15,36,0.94)'; x.fill();
  caja(x, a + 18, b + 18, w - 36, h - 36, 18); x.lineWidth = 1; x.strokeStyle = 'rgba(255,211,106,0.45)'; x.stroke();
  texto(x, e.guerra.nombre, W / 2, 168, { font: `600 22px ${IN}`, may: true, align: 'center', color: C.oro, esp: 4.4, max: w - 120 });
  // Emblema: cinta, anilla, rayos, cruz holográfica y medallón con estrella.
  const cx = W / 2, ey = 196, s = 290 / 320;
  const P = (px, py) => [cx + (px - 160) * s, ey + py * s];
  const cinta = x.createLinearGradient(P(120, 0)[0], 0, P(200, 0)[0], 0);
  [[0, C.teal], [0.333, C.teal], [0.333, C.violeta], [0.667, C.violeta], [0.667, C.rosa], [1, C.rosa]].forEach(([p, c]) => cinta.addColorStop(p, c));
  x.beginPath(); x.moveTo(...P(120, 0)); x.lineTo(...P(200, 0)); x.lineTo(...P(200, 78)); x.lineTo(...P(160, 100)); x.lineTo(...P(120, 78)); x.closePath(); x.fillStyle = cinta; x.fill();
  x.beginPath(); x.arc(...P(160, 112), 10 * s, 0, Math.PI * 2); x.lineWidth = 4 * s; x.strokeStyle = C.oro; x.stroke();
  x.beginPath(); x.moveTo(...P(160, 122)); x.lineTo(...P(160, 137)); x.stroke();
  const [ccx, ccy] = P(160, 230);
  x.save(); x.strokeStyle = 'rgba(255,211,106,0.45)'; x.lineWidth = 20 * s; x.setLineDash([3 * s, 7.996 * s]); x.beginPath(); x.arc(ccx, ccy, 84 * s, 0, Math.PI * 2); x.stroke(); x.restore();
  const brazos = [[[146, 216], [132, 140], [160, 130], [188, 140], [174, 216]], [[174, 216], [250, 202], [260, 230], [250, 258], [174, 244]],
    [[174, 244], [188, 320], [160, 330], [132, 320], [146, 244]], [[146, 244], [70, 258], [60, 230], [70, 202], [146, 216]]];
  const gc = x.createLinearGradient(...P(60, 130), ...P(260, 330));
  [[0, C.teal], [0.35, C.violeta], [0.65, C.rosa], [1, C.oro]].forEach(([p, c]) => gc.addColorStop(p, c));
  x.beginPath();
  brazos.forEach((q) => { x.moveTo(...P(...q[0])); x.lineTo(...P(...q[1])); x.quadraticCurveTo(...P(...q[2]), ...P(...q[3])); x.lineTo(...P(...q[4])); x.closePath(); });
  x.fillStyle = gc; x.fill(); x.lineWidth = 1.5; x.strokeStyle = 'rgba(242,240,255,0.5)'; x.stroke();
  x.beginPath(); x.arc(ccx, ccy, 34 * s, 0, Math.PI * 2); x.fillStyle = C.fondo; x.fill(); x.lineWidth = 4 * s; x.strokeStyle = C.oro; x.stroke();
  const estrella = (ex, ey2, rr) => {
    x.beginPath();
    for (let k = 0; k < 10; k++) { const ang = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? rr * 0.42 : rr; x.lineTo(ex + rad * Math.cos(ang), ey2 + rad * Math.sin(ang)); }
    x.closePath(); x.fillStyle = C.oro; x.fill();
  };
  estrella(ccx, ccy + 2, 18 * s * 1.3);
  texto(x, 'Cruz al mérito', W / 2, 620, { font: `800 104px ${BC}`, may: true, align: 'center', color: C.oro });
  texto(x, 'El alto mando concede esta cruz a', W / 2, 690, { font: `400 26px ${IN}`, align: 'center', color: C.t3 });
  texto(x, g.nombre, W / 2, 810, { font: `800 128px ${BC}`, may: true, align: 'center', max: w - 120 });
  const grado = Math.min((g.grado || 0) + 1, GRADOS.length - 1);
  x.font = `700 24px ${BC}`;
  const gw = x.measureText(may(GRADOS[grado])).width + 40;
  caja(x, W / 2 - gw / 2, 840, gw, 44, 22); x.fillStyle = 'rgba(13,11,26,0.75)'; x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(255,211,106,0.6)'; x.stroke();
  texto(x, GRADOS[grado], W / 2, 871, { font: `700 24px ${BC}`, may: true, align: 'center', color: C.oro, esp: 1 });
  texto(x, 'por alzarse con el 1.er puesto ante la pregunta', W / 2, 950, { font: `400 24px ${IN}`, align: 'center', color: C.t2 });
  texto(x, '«' + e.guerra.pregunta + '»', W / 2, 994, { font: `italic 400 30px ${IN}`, align: 'center', max: w - 120 });
  texto(x, `${plural(f.pts, 'punto', 'puntos')} · ${f.g} de ${f.g + f.e + f.p} batallas ganadas`, W / 2, 1056, { font: `700 38px ${BC}`, may: true, align: 'center', color: C.teal });
  // Pie: firma, sello y fecha.
  const yPie = 1200;
  x.strokeStyle = '#5a5490'; x.lineWidth = 1;
  [W / 2 - 300, W / 2 + 300].forEach((px) => { x.beginPath(); x.moveTo(px - 110, yPie); x.lineTo(px + 110, yPie); x.stroke(); });
  x.save(); x.strokeStyle = C.t3; x.lineWidth = 2.5; x.lineCap = 'round'; x.beginPath();
  const fx = W / 2 - 390, fy = yPie - 50;
  x.moveTo(fx + 8, fy + 38); x.bezierCurveTo(fx + 24, fy + 12, fx + 44, fy + 8, fx + 40, fy + 30); x.bezierCurveTo(fx + 36, fy + 52, fx + 62, fy + 46, fx + 78, fy + 22);
  x.bezierCurveTo(fx + 94, fy - 2, fx + 104, fy + 14, fx + 100, fy + 32); x.bezierCurveTo(fx + 96, fy + 50, fx + 128, fy + 40, fx + 146, fy + 18); x.bezierCurveTo(fx + 160, fy + 2, fx + 170, fy + 20, fx + 174, fy + 28);
  x.stroke(); x.restore();
  texto(x, e.guerra.alto || 'El alto mando', W / 2 - 300, yPie + 32, { font: `700 22px ${BC}`, may: true, align: 'center', color: C.t2, esp: 0.9, max: 220 });
  texto(x, new Date(e.guerra.publicada || Date.now()).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2 + 300, yPie - 12, { font: `400 24px ${IN}`, align: 'center' });
  texto(x, 'Fecha del armisticio', W / 2 + 300, yPie + 32, { font: `700 22px ${BC}`, may: true, align: 'center', color: C.t2, esp: 0.9 });
  const sx = W / 2, sy = yPie - 20;
  x.beginPath(); x.arc(sx, sy, 62, 0, Math.PI * 2); x.fillStyle = 'rgba(255,211,106,0.10)'; x.fill(); x.lineWidth = 3; x.strokeStyle = C.oro; x.stroke();
  x.save(); x.setLineDash([2, 4]); x.lineWidth = 1.5; x.beginPath(); x.arc(sx, sy, 43, 0, Math.PI * 2); x.stroke(); x.restore();
  const lema = 'ALTO MANDO · SELLO DE GUERRA · CRUZ AL MÉRITO · ';
  x.save(); x.translate(sx, sy); x.font = `700 12px ${BC}`; x.fillStyle = C.oro; x.textAlign = 'center';
  [...lema].forEach((ch, k) => { x.save(); x.rotate(-Math.PI + (k / lema.length) * Math.PI * 2 + Math.PI / 2); x.fillText(ch, 0, -50); x.restore(); });
  x.restore();
  estrella(sx, sy + 2, 26);
  return cv;
}

// ---------------------------------------------------------------- compartir

const QUE = {
  guerra: { hacer: cartelGuerra, archivo: 'cartel-guerra', titulo: 'Cartel de la guerra' },
  parte: { hacer: cartelParte, archivo: 'parte-de-guerra', titulo: 'Parte de mitad de contienda' },
  podio: { hacer: cartelPodio, archivo: 'cartel-victoria', titulo: 'Cartel de la victoria' },
  diploma: { hacer: diploma, archivo: 'cruz-al-merito', titulo: 'Cruz al mérito' }
};
const enlaceGeneral = () => (S.est.mando && S.est.mando.general ? location.origin + location.pathname + '#g=' + S.est.mando.general : '');
function mensaje(tipo) {
  const e = S.est, n = e.guerra.nombre, url = enlaceGeneral();
  if (tipo === 'guerra') return `¡Comienza la ${n}! ${e.guerra.pregunta} Ya os ha llegado a cada uno la orden de movilización por correo: entrad con vuestro enlace y a votar.${url ? ' Si no lo encontráis: ' + url : ''} ¡Sólo puede quedar uno!`;
  if (tipo === 'parte') {
    const G = porId(e.gente), pr = e.progreso;
    return `PARTE DE GUERRA de la ${n}, a mitad de contienda: ${pr.emitidos} de ${pr.total} batallas libradas. ${pr.rezagados.length ? 'En retaguardia: ' + enumerar(pr.rezagados.map((r) => G[r.id].nombre + ' (' + r.faltan + ')')) + '. ' : ''}Ni un solo resultado desvelado.${url ? ' A votar: ' + url : ''} ¡Sólo puede quedar uno!`;
  }
  const G = porId(e.gente), c = G[e.resultado.tabla[0].id];
  if (tipo === 'podio') return `¡${c.nombre} gana la ${n}! El parte de guerra completo, en la app: ${location.origin + location.pathname}`;
  return `Cruz al mérito para ${c.nombre}, campeón de la ${n}.`;
}

accion('cartel', async (tipo) => {
  const q = QUE[tipo];
  S.velo = `<div class="velo"><div class="caja centro" role="status">Dibujando el cartel…</div></div>`;
  pintar();
  await fuentes();
  const cv = await q.hacer(S.est);
  const blob = await new Promise((ok) => cv.toBlob(ok, 'image/png'));
  const archivo = new File([blob], q.archivo + '.png', { type: 'image/png' });
  const url = URL.createObjectURL(blob), texto = mensaje(tipo);
  S.ui.cartel = { archivo, texto, url };
  const puede = navigator.canShare && navigator.canShare({ files: [archivo] });
  S.velo = `<div class="velo" role="dialog" aria-modal="true" aria-labelledby="velo-t"><div class="caja" style="max-width:460px;gap:10px">
    <div class="fila entre"><h2 class="h2" id="velo-t">${q.titulo}</h2><button class="cuadro" data-a="cerrarCartel" aria-label="Cerrar">${ico('equis')}</button></div>
    <img src="${url}" alt="${esc(q.titulo)}" style="width:100%;border-radius:10px;border:1px solid #3a3566">
    ${puede ? `<button class="btn" data-a="compartirCartel">${ico('wasap')}Compartir</button>` : ''}
    <a class="btn ${puede ? 'linea medio' : ''}" href="${url}" download="${q.archivo}.png">Descargar la imagen</a>
    ${tipo !== 'diploma' ? `<button class="btn linea medio" data-a="copiarTexto">${ico('copiar')}Copiar el texto para WhatsApp</button><p class="peq t2">${esc(texto)}</p>` : ''}
  </div></div>`;
  pintar();
});
accion('compartirCartel', async () => {
  const c = S.ui.cartel;
  try { await navigator.share({ files: [c.archivo], text: c.texto }); } catch (e) { if (e.name !== 'AbortError') aviso('No se ha podido compartir. Descarga la imagen y mándala tú.'); }
});
accion('copiarTexto', async () => {
  try { await navigator.clipboard.writeText(S.ui.cartel.texto); aviso('Texto copiado.', true); } catch (e) { aviso('No se ha podido copiar.'); }
});
accion('cerrarCartel', () => { if (S.ui.cartel) URL.revokeObjectURL(S.ui.cartel.url); S.ui.cartel = null; S.velo = ''; pintar(); });

export function botonCartel(tipo, texto, clase = 'btn linea medio') {
  return `<button class="${clase}" data-a="cartel" data-v="${tipo}">${texto}</button>`;
}
export { cartelGuerra, cartelParte, cartelPodio, diploma, fuentes };
