// Torneo por eliminatorias en el navegador: plan, cuadro, ronda cumplida, cerrar ronda y cuadro final.
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node pruebas/torneo.js [carpeta de capturas]
'use strict';
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), assert = require('assert');
const { chromium } = require('playwright');
const plan = require('./ayuda-plan');
const PUERTO = 8139, BASE = 'http://localhost:' + PUERTO + '/', SALIDA = process.argv[2] || '/tmp/gn-torneo', errores = [];
const NOMBRES = ['María', 'Andrés', 'Carmen', 'Fran', 'Javier', 'Elena'];
const sinTilde = (n) => n.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
async function api(accion, p) {
  const r = await fetch(BASE + 'api', { method: 'POST', body: JSON.stringify(Object.assign({ accion, mando: 'mando-local' }, p)) });
  const j = await r.json();
  if (!j.ok) throw new Error(accion + ': ' + j.error);
  return j.datos;
}
const prueba = async (p) => (await (await fetch(BASE + '_prueba', { method: 'POST', body: JSON.stringify(p || {}) })).json()).datos;
async function votarRonda(tok, menos) {
  for (const n of NOMBRES) {
    if (n === menos) continue;
    const s = await api('estado', { token: tok[n] });
    for (const b of s.batallas.filter((x) => x.mia && !x.voto && x.of === s.guerra.cuadro.actual)) {
      const ia = NOMBRES.indexOf(s.gente.find((g) => g.id === b.a).nombre), ib = NOMBRES.indexOf(s.gente.find((g) => g.id === b.b).nombre);
      await api('votar', { token: tok[n], batalla: b.id, elegido: ia < ib ? b.a : b.b });
    }
  }
}
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = spawn('node', [path.join(__dirname, '..', 'herramientas', 'servidor.js'), String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => servidor.stdout.once('data', r));
  const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const pagina = async (hash, ancho = 390, alto = 844) => {
    const p = await (await nav.newContext({ viewport: { width: ancho, height: alto } })).newPage();
    p.on('pageerror', (e) => errores.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
    // La bienvenida de cada ofensiva se despacha sola antes de cualquier acción.
    await p.addLocatorHandler(p.locator('[data-a="alCombate"]'), async (b) => { await b.click(); });
    // Si sale la tarjeta de su batalla estrella, se pasa («Ahora no») antes de cualquier acción.
    await p.addLocatorHandler(p.locator('[data-a="saltarEstrella"]'), async (b) => { await b.click(); });
    await p.goto(BASE + hash); await p.waitForLoadState('networkidle');
    return p;
  };
  const texto = (p) => p.locator('#app').innerText();
  try {
    const { id } = await api('crearGuerra', { plan: { nombre: 'Copa de la Normalidad', pregunta: '¿Quién es más normal?', premio: 'La copa',
      gente: NOMBRES.map((n) => ({ nombre: n, correo: sinTilde(n) + '@ejemplo.test', mando: n === 'Fran' })) } });
    // --- plan: elegir torneo
    const m = await pagina('#mando=mando-local');
    await m.locator(`[data-a="abrirGuerra"][data-v="${id}"]`).click();
    await plan.paso(m, 3);
    await m.waitForSelector('[data-v="plan.formato=torneo"]');
    await m.locator('[data-v="plan.formato=torneo"]').click(); await m.waitForTimeout(150);
    assert.ok(/3 rondas y 6 cruces, 3\.er puesto incluido; 2 pasan la primera ronda sin combatir/.test(await texto(m)), 'resumen del cuadro en el plan');
    assert.strictEqual(await m.locator('[data-v="plan.ritmo=diaria"]').count(), 0, 'sin ritmo en el torneo');
    await plan.paso(m, 4); await plan.paso(m, 3);
    assert.strictEqual((await api('plan', { guerra: id })).plan.formato, 'torneo');
    await m.waitForTimeout(600);
    await m.screenshot({ path: path.join(SALIDA, '1-plan-formato.png'), fullPage: true });
    const n0 = (await prueba()).correos.length;
    await api('declarar', { guerra: id });
    const tok = {};
    (await prueba()).correos.slice(n0).forEach((c) => { const n = NOMBRES.find((x) => c.para.startsWith(sinTilde(x))); if (n) tok[n] = /#t=([\w.]+)/.exec(c.html)[1]; });
    // --- una combatiente vota su ronda en el móvil
    const est = await api('estado', { token: tok['Elena'] });
    const ma = await pagina('#t=' + tok['Elena']);
    assert.ok(/Cuartos de final/i.test(await texto(ma)), 'nombre de la ronda');
    const suyas = est.batallas.filter((b) => b.mia && b.of === 1).length;
    for (let k = 0; k < suyas; k++) { await ma.locator('[data-a="votar"][data-v="a"]').click(); await ma.waitForTimeout(200); }
    await ma.waitForLoadState('networkidle'); await ma.waitForTimeout(900);
    await ma.evaluate(() => { const b = document.querySelector('[data-a="saltarEstrella"]'); if (b) b.click(); }); await ma.waitForTimeout(200);
    assert.ok(/Ronda cumplida/i.test(await texto(ma)), 'ronda cumplida');
    await ma.screenshot({ path: path.join(SALIDA, '2-ronda-cumplida.png'), fullPage: true });
    await ma.getByRole('button', { name: 'Ver el cuadro' }).first().click(); await ma.waitForTimeout(300);
    assert.ok(/Pasa sin combatir/.test(await texto(ma)) && /Semifinales/i.test(await texto(ma)) && /\bfinal\b/i.test(await texto(ma)));
    await ma.screenshot({ path: path.join(SALIDA, '3-cuadro-ronda1.png'), fullPage: true });
    // --- votan los demás: la ronda se cierra sola
    await votarRonda(tok, 'Elena');
    await prueba({ salto: 20000 });
    await api('estado', { guerra: id });
    await ma.reload(); await ma.waitForLoadState('networkidle'); await ma.waitForTimeout(300);
    assert.ok(await ma.locator('.cruce-lado.gana').count() >= 4, 'se ve quién pasa');
    await ma.screenshot({ path: path.join(SALIDA, '4-cuadro-ronda2.png'), fullPage: true });
    // --- semifinales: el alto mando cierra la ronda desde el cuartel
    await votarRonda(tok, 'Javier');
    await m.goto(BASE + '#/cuartel'); await m.reload(); await m.waitForLoadState('networkidle');
    await m.waitForSelector('[data-a="cerrarRonda"]');
    assert.strictEqual(await m.locator('text=Firmar el armisticio').count(), 0, 'sin armisticio en el torneo');
    await m.screenshot({ path: path.join(SALIDA, '5-cuartel-ronda.png'), fullPage: true });
    await m.locator('[data-a="cerrarRonda"]').click(); await m.waitForTimeout(200);
    await m.locator('[data-a="cerrarRonda"]').click(); await m.waitForLoadState('networkidle'); await m.waitForTimeout(300);
    assert.strictEqual((await api('estado', { guerra: id })).guerra.cuadro.actual, 3, 'ronda cerrada por el alto mando');
    // --- final y 3.er puesto, desfile y parte
    await votarRonda(tok);
    await prueba({ salto: 20000 });
    assert.strictEqual((await api('estado', { guerra: id })).guerra.fase, 'terminada');
    await api('desfile', { guerra: id, orden: 'empezar' });
    for (let k = 0; k < 30; k++) { const s = await api('estado', { token: tok['María'] }); if (s.desfile.ultimo) break; await api('desfile', { guerra: id, orden: 'siguiente' }); }
    await api('desfile', { guerra: id, orden: 'terminar' });
    await ma.goto(BASE + '#/cuadro'); await ma.reload(); await ma.waitForLoadState('networkidle'); await ma.waitForTimeout(300);
    await ma.screenshot({ path: path.join(SALIDA, '6-cuadro-final.png'), fullPage: true });
    assert.ok(/Por el 3\.er puesto/i.test(await texto(ma)), 'tercer puesto en el cuadro');
    assert.ok(await ma.locator('.cruce-lado b').count() >= 10, 'cuadro final con votos: ' + await ma.locator('.cruce-lado b').count());
    const pc = await pagina('#t=' + tok['María'], 1280, 860);
    await pc.goto(BASE + '#/cuadro'); await pc.reload(); await pc.waitForLoadState('networkidle'); await pc.waitForTimeout(300);
    await pc.screenshot({ path: path.join(SALIDA, '7-cuadro-pc.png'), fullPage: true });
  } finally { await nav.close(); servidor.kill(); }
  if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); process.exit(1); }
  console.log('Torneo sin errores. Capturas en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });
