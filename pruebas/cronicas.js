// Tres guerras simuladas con el motor local y las crónicas en el navegador.
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node pruebas/cronicas.js [carpeta de capturas]
'use strict';
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), assert = require('assert');
const { chromium } = require('playwright');
const PUERTO = 8133, BASE = 'http://localhost:' + PUERTO + '/', SALIDA = process.argv[2] || '/tmp/gn5', errores = [];
const NOMBRES = ['María', 'Andrés', 'Carmen', 'Fran', 'Javier', 'Elena'];
async function api(accion, p) {
  const r = await fetch(BASE + 'api', { method: 'POST', body: JSON.stringify(Object.assign({ accion, mando: 'mando-local' }, p)) });
  const j = await r.json();
  if (!j.ok) throw new Error(accion + ': ' + j.error);
  return j.datos;
}
const salto = (ms) => fetch(BASE + '_prueba', { method: 'POST', body: JSON.stringify({ salto: ms }) });
async function guerra(nombre, gente, fuerza, desertor) {
  const { id } = await api('crearGuerra', { plan: { nombre, pregunta: '¿Quién es más normal?', extras: { desfile: false },
    gente: gente.map((n) => ({ nombre: n, correo: n.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + '@ejemplo.test', mando: n === 'Fran' })) } });
  await api('declarar', { guerra: id });
  const plan = await api('plan', { guerra: id }), cuartel = (await api('cuartel', {})).guerras;
  const doc = await api('informe', { guerra: id }).catch(() => null);
  return { id, plan, cuartel, doc };
}
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = spawn('node', [path.join(__dirname, '..', 'herramientas', 'servidor.js'), String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => servidor.stdout.once('data', r));
  const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  let tokenJavier = null;
  try {
    const ediciones = [['Guerra de la Normalidad', NOMBRES, 0, 'Elena'], ['Guerra de la Normalidad', NOMBRES, 1, null], ['Guerra de la mejor boda', NOMBRES.slice(0, 5), 2, null]];
    for (const [nombre, gente, giro, desertor] of ediciones) {
      const { id } = await guerra(nombre, gente);
      // Tokens: el alto mando los ve en el estado de su carta; para el resto se usan los correos del servidor.
      const correos = (await (await fetch(BASE + '_prueba', { method: 'POST', body: '{}' })).json()).datos.correos.slice(-gente.length);
      const tok = {};
      correos.forEach((c) => { const n = gente.find((x) => c.para.startsWith(x.toLowerCase().normalize('NFD').replace(/[^a-z]/g, ''))); tok[n] = /#t=([\w.]+)/.exec(c.html)[1]; });
      tokenJavier = tok['Javier'];
      for (const n of gente) {
        if (n === desertor) continue;
        const s = await api('estado', { token: tok[n] });
        for (const b of s.batallas.filter((x) => x.mia)) {
          const ia = (NOMBRES.indexOf(s.gente.find((g) => g.id === b.a).nombre) + giro) % 6, ib = (NOMBRES.indexOf(s.gente.find((g) => g.id === b.b).nombre) + giro) % 6;
          await api('votar', { token: tok[n], batalla: b.id, elegido: (n === 'Javier' ? ia > ib : ia < ib) ? b.a : b.b });
        }
        if (n !== 'Carmen') await api('porra', { token: tok[n], orden: s.gente.filter((g) => g.nombre !== desertor).map((g) => g.id) }).catch(() => {});
      }
      if (desertor) {
        const est = await api('estado', { guerra: id });
        const dec = {};
        est.progreso.rezagados.forEach((r) => { dec[r.id] = { accion: 'expulsar', sentencia: 'A pelar patatas.' }; });
        await api('armisticio', { guerra: id, decisiones: dec });
      } else { await salto(20000); await api('estado', { guerra: id }); }
      await api('publicar', { guerra: id });
    }
    const p = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    p.on('pageerror', (e) => errores.push(e.message));
    await p.goto(BASE + '#t=' + tokenJavier); await p.waitForLoadState('networkidle');
    await p.getByRole('button', { name: 'Crónicas' }).first().click();
    await p.waitForSelector('[data-a="pestanaCronicas"]'); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(SALIDA, '1-guerras.png'), fullPage: true });
    await p.locator('[data-a="abrirCronica"]').first().click(); await p.waitForTimeout(200);
    await p.locator('[data-a="pestanaCronicas"][data-v="escalafon"]').click(); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(SALIDA, '2-escalafon.png'), fullPage: true });
    const texto = await p.locator('body').innerText();
    assert.ok(/2 ediciones/.test(texto), 'la Guerra de la Normalidad suma dos ediciones');
    await p.locator('[data-a="pestanaCronicas"][data-v="medallero"]').click(); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(SALIDA, '3-medallero.png'), fullPage: true });
    assert.ok(/sargento/i.test(await p.locator('body').innerText()), 'tres guerras terminadas: sargento');
    const pc = await (await nav.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
    pc.on('pageerror', (e) => errores.push(e.message));
    await pc.goto(BASE + '#t=' + tokenJavier); await pc.waitForLoadState('networkidle');
    await pc.getByRole('button', { name: 'Crónicas' }).first().click(); await pc.waitForTimeout(400);
    await pc.locator('[data-a="pestanaCronicas"][data-v="escalafon"]').click(); await pc.waitForTimeout(200);
    await pc.screenshot({ path: path.join(SALIDA, '4-escalafon-pc.png'), fullPage: true });
  } finally { await nav.close(); servidor.kill(); }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); process.exit(1); }
  console.log('Crónicas sin errores. Capturas en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });
