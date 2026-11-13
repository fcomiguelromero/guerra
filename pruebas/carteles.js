// Dibuja los cuatro carteles con una guerra simulada y guarda las imágenes.
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node pruebas/carteles.js [carpeta]
'use strict';
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), assert = require('assert');
const { chromium } = require('playwright');
const PUERTO = 8134, BASE = 'http://localhost:' + PUERTO + '/', SALIDA = process.argv[2] || '/tmp/gn6', errores = [];
const NOMBRES = ['María', 'Andrés', 'Carmen', 'Fran', 'Javier', 'Elena', 'Rafa', 'Lola'];
async function api(accion, p) {
  const r = await fetch(BASE + 'api', { method: 'POST', body: JSON.stringify(Object.assign({ accion, mando: 'mando-local' }, p)) });
  const j = await r.json(); if (!j.ok) throw new Error(accion + ': ' + j.error); return j.datos;
}
async function guardarCartel(p, nombre) {
  await p.waitForSelector('.velo img');
  const datos = await p.evaluate(async () => {
    const b = await (await fetch(document.querySelector('.velo img').src)).blob();
    return await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
  });
  fs.writeFileSync(path.join(SALIDA, nombre + '.png'), Buffer.from(datos.split(',')[1], 'base64'));
  await p.screenshot({ path: path.join(SALIDA, nombre + '-ventana.png') });
  await p.locator('[data-a="cerrarCartel"]').click();
}
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = spawn('node', [path.join(__dirname, '..', 'herramientas', 'servidor.js'), String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => servidor.stdout.once('data', r));
  const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    const p = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    p.on('pageerror', (e) => errores.push(e.message));
    await p.goto(BASE + '#mando=mando-local'); await p.waitForLoadState('networkidle');
    // Una foto de verdad, dibujada en el navegador, para dos combatientes.
    const foto = await p.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 400; c.height = 480; const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 400, 480); g.addColorStop(0, '#c86b3c'); g.addColorStop(1, '#6b2f5a'); x.fillStyle = g; x.fillRect(0, 0, 400, 480);
      x.fillStyle = '#f1c27d'; x.beginPath(); x.arc(200, 190, 95, 0, 7); x.fill(); x.fillRect(110, 300, 180, 200); return c.toDataURL('image/jpeg', 0.8);
    });
    const { id: idFoto } = await api('subirFoto', { datos: foto });
    const { id } = await api('crearGuerra', { plan: { nombre: 'Guerra de la Normalidad', pregunta: '¿Quién es más normal?', premio: 'Una cena pagada', extras: { desfile: false },
      gente: NOMBRES.map((n, i) => ({ nombre: n, correo: 'c' + i + '@ejemplo.test', mando: n === 'Fran', foto: i < 2 ? idFoto : null, frase: 'Frase' })) } });
    await api('declarar', { guerra: id });
    const correos = (await (await fetch(BASE + '_prueba', { method: 'POST', body: '{}' })).json()).datos.correos;
    const tok = {}; correos.forEach((c) => { tok[NOMBRES[Number(c.para[1])]] = /#t=([\w.]+)/.exec(c.html)[1]; });
    const votar = async (n, cuantas) => {
      const s = await api('estado', { token: tok[n] });
      for (const b of s.batallas.filter((x) => x.mia && !x.voto).slice(0, cuantas)) {
        const ia = NOMBRES.indexOf(s.gente.find((g) => g.id === b.a).nombre), ib = NOMBRES.indexOf(s.gente.find((g) => g.id === b.b).nombre);
        await api('votar', { token: tok[n], batalla: b.id, elegido: (n === 'Javier' ? ia > ib : ia < ib) ? b.a : b.b });
      }
    };
    for (const n of ['María', 'Andrés', 'Carmen', 'Fran', 'Javier']) await votar(n, 99);
    await votar('Elena', 5); await votar('Rafa', 1);
    await p.goto(BASE + '#t=' + tok['Fran']); await p.waitForTimeout(800); await p.waitForLoadState('networkidle');
    await p.getByRole('button', { name: 'Cuartel' }).first().click(); await p.waitForLoadState('networkidle');
    await p.locator('[data-a="cartel"][data-v="guerra"]').click(); await guardarCartel(p, '1-guerra');
    await p.locator('[data-a="cartel"][data-v="parte"]').click(); await guardarCartel(p, '2-parte');
    for (const n of ['Elena', 'Rafa', 'Lola']) await votar(n, 99);
    await fetch(BASE + '_prueba', { method: 'POST', body: JSON.stringify({ salto: 20000 }) });
    await api('estado', { guerra: id });
    await api('publicar', { guerra: id });
    await p.goto(BASE + '#/batallas'); await p.reload(); await p.waitForLoadState('networkidle');
    await p.locator('[data-a="cartel"][data-v="podio"]').click(); await guardarCartel(p, '3-podio');
    await p.locator('[data-a="cartel"][data-v="diploma"]').click(); await guardarCartel(p, '4-diploma');
  } finally { await nav.close(); servidor.kill(); }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); process.exit(1); }
  console.log('Carteles dibujados en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });
