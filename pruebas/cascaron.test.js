// Prueba del cascarón y del adaptador de Apps Script con unos servicios de Google de pega.
// Ejecutar con: node pruebas/cascaron.test.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto'), assert = require('assert');
const raiz = path.join(__dirname, '..');

// Sheets convierte lo que parece un número o una fórmula: la pega lo imita para probar el centinela.
function comoSheets(v) {
  if (typeof v !== 'string') return v;
  if (v.length > 50000) throw new Error('celda de más de 50.000 caracteres');
  if (/^=/.test(v)) return '#ERROR!';
  if (/^[+-]?\d+(\.\d+)?(e\d+)?$/i.test(v)) return Number(v);
  return v;
}
function Hoja(nombre) {
  const filas = [];
  let maxCols = 26;
  const h = {
    getName: () => nombre,
    appendRow: (v) => { if (v.length > maxCols) throw new Error('columnas fuera de rango'); filas.push(v.map(comoSheets)); },
    setFrozenRows: () => {},
    getLastRow: () => filas.length,
    getLastColumn: () => filas.reduce((m, f) => Math.max(m, f.length), 0),
    getMaxColumns: () => maxCols,
    insertColumnsAfter: (c, n) => { maxCols += n; },
    deleteRow: (r) => { filas.splice(r - 1, 1); },
    getRange: (r, c, nr, nc) => {
      nr = nr || 1; nc = nc || 1;
      if (c + nc - 1 > maxCols) throw new Error('columnas fuera de rango');
      return {
        getValue: () => (filas[r - 1] || [])[c - 1] == null ? '' : filas[r - 1][c - 1],
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => { const v = (filas[r - 1 + i] || [])[c - 1 + j]; return v == null ? '' : v; })),
        setValues: (vals) => vals.forEach((fila, i) => { while (filas.length < r + i) filas.push([]); fila.forEach((v, j) => { filas[r - 1 + i][c - 1 + j] = comoSheets(v); }); }),
        createTextFinder: (texto) => { const f = { matchEntireCell: () => f, matchCase: () => f, findNext: () => { for (let i = 0; i < nr; i++) if ((filas[r - 1 + i] || [])[c - 1] === texto) return { getRow: () => r + i }; return null; } }; return f; }
      };
    },
    _filas: filas
  };
  return h;
}
function nube() {
  const hojas = {}, cache = new Map(), props = new Map(), correos = [], disparadores = [];
  const g = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => hojas[n] || null, insertSheet: (n) => (hojas[n] = Hoja(n)) }) },
    CacheService: { getScriptCache: () => ({
      get: (k) => cache.has(k) ? cache.get(k) : null,
      put: (k, v) => { if (Buffer.byteLength(String(v)) > 100000) throw new Error('valor de caché demasiado grande'); cache.set(k, String(v)); },
      putAll: (m) => Object.keys(m).forEach((k) => { if (Buffer.byteLength(String(m[k])) > 100000) throw new Error('valor de caché demasiado grande'); cache.set(k, String(m[k])); }),
      getAll: (ks) => { const r = {}; ks.forEach((k) => { if (cache.has(k)) r[k] = cache.get(k); }); return r; },
      remove: (k) => cache.delete(k)
    }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => props.has(k) ? props.get(k) : null,
      setProperty: (k, v) => { if (Buffer.byteLength(String(v)) > 9000) throw new Error('propiedad demasiado grande'); props.set(k, String(v)); },
      setProperties: (m) => Object.keys(m).forEach((k) => { if (Buffer.byteLength(String(m[k])) > 9000) throw new Error('propiedad demasiado grande'); props.set(k, String(m[k])); }),
      getProperties: () => Object.fromEntries(props), getKeys: () => Array.from(props.keys()), deleteProperty: (k) => props.delete(k)
    }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    MailApp: { sendEmail: (m) => correos.push(m) },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      formatDate: () => '12',
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, texto) => Array.from(crypto.createHash('sha256').update(texto, 'utf8').digest()).map((b) => b > 127 ? b - 256 : b)
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ texto: t, setMimeType() { return this; } }) },
    ScriptApp: {
      getProjectTriggers: () => disparadores.map((f) => ({ getHandlerFunction: () => f })),
      newTrigger: (f) => ({ timeBased: () => ({ everyHours: () => ({ create: () => disparadores.push(f) }) }) })
    },
    UrlFetchApp: { caida: false, descargas: 0, fetch: (url) => {
      if (g.UrlFetchApp.caida) throw new Error('sin red');
      g.UrlFetchApp.descargas++;
      const rel = url.replace('https://fcomiguelromero.github.io/guerra/', '').split('?')[0];
      const f = path.join(raiz, rel);
      return { getResponseCode: () => fs.existsSync(f) ? 200 : 404, getContentText: () => fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '' };
    } },
    Logger: { log: () => {} }, console, Date, Math, JSON, Object, Array, String, Number, Error, RegExp
  };
  vm.createContext(g);
  vm.runInContext(fs.readFileSync(path.join(raiz, 'instalar', 'Codigo.gs'), 'utf8'), g);
  return { g, hojas, cache, props, correos, disparadores,
    post: (p) => JSON.parse(g.doPost({ postData: { contents: JSON.stringify(p) } }).texto) };
}

let n = 0;
function prueba(nombre, fn) { fn(); n++; console.log('  ✓ ' + nombre); }

const N = nube();

prueba('instalar: crea las pestañas, la clave del alto mando y el reloj, una sola vez', () => {
  N.g.instalar(); N.g.instalar();
  assert.deepStrictEqual(Object.keys(N.hojas).sort(), ['documentos', 'fotos', 'inicio', 'registro']);
  assert.strictEqual(N.disparadores.length, 1);
  const enlace = N.hojas.inicio._filas[2][0];
  assert.ok(/^https:\/\/fcomiguelromero\.github\.io\/guerra\/#mando=[0-9a-f]{28}$/.test(enlace), enlace);
  assert.strictEqual(N.props.get('URL_APP'), 'https://fcomiguelromero.github.io/guerra/');
});

const mando = N.props.get('CLAVE_MANDO');
let id, tokens = {};

prueba('una guerra entera a través de doPost, con los datos en la hoja', () => {
  assert.strictEqual(JSON.parse(N.g.doGet({}).texto).ok, true);
  assert.strictEqual(N.post({ accion: 'crearGuerra', plan: {} }).codigo, 'mando');
  const nombres = ['María', 'Andrés', 'Carmen', 'Fran', 'Javier'];
  // La frase «1e5» y el correo numérico comprueban que la hoja no altera los datos.
  let r = N.post({ accion: 'crearGuerra', mando, plan: { nombre: 'Guerra de prueba', pregunta: '¿Quién?', premio: '=SUMA(1;2)',
    gente: nombres.map((x, i) => ({ nombre: x, correo: 'c' + i + '@ejemplo.test', frase: i ? 'Frase' : '1e5', mando: i === 3 })) } });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  id = r.datos.id;
  r = N.post({ accion: 'declarar', mando, guerra: id });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(r.datos.batallas, 10);
  assert.strictEqual(N.correos.length, 5);
  N.correos.forEach((m) => { tokens[m.to] = /#t=([\w.]+)/.exec(m.htmlBody)[1]; assert.strictEqual(m.name, 'Fran'); });
  nombres.forEach((x, i) => {
    const token = tokens['c' + i + '@ejemplo.test'];
    const est = N.post({ accion: 'estado', token }).datos;
    assert.strictEqual(est.guerra.premio, '=SUMA(1;2)');
    est.batallas.filter((b) => b.mia).forEach((b) => assert.strictEqual(N.post({ accion: 'votar', token, batalla: b.id, elegido: b.a, proclama: 'Porque sí' }).ok, true));
  });
  const est = N.post({ accion: 'estado', token: tokens['c0@ejemplo.test'] }).datos;
  assert.strictEqual(est.progreso.emitidos, 30);
  assert.strictEqual(est.gente.find((x) => x.nombre === 'María').frase, '1e5');
  assert.ok(N.hojas.registro._filas.length > 30);
  assert.ok(N.hojas.documentos._filas.some((f) => f[0] === 'guerra:' + id && String(f[3])[0] === '~'));
});

prueba('una guerra grande se reparte en varias celdas y varias entradas de caché', () => {
  const doc = JSON.parse(N.hojas.documentos._filas.find((f) => f[0] === 'guerra:' + id).slice(3).map((v) => String(v).slice(1)).join(''));
  const largo = 'Proclama larguísima con eñes y acentos: ¡qué batalla más reñida, señoría! '.repeat(2).slice(0, 190);
  Object.keys(doc.votos).forEach((b) => Object.keys(doc.votos[b]).forEach((v) => { doc.votos[b][v][2] = largo; }));
  doc.relleno = Array.from({ length: 1300 }, (_, i) => '0' + i + '=' + largo);
  // Se escribe por la vía normal: el motor relee desde la hoja y desde la caché.
  const texto = JSON.stringify(doc);
  assert.ok(texto.length > 150000);
  const env = vm.runInContext('motor_()', N.g);
  N.cache.clear();
  const fila = N.hojas.documentos._filas.find((f) => f[0] === 'guerra:' + id);
  const trozos = [];
  for (let i = 0; i < texto.length; i += 45000) trozos.push('~' + texto.slice(i, i + 45000));
  fila.splice(3, fila.length - 3, ...trozos);
  let est = N.post({ accion: 'estado', token: tokens['c1@ejemplo.test'] });
  assert.strictEqual(est.ok, true, JSON.stringify(est).slice(0, 300));
  assert.ok(Number(N.cache.get('d:guerra:' + id)) >= 5, 'la caché guarda el documento en trozos');
  est = N.post({ accion: 'estado', token: tokens['c1@ejemplo.test'] });
  assert.strictEqual(est.ok, true);
  const r = N.post({ accion: 'pulla', token: tokens['c1@ejemplo.test'], texto: 'Hola' });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  const filaNueva = N.hojas.documentos._filas.find((f) => f[0] === 'guerra:' + id);
  const releido = JSON.parse(filaNueva.slice(3).map((v) => String(v).slice(1)).join(''));
  assert.strictEqual(releido.relleno.length, 1300);
  assert.strictEqual(releido.pullas.length, 1);
  assert.ok(env);
});

prueba('fotos: se guardan en trozos y se sirven tal cual', () => {
  const datos = 'data:image/jpeg;base64,' + '+/9j' + 'A1b2'.repeat(15000);
  const r = N.post({ accion: 'subirFoto', mando, datos });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  N.cache.clear();
  assert.strictEqual(N.post({ accion: 'fotos', ids: [r.datos.id] }).datos[r.datos.id], datos);
  assert.strictEqual(N.post({ accion: 'subirFoto', mando, datos: 'data:text/html;base64,AAAA' }).codigo, 'foto');
});

prueba('sin red: el motor sigue funcionando con la copia de reserva', () => {
  N.cache.clear();
  N.g.UrlFetchApp.caida = true;
  assert.strictEqual(N.post({ accion: 'ping' }).ok, true);
  N.g.UrlFetchApp.caida = false;
});

prueba('un motor manipulado no se ejecuta: manda la huella', () => {
  const M2 = nube();
  const bueno = fs.readFileSync(path.join(raiz, 'motor', 'motor.js'), 'utf8');
  const original = M2.g.UrlFetchApp.fetch;
  M2.g.UrlFetchApp.fetch = (url) => /motor\.js/.test(url) ? { getResponseCode: () => 200, getContentText: () => bueno + '\n// manipulado' } : original(url);
  const r = JSON.parse(M2.g.doPost({ postData: { contents: '{"accion":"ping"}' } }).texto);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.codigo, 'motor');
});

prueba('errores internos: respuesta amable y apunte en el registro', () => {
  const r = JSON.parse(N.g.doPost({ postData: { contents: '{mal json' } }).texto);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.codigo, 'interno');
  assert.ok(N.hojas.registro._filas.some((f) => f[3] === 'ERROR'));
});

console.log('\n' + n + ' pruebas superadas.');
