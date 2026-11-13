// Convierte los fondos SVG en JPG para los correos (Gmail no muestra SVG). node herramientas/fondos-correo.js
'use strict';
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const raiz = path.join(__dirname, '..');
(async () => {
  const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const hacer = async (svg, ancho, alto, salida, velo) => {
    const p = await (await nav.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2 })).newPage();
    const datos = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(raiz, 'assets', svg)).toString('base64');
    await p.setContent(`<body style="margin:0;background:#0d0b1a"><div style="position:relative;width:${ancho}px;height:${alto}px;background:#0d0b1a url(${datos}) center bottom/100% auto no-repeat">
      <div style="position:absolute;inset:0;background:${velo}"></div></div></body>`);
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(raiz, 'assets', salida), type: 'jpeg', quality: 72 });
    console.log(salida, fs.statSync(path.join(raiz, 'assets', salida)).size, 'bytes');
  };
  await hacer('fondo-reflectores-movil.svg', 390, 844, 'correo-reflectores.jpg', 'linear-gradient(rgba(13,11,26,0.15), rgba(13,11,26,0) 40%)');
  await hacer('fondo-mapa-movil.svg', 390, 858, 'correo-mapa.jpg', 'rgba(13,11,26,0.1)');
  await nav.close();
})();
