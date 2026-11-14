// Varias preguntas, plato fuerte y álbum de la guerra, en el navegador.
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node pruebas/album.js [carpeta de capturas]
'use strict';
const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs'), assert = require('assert');
const { chromium } = require('playwright');
const PUERTO = 8137, BASE = 'http://localhost:' + PUERTO + '/', SALIDA = process.argv[2] || '/tmp/gn-album', errores = [];
const NOMBRES = ['María', 'Andrés', 'Carmen', 'Fran', 'Javier', 'Elena'];
const sinTilde = (n) => n.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
async function api(accion, p) {
  const r = await fetch(BASE + 'api', { method: 'POST', body: JSON.stringify(Object.assign({ accion, mando: 'mando-local' }, p)) });
  const j = await r.json();
  if (!j.ok) throw new Error(accion + ': ' + j.error);
  return j.datos;
}
const prueba = async (p) => (await (await fetch(BASE + '_prueba', { method: 'POST', body: JSON.stringify(p || {}) })).json()).datos;

async function edicion(id) {
  const n0 = (await prueba()).correos.length;
  await api('declarar', { guerra: id });
  const tok = {};
  (await prueba()).correos.slice(n0).forEach((c) => { const n = NOMBRES.find((x) => c.para.startsWith(sinTilde(x))); if (n) tok[n] = /#t=([\w.]+)/.exec(c.html)[1]; });
  return tok;
}
async function jugar(id, tok) {
  for (const n of NOMBRES) {
    const s = await api('estado', { token: tok[n] });
    const nom = (gid) => s.gente.find((g) => g.id === gid).nombre;
    for (const b of s.batallas.filter((x) => x.delDia && !x.mia)) await api('apostar', { token: tok[n], batalla: b.id, elegido: b.a }).catch(() => {});
    for (const b of s.batallas.filter((x) => x.mia)) {
      if (b.delDia) await api('apostar', { token: tok[n], batalla: b.id, elegido: NOMBRES.indexOf(nom(b.a)) < NOMBRES.indexOf(nom(b.b)) ? b.a : b.b });
      const elegido = (n === 'Javier' ? NOMBRES.indexOf(nom(b.a)) > NOMBRES.indexOf(nom(b.b)) : NOMBRES.indexOf(nom(b.a)) < NOMBRES.indexOf(nom(b.b))) ? b.a : b.b;
      const proclama = b.of === 1 && n !== 'Fran' ? `${nom(elegido)} es la normalidad hecha persona, y lo sabe todo el mundo.` : '';
      await api('votar', { token: tok[n], batalla: b.id, elegido, proclama });
    }
    await api('porra', { token: tok[n], orden: s.gente.map((g) => g.id) }).catch(() => {});
  }
  await prueba({ salto: 20000 });
  return api('estado', { guerra: id });
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = spawn('node', [path.join(__dirname, '..', 'herramientas', 'servidor.js'), String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => servidor.stdout.once('data', r));
  const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const pagina = async (hash, ancho = 390, alto = 844) => {
    const p = await (await nav.newContext({ viewport: { width: ancho, height: alto }, acceptDownloads: true })).newPage();
    p.on('pageerror', (e) => errores.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
    await p.goto(BASE + hash); await p.waitForLoadState('networkidle');
    return p;
  };
  try {
    // ---- primera edición: tres preguntas, proclamas, Radio Macuto y desfile completo
    const { id } = await api('crearGuerra', { plan: { nombre: 'Guerra de la Normalidad', pregunta: '¿Quién es más normal?', campo: 'Amigos', premio: 'Una cena pagada por los demás',
      otras: ['¿Quién sobreviviría a un apocalipsis zombi?', '¿Quién llega siempre tarde?'],
      gente: NOMBRES.map((n) => ({ nombre: n, correo: sinTilde(n) + '@ejemplo.test', mando: n === 'Fran' })) } });
    const tok = await edicion(id);
    const ma = await pagina('#t=' + tok['María']);
    const cabecera = await ma.locator('h1').first().innerText();
    assert.ok(/apocalipsis|normal|tarde/i.test(cabecera), 'la cabecera lleva la pregunta de su ofensiva');
    await ma.locator('button:visible', { hasText: 'Ordenanzas' }).first().click(); await ma.waitForTimeout(200);
    assert.ok(/Varias preguntas/i.test(await ma.locator('#app').innerText()));
    await api('pulla', { token: tok['Carmen'], texto: 'Javier vota con los ojos cerrados.' });
    await api('pulla', { token: tok['Andrés'], texto: 'Elena aún está leyendo las ordenanzas.' });
    for (const p of (await api('estado', { guerra: id, token: tok['Fran'] })).mando.pullas) await api('moderar', { guerra: id, id: p.id, emitir: true });
    await jugar(id, tok);
    const inf = await api('informe', { guerra: id });
    for (const p of inf.proclamas.slice(0, 3)) await api('estrella', { guerra: id, batalla: p.batalla, de: p.de, si: true });
    assert.strictEqual(inf.resultado.preguntas.length, 3);
    await api('desfile', { guerra: id, orden: 'empezar' });
    let vio = false;
    for (let k = 0; k < 60; k++) {
      const s = await api('estado', { token: tok['María'] });
      if (s.desfile.actual.t === 'pregunta' && !vio) {
        await ma.goto(BASE + '#/batallas'); await ma.reload(); await ma.waitForLoadState('networkidle'); await ma.waitForTimeout(300);
        assert.ok(/Pregunta 1 de 3/i.test(await ma.locator('#app').innerText()), 'paso del desfile de la pregunta');
        await ma.screenshot({ path: path.join(SALIDA, '1-desfile-pregunta.png'), fullPage: true });
        vio = true;
      }
      if (s.desfile.ultimo) break;
      await api('desfile', { guerra: id, orden: 'siguiente' });
    }
    assert.ok(vio, 'el desfile pasa por los campeones de cada pregunta');
    await api('desfile', { guerra: id, orden: 'terminar' });
    await ma.goto(BASE + '#/batallas'); await ma.reload(); await ma.waitForLoadState('networkidle'); await ma.waitForTimeout(300);
    assert.ok(/Campeones por pregunta/i.test(await ma.locator('#app').innerText()));
    await ma.screenshot({ path: path.join(SALIDA, '2-parte-publicado.png'), fullPage: true });

    // ---- álbum: imagen y PDF
    await ma.locator('[data-a="album"]').click();
    await ma.waitForSelector('text=Descargar el PDF', { timeout: 30000 });
    await ma.screenshot({ path: path.join(SALIDA, '3-dialogo-album.png') });
    const [dImg] = await Promise.all([ma.waitForEvent('download'), ma.getByRole('link', { name: 'Descargar la imagen' }).click()]);
    const img = path.join(SALIDA, 'album.jpg'); await dImg.saveAs(img);
    const [dPdf] = await Promise.all([ma.waitForEvent('download'), ma.getByRole('link', { name: 'Descargar el PDF' }).click()]);
    const pdf = path.join(SALIDA, 'album.pdf'); await dPdf.saveAs(pdf);
    assert.strictEqual(dPdf.suggestedFilename(), 'album-guerra-de-la-normalidad.pdf');
    const info = execFileSync('pdfinfo', [pdf]).toString();
    const paginas = Number(/Pages:\s+(\d+)/.exec(info)[1]);
    assert.ok(paginas >= 3 && /595\.28 x 841\.89/.test(info), 'PDF A4 legible:\n' + info);
    execFileSync('pdftoppm', ['-r', '40', '-png', pdf, path.join(SALIDA, 'pagina')]);
    assert.ok(fs.statSync(img).size > 100000, 'imagen del álbum');
    await ma.locator('[data-a="cerrarAlbum"]').click();

    // ---- segunda edición: la batalla del día es un plato fuerte, con su motivo
    const { id: id2 } = await api('contraofensiva', { guerra: id });
    const tok2 = await edicion(id2);
    const s2 = await api('estado', { token: tok2['María'] });
    const plato = s2.batallas.find((b) => b.delDia && b.of === 1);
    assert.ok(plato && /^(Revancha|La gran rivalidad|Duelo en el escalafón)/.test(plato.motivo), 'plato fuerte con motivo');
    const m2 = await pagina('#t=' + tok2[NOMBRES.find((n) => { const g = s2.gente.find((x) => x.nombre === n); return g.id !== plato.a && g.id !== plato.b; })]);
    for (let k = 0; k < 8 && !(await m2.locator('[data-a="apostar"]').count()); k++) { await m2.locator('[data-a="votar"][data-v="a"]').click(); await m2.waitForTimeout(200); }
    assert.ok(new RegExp(plato.motivo.slice(0, 12)).test(await m2.locator('#app').innerText()), 'el motivo se ve en la app');
    await m2.screenshot({ path: path.join(SALIDA, '4-plato-fuerte.png'), fullPage: true });
  } finally { await nav.close(); servidor.kill(); }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); process.exit(1); }
  console.log('Álbum sin errores. Capturas en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });
