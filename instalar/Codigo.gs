/**
 * Guerra de la Normalidad: cascarón.
 *
 * Esto es lo único que vive en Google Apps Script, pegado a la hoja de cálculo del juego.
 * El motor (reglas, votos, correos) se descarga de la web del proyecto, se comprueba su
 * huella y se ejecuta aquí, con los permisos de esta hoja. Así el motor se actualiza solo
 * y este archivo no hay que volver a tocarlo.
 */
var WEB = 'https://fcomiguelromero.github.io/guerra/';

function doGet(e) { return atender_(e); }
function doPost(e) { return atender_(e); }
function tictac() { motor_().reloj(); }

/** Ejecutar una vez desde el editor: prepara la hoja y deja el enlace del alto mando en la pestaña «inicio». */
function instalar() {
  var enlace = motor_().instalar();
  Logger.log('Listo. Tu enlace de alto mando está en la pestaña «inicio» de la hoja: ' + enlace);
}

function atender_(e) {
  var m;
  try { m = motor_(); } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, codigo: 'motor', error: 'El cuartel general no responde. Vuelve a intentarlo en un minuto.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return m.web(e);
}

function motor_() {
  var cache = CacheService.getScriptCache();
  var props = PropertiesService.getScriptProperties();
  var huella = cache.get('motor:huella');
  if (!huella) {
    try {
      var r = UrlFetchApp.fetch(WEB + 'motor/version.txt?' + Date.now(), { muteHttpExceptions: true });
      if (r.getResponseCode() === 200 && /^[0-9a-f]{64}$/.test(r.getContentText().trim())) huella = r.getContentText().trim();
    } catch (err) { /* sin red: se usa la última copia buena */ }
    if (!huella) huella = props.getProperty('motor:huella');
    if (!huella) throw new Error('No se pudo descargar el motor.');
    cache.put('motor:huella', huella, 120);
  }
  var codigo = leerTrozos_(function (claves) { return cache.getAll(claves); }, cache.get('motor:' + huella), 'motor:' + huella + ':');
  if (!codigo) {
    if (props.getProperty('motor:huella') === huella) codigo = copiaBuena_(props);
    if (!codigo) {
      var r2 = UrlFetchApp.fetch(WEB + 'motor/motor.js?v=' + huella, { muteHttpExceptions: true });
      codigo = r2.getResponseCode() === 200 ? r2.getContentText() : '';
      if (codigo && huella_(codigo) === huella) {
        guardarCopiaBuena_(props, huella, codigo);
      } else {
        codigo = copiaBuena_(props);           // la descarga no cuadra con su huella: no se ejecuta
        huella = props.getProperty('motor:huella');
        if (!codigo) throw new Error('El motor descargado no coincide con su huella.');
      }
    }
    var mapa = {}, n = 0;
    for (var i = 0; i < codigo.length; i += 30000) mapa['motor:' + huella + ':' + n++] = codigo.slice(i, i + 30000);
    mapa['motor:' + huella] = String(n);
    try { cache.putAll(mapa, 21600); } catch (err) { /* sin caché se descarga otra vez */ }
  }
  return (0, eval)(codigo).gas({ urlApp: WEB });
}

function huella_(texto) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function leerTrozos_(leer, cuantos, prefijo) {
  var n = Number(cuantos);
  if (!n) return null;
  var claves = [];
  for (var i = 0; i < n; i++) claves.push(prefijo + i);
  var mapa = leer(claves), texto = '';
  for (var j = 0; j < n; j++) { if (mapa[claves[j]] == null) return null; texto += mapa[claves[j]]; }
  return texto;
}
function copiaBuena_(props) {
  var todas = props.getProperties();
  var codigo = leerTrozos_(function () { return todas; }, todas['motor:trozos'], 'motor:copia:');
  return codigo && huella_(codigo) === todas['motor:huella'] ? codigo : null;
}
function guardarCopiaBuena_(props, huella, codigo) {
  try {
    var viejas = props.getKeys().filter(function (k) { return k.indexOf('motor:copia:') === 0; });
    viejas.forEach(function (k) { props.deleteProperty(k); });
    var mapa = {}, n = 0;
    for (var i = 0; i < codigo.length; i += 4000) mapa['motor:copia:' + n++] = codigo.slice(i, i + 4000);
    mapa['motor:trozos'] = String(n);
    mapa['motor:huella'] = huella;
    props.setProperties(mapa);
  } catch (err) { /* la copia de reserva es opcional */ }
}
