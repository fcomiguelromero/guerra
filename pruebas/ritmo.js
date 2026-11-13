// Recorrido de una guerra con una ofensiva al día: campo de batalla, «cumplido por hoy», aviso diario,
// Radio Macuto con aviso, ensayo del desfile, informe con las pullas y ganador de la porra.
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node pruebas/ritmo.js [carpeta de capturas]
'use strict';
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), assert = require('assert');
const { chromium } = require('playwright');

const PUERTO = 8135, BASE = 'http://localhost:' + PUERTO + '/';
const SALIDA = process.argv[2] || '/tmp/gn-ritmo';
const NOMBRES = ['María', 'Andrés', 'Carmen', 'Fran', 'Javier'];
const HORA = 3600000, errores = [];
const sinTilde = (n) => n.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');

async function api(accion, p) {
  const r = await fetch(BASE + (accion === '_prueba' ? '_prueba' : 'api'), { method: 'POST', body: JSON.stringify(Object.assign({ accion }, p)) });
  const j = await r.json();
  if (!j.ok) throw new Error(accion + ': ' + j.error);
  return j.datos;
}
async function pagina(navegador, ancho, alto, hash) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errores.push('[' + hash.slice(0, 12) + '] ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push('[' + hash.slice(0, 12) + '] ' + m.text()); });
  await p.goto(BASE + hash);
  await p.waitForLoadState('networkidle');
  return p;
}
const foto = (p, nombre, entera) => p.screenshot({ path: path.join(SALIDA, nombre + '.png'), fullPage: !!entera });
const pulsa = async (p, texto) => { await p.getByRole('button', { name: texto, exact: false }).first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(150); };
const texto = (p) => p.locator('#app').innerText();

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = spawn('node', [path.join(__dirname, '..', 'herramientas', 'servidor.js'), String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => servidor.stdout.once('data', r));
  const navegador = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  try {
    // --- plan: campo de batalla y una ofensiva al día
    const m = await pagina(navegador, 390, 844, '#mando=mando-local');
    await pulsa(m, 'Plan de guerra nuevo');
    await m.fill('#p-nombre', 'Guerra de la Normalidad');
    await m.fill('#p-pregunta', '¿Quién es más normal?');
    await m.fill('#p-campo', 'Compañeros de trabajo');
    await m.fill('#p-desfile', 'Sábado a las 21:00, en el bar de siempre');
    for (let i = 0; i < NOMBRES.length; i++) {
      await pulsa(m, 'Reclutar combatiente');
      await m.fill('#gn-' + i, NOMBRES[i]);
      await m.fill('#gc-' + i, sinTilde(NOMBRES[i]) + '@ejemplo.test');
    }
    await m.locator('[data-a="soyYo"][data-v="3"]').click();
    await m.locator('[data-a="opcion"][data-v="plan.ritmo=diaria"]').click();
    assert.ok(/durará al menos 5 días/.test(await texto(m)));
    await pulsa(m, 'Guardar borrador');
    assert.strictEqual(await m.inputValue('#p-campo'), 'Compañeros de trabajo');
    assert.strictEqual(await m.locator('[data-v="plan.ritmo=diaria"]').getAttribute('aria-pressed'), 'true');
    await foto(m, '01-plan-ritmo', true);
    // --- presentación: página suelta, sólo para leer
    await m.fill('#p-pitch', 'Compañeros: ha llegado la hora de saber quién es quién.');
    await pulsa(m, 'Guardar borrador');
    const urlPres = await m.getByRole('link', { name: 'Ver la presentación' }).getAttribute('href');
    assert.ok(/#p=g\w+\.\w+$/.test(urlPres));
    assert.ok(/^mailto:\?subject=/.test(await m.getByRole('link', { name: 'Por correo' }).getAttribute('href')));
    await foto(m, '00-plan-presentacion', true);
    const pr = await pagina(navegador, 390, 844, urlPres.slice(urlPres.indexOf('#')));
    await pr.waitForSelector('.enorme');
    const tp = await texto(pr);
    assert.ok(/¿Te alistas\?/i.test(tp) && /Una ofensiva nueva/i.test(tp) && /ha llegado la hora/.test(tp) && /Compañeros de trabajo/i.test(tp), 'la presentación explica la guerra');
    assert.ok(!/María|Andrés|Carmen|Javier/.test(tp), 'sin nombres de combatientes');
    assert.strictEqual(await pr.locator('button, input, textarea, a').count(), 0, 'sin botones ni enlaces');
    await foto(pr, '00-presentacion', true);
    await pr.reload(); await pr.waitForSelector('.enorme');
    const prPc = await pagina(navegador, 1280, 860, urlPres.slice(urlPres.indexOf('#')));
    await prPc.waitForSelector('.enorme');
    await foto(prPc, '00-presentacion-pc', true);
    await pulsa(m, '¡Declarar la guerra!');
    await m.locator('[data-a="declararYa"]').click();
    await m.waitForFunction(() => location.hash === '#/cuartel');
    await m.waitForLoadState('networkidle');
    assert.ok(/Guerra de la Normalidad · Compañeros de trabajo/i.test(await texto(m)));

    const { correos } = await api('_prueba', {});
    const tok = {};
    correos.forEach((c) => { tok[NOMBRES.find((n) => c.para.startsWith(sinTilde(n)))] = /#t=([\w.]+)/.exec(c.html)[1]; });
    fs.writeFileSync(path.join(SALIDA, 'correo-orden.html'), correos[0].html);

    // --- María: sólo puede votar la ofensiva abierta; después, «cumplido por hoy»
    const ma = await pagina(navegador, 390, 844, '#t=' + tok['María']);
    let est = await api('estado', { token: tok['María'] });
    const hoy = est.batallas.filter((b) => b.mia && b.of === 1).length;
    for (let k = 0; k < hoy; k++) { await ma.locator('[data-a="votar"][data-v="a"]').click(); await ma.waitForTimeout(150); }
    await ma.waitForLoadState('networkidle');
    assert.ok(/Cumplido por hoy/i.test(await texto(ma)) && /ofensiva 2 de 5 se abre/i.test(await texto(ma)), 'cumplido por hoy');
    assert.strictEqual(await ma.locator('[data-a="votar"]').count(), 0);
    await foto(ma, '02-cumplido-por-hoy');
    await pulsa(ma, 'Ordenanzas');
    assert.ok(/Una ofensiva al día/i.test(await texto(ma)));
    await foto(ma, '03-ordenanzas', true);

    // --- al día siguiente: aviso por correo y batallas nuevas
    const antes = (await api('_prueba', {})).correos.length;
    await api('_prueba', { salto: 24 * HORA, reloj: true });
    const avisos = (await api('_prueba', {})).correos.slice(antes);
    assert.ok(avisos.length >= 4 && avisos.every((c) => /se abre la ofensiva/.test(c.asunto)), 'aviso diario');
    fs.writeFileSync(path.join(SALIDA, 'correo-ofensiva.html'), avisos[0].html);
    await ma.goto(BASE + '#/batallas'); await ma.reload(); await ma.waitForLoadState('networkidle');
    assert.ok(await ma.locator('[data-a="votar"]').count(), 'hay batallas nuevas');
    assert.ok(/Ofensiva 2 de 5/i.test(await texto(ma)));
    await foto(ma, '04-ofensiva-2');

    // --- Radio Macuto: emitir avisando; el enlace del correo lleva a la radio
    await api('pulla', { token: tok['Carmen'], texto: 'Javier vota con los ojos cerrados.' });
    await m.reload(); await m.waitForLoadState('networkidle');
    await foto(m, '05-censura', true);
    const n0 = (await api('_prueba', {})).correos.length;
    await m.locator('[data-a="moderar"][data-v$=":2"]').click();
    await m.waitForLoadState('networkidle'); await m.waitForTimeout(200);
    const radio = (await api('_prueba', {})).correos.slice(n0).filter((c) => /Radio Macuto/.test(c.asunto));
    assert.strictEqual(radio.length, 4, 'la pulla llega a los otros cuatro');
    assert.ok(radio.every((c) => !/Carmen/.test(c.html.replace(/Carmen, alguien/, ''))), 'sin autor');
    fs.writeFileSync(path.join(SALIDA, 'correo-radio.html'), radio[0].html);
    const enlace = /href="([^"]+ir=radio)"/.exec(radio[0].html)[1].replace(/&amp;/g, '&');
    const an = await pagina(navegador, 390, 844, enlace.slice(enlace.indexOf('#')));
    assert.ok(/Radio Macuto/i.test(await texto(an)) && await an.locator('#pulla').count(), 'el correo lleva a escribir una pulla');
    await foto(an, '06-radio-desde-correo');

    // --- pasan los días, votan todos y llega el aviso de alto el fuego
    await api('_prueba', { salto: 5 * 24 * HORA, reloj: true });
    for (const n of NOMBRES) {
      const s = await api('estado', { token: tok[n] });
      for (const b of s.batallas.filter((x) => x.mia && !x.voto)) await api('votar', { token: tok[n], batalla: b.id, elegido: b.a < b.b ? b.a : b.b });
      await api('porra', { token: tok[n], orden: s.gente.filter((g) => g.combate).map((g) => g.id).sort((x, y) => (n === 'Andrés' ? x.localeCompare(y) : y.localeCompare(x))) });
    }
    const n1 = (await api('_prueba', {})).correos.length;
    await api('_prueba', { salto: 60000, reloj: true });
    const fin = (await api('_prueba', {})).correos.slice(n1);
    assert.ok(fin.length === 5 && /alto el fuego/.test(fin[0].asunto) && /Sábado a las 21:00/.test(fin[0].html), 'aviso de alto el fuego');
    fs.writeFileSync(path.join(SALIDA, 'correo-fin.html'), fin[0].html);

    // --- informe con Radio Macuto y ensayo privado del desfile
    await m.goto(BASE + '#/informe'); await m.reload(); await m.waitForSelector('.tabla');
    assert.ok(/ojos cerrados/.test(await texto(m)) && /Carmen/.test(await texto(m)), 'las pullas, con autor, en el informe');
    await foto(m, '07-informe', true);
    await pulsa(m, 'Ensayar el desfile');
    await m.waitForFunction(() => location.hash === '#/ensayo');
    await m.waitForSelector('[data-a="ensayoPaso"]');
    await foto(m, '08-ensayo', true);
    let pasos = 0;
    while (!(await m.locator('[data-a="ensayoPaso"][data-v="1"]').isDisabled())) { await m.locator('[data-a="ensayoPaso"][data-v="1"]').click(); await m.waitForTimeout(60); pasos++; }
    assert.ok(pasos >= 4 && /1\.er puesto|Empate en el primer puesto/i.test(await texto(m)), 'el ensayo llega hasta el final');
    await foto(m, '09-ensayo-final', true);
    assert.strictEqual((await api('estado', { token: tok['María'] })).guerra.fase, 'terminada', 'el ensayo no mueve la guerra');
    await ma.goto(BASE + '#/batallas'); await ma.reload(); await ma.waitForLoadState('networkidle');
    assert.ok(/Alto el fuego/i.test(await texto(ma)), 'los combatientes no ven el ensayo');
    await pulsa(m, 'Salir');

    // --- desfile de verdad hasta el final, y la porra con su ganador
    await m.waitForSelector('[data-a="desfile"][data-v="empezar"]');
    await m.locator('[data-a="desfile"][data-v="empezar"]').click();
    await m.waitForFunction(() => location.hash === '#/cuartel');
    for (let k = 0; k < 40; k++) {
      await m.waitForLoadState('networkidle');
      if (await m.locator('[data-a="desfile"][data-v="terminar"]').count()) break;
      const s = await api('estado', { token: tok['María'] });
      if (s.desfile && s.desfile.actual.t === 'duelo') for (const n of NOMBRES) { try { await api('votarDuelo', { token: tok[n], elegido: s.desfile.actual.duelo.entre[0] }); } catch (e) { /* los duelistas no votan */ } }
      await m.locator('[data-a="desfile"][data-v="siguiente"]').first().click();
      await m.waitForTimeout(200);
    }
    await m.locator('[data-a="desfile"][data-v="terminar"]').first().click();
    await m.locator('[data-a="desfile"][data-v="terminar"]').first().click();
    await m.waitForFunction(() => location.hash === '#/batallas');
    await ma.goto(BASE + '#/porra'); await ma.reload(); await ma.waitForLoadState('networkidle');
    assert.ok(/Ganador de la porra/i.test(await texto(ma)) && await ma.locator('.avatar.gigante').count(), 'ganador de la porra, con foto');
    await foto(ma, '10-porra-ganador', true);
    await ma.goto(BASE + '#/batallas'); await ma.waitForLoadState('networkidle');
    assert.ok(/Quien más veces votó lo mismo que la mayoría/.test(await texto(ma)), 'explicación de las condecoraciones');
    await ma.locator('.leyenda summary').click();
    assert.ok(/Diferencia de votos/.test(await texto(ma)));
    await foto(ma, '11-parte', true);
    await ma.getByRole('button', { name: 'Crónicas' }).first().click();
    await ma.waitForSelector('[data-a="pestanaCronicas"]');
    await ma.locator('[data-a="pestanaCronicas"][data-v="escalafon"]').click(); await ma.waitForTimeout(200);
    assert.ok(/Guerras jugadas/.test(await texto(ma)) && /Compañeros de trabajo/.test(await texto(ma)));
    await foto(ma, '12-escalafon', true);

    assert.deepStrictEqual(errores, [], 'sin errores en el navegador');
    console.log('Ritmo diario sin errores. Capturas en ' + SALIDA);
  } finally { await navegador.close(); servidor.kill(); }
})().catch((e) => { console.error(e); process.exit(1); });
