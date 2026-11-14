// Álbum de la guerra: el recuerdo final, para todos los combatientes cuando se publica el parte.
// Se dibuja en el propio dispositivo por bloques (portada, cuadro de honor, parte, condecoraciones...)
// y sale de dos maneras: una imagen larga para WhatsApp y un PDF de páginas A4 para guardar o imprimir.
import { S, esc, plural, enumerar, porId, ordinal, signo, ico, pintar, aviso, accion } from './base.js';
import { dibujo } from './carteles.js';
import { listaCuriosidades, TITULOS, detallePremio } from './combate.js';

const { W, M, C, BC, IN, may, imagen, fuentes, caja, texto, lineas, parrafo, cartita, sello } = dibujo;
const PAGINA = Math.round(W * Math.SQRT2);           // proporción A4
const ANCHO = W - 2 * M;
const sinEtiquetas = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent; };

// Cada bloque se dibuja en su propio lienzo transparente, tan alto como haga falta, y luego se recorta.
async function bloque(alto, dibujar) {
  const c = document.createElement('canvas');
  c.width = W; c.height = alto;
  const x = c.getContext('2d');
  const usado = Math.ceil(await dibujar(x));
  const r = document.createElement('canvas');
  r.width = W; r.height = Math.max(1, usado);
  r.getContext('2d').drawImage(c, 0, 0);
  return r;
}
function titulo(x, s, y, color) {
  texto(x, s, M, y + 52, { font: `800 56px ${BC}`, may: true, color: color || '#fff', esp: 1 });
  x.fillStyle = color || C.teal; x.fillRect(M, y + 70, 90, 5);
  return 100;
}
function linea(x, y) { x.fillStyle = C.borde; x.fillRect(M, y, ANCHO, 2); }

// ---------------------------------------------------------------- bloques

async function portada(e) {
  const g = e.guerra, preg = (g.preguntas && g.preguntas.length ? g.preguntas : [g.pregunta]).filter(Boolean);
  return bloque(1200, async (x) => {
    let y = 120;
    texto(x, 'Álbum de la guerra', W / 2, y, { font: `700 30px ${IN}`, may: true, align: 'center', color: C.t2, esp: 8 });
    y += 40;
    const nombre = lineas(x, may(g.nombre), `800 120px ${BC}`, ANCHO);
    nombre.forEach((l) => { y += 118; texto(x, l, W / 2, y, { font: `800 120px ${BC}`, align: 'center' }); });
    if (g.campo) { y += 66; texto(x, g.campo, W / 2, y, { font: `700 40px ${BC}`, may: true, align: 'center', color: C.teal, esp: 4 }); }
    y += 40;
    preg.forEach((q) => { y += 20; y += parrafo(x, q, W / 2, y + 44, { font: `800 ${preg.length > 1 ? 40 : 52}px ${BC}`, align: 'center', color: C.oro, max: ANCHO, alto: preg.length > 1 ? 46 : 58 }); });
    const f = g.publicada || g.terminada || Date.now();
    y += 70;
    texto(x, new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, y, { font: `400 30px ${IN}`, align: 'center', color: C.t3 });
    y += 46;
    texto(x, `${plural(e.resultado.tabla.length, 'contendiente', 'contendientes')} · ${plural(e.resultado.batallas.length, 'batalla', 'batallas')}`, W / 2, y, { font: `400 28px ${IN}`, align: 'center', color: C.t2 });
    return y + 60;
  });
}

async function honor(e) {
  const r = e.resultado, G = porId(e.gente), t = r.tabla;
  return bloque(1100, async (x) => {
    let y = titulo(x, 'Cuadro de honor', 0, C.oro) + 30;
    const base = y + 640;
    const puesto = async (f, cx, w, fotoH, nomT, alto, color, num, colores, pie, brillo) => {
      if (!f) return;
      const hCarta = fotoH + nomT * 1.05 + 18 + 24 * 1.4 + 6 + 8;
      await cartita(x, G[f.id], cx - w / 2, base - alto - 16 - hCarta, w, fotoH, nomT, { colores, pie, pieTam: 22, pieColor: brillo ? C.oro : C.t3, brillo });
      const g = x.createLinearGradient(0, base - alto, 0, base);
      g.addColorStop(0, color + '55'); g.addColorStop(1, color + '0d');
      x.beginPath(); x.roundRect(cx - w / 2, base - alto, w, alto, [14, 14, 0, 0]); x.fillStyle = g; x.fill(); x.lineWidth = 2; x.strokeStyle = color; x.stroke();
      texto(x, num, cx, base - alto / 2 + 26, { font: `800 72px ${BC}`, align: 'center', color });
    };
    await puesto(t[1], W / 2 - 320, 260, 190, 44, 110, C.teal, '2', [[0, C.teal], [0.55, C.violeta], [1, C.rosa]], plural(t[1] ? t[1].pts : 0, 'punto', 'puntos'));
    await puesto(t[2], W / 2 + 320, 260, 190, 44, 76, C.rosa, '3', [[0, C.rosa], [0.55, C.violeta], [1, C.teal]], plural(t[2] ? t[2].pts : 0, 'punto', 'puntos'));
    await puesto(t[0], W / 2, 320, 240, 56, 170, C.oro, '1', [[0, C.oro], [0.45, C.rosa], [0.75, C.violeta], [1, C.teal]], plural(t[0].pts, 'punto', 'puntos'), true);
    y = base + 56;
    if (e.guerra.premio) { texto(x, 'Premio: ' + e.guerra.premio, W / 2, y, { font: `600 32px ${IN}`, align: 'center', color: C.oro, max: ANCHO }); y += 52; }
    return y + 20;
  });
}

async function parte(e) {
  const r = e.resultado, G = porId(e.gente), filas = r.tabla, alto = 64;
  return bloque(240 + filas.length * alto + 120, async (x) => {
    let y = titulo(x, 'Parte de guerra', 0) + 20;
    const col = { pos: M + 10, nom: M + 90, gep: W - M - 330, dif: W - M - 160, pts: W - M - 10 };
    texto(x, 'G-E-P', col.gep, y + 24, { font: `600 22px ${IN}`, color: C.t2, align: 'center' });
    texto(x, 'Dif.', col.dif, y + 24, { font: `600 22px ${IN}`, color: C.t2, align: 'center' });
    texto(x, 'Pts', col.pts, y + 24, { font: `600 22px ${IN}`, color: C.t2, align: 'right' });
    y += 40;
    filas.forEach((f, i) => {
      if (i % 2 === 0) { caja(x, M, y, ANCHO, alto - 6, 10); x.fillStyle = 'rgba(255,255,255,0.04)'; x.fill(); }
      const color = f.pos === 1 ? C.oro : f.pos <= 3 ? C.teal : C.txt, mid = y + alto / 2 + 8;
      texto(x, f.pos + '.º', col.pos, mid + 4, { font: `800 38px ${BC}`, color });
      texto(x, G[f.id].nombre, col.nom, mid + 4, { font: `700 36px ${BC}`, may: true, color: '#fff', max: col.gep - col.nom - 90 });
      texto(x, `${f.g}-${f.e}-${f.p}`, col.gep, mid, { font: `400 28px ${IN}`, align: 'center', color: C.t3 });
      texto(x, signo(f.dif), col.dif, mid, { font: `400 28px ${IN}`, align: 'center', color: f.dif > 0 ? C.teal : f.dif < 0 ? C.rosa : C.t3 });
      texto(x, String(f.pts), col.pts, mid + 4, { font: `800 38px ${BC}`, align: 'right', color });
      y += alto;
    });
    if (r.desertores.length) {
      y += 50;
      const nombres = enumerar(r.desertores.map((d) => G[d.id].nombre));
      texto(x, nombres, M, y, { font: `400 30px ${IN}`, color: C.t2, max: ANCHO - 240 });
      x.font = `400 30px ${IN}`;
      const wn = Math.min(x.measureText(nombres).width, ANCHO - 240);
      x.fillStyle = C.t2; x.fillRect(M, y - 10, wn, 2);
      sello(x, r.desertores.length > 1 ? 'Desertores' : 'Desertor', M + wn + 120, y - 10, 28, C.rosa, -4);
      y += 20;
    }
    return y + 40;
  });
}

// Lista de tarjetas con título en mayúsculas y texto debajo: condecoraciones, campeones por pregunta...
async function tarjetas(nombre, color, items) {
  if (!items.length) return null;
  return bloque(200 + items.length * 260, async (x) => {
    let y = titulo(x, nombre, 0, color) + 20;
    items.forEach((it) => {
      const ls = lineas(x, it.texto, `400 28px ${IN}`, ANCHO - 60);
      const h = 66 + 44 + ls.length * 38 + 20;
      caja(x, M, y, ANCHO, h, 16); x.fillStyle = 'rgba(255,255,255,0.05)'; x.fill(); x.lineWidth = 2; x.strokeStyle = color; x.stroke();
      texto(x, it.sobre, M + 30, y + 46, { font: `700 24px ${IN}`, may: true, color, esp: 3, max: ANCHO - 60 });
      texto(x, it.nombre, M + 30, y + 96, { font: `800 46px ${BC}`, may: true, color: '#fff', max: ANCHO - 60 });
      ls.forEach((l, k) => texto(x, l, M + 30, y + 140 + k * 38, { font: `400 28px ${IN}`, color: C.t3 }));
      y += h + 18;
    });
    return y + 30;
  });
}

// Lista de citas en cursiva: proclamas y pullas.
async function citas(nombre, color, items, nota) {
  if (!items.length) return null;
  return bloque(260 + items.length * 300, async (x) => {
    let y = titulo(x, nombre, 0, color) + 10;
    if (nota) { texto(x, nota, M, y + 20, { font: `400 24px ${IN}`, color: C.t2, max: ANCHO }); y += 50; }
    items.forEach((it) => {
      const ls = lineas(x, '«' + it.texto + '»', `italic 400 32px ${IN}`, ANCHO - 40);
      x.fillStyle = color; x.fillRect(M, y + 10, 5, ls.length * 44 + (it.pie ? 40 : 0));
      ls.forEach((l, k) => texto(x, l, M + 30, y + 44 + k * 44, { font: `italic 400 32px ${IN}`, color: '#fff' }));
      y += ls.length * 44;
      if (it.pie) { texto(x, it.pie, M + 30, y + 36, { font: `400 24px ${IN}`, color: C.t2, max: ANCHO - 40 }); y += 40; }
      y += 34;
    });
    return y + 20;
  });
}

async function cierre(e) {
  return bloque(320, async (x) => {
    linea(x, 30);
    texto(x, '¡Sólo puede quedar uno!', W / 2, 140, { font: `800 72px ${BC}`, may: true, align: 'center', color: C.oro });
    texto(x, e.guerra.firma ? 'Alto mando: ' + e.guerra.firma : 'Guerra de la Normalidad', W / 2, 200, { font: `400 28px ${IN}`, align: 'center', color: C.t2 });
    return 250;
  });
}

async function bloques(e) {
  const r = e.resultado, G = porId(e.gente), nom = (id) => G[id].nombre;
  const premios = ['rebelde', 'borrego', 'tardon', 'adivino'].filter((k) => r.premios[k]).map((k) => ({ sobre: TITULOS[k], nombre: nom(r.premios[k].id), texto: detallePremio(Object.assign({ cual: k }, r.premios[k])) }));
  if (r.porra && r.porra.gana && r.porra.gana.length) premios.push({ sobre: r.porra.gana.length > 1 ? 'Ganadores de la porra' : 'Ganador de la porra', nombre: enumerar(r.porra.gana.map(nom)), texto: `A ${plural(r.porra.lista[0].suma, 'puesto', 'puestos')} del parte final.` });
  const preguntas = (r.preguntas || []).map((q) => ({ sobre: 'Pregunta ' + q.k + ' · ' + plural(q.pts, 'punto', 'puntos'), nombre: nom(q.id), texto: q.texto }));
  const curios = listaCuriosidades(r, G).map((h) => ({ sobre: '', nombre: '', texto: sinEtiquetas(h) }));
  const proclamas = (r.proclamas || []).map((p) => ({ texto: p.texto, pie: `${nom(p.a)} contra ${nom(p.b)} · a ${nom(p.elegido)}` }));
  const pullas = ((e.radio && e.radio.antena) || []).slice().reverse().map((p) => ({ texto: p.texto }));
  const consejo = r.desertores.map((d) => ({ sobre: 'Consejo de guerra', nombre: nom(d.id), texto: (d.sentencia ? 'Sentencia: ' + d.sentencia + '. ' : '') + 'Dejó ' + plural(d.faltaban, 'batalla', 'batallas') + ' sin librar.' }));
  const lista = [await portada(e), await honor(e), await parte(e),
    await tarjetas('Campeones por pregunta', C.oro, preguntas),
    await tarjetas('Condecoraciones', C.teal, premios),
    await tarjetas('Consejo de guerra', C.rosa, consejo),
    curios.length ? await citasLlanas('Curiosidades', curios) : null,
    await citas('Proclamas anónimas', C.violeta, proclamas, 'Las mejores razones de los votos, sin firma.'),
    await citas('Radio Macuto', C.rosa, pullas, 'Pullas emitidas desde las trincheras.'),
    await cierre(e)];
  return lista.filter(Boolean);
}
async function citasLlanas(nombre, items) {
  return bloque(200 + items.length * 200, async (x) => {
    let y = titulo(x, nombre, 0) + 20;
    items.forEach((it) => {
      const ls = lineas(x, it.texto, `400 30px ${IN}`, ANCHO - 30);
      x.fillStyle = C.teal; x.beginPath(); x.arc(M + 8, y + 22, 6, 0, Math.PI * 2); x.fill();
      ls.forEach((l, k) => texto(x, l, M + 30, y + 32 + k * 42, { font: `400 30px ${IN}`, color: C.t3 }));
      y += ls.length * 42 + 26;
    });
    return y + 20;
  });
}

// ---------------------------------------------------------------- montaje: imagen larga y páginas

async function pintarFondo(x, alto) {
  x.fillStyle = C.fondo; x.fillRect(0, 0, W, alto);
  try {
    const img = await imagen('assets/fondo-mapa-pc.svg');
    x.globalAlpha = 0.55;
    for (let y = 0; y < alto; y += 880) x.drawImage(img, -100, y, 1280, 880);
    x.globalAlpha = 1;
  } catch (e) { /* color liso */ }
  const g = x.createRadialGradient(W / 2, 0, 0, W / 2, 0, W);
  g.addColorStop(0, 'rgba(255,211,106,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, Math.min(alto, W));
}
async function imagenLarga(bs) {
  const alto = bs.reduce((t, b) => t + b.height + 40, 40);
  const c = document.createElement('canvas');
  c.width = W; c.height = alto;
  const x = c.getContext('2d');
  await pintarFondo(x, alto);
  let y = 40;
  bs.forEach((b) => { x.drawImage(b, 0, y); y += b.height + 40; });
  return c;
}
// Reparte los bloques en páginas A4: si un bloque no cabe en lo que queda, pasa a la siguiente;
// si no cabe ni en una página entera, se corta en trozos.
async function paginas(e, bs) {
  const pags = [], margen = 70, util = PAGINA - 2 * margen - 50;
  let actual = null, y = 0;
  const nueva = async () => {
    const c = document.createElement('canvas');
    c.width = W; c.height = PAGINA;
    const x = c.getContext('2d');
    await pintarFondo(x, PAGINA);
    pags.push(c); actual = x; y = margen;
  };
  await nueva();
  for (const b of bs) {
    if (b.height <= util) {
      if (y + b.height > margen + util) await nueva();
      actual.drawImage(b, 0, y); y += b.height + 30;
    } else {
      for (let desde = 0; desde < b.height; desde += util) {
        if (y > margen) await nueva();
        const h = Math.min(util, b.height - desde);
        actual.drawImage(b, 0, desde, W, h, 0, y, W, h); y += h + 30;
      }
    }
  }
  pags.forEach((c, i) => {
    const x = c.getContext('2d');
    texto(x, `${e.guerra.nombre} · ${i + 1} de ${pags.length}`, W / 2, PAGINA - 40, { font: `400 22px ${IN}`, align: 'center', color: C.t2, max: W - 2 * M });
  });
  return pags;
}

// PDF mínimo: una imagen JPEG por página A4, sin librerías.
async function pdf(pags) {
  const enc = new TextEncoder(), trozos = [], pos = [];
  let largo = 0;
  const poner = (d) => { const b = typeof d === 'string' ? enc.encode(d) : d; trozos.push(b); largo += b.length; };
  const obj = (n, cuerpo) => { pos[n] = largo; poner(`${n} 0 obj\n`); cuerpo(); poner('\nendobj\n'); };
  const jpgs = [];
  for (const c of pags) {
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.86));
    jpgs.push(new Uint8Array(await blob.arrayBuffer()));
  }
  const n = pags.length, pw = 595.28, ph = 841.89;
  poner('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1, () => poner('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => poner(`<< /Type /Pages /Count ${n} /Kids [${pags.map((_, i) => (3 + i * 3) + ' 0 R').join(' ')}] >>`));
  pags.forEach((c, i) => {
    const pg = 3 + i * 3, ct = pg + 1, im = pg + 2;
    obj(pg, () => poner(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>`));
    const flujo = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
    obj(ct, () => { poner(`<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`); });
    obj(im, () => {
      poner(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpgs[i].length} >>\nstream\n`);
      poner(jpgs[i]); poner('\nendstream');
    });
  });
  const total = 3 + n * 3, xref = largo;
  let tabla = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let k = 1; k < total; k++) tabla += String(pos[k]).padStart(10, '0') + ' 00000 n \n';
  poner(tabla + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(trozos, { type: 'application/pdf' });
}

// ---------------------------------------------------------------- botón y diálogo

const nombreArchivo = () => 'album-' + S.est.guerra.nombre.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
accion('album', async () => {
  S.velo = `<div class="velo"><div class="caja centro" role="status">Montando el álbum de la guerra…</div></div>`;
  pintar();
  try {
    await fuentes();
    const bs = await bloques(S.est);
    const larga = await imagenLarga(bs);
    const png = await new Promise((ok) => larga.toBlob(ok, 'image/jpeg', 0.9));
    const doc = await pdf(await paginas(S.est, bs));
    const archivo = new File([png], nombreArchivo() + '.jpg', { type: 'image/jpeg' });
    const url = URL.createObjectURL(png), urlPdf = URL.createObjectURL(doc);
    S.ui.album = { archivo, url, urlPdf };
    const puede = navigator.canShare && navigator.canShare({ files: [archivo] });
    S.velo = `<div class="velo" role="dialog" aria-modal="true" aria-labelledby="velo-t"><div class="caja" style="max-width:460px;gap:10px;max-height:92vh">
      <div class="fila entre"><h2 class="h2" id="velo-t">Álbum de la guerra</h2><button class="cuadro" data-a="cerrarAlbum" aria-label="Cerrar">${ico('equis')}</button></div>
      <div style="overflow:auto;max-height:46vh;border-radius:10px;border:1px solid #3a3566"><img src="${url}" alt="Álbum de la guerra" style="width:100%;display:block"></div>
      ${puede ? `<button class="btn" data-a="compartirAlbum">${ico('wasap')}Compartir la imagen</button>` : ''}
      <a class="btn ${puede ? 'linea medio' : ''}" href="${url}" download="${nombreArchivo()}.jpg">Descargar la imagen</a>
      <a class="btn linea medio" href="${urlPdf}" download="${nombreArchivo()}.pdf">Descargar el PDF</a>
      <p class="peq t2">La imagen, para mandarla por WhatsApp; el PDF, para guardarlo o imprimirlo.</p>
    </div></div>`;
  } catch (err) {
    S.velo = '';
    aviso('No se ha podido montar el álbum en este dispositivo.');
  }
  pintar();
});
accion('compartirAlbum', async () => {
  try { await navigator.share({ files: [S.ui.album.archivo], text: `Álbum de la ${S.est.guerra.nombre}. ¡Sólo puede quedar uno!` }); }
  catch (e) { if (e.name !== 'AbortError') aviso('No se ha podido compartir. Descarga la imagen y mándala tú.'); }
});
accion('cerrarAlbum', () => {
  if (S.ui.album) { URL.revokeObjectURL(S.ui.album.url); URL.revokeObjectURL(S.ui.album.urlPdf); }
  S.ui.album = null; S.velo = ''; pintar();
});
export const botonAlbum = (clase = 'btn linea medio crece') => `<button class="${clase}" data-a="album">Álbum de la guerra</button>`;
export { bloques, imagenLarga, paginas, pdf };
