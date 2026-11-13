// Genera el icono de la app y la imagen de la vista previa de los enlaces (WhatsApp, Telegram…).
// node herramientas/imagenes.js <carpeta con barlow-condensed-latin-800-normal.woff2>
'use strict';
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const raiz = path.join(__dirname, '..');
const fuente = 'data:font/woff2;base64,' + fs.readFileSync(path.join(process.argv[2], 'barlow-condensed-latin-800-normal.woff2')).toString('base64');
const fondo = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(raiz, 'assets', 'fondo-reflectores-pc.svg')).toString('base64');
const css = `@font-face{font-family:BC;font-weight:800;src:url(${fuente})}*{margin:0;box-sizing:border-box}body{background:#0d0b1a;font-family:BC;font-weight:800;color:#fff;text-transform:uppercase}`;
const estrella = (t, color) => `<svg width="${t}" height="${t}" viewBox="0 0 24 24"><path fill="${color}" d="M12 1.6l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.7l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z"/></svg>`;
// Icono: dos reflectores que se cruzan, las siglas y la estrella dorada. Todo dentro de la zona segura de los iconos adaptables.
const icono = (t) => `<style>${css}</style><div style="position:relative;width:${t}px;height:${t}px;overflow:hidden;background:radial-gradient(circle at 50% 38%,#2b2360 0%,#0d0b1a 72%)">
  <div style="position:absolute;left:50%;bottom:-6%;width:34%;height:120%;transform-origin:50% 100%;transform:translateX(-50%) rotate(-24deg);background:linear-gradient(to top,rgba(94,240,208,.55),rgba(94,240,208,0));clip-path:polygon(42% 100%,58% 100%,100% 0,0 0)"></div>
  <div style="position:absolute;left:50%;bottom:-6%;width:34%;height:120%;transform-origin:50% 100%;transform:translateX(-50%) rotate(24deg);background:linear-gradient(to top,rgba(255,106,213,.55),rgba(255,106,213,0));clip-path:polygon(42% 100%,58% 100%,100% 0,0 0)"></div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${t * 0.01}px">
    ${estrella(t * 0.2, '#ffd36a')}
    <div style="font-size:${t * 0.42}px;line-height:.86;letter-spacing:${t * 0.01}px;text-shadow:0 ${t * 0.012}px ${t * 0.05}px #0d0b1a">GN</div>
  </div></div>`;
const previa = `<style>${css}</style><div style="position:relative;width:1200px;height:630px;overflow:hidden;background:#0d0b1a url(${fondo}) center bottom/cover no-repeat">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(13,11,26,.35),rgba(13,11,26,.8))"></div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px">
    ${estrella(64, '#ffd36a')}
    <div style="font-size:128px;line-height:.9;letter-spacing:2px;text-shadow:0 4px 30px #0d0b1a">Guerra de la<br>Normalidad</div>
    <div style="margin-top:10px;padding:8px 26px 12px;border:4px solid #5ef0d0;border-radius:16px;font-size:46px;letter-spacing:3px;color:#5ef0d0;background:rgba(13,11,26,.7)">¡Sólo puede quedar uno!</div>
  </div></div>`;
(async () => {
  const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const hacer = async (html, ancho, alto, salida, opciones) => {
    const p = await (await nav.newContext({ viewport: { width: ancho, height: alto } })).newPage();
    await p.setContent(html);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    await p.screenshot(Object.assign({ path: path.join(raiz, 'assets', salida) }, opciones));
    console.log(salida, fs.statSync(path.join(raiz, 'assets', salida)).size, 'bytes');
  };
  await hacer(icono(512), 512, 512, 'icono-512.png');
  await hacer(icono(192), 192, 192, 'icono-192.png');
  await hacer(icono(180), 180, 180, 'icono-180.png');
  await hacer(previa, 1200, 630, 'vista-previa.jpg', { type: 'jpeg', quality: 82 });
  await nav.close();
})();
