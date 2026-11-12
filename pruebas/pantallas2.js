// Segundo recorrido: llamamiento a filas, foto de una carta y duelo final en el desfile.
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node pruebas/pantallas2.js [carpeta de capturas]
'use strict';
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs'), assert = require('assert'), zlib = require('zlib');
const { chromium } = require('playwright');
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
  const fila = Buffer.concat([Buffer.from([0]), Buffer.alloc(900, 0).map((_, i) => [200, 120, 60][i % 3])]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), trozo('IHDR', ihdr), trozo('IDAT', zlib.deflateSync(Buffer.concat(Array(200).fill(fila)))), trozo('IEND', Buffer.alloc(0))]);
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
    for (let i = 0; i < NOMBRES.length; i++) { await pulsa(m, 'Reclutar combatiente'); await m.fill('#gn-' + i, NOMBRES[i]); await m.fill('#gc-' + i, 'c' + i + '@ejemplo.test'); }
    await m.locator('[data-a="soyYo"][data-v="3"]').click();
    fs.writeFileSync(path.join(SALIDA, 'foto.png'), png());
    await m.locator('input[type=file][data-v="0"]').setInputFiles(path.join(SALIDA, 'foto.png'));
    await m.waitForSelector('.retrato img');
    await pulsa(m, 'Abrir el llamamiento');
    await foto(m, '01-llamamiento-plan', true);
    const general = (await api('plan', { mando: 'mando-local', guerra: (await api('cuartel', { mando: 'mando-local' })).guerras[0].id })).mando.general;
    // Un recluta abre el enlace general, toca su carta y se alista; otro se presenta voluntario.
    const r = await pagina(nav, 390, 844, '#g=' + general);
    await foto(r, '02-llamamiento', true);
    await r.locator('[data-a="elegirCarta"]').nth(1).click();
    await pulsa(r, '¡Me alisto!');
    await r.fill('#voluntario', 'Sergio'); await pulsa(r, 'Enviar');
    await foto(r, '03-alistado', true);
    const conv = await api('convocatoria', { g: general });
    for (const g of conv.gente) if (g.alistado == null && g.nombre !== 'Carmen') await api('alistar', { g: general, id: g.id, si: true });
    await m.reload(); await m.waitForLoadState('networkidle');
    await foto(m, '04-plan-respuestas', true);
    assert.ok(await m.getByText('se presenta voluntario').count(), 'el voluntario aparece en el plan');
    await m.locator('[data-a="reclutar"][data-v$=":0"]').click(); await m.waitForLoadState('networkidle');
    await m.locator('[data-a="conmutar"][data-v="plan.llamamiento.soloAlistados"]').click();   // que entre también Carmen
    await m.locator('[data-a="conmutar"][data-v="plan.extras.condecoraciones"]').click();
    await pulsa(m, '¡Declarar la guerra!');
    await m.locator('[data-a="declararYa"]').click();
    await m.waitForFunction(() => location.hash === '#/cuartel');
    const { correos } = await api('_prueba', {});
    assert.strictEqual(correos.length, 4);
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
