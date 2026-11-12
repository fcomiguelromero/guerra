// Servidor de desarrollo: sirve las pantallas y un motor en memoria en /api. node herramientas/servidor.js [puerto]
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const M = (0, eval)(fs.readFileSync(path.join(raiz, 'motor', 'motor.js'), 'utf8'));
const docs = new Map(), fotos = new Map(), correos = [];
let salto = 0;
const env = {
  ahora: () => Date.now() + salto, azar: Math.random, hora: () => 12,
  id: (n) => { let s = ''; while (s.length < n) s += Math.floor(Math.random() * 36).toString(36); return s; },
  leer: (k) => docs.has(k) ? JSON.parse(docs.get(k)) : null, escribir: (k, o) => docs.set(k, JSON.stringify(o)), borrar: (k) => docs.delete(k),
  leerFoto: (id) => fotos.get(id) || null, escribirFoto: (id, d) => fotos.set(id, d),
  registrar: () => {}, candado: (fn) => fn(), correo: (m) => correos.push(m),
  ajuste: (k) => ({ CLAVE_MANDO: 'mando-local', URL_APP: 'http://localhost:' + puerto + '/' })[k]
};
const motor = M.crear(env);
const puerto = Number(process.argv[2]) || 8123;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api' || url.pathname === '/_prueba') {
    let cuerpo = '';
    req.on('data', (c) => { cuerpo += c; });
    req.on('end', () => {
      let salida;
      try {
        const p = JSON.parse(cuerpo || '{}');
        if (url.pathname === '/_prueba') { if (p.salto) salto += p.salto; salida = { ok: true, datos: { correos, salto } }; }
        else salida = { ok: true, datos: motor.atender(p) };
      } catch (e) {
        if (!e.fallo) console.error(e);
        salida = { ok: false, codigo: e.codigo || 'interno', error: e.fallo ? e.message : 'Error interno: ' + e.message };
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(salida));
    });
    return;
  }
  const f = path.join(raiz, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(puerto, () => console.log('Guerra en http://localhost:' + puerto + '/#mando=mando-local'));
