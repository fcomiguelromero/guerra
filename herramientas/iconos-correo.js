// Dibuja en PNG los iconos que usan los correos (los clientes de correo no muestran SVG).
// Ejecutar con: NODE_PATH=/opt/npm-tools/node_modules node herramientas/iconos-correo.js
'use strict';
const { spawn } = require('child_process');
const path = require('path');
const { chromium } = require('playwright');
const PUERTO = 8139;
(async () => {
  const servidor = spawn('node', [path.join(__dirname, 'servidor.js'), String(PUERTO)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => servidor.stdout.once('data', r));
  const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    const p = await (await nav.newContext({ viewport: { width: 200, height: 200 }, deviceScaleFactor: 3 })).newPage();
    await p.goto('http://localhost:' + PUERTO + '/index.html#nada');
    const COLORES = await p.evaluate(async () => (await import('/app/dibujos.js')).COLOR_ICONO);
    for (const [ic, color] of Object.entries(COLORES)) {
      await p.evaluate(async ([ic, color]) => {
        const { icono } = await import('/app/dibujos.js');
        document.body.innerHTML = `<div id="t" style="position:fixed;left:0;top:0;width:40px;height:40px;border-radius:11px;background:${color}22;border:1.5px solid ${color}88;box-sizing:border-box;display:flex;align-items:center;justify-content:center;color:${color}">${icono(ic, 22, 2)}</div>`;
        document.body.style.background = 'transparent';
        document.documentElement.style.background = 'transparent';
      }, [ic, color]);
      await p.locator('#t').screenshot({ path: path.join(__dirname, '..', 'assets', 'correo', 'ic-' + ic + '.png'), omitBackground: true });
    }
  } finally { await nav.close(); servidor.kill(); }
  console.log('Iconos de correo dibujados.');
})();
