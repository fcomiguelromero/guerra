// Recorrido de las parejas: se marcan en la ficha, se encienden sus extras, se combate y se ven en el desfile y el informe.
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node pruebas/parejas.js [carpeta de capturas]
'use strict';
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), assert = require('assert');
const { chromium } = require('playwright');
const plan = require('./ayuda-plan');
const PUERTO = 8137, BASE = 'http://localhost:' + PUERTO + '/', SALIDA = process.argv[2] || '/tmp/gn-parejas', errores = [];
const NOMBRES = ['Lucía', 'Pablo', 'Elena', 'Javi', 'Rosa', 'Fran'];
async function api(accion, p) {
  const r = await fetch(BASE + (accion === '_prueba' ? '_prueba' : 'api'), { method: 'POST', body: JSON.stringify(Object.assign({ accion }, p)) });
  const j = await r.json();
  if (!j.ok) throw new Error(accion + ': ' + j.error);
  return j.datos;
}
async function pagina(nav, ancho, alto, hash) {
  const p = await (await nav.newContext({ viewport: { width: ancho, height: alto } })).newPage();
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  await p.addLocatorHandler(p.locator('[data-a="saltarEstrella"]'), async (b) => { await b.click(); });
  await p.addLocatorHandler(p.locator('[data-a="alCombate"]'), async (b) => { await b.click(); });
  await p.goto(BASE + hash); await p.waitForLoadState('networkidle');
  return p;
}
const foto = (p, n, entera) => p.screenshot({ path: path.join(SALIDA, n + '.png'), fullPage: !!entera });
const quieto = async (p) => { await p.waitForLoadState('networkidle'); await p.waitForTimeout(200); };
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = spawn('node', [path.join(__dirname, '..', 'herramientas', 'servidor.js'), String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => servidor.stdout.once('data', r));
  const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    const m = await pagina(nav, 390, 844, '#mando=mando-local');
    await m.getByRole('button', { name: 'Plan de guerra nuevo' }).first().click(); await quieto(m);
    await m.fill('#p-nombre', 'Guerra de las Parejas'); await m.fill('#p-pregunta', '¿Quién es más normal?');
    await plan.paso(m, 2);
    for (let i = 0; i < NOMBRES.length; i++) await plan.reclutar(m, i, NOMBRES[i], 'c' + i + '@ejemplo.test');
    await plan.soyYo(m, 5);
    // Lucía y Pablo; Elena y Javi. Luego Elena cambia a Rosa y Javi queda suelto.
    // Con GN_FOTOS=ruta1,ruta2 se ponen fotos a Lucía y a Pablo (para ver la cara enamorada; no se suben al repositorio).
    const fotos = (process.env.GN_FOTOS || '').split(',').filter(Boolean);
    for (let i = 0; i < fotos.length && i < 2; i++) {
      await m.locator(`[data-a="abrirFicha"][data-v="${i}"]`).click();
      await m.locator(`input[type=file][data-v="${i}"]`).setInputFiles(fotos[i]);
      await m.waitForSelector('.recorte-marco img'); await m.locator('.recorte-si').click(); await m.waitForSelector('.retrato img');
      await m.locator('.hoja [data-a="cerrarFicha"]').click();
    }
    await m.locator('[data-a="abrirFicha"][data-v="0"]').click();
    await m.selectOption('#gp-0', '1');
    await foto(m, '01-ficha-pareja');
    await m.locator('.hoja [data-a="cerrarFicha"]').click();
    await m.locator('[data-a="abrirFicha"][data-v="2"]').click();
    await m.selectOption('#gp-2', '3');
    await m.selectOption('#gp-2', '4');
    await m.locator('.hoja [data-a="cerrarFicha"]').click();
    await m.locator('[data-a="abrirFicha"][data-v="3"]').click();
    assert.strictEqual(await m.locator('#gp-3').inputValue(), '', 'Javi se queda sin pareja al cambiar Elena');
    await m.locator('.hoja [data-a="cerrarFicha"]').click();
    await foto(m, '02-fichas-con-parejas', true);
    await plan.paso(m, 4);
    await m.locator('[data-a="extra"][data-v="lealtad"]').click();
    await foto(m, '03-extras-parejas', true);
    await plan.paso(m, 5); await plan.abrir(m, 'ordenanzas');
    const ord = await m.locator('body').innerText();
    await foto(m, '04-ordenanzas', true); if (!/en el amor y en la guerra/i.test(ord)) console.log(ord.slice(0, 3000));
    assert.ok(/en el amor y en la guerra/i.test(ord), 'las ordenanzas explican las parejas');
    await foto(m, '04-ordenanzas', true);
    const presenta = (await api('plan', { mando: 'mando-local', guerra: (await api('cuartel', { mando: 'mando-local' })).guerras[0].id })).plan.presenta;
    const pr = await pagina(nav, 390, 844, '#p=' + presenta);
    await pr.waitForSelector('.propina-amor .escena-beso');
    await pr.locator('.propina-amor').scrollIntoViewIfNeeded(); await pr.waitForTimeout(500);
    await pr.locator('.propina-amor').screenshot({ path: path.join(SALIDA, '04b-presentacion-amor.png') });
    await plan.declarar(m);
    await m.locator('[data-a="declararYa"]').click();
    await m.waitForFunction(() => location.hash === '#/cuartel');
    const correos = (await api('_prueba', {})).correos.filter((c) => /Comienza/.test(c.asunto));
    const tok = {};
    correos.forEach((c) => { tok[NOMBRES[Number(c.para[1])]] = /#t=([\w.]+)/.exec(c.html)[1]; });
    const est0 = await api('estado', { token: tok['Lucía'] });
    const ordz = await pagina(nav, 390, 844, '#t=' + tok['Rosa']);
    await ordz.evaluate(() => { location.hash = '#/ordenanzas'; }); await quieto(ordz);
    assert.ok(await ordz.locator('.regla-beso .escena-beso').count(), 'el beso sale en la ordenanza de las parejas');
    await ordz.locator('.regla-beso').scrollIntoViewIfNeeded(); await ordz.waitForTimeout(500);
    await foto(ordz, '04c-ordenanzas-amor');
    const id = (n) => est0.gente.find((g) => g.nombre === n).id;
    assert.strictEqual(est0.gente.find((g) => g.nombre === 'Lucía').pareja, id('Pablo'));
    assert.strictEqual(est0.gente.find((g) => g.nombre === 'Rosa').pareja, id('Elena'));
    assert.ok(!est0.gente.find((g) => g.nombre === 'Javi').pareja);
    // La batalla de Lucía contra Pablo lleva el corazón partido.
    const casa = est0.batallas.find((b) => b.casa);
    assert.ok(casa, 'hay una batalla de pareja marcada');
    const j = await pagina(nav, 1280, 860, '#t=' + tok['Javi']);
    for (let k = 0; k < 15 && !(await j.locator('.casa-marca').count()); k++) { await j.locator('[data-a="mover"][data-v="1"]').first().click(); await j.waitForTimeout(250); }
    assert.ok(await j.locator('.casa-marca').count(), 'Javi ve el duelo doméstico');
    assert.strictEqual(await j.locator('.carta.amor').count(), 2, 'las dos cartas del duelo doméstico van con marco de amor');
    if (fotos.length) await j.waitForSelector('.cara-amor', { timeout: 20000 }).catch(() => {});
    await j.waitForTimeout(1600);
    await foto(j, '05-batalla');
    const jm = await pagina(nav, 390, 844, '#t=' + tok['Javi']);
    for (let k = 0; k < 15 && !(await jm.locator('.casa-marca').count()); k++) { await jm.locator('[data-a="mover"][data-v="1"]').first().click(); await jm.waitForTimeout(250); }
    if (fotos.length) await jm.waitForSelector('.cara-amor', { timeout: 20000 }).catch(() => {});
    await jm.waitForTimeout(1600);
    await foto(jm, '05b-batalla-movil');
    // Todos votan; Lucía se vota a sí misma contra Pablo y Rosa le da la porra cruzada a Elena.
    let k = 0;
    for (const n of NOMBRES) {
      const s = await api('estado', { token: tok[n] });
      for (const b of s.batallas.filter((x) => x.mia)) await api('votar', { token: tok[n], batalla: b.id, elegido: k++ % 3 ? b.a : b.b });
    }
    const vivos = (await api('estado', { token: tok['Rosa'] })).gente.filter((g) => g.combate).map((g) => g.id);
    const r = await pagina(nav, 390, 844, '#t=' + tok['Rosa']);
    await r.evaluate(() => { location.hash = '#/porra'; }); await quieto(r);
    await r.selectOption('#porra-pareja', '2');
    await foto(r, '06-porra-cruzada', true);
    await r.locator('[data-a="porraEnviar"]').click(); await quieto(r);
    assert.ok(vivos.length > 2);
    await api('_prueba', { salto: 20000 });
    await m.reload(); await quieto(m);
    await m.getByRole('button', { name: 'Informe clasificado' }).first().click(); await quieto(m);
    await m.waitForSelector('.pareja-desfile');
    await foto(m, '07-informe-parejas', true);
    await m.getByRole('button', { name: '¡Que empiece el desfile!' }).first().click(); await quieto(m);
    const vis = await pagina(nav, 390, 844, '#t=' + tok['Lucía']);
    let est = await api('estado', { token: tok['Lucía'] }), vistoGuino = false;
    for (;;) {
      const a = est.desfile.actual;
      if (a.t === 'puesto' && a.guino && !vistoGuino) { vistoGuino = true; await vis.reload(); await quieto(vis); await foto(vis, '08-guino', true); }
      if (a.t === 'parejas') { await vis.reload(); await quieto(vis); await foto(vis, '09-desfile-parejas', true); }
      if (est.desfile.ultimo) break;
      if (a.t === 'duelo') await api('desfile', { mando: 'mando-local', token: tok['Fran'], orden: 'cerrarDuelo' }).catch(() => {});
      await api('desfile', { mando: 'mando-local', token: tok['Fran'], orden: 'siguiente' });
      est = await api('estado', { token: tok['Lucía'] });
    }
    assert.ok(fs.existsSync(path.join(SALIDA, '09-desfile-parejas.png')), 'el desfile tiene el paso de las parejas');
    // Parte de guerra final, como expediente.
    await api('desfile', { mando: 'mando-local', token: tok['Fran'], orden: 'terminar' });
    const pf = await pagina(nav, 390, 844, '#t=' + tok['Rosa']);
    await pf.waitForSelector('.expediente'); await pf.waitForTimeout(500);
    assert.ok(/parte n\.º/i.test(await pf.locator('.parte-portada').innerText()), 'el parte lleva su número');
    await foto(pf, '10-parte-final-movil', true);
    await pf.evaluate(() => { location.hash = '#/porra'; }); await quieto(pf);
    assert.ok(await pf.locator('.porra-vs tbody tr').count() >= 6, 'la porra se compara con el parte final');
    await foto(pf, '10b-porra-comparada', true);
    const pfc = await pagina(nav, 1280, 860, '#t=' + tok['Lucía']);
    await pfc.waitForSelector('.expediente'); await pfc.waitForTimeout(500);
    await foto(pfc, '11-parte-final-pc', true);
    // Ritmo diario: la ofensiva con duelo doméstico da la bienvenida con el beso.
    const { id: id2 } = await api('crearGuerra', { mando: 'mando-local', plan: {} });
    const p2 = (await api('plan', { mando: 'mando-local', guerra: id2 })).plan;
    Object.assign(p2, { nombre: 'Guerra diaria de parejas', pregunta: '¿Quién es más normal?', ritmo: 'diaria' });
    p2.gente = ['Ana', 'Beto', 'Ceci', 'Dani'].map((n, i) => ({ nombre: n, correo: 'd' + i + '@ejemplo.test', frase: '', foto: null, combate: true, mando: i === 3, parejaK: i === 0 ? 1 : i === 1 ? 0 : null }));
    await api('guardarPlan', { mando: 'mando-local', guerra: id2, plan: p2 });
    await api('declarar', { mando: 'mando-local', guerra: id2 });
    const c2 = (await api('_prueba', {})).correos.filter((c) => /^d2@/.test(c.para) && /#t=/.test(c.html)).pop();
    const t2 = /#t=([\w.]+)/.exec(c2.html)[1];
    let vistoBeso = false;
    for (let dia = 0; dia < 4 && !vistoBeso; dia++) {
      const pb = await (await nav.newContext({ viewport: { width: 390, height: 844 } })).newPage();
      pb.on('pageerror', (e) => errores.push(e.message));
      await pb.goto(BASE + '#t=' + t2); await quieto(pb);
      if (await pb.locator('.bienvenida .escena-beso').count()) { vistoBeso = true; await pb.waitForTimeout(600); await foto(pb, '12-bienvenida-duelo-domestico'); }
      else {
        if (await pb.locator('[data-a="alCombate"]').count()) await pb.locator('[data-a="alCombate"]').click();
        await api('_prueba', { salto: 24 * 3600 * 1000, reloj: true });
      }
      await pb.close();
    }
    assert.ok(vistoBeso, 'la bienvenida del día del duelo doméstico lleva el beso');
  } finally { await nav.close(); servidor.kill(); }
  if (errores.length) { console.log('ERRORES DE PANTALLA:\n' + errores.join('\n')); process.exit(1); }
  console.log('Parejas sin errores. Capturas en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });
