// Recorrido de una guerra entera por las pantallas, con un navegador de verdad y el motor local.
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node pruebas/pantallas.js [carpeta de capturas]
'use strict';
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), assert = require('assert');
const { chromium } = require('playwright');

const PUERTO = 8131, BASE = 'http://localhost:' + PUERTO + '/';
const SALIDA = process.argv[2] || '/tmp/gn';
const NOMBRES = ['María', 'Andrés', 'Carmen', 'Fran', 'Javier', 'Elena'];
const errores = [];

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

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = spawn('node', [path.join(__dirname, '..', 'herramientas', 'servidor.js'), String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => servidor.stdout.once('data', r));
  const navegador = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  try {
    // --- alto mando: plan de guerra
    const m = await pagina(navegador, 390, 844, '#mando=mando-local');
    await pulsa(m, 'Plan de guerra nuevo');
    await m.fill('#p-nombre', 'Guerra de la Normalidad');
    await m.fill('#p-pregunta', '¿Quién es más normal?');
    await m.fill('#p-premio', 'Una cena pagada por los demás');
    await m.fill('#p-botin', '2 € por cabeza');
    for (let i = 0; i < NOMBRES.length; i++) {
      await pulsa(m, 'Reclutar combatiente');
      await m.fill('#gn-' + i, NOMBRES[i]);
      await m.fill('#gc-' + i, NOMBRES[i].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + '@ejemplo.test');
      await m.fill('#gf-' + i, i === 0 ? 'Frase de María: hasta 100 caracteres. Este ejemplo los gasta todos para que veas bien cuánto cabe aquí.' : 'Frase de ' + NOMBRES[i]);
    }
    await m.locator('[data-a="soyYo"][data-v="3"]').click();
    await pulsa(m, 'Guardar borrador');
    await foto(m, '01-plan', true);
    await pulsa(m, '¡Declarar la guerra!');
    await foto(m, '02-confirmar');
    await m.locator('[data-a="declararYa"]').click();
    await m.waitForFunction(() => location.hash === '#/cuartel');
    await m.waitForLoadState('networkidle');
    await foto(m, '03-cuartel', true);

    // --- enlaces personales, sacados de los correos
    const { correos } = await api('_prueba', {});
    assert.strictEqual(correos.length, 6);
    const tok = {};
    correos.forEach((c) => { tok[NOMBRES.find((n) => c.para.startsWith(n.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')))] = /#t=([\w.]+)/.exec(c.html)[1]; });
    fs.writeFileSync(path.join(SALIDA, 'correo.html'), correos[0].html);

    // --- combatiente en el móvil: votar, retirada y repaso
    const j = await pagina(navegador, 390, 844, '#t=' + tok['Javier']);
    await foto(j, '04-batalla-movil');
    await j.fill('#proclama', 'Porque tiene más cara de normal.');
    await j.locator('[data-a="votar"][data-v="a"]').click();
    await j.waitForSelector('#retirada');
    await foto(j, '05-retirada');
    await j.locator('#retirada').click();
    await j.waitForTimeout(400);
    assert.ok(await j.locator('[data-a="votar"]').count(), 'tras la retirada se puede volver a votar');
    for (let k = 0; k < 3; k++) { await j.locator('[data-a="votar"][data-v="b"]').click(); await j.waitForTimeout(120); }
    await j.waitForLoadState('networkidle');
    let est = await api('estado', { token: tok['Javier'] });
    assert.strictEqual(est.batallas.filter((b) => b.voto).length, 3, 'los tres votos han llegado al motor');
    await pulsa(j, 'Porra');
    await foto(j, '06-porra-cerrada');
    await pulsa(j, 'Ordenanzas');
    await foto(j, '07-ordenanzas', true);

    // --- combatiente en el ordenador
    const e = await pagina(navegador, 1280, 860, '#t=' + tok['Elena']);
    await foto(e, '08-batalla-pc');

    // --- el resto vota por la vía rápida; María termina a mano para ver «misión cumplida» y la porra
    const votarTodo = async (nombre, dejar) => {
      const s = await api('estado', { token: tok[nombre] });
      const pend = s.batallas.filter((b) => b.mia && !b.voto);
      for (const b of pend.slice(0, pend.length - (dejar || 0))) {
        const ia = NOMBRES.indexOf(s.gente.find((g) => g.id === b.a).nombre), ib = NOMBRES.indexOf(s.gente.find((g) => g.id === b.b).nombre);
        await api('votar', { token: tok[nombre], batalla: b.id, elegido: (nombre === 'Javier' ? ia > ib : ia < ib) ? b.a : b.b, proclama: b.id % 4 === 0 ? 'Proclama de prueba número ' + b.id + '.' : '' });
      }
    };
    for (const n of ['Andrés', 'Carmen', 'Javier', 'Elena']) await votarTodo(n);
    await votarTodo('María', 1);
    const ma = await pagina(navegador, 390, 844, '#t=' + tok['María']);
    await ma.locator('[data-a="votar"][data-v="a"]').click();
    await ma.waitForLoadState('networkidle');
    await foto(ma, '09-mision-cumplida');
    await pulsa(ma, 'Hacer la porra');
    await ma.locator('[data-a="porraMover"][data-v="1:-1"]').click();
    await foto(ma, '10-porra', true);
    await pulsa(ma, 'Enviar porra');
    await api('pulla', { token: tok['Elena'], texto: 'Que alguien despierte a Fran.' });

    // --- alto mando: censura, armisticio (Fran, o sea él mismo, no ha votado) e informe
    await m.reload(); await m.waitForLoadState('networkidle');
    await foto(m, '11-cuartel-censura', true);
    await m.locator('[data-a="moderar"][data-v$=":1"]').click();
    await m.waitForLoadState('networkidle');
    await votarTodo('Fran', 2);
    await m.reload(); await m.waitForLoadState('networkidle');
    await pulsa(m, 'Firmar el armisticio');
    await m.locator('[data-a="decidir"][data-v$=":indultar"]').click();
    await foto(m, '12-armisticio');
    await m.locator('[data-a="firmar"]').click();
    await m.locator('[data-a="firmar"]').click();
    await m.waitForFunction(() => location.hash === '#/informe');
    await m.waitForSelector('.tabla');
    await foto(m, '13-informe', true);
    const estrella = m.locator('[data-a="estrella"]').first();
    await estrella.click(); await m.waitForLoadState('networkidle');

    // --- alto el fuego y espía
    await j.goto(BASE + '#/batallas'); await j.reload(); await j.waitForLoadState('networkidle');
    await foto(j, '14-alto-el-fuego', true);
    await j.locator('[data-a="espiar"]').click();
    await j.locator('[data-a="espiar"]').click();
    await j.waitForLoadState('networkidle'); await j.waitForTimeout(200);
    await foto(j, '15-espia');

    // --- desfile: el alto mando pasa los pasos y los demás lo siguen
    await pulsa(m, '¡Que empiece el desfile!');
    await m.waitForFunction(() => location.hash === '#/cuartel');
    await foto(m, '16-mando-desfile', true);
    await e.reload(); await e.waitForLoadState('networkidle');
    let paso = 0;
    for (;;) {
      est = await api('estado', { token: tok['Elena'] });
      const t = est.desfile.actual.t + (est.desfile.actual.pos || est.desfile.actual.cual || '');
      await e.waitForTimeout(2700);                       // el latido del desfile trae el paso nuevo
      await foto(e, '17-desfile-pc-' + String(paso).padStart(2, '0') + '-' + t);
      if (paso % 3 === 0 || est.desfile.ultimo) { await j.reload(); await j.waitForLoadState('networkidle'); await foto(j, '18-desfile-movil-' + String(paso).padStart(2, '0') + '-' + t, true); }
      if (est.desfile.ultimo) break;
      await m.locator('[data-a="desfile"][data-v="siguiente"]').click();
      await m.waitForLoadState('networkidle');
      paso++;
    }
    await m.locator('[data-a="desfile"][data-v="terminar"]').click();
    await m.locator('[data-a="desfile"][data-v="terminar"]').click();
    await m.waitForLoadState('networkidle'); await m.waitForTimeout(300);
    await foto(m, '19-publicada-mando', true);
    await e.reload(); await e.waitForLoadState('networkidle');
    await foto(e, '20-publicada-pc', true);
    await pulsa(e, 'Crónicas');
    await e.waitForTimeout(300);
    await foto(e, '21-cronicas-pc');

    // --- entrada con el enlace general: «identifícate, soldado»
    const general = (await api('estado', { token: tok['Fran'], mando: 'mando-local' })).mando.general;
    const g = await pagina(navegador, 390, 844, '#g=' + general);
    await foto(g, '22-quien-eres', true);
    const s = await pagina(navegador, 390, 844, '');
    await foto(s, '23-sin-enlace');

    // --- borrar la guerra ya publicada: desaparece y los enlaces dejan de valer
    await m.goto(BASE + '#/cuartel'); await m.reload(); await m.waitForLoadState('networkidle');
    await m.locator('[data-a="borrarGuerra"]').click();
    await foto(m, '24-borrar');
    await m.locator('[data-a="borrarYa"]').click();
    await m.waitForFunction(() => location.hash === '#/guerras');
    await m.waitForLoadState('networkidle'); await m.waitForTimeout(300);
    await foto(m, '25-tras-borrar');
    assert.ok((await m.locator('body').innerText()).includes('Aún no hay ninguna guerra'));
    await j.reload(); await j.waitForLoadState('networkidle'); await j.waitForTimeout(300);
    await foto(j, '26-enlace-de-guerra-borrada');
    assert.ok((await j.locator('body').innerText()).includes('ya no existe'));
  } finally {
    await navegador.close();
    servidor.kill();
  }
  if (errores.length) { console.log('ERRORES DE PANTALLA:\n' + errores.join('\n')); process.exit(1); }
  console.log('Recorrido completo sin errores. Capturas en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });
