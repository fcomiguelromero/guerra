// Pone el mismo número de versión a todo lo que carga la app: index.html (estilos y main.js) y cada
// «import» entre módulos de app/. GitHub Pages deja que el navegador guarde cada archivo 10 minutos;
// con la versión en la dirección, al publicar un cambio nadie se queda con módulos viejos mezclados.
// Uso: node herramientas/version-app.js [número]   (sin número, sube uno)
'use strict';
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const indice = path.join(raiz, 'index.html');
let html = fs.readFileSync(indice, 'utf8');
const actual = Number((/main\.js\?v=(\d+)/.exec(html) || [])[1] || 0);
const v = Number(process.argv[2]) || actual + 1;
html = html.replace(/(app\/[\w-]+\.(?:js|css))\?v=\d+/g, '$1?v=' + v);
fs.writeFileSync(indice, html);
const dir = path.join(raiz, 'app');
let n = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const p = path.join(dir, f), antes = fs.readFileSync(p, 'utf8');
  const despues = antes.replace(/(from\s+'|import\(\s*')(\.\/[\w-]+\.js)(\?v=\d+)?'/g, (m, a, ruta) => { n++; return a + ruta + '?v=' + v + "'"; });
  if (despues !== antes) fs.writeFileSync(p, despues);
}
console.log('Versión ' + v + ' puesta en index.html y en ' + n + ' imports.');
