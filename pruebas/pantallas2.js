// Segundo recorrido: llamamiento a filas, foto de una carta y duelo final en el desfile.
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node pruebas/pantallas2.js [carpeta de capturas]
'use strict';
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), assert = require('assert'), zlib = require('zlib');
const { chromium } = require('playwright');
const plan = require('./ayuda-plan');
const PUERTO = 8132, BASE = 'http://localhost:' + PUERTO + '/', SALIDA = process.argv[2] || '/tmp/gn2', errores = [];
const NOMBRES = ['María', 'Andrés', 'Carmen', 'Fran'];
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
  // Si sale la tarjeta de su batalla estrella, se pasa («Ahora no») antes de cualquier acción.
  await p.addLocatorHandler(p.locator('[data-a="saltarEstrella"]'), async (b) => { await b.click(); });
  await p.goto(BASE + hash); await p.waitForLoadState('networkidle');
  return p;
}
const foto = (p, n, entera) => p.screenshot({ path: path.join(SALIDA, n + '.png'), fullPage: !!entera });
const pulsa = async (p, t) => { await p.getByRole('button', { name: t }).first().click(); await p.waitForLoadState('networkidle'); await p.waitForTimeout(150); };
// Un PNG liso de 300×200 para probar la subida de fotos.
function png() {
  const crc = (b) => { let c, n = ~0; for (const x of b) { c = (n ^ x) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; n = (n >>> 8) ^ c; } return ~n >>> 0; };
  const trozo = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(300, 0); ihdr.writeUInt32BE(200, 4); ihdr[8] = 8; ihdr[9] = 2;
  // Un degradado con cuadros, para que se note el encuadre.
  const filas = Array.from({ length: 200 }, (_, y) => Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: 900 }, (_, i) => {
    const x = Math.floor(i / 3), c = i % 3, cuadro = ((x >> 5) + (y >> 5)) % 2;
    return c === 0 ? Math.round(120 + x * 0.45) : c === 1 ? Math.round(60 + y * 0.6) : cuadro ? 200 : 70;
  }))]));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', ihdr), trozo('IDAT', zlib.deflateSync(Buffer.concat(filas))), trozo('IEND', Buffer.alloc(0))]);
}
(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = spawn('node', [path.join(__dirname, '..', 'herramientas', 'servidor.js'), String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => servidor.stdout.once('data', r));
  const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    const m = await pagina(nav, 390, 844, '#mando=mando-local');
    await pulsa(m, 'Plan de guerra nuevo');
    await m.fill('#p-nombre', 'Guerra del Empate'); await m.fill('#p-pregunta', '¿Quién empata mejor?');
    await plan.paso(m, 2);
    for (let i = 0; i < NOMBRES.length; i++) await plan.reclutar(m, i, NOMBRES[i], 'c' + i + '@ejemplo.test');
    await plan.soyYo(m, 3);
    fs.writeFileSync(path.join(SALIDA, 'foto.png'), png());
    await m.locator('[data-a="abrirFicha"][data-v="0"]').click();
    await m.locator('input[type=file][data-v="0"]').setInputFiles(path.join(SALIDA, 'foto.png'));
    // Encuadre: se acerca con la barra, se arrastra la foto y se usa.
    await m.waitForSelector('.recorte-marco img');
    await m.locator('.recorte-zoom').fill('1.8');
    const caja = await m.locator('.recorte-marco').boundingBox();
    await m.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2); await m.mouse.down();
    await m.mouse.move(caja.x + caja.width / 2 + 60, caja.y + caja.height / 2 + 30, { steps: 5 }); await m.mouse.up();
    await foto(m, '00-encuadre');
    await m.locator('.recorte-si').click();
    await m.waitForSelector('.retrato img');
    assert.ok(await m.locator('[data-a="reencuadrar"][data-v="0"]').count(), 'con foto, se puede volver a encuadrar');
    await m.locator('.hoja [data-a="cerrarFicha"]').click();
    await plan.abrir(m, 'llamamiento');
    await pulsa(m, 'Abrir el llamamiento');
    await plan.abrir(m, 'llamamiento');
    await m.fill('#nota', 'Reclutas: ha llegado la hora de saber quién es el más normal.');
    await m.locator('[data-a="previa"][data-v="llamamiento"]').click();
    await m.waitForSelector('.velo iframe'); await m.waitForTimeout(300);
    await foto(m, '00a-previa-llamamiento');
    await m.locator('.velo [data-a="cerrarVelo"]').click();
    await plan.paso(m, 5);
    await m.locator('[data-a="previa"][data-v="orden"]').click();
    await m.waitForSelector('.velo iframe'); await m.waitForTimeout(300);
    await foto(m, '00b-previa-orden');
    assert.ok((await m.locator('.velo').innerText()).includes('No se ha enviado nada'));
    await m.locator('.velo [data-a="cerrarVelo"]').click();
    assert.strictEqual((await api('_prueba', {})).correos.length, 0, 'la vista previa no envía correos');
    await plan.paso(m, 2); await plan.abrir(m, 'llamamiento');
    await pulsa(m, 'Llamamiento por correo');
    await plan.abrir(m, 'llamamiento');
    await foto(m, '01-llamamiento-plan', true);
    const llamadas = (await api('_prueba', {})).correos.filter((c) => /Llamamiento/.test(c.asunto));
    assert.strictEqual(llamadas.length, 3, 'tres correos de llamamiento: todos menos el alto mando');
    fs.writeFileSync(path.join(SALIDA, 'correo-llamamiento.html'), llamadas[0].html);
    const enlace = /href="(http[^"]+#g=[^"]+)"/.exec(llamadas.find((c) => c.para === 'c2@ejemplo.test').html)[1].replace(/&amp;/g, '&').replace(/^http:\/\/localhost:\d+\//, '');
    const carmen = await pagina(nav, 390, 844, enlace);
    await carmen.waitForSelector('#respuesta');
    await foto(carmen, '01b-llamamiento-desde-correo', true);
    assert.ok((await carmen.locator('#respuesta').innerText()).includes('Carmen'), 'el correo lleva directo a su carta');
    const general = (await api('plan', { mando: 'mando-local', guerra: (await api('cuartel', { mando: 'mando-local' })).guerras[0].id })).mando.general;
    // Un recluta abre el enlace general, toca su carta y se alista; otro se presenta voluntario.
    const r = await pagina(nav, 390, 844, '#g=' + general);
    await foto(r, '02-llamamiento', true);
    await r.locator('[data-a="elegirCarta"]').nth(1).click();
    await pulsa(r, '¡Me alisto!');
    await r.fill('#voluntario', 'Sergio'); await pulsa(r, 'Enviar');
    await foto(r, '03-alistado', true);
    // Cierre con fecha y hora, último parte para un rezagado y ordenanzas personalizadas.
    await m.reload(); await m.waitForLoadState('networkidle');
    await plan.paso(m, 2); await plan.abrir(m, 'llamamiento');
    await m.fill('#cierre', '2030-11-20T20:00'); await m.locator('#cierre').dispatchEvent('change');
    await plan.paso(m, 5); await plan.abrir(m, 'ordenanzas');
    await pulsa(m, 'Personalizar las ordenanzas');
    await m.fill('#ot-0', 'El combate, versión del alto mando');
    await m.locator('[data-a="ordMover"][data-v="1:-1"]').click();
    await plan.paso(m, 6);
    await foto(m, '04b-ordenanzas', true);
    const conv0 = await api('convocatoria', { g: general });
    assert.strictEqual(conv0.guerra.ordenanzas[1].t, 'El combate, versión del alto mando', 'las ordenanzas personalizadas se guardan');
    assert.ok(conv0.cierreTs > Date.now() && /a las 20:00/.test(conv0.cierre), conv0.cierre);
    const carmenId = conv0.gente.find((g) => g.nombre === 'Carmen').id;
    const ult = await pagina(nav, 390, 844, '#g=' + general + '&r=' + carmenId + '&parte=1');
    await ult.waitForSelector('#cuenta-parte');
    await foto(ult, '04c-ultimo-parte', true);
    const ultPc = await pagina(nav, 1280, 860, '#g=' + general + '&r=' + carmenId + '&parte=1');
    await ultPc.waitForSelector('#cuenta-parte');
    await foto(ultPc, '04d-ultimo-parte-pc', true);
    const conv = await api('convocatoria', { g: general });
    for (const g of conv.gente) if (g.alistado == null && g.nombre !== 'Carmen') await api('alistar', { g: general, id: g.id, si: true });
    await m.reload(); await m.waitForLoadState('networkidle');
    await plan.paso(m, 2); await plan.abrir(m, 'llamamiento');
    await foto(m, '04-plan-respuestas', true);
    assert.ok(await m.getByText('se presenta voluntario').count(), 'el voluntario aparece en el plan');
    await m.locator('[data-a="reclutar"][data-v$=":0"]').click(); await m.waitForLoadState('networkidle');
    await plan.abrir(m, 'llamamiento');
    await m.locator('[data-a="conmutar"][data-v="plan.llamamiento.soloAlistados"]').click();   // que entre también Carmen
    await plan.paso(m, 4);
    await m.locator('[data-a="extra"][data-v="condecoraciones"]').click();
    await plan.declarar(m);
    await m.locator('[data-a="declararYa"]').click();
    await m.waitForFunction(() => location.hash === '#/cuartel');
    const correos = (await api('_prueba', {})).correos.filter((c) => /Comienza/.test(c.asunto));
    assert.strictEqual(correos.length, 4);
    assert.ok(correos[0].html.includes('cid:tropa') && correos[0].imagenes.length, 'la tropa va dentro de la orden');
    fs.writeFileSync(path.join(SALIDA, 'correo-orden.html'), correos[0].html.replace('cid:tropa', correos[0].imagenes[0].datos));
    const tok = {};
    correos.forEach((c) => { tok[NOMBRES[Number(c.para[1])]] = /#t=([\w.]+)/.exec(c.html)[1]; });
    // Con cuatro combatientes cada batalla tiene dos votos: todos votan «a» y «b» alternando para empatar todo.
    let k = 0;
    for (const n of NOMBRES) { const s = await api('estado', { token: tok[n] }); for (const b of s.batallas.filter((x) => x.mia)) await api('votar', { token: tok[n], batalla: b.id, elegido: k++ % 2 ? b.a : b.b }); }
    await api('_prueba', { salto: 20000 });
    await m.reload(); await m.waitForLoadState('networkidle');
    await pulsa(m, 'Informe clasificado');
    await m.waitForSelector('.tabla');
    await foto(m, '05-informe-empate', true);
    await pulsa(m, '¡Que empiece el desfile!');
    const j = await pagina(nav, 390, 844, '#t=' + tok['María']);
    let est = await api('estado', { token: tok['María'] });
    while (est.desfile.actual.t !== 'duelo') { await api('desfile', { mando: 'mando-local', token: tok['Fran'], orden: 'siguiente' }); est = await api('estado', { token: tok['María'] }); }
    const duelistas = est.desfile.actual.duelo.entre, fuera = NOMBRES.find((n) => duelistas.indexOf(est.gente.find((g) => g.nombre === n).id) < 0);
    const v = fuera ? await pagina(nav, 1280, 860, '#t=' + tok[fuera]) : null;
    await j.reload(); await j.waitForLoadState('networkidle');
    await foto(j, '06-duelo-movil', true);
    if (v) { await foto(v, '07-duelo-pc'); await v.locator('[data-a="votarDuelo"]').first().click(); await v.waitForLoadState('networkidle'); await foto(v, '08-duelo-votado'); }
    await m.reload(); await m.waitForLoadState('networkidle');
    await foto(m, '09-mando-duelo', true);
    for (;;) { est = await api('estado', { token: tok['María'] }); if (est.desfile.ultimo) break; await api('desfile', { mando: 'mando-local', token: tok['Fran'], orden: 'siguiente' }); }
    await j.reload(); await j.waitForLoadState('networkidle');
    await foto(j, '10-campeon-tras-duelo', true);
  } finally { await nav.close(); servidor.kill(); }
  if (errores.length) { console.log('ERRORES DE PANTALLA:\n' + errores.join('\n')); process.exit(1); }
  console.log('Segundo recorrido sin errores. Capturas en ' + SALIDA);
})().catch((e) => { console.error(e); process.exit(1); });
