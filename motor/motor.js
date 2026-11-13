(function () {
'use strict';
/*
 * Motor de la Guerra de la Normalidad.
 * Un único archivo: reglas puras + acciones + adaptador de Google Apps Script.
 * El cascarón instalado en Google lo descarga y lo evalúa; las pruebas de Node lo cargan igual.
 */

var VERSION = '0.1.0';
var GRACIA = 10000;          // 10 segundos de cortesía para retirar un voto
var MARGEN = 4000;           // holgura por la latencia de la red
var DIA = 86400000;
var DUELO_SEG = 60;
var HORA_OFENSIVA = 9;     // con una ofensiva al día, la nueva se abre a las 9:00
var EXTRAS = ['porra', 'espia', 'desfile', 'proclamas', 'condecoraciones', 'radio', 'parte', 'corneta'];
var GRADOS = ['Recluta', 'Soldado', 'Cabo', 'Sargento', 'Alférez', 'Teniente', 'Capitán', 'Comandante', 'Coronel', 'General'];

// ---------------------------------------------------------------- utilidades

function Fallo(codigo, mensaje) {
  var e = new Error(mensaje);
  e.codigo = codigo;
  e.fallo = true;
  return e;
}
function exigir(cond, codigo, mensaje) { if (!cond) throw Fallo(codigo, mensaje); }
function txt(v, max) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 200); }
function parrafo(v, max) { return String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, max || 2000); }
function norm(s) { return txt(s, 200).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function porId(lista) { var m = {}; lista.forEach(function (x) { m[x.id] = x; }); return m; }
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
function enumerar(nombres) {
  if (nombres.length < 2) return nombres.join('');
  var ultimo = nombres[nombres.length - 1];
  return nombres.slice(0, -1).join(', ') + (/^(i|hi)/i.test(ultimo) ? ' e ' : ' y ') + ultimo;
}
function barajar(lista, azar) {
  var a = lista.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(azar() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// ---------------------------------------------------------------- reglas puras

// Todos contra todos por el método del círculo. Con número impar, uno descansa en cada ofensiva.
function calendario(ids, azar) {
  var eq = barajar(ids, azar);
  if (eq.length % 2) eq.push(null);
  var n = eq.length, batallas = [], id = 1;
  for (var r = 0; r < n - 1; r++) {
    var pares = [];
    for (var i = 0; i < n / 2; i++) {
      var x = eq[i], y = eq[n - 1 - i];
      if (x !== null && y !== null) pares.push(azar() < 0.5 ? [x, y] : [y, x]);
    }
    barajar(pares, azar).forEach(function (p) { batallas.push({ id: id++, of: r + 1, a: p[0], b: p[1] }); });
    eq.splice(1, 0, eq.pop());
  }
  return batallas;
}

function contendientes(doc) { return doc.gente.filter(function (g) { return g.combate && g.estado !== 'expulsado'; }); }
function votantes(doc) { return doc.gente.filter(function (g) { return g.vota && g.estado !== 'expulsado'; }); }
function batallasVivas(doc) {
  var vivo = porId(contendientes(doc));
  return (doc.batallas || []).filter(function (b) { return vivo[b.a] && vivo[b.b]; });
}
function puedeVotar(v, b) { return v.vota && b.a !== v.id && b.b !== v.id; }
function batallasDe(doc, v) { return batallasVivas(doc).filter(function (b) { return puedeVotar(v, b); }); }
function votoDe(doc, b, vid) { var vs = doc.votos[b.id]; return vs && vs[vid] ? vs[vid] : null; }
function faltan(doc, v) {
  return batallasDe(doc, v).filter(function (b) { return !votoDe(doc, b, v.id); }).length;
}
// Con «limite» (ofensivas ya abiertas), sólo es rezagado quien debe batallas que ya puede votar.
function progreso(doc, limite) {
  var total = 0, emitidos = 0, rezagados = [];
  votantes(doc).forEach(function (v) {
    var suyas = batallasDe(doc, v), f = faltan(doc, v);
    total += suyas.length; emitidos += suyas.length - f;
    var abiertas = limite ? suyas.filter(function (b) { return b.of <= limite; }) : suyas;
    var debe = abiertas.filter(function (b) { return !votoDe(doc, b, v.id); }).length;
    if (debe > 0 && v.estado === 'activo') rezagados.push({ id: v.id, faltan: debe, de: abiertas.length });
  });
  rezagados.sort(function (x, y) { return y.faltan - x.faltan; });
  return { total: total, emitidos: emitidos, rezagados: rezagados };
}

// Recuento de cada batalla viva y fila de cada contendiente.
function recuento(doc) {
  var vota = porId(votantes(doc)), filas = {};
  contendientes(doc).forEach(function (c) { filas[c.id] = { id: c.id, g: 0, e: 0, p: 0, vf: 0, vc: 0 }; });
  var batallas = batallasVivas(doc).map(function (b) {
    var va = 0, vb = 0, vs = doc.votos[b.id] || {};
    Object.keys(vs).forEach(function (vid) {
      if (!vota[vid]) return;
      if (vs[vid][0] === b.a) va++; else vb++;
    });
    var fa = filas[b.a], fb = filas[b.b];
    fa.vf += va; fa.vc += vb; fb.vf += vb; fb.vc += va;
    if (va > vb) { fa.g++; fb.p++; } else if (vb > va) { fb.g++; fa.p++; } else { fa.e++; fb.e++; }
    return { id: b.id, of: b.of, a: b.a, b: b.b, va: va, vb: vb };
  });
  Object.keys(filas).forEach(function (id) {
    var f = filas[id];
    f.dif = f.vf - f.vc;
    f.liga = 3 * f.g + f.e;
    f.pts = doc.puntuacion === 'votos' ? 3 * f.vf : f.liga;
  });
  return { filas: filas, batallas: batallas };
}

// Puntos del enfrentamiento directo dentro de un grupo de empatados.
function directo(grupo, batallas) {
  var dentro = porId(grupo), pts = {};
  grupo.forEach(function (f) { pts[f.id] = 0; });
  batallas.forEach(function (b) {
    if (!dentro[b.a] || !dentro[b.b]) return;
    if (b.va > b.vb) pts[b.a] += 3; else if (b.vb > b.va) pts[b.b] += 3; else { pts[b.a]++; pts[b.b]++; }
  });
  return pts;
}

// Clasificación: puntos, diferencia de votos, enfrentamiento directo, votos a favor y, al final, el sorteo.
function clasificar(doc, rec) {
  var sorteo = {};
  (doc.orden || doc.gente.map(function (g) { return g.id; })).forEach(function (id, i) { sorteo[id] = -i; });
  var criterios = [
    function (grupo) { var m = {}; grupo.forEach(function (f) { m[f.id] = f.pts; }); return m; },
    function (grupo) { var m = {}; grupo.forEach(function (f) { m[f.id] = f.dif; }); return m; },
    function (grupo) { return directo(grupo, rec.batallas); },
    function (grupo) { var m = {}; grupo.forEach(function (f) { m[f.id] = f.vf; }); return m; },
    function (grupo) { var m = {}; grupo.forEach(function (f) { m[f.id] = sorteo[f.id] || 0; }); return m; }
  ];
  function ordenar(grupo, nivel) {
    if (grupo.length < 2 || nivel >= criterios.length) return grupo;
    var val = criterios[nivel](grupo);
    var orden = grupo.slice().sort(function (x, y) { return val[y.id] - val[x.id]; });
    var res = [], i = 0;
    while (i < orden.length) {
      var j = i;
      while (j < orden.length && val[orden[j].id] === val[orden[i].id]) j++;
      res = res.concat(ordenar(orden.slice(i, j), nivel + 1));
      i = j;
    }
    return res;
  }
  var tabla = ordenar(Object.keys(rec.filas).map(function (id) { return rec.filas[id]; }), 0);
  tabla.forEach(function (f, i) { f.pos = i + 1; });
  // Empate en el primer puesto: basta con igualar a puntos (regla por defecto) o, si se desactiva,
  // sólo cuando persiste tras la diferencia de votos y el enfrentamiento directo.
  var empate = null;
  if (tabla.length > 1) {
    var grupo = tabla.filter(function (f) { return f.pts === tabla[0].pts; });
    if (doc.dueloPorPuntos === false) {
      grupo = grupo.filter(function (f) { return f.dif === tabla[0].dif; });
      var d = directo(grupo, rec.batallas);
      grupo = grupo.filter(function (f) { return d[f.id] === d[tabla[0].id]; });
    }
    if (grupo.length > 1) empate = grupo.map(function (f) { return f.id; });
  }
  return { tabla: tabla, empate: empate };
}

function puntuarPorras(doc, tabla) {
  var pos = {}, vota = porId(votantes(doc));
  tabla.forEach(function (f) { pos[f.id] = f.pos; });
  var lista = Object.keys(doc.porras || {}).filter(function (vid) { return vota[vid]; }).map(function (vid) {
    var orden = doc.porras[vid].orden.filter(function (id) { return pos[id]; }), suma = 0;
    orden.forEach(function (id, i) { suma += Math.abs(i + 1 - pos[id]); });
    return { id: vid, suma: suma, ts: doc.porras[vid].ts };
  });
  lista.sort(function (x, y) { return x.suma - y.suma || x.ts - y.ts; });
  lista.forEach(function (p, i) { p.pos = i + 1; });
  var gana = lista.length ? lista.filter(function (p) { return p.suma === lista[0].suma; }).map(function (p) { return p.id; }) : [];
  return { lista: lista, gana: gana };
}

// Suma provisional de una porra con sólo los puestos ya revelados en el desfile.
function porraParcial(doc, revelados) {
  var pos = {}, vota = porId(votantes(doc));
  revelados.forEach(function (r) { pos[r.id] = r.pos; });
  var vivos = porId(contendientes(doc));
  var lista = Object.keys(doc.porras || {}).filter(function (vid) { return vota[vid]; }).map(function (vid) {
    var orden = doc.porras[vid].orden.filter(function (id) { return vivos[id]; }), suma = 0;
    orden.forEach(function (id, i) { if (pos[id]) suma += Math.abs(i + 1 - pos[id]); });
    return { id: vid, suma: suma };
  });
  lista.sort(function (x, y) { return x.suma - y.suma; });
  return lista;
}

function condecorar(doc, rec) {
  var gana = {};
  rec.batallas.forEach(function (b) { gana[b.id] = b.va > b.vb ? b.a : b.vb > b.va ? b.b : null; });
  var fichas = votantes(doc).map(function (v) {
    var con = 0, contra = 0, de = 0;
    rec.batallas.forEach(function (b) {
      var voto = votoDe(doc, b, v.id);
      if (!voto) return;
      de++;
      if (gana[b.id] === null) return;
      if (voto[0] === gana[b.id]) con++; else contra++;
    });
    return { id: v.id, con: con, contra: contra, de: de, fin: v.fin, estado: v.estado, faltaban: v.faltaban || 0 };
  }).filter(function (f) { return f.de > 0; });
  if (fichas.length < 3) return {};
  var premios = {};
  var rebelde = fichas.slice().sort(function (x, y) { return y.contra / y.de - x.contra / x.de || y.contra - x.contra; })[0];
  if (rebelde.contra > 0) premios.rebelde = { id: rebelde.id, n: rebelde.contra, de: rebelde.de };
  var borrego = fichas.filter(function (f) { return f.id !== rebelde.id; })
    .sort(function (x, y) { return y.con / y.de - x.con / x.de || y.con - x.con; })[0];
  if (borrego && borrego.con > 0) premios.borrego = { id: borrego.id, n: borrego.con, de: borrego.de };
  var indultados = fichas.filter(function (f) { return f.estado === 'indultado'; })
    .sort(function (x, y) { return y.faltaban - x.faltaban; });
  if (indultados.length) {
    premios.tardon = { id: indultados[0].id, motivo: 'indulto', n: indultados[0].faltaban };
  } else {
    var ultimo = fichas.filter(function (f) { return f.fin; }).sort(function (x, y) { return y.fin - x.fin; })[0];
    if (ultimo) premios.tardon = { id: ultimo.id, motivo: 'ultimo', n: ultimo.fin - (doc.declarada || 0) };
  }
  return premios;
}

// Con quién coincide más y menos cada votante.
function afinidades(doc, rec) {
  var vs = votantes(doc), res = {};
  vs.forEach(function (u) {
    var mejor = null, peor = null;
    vs.forEach(function (w) {
      if (w.id === u.id) return;
      var comun = 0, igual = 0;
      rec.batallas.forEach(function (b) {
        var x = votoDe(doc, b, u.id), y = votoDe(doc, b, w.id);
        if (!x || !y) return;
        comun++;
        if (x[0] === y[0]) igual++;
      });
      if (!comun) return;
      var par = { id: w.id, n: igual, de: comun, r: igual / comun };
      if (!mejor || par.r > mejor.r || (par.r === mejor.r && par.de > mejor.de)) mejor = par;
      if (!peor || par.r < peor.r || (par.r === peor.r && par.de > peor.de)) peor = par;
    });
    if (mejor && peor && mejor.id !== peor.id) {
      res[u.id] = { companero: { id: mejor.id, n: mejor.n, de: mejor.de }, enemigo: { id: peor.id, n: peor.n, de: peor.de } };
    }
  });
  return res;
}

function curiosidades(doc, rec) {
  var c = {};
  var conVotos = rec.batallas.filter(function (b) { return b.va + b.vb > 0; });
  if (conVotos.length) {
    var dif = function (b) { return Math.abs(b.va - b.vb); };
    var min = Math.min.apply(null, conVotos.map(dif)), max = Math.max.apply(null, conVotos.map(dif));
    var renidas = conVotos.filter(function (b) { return dif(b) === min; });
    c.renida = { batalla: renidas[0].id, otras: renidas.length - 1, margen: min };
    c.paliza = { batalla: conVotos.filter(function (b) { return dif(b) === max; })[0].id };
  }
  var fines = votantes(doc).filter(function (v) { return v.fin; }).sort(function (x, y) { return x.fin - y.fin; });
  if (fines.length) {
    c.primero = { id: fines[0].id, ms: fines[0].fin - (doc.declarada || 0) };
    c.ultimo = { id: fines[fines.length - 1].id, ms: fines[fines.length - 1].fin - (doc.declarada || 0) };
  }
  var veces = {};
  Object.keys(doc.espias || {}).forEach(function (vid) { var b = doc.espias[vid]; veces[b] = (veces[b] || 0) + 1; });
  var espiadas = Object.keys(veces).sort(function (x, y) { return veces[y] - veces[x]; });
  if (espiadas.length) c.espiada = { batalla: Number(espiadas[0]), n: veces[espiadas[0]] };
  return c;
}

function calcular(doc) {
  var rec = recuento(doc), cl = clasificar(doc, rec);
  var res = {
    tabla: cl.tabla,
    empate: cl.empate,
    batallas: rec.batallas,
    desertores: doc.gente.filter(function (g) { return g.estado === 'expulsado'; })
      .map(function (g) { return { id: g.id, sentencia: g.sentencia || '', faltaban: g.faltaban || 0 }; }),
    indultados: doc.gente.filter(function (g) { return g.estado === 'indultado'; })
      .map(function (g) { return { id: g.id, faltaban: g.faltaban || 0 }; }),
    porra: puntuarPorras(doc, cl.tabla),
    premios: doc.extras.condecoraciones ? condecorar(doc, rec) : {},
    afinidad: afinidades(doc, rec),
    curiosidades: curiosidades(doc, rec)
  };
  if (doc.duelo && doc.duelo.cerrado) aplicarDuelo(doc, res);
  return res;
}

// Reordena a los empatados en cabeza según los votos del duelo final.
function aplicarDuelo(doc, res) {
  var d = doc.duelo, votos = {};
  d.entre.forEach(function (id) { votos[id] = 0; });
  Object.keys(d.votos).forEach(function (vid) { if (votos[d.votos[vid]] != null) votos[d.votos[vid]]++; });
  var previa = {};
  res.tabla.forEach(function (f) { previa[f.id] = f.pos; });
  var grupo = res.tabla.filter(function (f) { return votos[f.id] != null; });
  grupo.sort(function (x, y) { return votos[y.id] - votos[x.id] || previa[x.id] - previa[y.id]; });
  var resto = res.tabla.filter(function (f) { return votos[f.id] == null; });
  res.tabla = grupo.concat(resto);
  res.tabla.forEach(function (f, i) { f.pos = i + 1; });
  res.duelo = { entre: d.entre.slice(), votos: votos, ganador: grupo[0].id };
  res.empate = null;
  res.porra = puntuarPorras(doc, res.tabla);
}

// Orden del desfile: consejo de guerra, puestos de abajo arriba con proclamas intercaladas,
// condecoraciones antes del podio, duelo final si hay empate y campeón.
function pasosDesfile(doc) {
  var r = doc.resultado, pasos = [];
  r.desertores.forEach(function (d) { pasos.push({ t: 'consejo', id: d.id }); });
  var n = r.tabla.length, cabeza = r.empate ? r.empate.length : 1;
  var proclamas = doc.extras.proclamas ? (doc.estrellas || []).slice() : [];
  var premios = ['rebelde', 'borrego', 'tardon'].filter(function (k) { return r.premios[k]; });
  var bajos = [], podio = [];
  for (var pos = n; pos > (r.empate ? cabeza : 2); pos--) (pos > 3 ? bajos : podio).push(pos);
  if (!bajos.length) proclamas.forEach(function (p) { pasos.push({ t: 'proclama', ref: p }); });
  bajos.forEach(function (pos, i) {
    pasos.push({ t: 'puesto', pos: pos });
    if (i < bajos.length - 1) { if (proclamas.length) pasos.push({ t: 'proclama', ref: proclamas.shift() }); }
    else while (proclamas.length) pasos.push({ t: 'proclama', ref: proclamas.shift() });
  });
  premios.forEach(function (k) { pasos.push({ t: 'condecoracion', cual: k }); });
  podio.forEach(function (pos) { pasos.push({ t: 'puesto', pos: pos }); });
  if (r.empate) pasos.push({ t: 'duelo' });
  else { if (n > 1) pasos.push({ t: 'finalistas' }); pasos.push({ t: 'campeon' }); }
  var np = 0, total = pasos.filter(function (p) { return p.t === 'proclama'; }).length;
  pasos.forEach(function (p) { if (p.t === 'proclama') { p.n = ++np; p.de = total; } });
  return pasos;
}

function ordenanzasAuto(doc) {
  var x = doc.extras, cosas = doc.modo === 'cosas';
  var nc = doc.batallas && doc.batallas.length ? Math.max.apply(null, doc.batallas.map(function (b) { return b.of; }))
    : (function () { var n = doc.gente.filter(function (g) { return g.combate; }).length; return n < 2 ? 0 : n % 2 ? n : n - 1; })();
  var lista = [];
  lista.push({ t: 'El combate', x: 'Cada batalla enfrenta a dos ' + (cosas ? 'contendientes' : 'combatientes') +
    ' y tú eliges a uno según la pregunta de la guerra: «' + (doc.pregunta || '') + '». Hay que mojarse: no vale votar empate.' +
    (cosas ? '' : ' En tus propios combates no votas.') });
  var cola = doc.diana && doc.diana.activa ? ' Al que se duerma le tocarán diana' + (x.parte ? ', y a mitad de contienda saldrá un parte de guerra con los rezagados.' : '.')
    : (x.parte ? ' A mitad de contienda saldrá un parte de guerra con los rezagados.' : '');
  if (doc.ritmo === 'diaria') {
    lista.push({ t: 'Una ofensiva al día', x: (nc ? 'Las ' + nc + ' ofensivas' : 'Las ofensivas') + ' se abren de una en una: la primera, al declararse la guerra; después, una nueva cada mañana a las ' + HORA_OFENSIVA + ':00. Cada día te llegará un correo avisando de que hay batallas nuevas.' +
      ' Las batallas de una ofensiva abierta no caducan: puedes votarlas ese día o cualquier otro, pero no puedes adelantarte a las ofensivas que aún no se han abierto.' +
      (nc ? ' La guerra dura, como mínimo, ' + nc + ' días,' : ' La guerra') + ' y no termina hasta que vota todo el mundo: todos ven quién va con retraso.' + cola });
  } else {
    lista.push({ t: 'Todas las ofensivas, de golpe', x: (nc ? 'Las ' + nc + ' ofensivas' : 'Todas las ofensivas') +
      ' se abren a la vez, como una temporada de Netflix. Vota a tu ritmo: la guerra no termina hasta que vota todo el mundo, y todos ven quién la tiene en pausa.' + cola });
  }
  lista.push({ t: 'Secreto y sin vuelta atrás', x: 'Tu voto es secreto para los demás combatientes y los resultados se ' +
    (x.desfile ? 'revelan en el desfile.' : 'publican cuando acabe la guerra.') +
    (x.proclamas ? ' No hace falta dar razones, pero si quieres puedes dejar una proclama: se leerá ' + (x.desfile ? 'en el desfile' : 'al final') + ' sin tu nombre.' : '') +
    ' Una vez votas no hay vuelta atrás, salvo 10 segundos de cortesía por si te equivocas de botón.' });
  if (doc.puntuacion === 'votos') {
    lista.push({ t: 'Los puntos', x: 'Cada voto que recibes vale 3 puntos, ganes o pierdas la batalla. Si dos combatientes terminan con los mismos puntos, desempata el enfrentamiento directo.' +
      ' Pero si el empate a puntos es por el primer puesto, no hay cuentas que valgan: se libra un duelo final' + (x.desfile ? ' en directo durante el desfile.' : '.') });
  } else {
    lista.push({ t: 'Los puntos', puntos: true, x: 'Como en el fútbol, vamos. Una batalla acaba en empate si los votos quedan igualados. Si dos combatientes terminan con los mismos puntos, desempata la diferencia de votos (a favor menos en contra) y, si persiste, el enfrentamiento directo.' +
      ' Pero si el empate a puntos es por el primer puesto, no hay cuentas que valgan: se libra un duelo final' + (x.desfile ? ' en directo durante el desfile.' : '.') });
  }
  if (x.porra) lista.push({ t: 'La porra', x: 'Cuando termines tus votos se abre la porra: ordena a todos los combatientes del primero al último. Se suman los puestos de diferencia con el parte final y gana la suma más baja.' +
    (doc.botin ? ' Botín: ' + doc.botin + '.' : '') });
  if (x.espia) lista.push({ t: 'Tu espía', x: 'Cuando haya votado todo el mundo, puedes mandar al espía a descubrir quién ganó un combate. Sólo uno, y sin ver los puntos.' });
  if (x.desfile) lista.push({ t: 'El desfile de la victoria', x: 'El parte de guerra se revela en el desfile, del último puesto al primero' +
    (x.condecoraciones ? ', con condecoraciones al más rebelde, al más borrego y al más tardón.' : '.') +
    (doc.premio ? ' Premio: ' + doc.premio + ', y la cruz al mérito para el campeón.' : ' El campeón se lleva la cruz al mérito.') +
    ' Después, cada uno descubrirá su compañero de trinchera y su enemigo íntimo de voto.' });
  lista.push({ t: 'Desertores e indultos', x: 'Si alguien no vota, el alto mando puede firmar el armisticio. Al desertor se le expulsa con deshonor: desaparecen sus combates y sus votos, como si nunca hubiera combatido, y queda en las crónicas como desertor' +
    (x.desfile ? ': el consejo de guerra leerá su sentencia en el desfile.' : '.') +
    ' A quien le falten pocos votos se le puede indultar: sigue en la guerra y sólo se pierden sus votos pendientes.' });
  lista.push({ t: 'Grados', x: 'Cada guerra que terminas te asciende un grado: soldado, cabo, sargento, alférez, teniente, capitán, comandante, coronel y, por fin, general. Tu grado luce en tu carta y en el escalafón. Desertar no asciende.' });
  if (x.radio) lista.push({ t: 'Radio Macuto', x: 'Durante la guerra puedes lanzar pullas anónimas por Radio Macuto: salen en antena sin firma. Antes de emitirlas, el alto mando revisa que nadie se pase de la raya.' });
  return lista;
}

// Explicación breve del juego: va en el llamamiento a filas (pantalla y correo).
function resumenJuego(doc) {
  var x = doc.extras, cosas = doc.modo === 'cosas', l = [];
  var nc = doc.gente.filter(function (g) { return g.combate; }).length, nb = nc * (nc - 1) / 2;
  l.push(cosas
    ? 'Cada batalla enfrenta a dos contendientes y tú eliges cuál gana según la pregunta. Hay que mojarse: no vale el empate.'
    : 'Todos contra todos: cada batalla enfrenta a dos combatientes y el resto elige a uno según la pregunta. Hay que mojarse: no vale el empate. En tus propios combates no votas.');
  l.push((nc >= 3 ? 'Con ' + nc + (cosas ? ' contendientes' : ' combatientes') + ' habrá ' + nb + ' batallas. ' : '') +
    (doc.ritmo === 'diaria' ? 'Cada día se abre una ofensiva nueva, a las ' + HORA_OFENSIVA + ':00, y te avisamos por correo. Votas desde el móvil cuando quieras.' : 'Se abren todas de golpe y votas a tu ritmo, desde el móvil.') + ' La guerra no termina hasta que vota todo el mundo.');
  l.push('Tu voto es secreto para los demás. ' + (x.desfile ? 'El parte de guerra se revela al final, en el desfile de la victoria, del último puesto al primero.' : 'El parte de guerra se publica al final, de golpe.') +
    (doc.premio ? ' Premio: ' + doc.premio + '.' : ''));
  var extras = [];
  if (x.porra) extras.push('una porra para adivinar la clasificación');
  if (x.espia) extras.push('un espía para descubrir un combate antes del desfile');
  if (x.radio) extras.push('Radio Macuto, para lanzar pullas anónimas');
  if (extras.length) l.push('Y de propina: ' + enumerar(extras) + '.');
  return l;
}
function listaCorreo(items) {
  return '<ul style="margin:0 0 14px;padding-left:20px">' + items.map(function (x) { return '<li style="margin:0 0 8px">' + esc(x) + '</li>'; }).join('') + '</ul>';
}

// ---------------------------------------------------------------- correos

// Marco común de los correos. o.fondo: imagen de fondo (JPG alojado en la web); o.mosaico: repetirla; o.titulo: rótulo grande.
function marcoCorreo(doc, cuerpo, pie, o) {
  o = o || {};
  var fondo = o.fondo ? 'background-image:url(' + o.fondo + ');background-repeat:' + (o.mosaico ? 'repeat' : 'no-repeat') +
    ';background-size:' + (o.mosaico ? '390px auto' : 'cover') + ';background-position:center ' + (o.mosaico ? 'top' : 'bottom') + ';' : '';
  var condensada = 'font-family:\'Barlow Condensed\',\'Arial Narrow\',\'Roboto Condensed\',Arial,sans-serif;font-weight:800;text-transform:uppercase';
  return '<div style="margin:0;padding:44px 14px 64px;background-color:#0d0b1a;' + fondo + 'font-family:Arial,Helvetica,sans-serif">' +
    // Portada: nombre de la guerra y rótulo, directamente sobre el fondo.
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto">' +
    '<tr><td style="padding:0 8px;text-align:center;font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#5ef0d0;text-shadow:0 1px 6px #0d0b1a">' + esc(doc.nombre + (doc.campo ? ' · ' + doc.campo : '')) + '</td></tr>' +
    (o.titulo ? '<tr><td style="padding:10px 8px 0;text-align:center;' + condensada + ';font-size:44px;line-height:1;color:#ffffff;text-shadow:0 2px 14px #0d0b1a">' + esc(o.titulo) + '</td></tr>' : '') +
    '<tr><td style="padding:14px 0 26px;text-align:center"><span style="display:inline-block;width:64px;height:4px;border-radius:2px;background-color:#ff6ad5;background-image:linear-gradient(90deg,#5ef0d0,#8f7bff,#ff6ad5,#ffd36a)"></span></td></tr>' +
    '</table>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background-color:#16132b;background-color:rgba(22,19,43,0.82);border:1px solid #3a3566;border-radius:16px">' +
    '<tr><td style="padding:24px 24px 24px;font-size:16px;line-height:1.55;color:#f2f0ff">' + cuerpo + '</td></tr>' +
    '<tr><td style="padding:16px 24px 24px;border-top:1px solid #2a2648;font-size:12px;line-height:1.5;color:#8d88ab">' + pie + '</td></tr>' +
    '</table>' +
    '<p style="margin:22px 0 0;text-align:center;' + condensada + ';font-size:18px;letter-spacing:2px;color:#ffffff;text-shadow:0 1px 8px #0d0b1a">¡Sólo puede quedar uno!</p>' +
    '</div>';
}
function botonCorreo(url, texto) {
  return '<p style="margin:24px 0 8px;text-align:center"><a href="' + esc(url) + '" style="display:inline-block;padding:14px 28px;border-radius:12px;background:#5ef0d0;color:#0d0b1a;font-size:17px;font-weight:bold;text-decoration:none;text-transform:uppercase">' + esc(texto) + '</a></p>' +
    '<p style="margin:0 0 16px;text-align:center;font-size:12px;line-height:1.5;color:#b3aecf">Este enlace es sólo tuyo: quien lo tenga vota por ti, así que no lo reenvíes.</p>';
}
function parrafos(texto) {
  return parrafo(texto, 3000).split(/\n+/).filter(Boolean).map(function (l) { return '<p style="margin:0 0 14px">' + esc(l) + '</p>'; }).join('');
}

// ---------------------------------------------------------------- el motor

function crearMotor(env) {
  var ACC = {};

  function ahora() { return env.ahora(); }
  function mandoValido(p) { return !!p.mando && p.mando === env.ajuste('CLAVE_MANDO'); }
  function urlApp() { return env.ajuste('URL_APP') || ''; }
  function cargar(id, fresco) {
    var doc = env.leer('guerra:' + id, fresco);
    exigir(doc, 'noexiste', 'Esa guerra no existe.');
    return doc;
  }
  function guardar(doc) {
    doc.rev = (doc.rev || 0) + 1;
    doc.actualizada = ahora();
    env.escribir('guerra:' + doc.id, doc, doc.nombre + ' · ' + doc.fase);
    var indice = env.leer('indice', true) || { guerras: [] };
    var ficha = { id: doc.id, nombre: doc.nombre, campo: doc.campo || '', fase: doc.fase, creada: doc.creada, publicada: doc.publicada || null };
    var i = indice.guerras.findIndex(function (g) { return g.id === doc.id; });
    if (i < 0) indice.guerras.push(ficha);
    else if (JSON.stringify(indice.guerras[i]) === JSON.stringify(ficha)) return;
    else indice.guerras[i] = ficha;
    env.escribir('indice', indice, plural(indice.guerras.length, 'guerra', 'guerras'));
  }
  function indice() { return (env.leer('indice') || { guerras: [] }).guerras; }
  function anotar(doc, quien, accion, detalle) {
    try { env.registrar([new Date(ahora()).toISOString(), doc ? doc.id : '', quien || '', accion, detalle || '']); } catch (e) { /* el registro nunca tumba una acción */ }
  }
  function mandoDe(doc) { return doc.gente.filter(function (g) { return g.mando; })[0] || null; }
  function nombreMando(doc) { var m = mandoDe(doc); return doc.firma || (m ? m.nombre : 'El alto mando'); }
  function claveGeneral(doc) { return doc.id + '.' + doc.clave; }
  function enlacePersonal(g) { return urlApp() + '#t=' + g.token; }

  // -- contexto de cada petición: quién llama y sobre qué guerra
  function contexto(p, fresco) {
    var ctx = { ahora: ahora(), esMando: mandoValido(p), doc: null, yo: null };
    if (p.p) {
      // Enlace de la presentación: sólo enseña de qué va la guerra, sin cartas ni alistamiento. Manda sobre cualquier otra credencial.
      var trozos = String(p.p).split('.');
      ctx.doc = cargar(trozos[0], fresco);
      exigir(ctx.doc.presenta && ctx.doc.presenta === trozos[1], 'enlace', 'Este enlace no vale.');
      ctx.esMando = false;
    } else if (p.token) {
      var gid = String(p.token).split('.')[0];
      ctx.doc = cargar(gid, fresco);
      ctx.yo = ctx.doc.gente.filter(function (g) { return g.token && g.token === p.token; })[0] || null;
      exigir(ctx.yo, 'enlace', 'Este enlace ya no vale. Pide al alto mando que te mande otro.');
    } else if (p.g) {
      var partes = String(p.g).split('.');
      ctx.doc = cargar(partes[0], fresco);
      exigir(ctx.doc.clave && ctx.doc.clave === partes[1], 'enlace', 'Este enlace no vale.');
    } else if (p.guerra) {
      exigir(ctx.esMando, 'mando', 'Sólo el alto mando puede hacer eso.');
      ctx.doc = cargar(p.guerra, fresco);
    }
    return ctx;
  }
  function definir(nombre, opciones, hacer) { ACC[nombre] = { escribe: !!opciones.escribe, quien: opciones.quien, hacer: hacer }; }

  function atender(p) {
    p = p || {};
    var def = ACC[p.accion];
    exigir(def, 'accion', 'Acción desconocida.');
    function correr() {
      var ctx = contexto(p, def.escribe);
      if (def.quien === 'mando') exigir(ctx.esMando, 'mando', 'Sólo el alto mando puede hacer eso.');
      if (def.quien === 'token') exigir(ctx.yo, 'enlace', 'Entra con tu enlace personal.');
      if (def.quien === 'general') exigir(ctx.doc && (p.g || ctx.yo || ctx.esMando), 'enlace', 'Este enlace no vale.');
      if (def.escribe && ctx.doc) madurar(ctx.doc, ctx.ahora);
      var res = def.hacer(ctx, p);
      if (def.escribe && ctx.doc && !ctx.sinGuardar) guardar(ctx.doc);
      return res;
    }
    return def.escribe ? env.candado(correr) : correr();
  }

  // -- transiciones que ocurren solas con el paso del tiempo
  function debeMadurar(doc, t) {
    if (doc.fase === 'abierta') {
      var vs = votantes(doc);
      if (!vs.length || vs.some(function (v) { return faltan(doc, v) > 0; })) return false;
      return t - ultimoVoto(doc) >= GRACIA + MARGEN;
    }
    var d = doc.duelo;
    if (d && !d.cerrado) {
      if (d.cierra && t >= d.cierra) return true;
      return electoresDuelo(doc).every(function (v) { return d.votos[v.id]; });
    }
    return false;
  }
  function ultimoVoto(doc) {
    var max = 0;
    Object.keys(doc.votos).forEach(function (b) {
      Object.keys(doc.votos[b]).forEach(function (v) { if (doc.votos[b][v][1] > max) max = doc.votos[b][v][1]; });
    });
    return max;
  }
  function madurar(doc, t) {
    if (!debeMadurar(doc, t)) return false;
    if (doc.fase === 'abierta') terminar(doc, t);
    else cerrarDuelo(doc, t);
    return true;
  }
  function totalOfensivas(doc) { return doc.batallas.length ? Math.max.apply(null, doc.batallas.map(function (b) { return b.of; })) : 0; }
  // Con una ofensiva al día: la 1.ª, al declarar; la siguiente, a las 9:00 del día siguiente, y así sucesivamente.
  function primeraHora(doc) { return env.inicioDia(doc.declarada) + HORA_OFENSIVA * 3600000; }
  function abiertas(doc, t) {
    var total = totalOfensivas(doc);
    if (doc.ritmo !== 'diaria' || doc.fase !== 'abierta') return total;
    return Math.min(total, 1 + Math.max(0, Math.floor((t - primeraHora(doc)) / DIA)));
  }
  function proximaOfensiva(doc, t) {
    var ab = abiertas(doc, t);
    return doc.ritmo === 'diaria' && doc.fase === 'abierta' && ab < totalOfensivas(doc) ? primeraHora(doc) + ab * DIA : null;
  }
  function pieFirma(doc) {
    return '<p style="margin:18px 0 0"><strong>' + esc(nombreMando(doc)) + '</strong><br><span style="font-size:13px;color:#b3aecf">Alto mando de la guerra</span></p>';
  }
  function avisarOfensiva(doc, n, t) {
    var total = totalOfensivas(doc), enviados = 0;
    votantes(doc).forEach(function (g) {
      if (!g.correo || g.estado !== 'activo') return;
      var debe = batallasDe(doc, g).filter(function (b) { return b.of <= n && !votoDe(doc, b, g.id); }).length;
      if (!debe) return;
      try {
        env.correo({
          para: g.correo, nombre: nombreMando(doc), asunto: doc.nombre + ': se abre la ofensiva ' + n + ' de ' + total,
          html: marcoCorreo(doc, '<p style="margin:0 0 14px;font-size:19px;font-weight:bold">' + esc(g.nombre) + ', hay batallas nuevas.</p>' +
            '<p style="margin:0 0 14px;color:#cdc8e6">Se ha abierto la ofensiva ' + n + ' de ' + total + '. Tienes ' + plural(debe, 'batalla', 'batallas') + ' por votar' + (n < total ? '; mañana a las ' + HORA_OFENSIVA + ':00, la siguiente.' : ': es la última ofensiva.') + '</p>' +
            botonCorreo(enlacePersonal(g), 'A las trincheras') + pieFirma(doc),
            'Recibirás un aviso cada día mientras se abran ofensivas.', { fondo: urlApp() + 'assets/correo-reflectores.jpg', titulo: 'Ofensiva ' + n + ' de ' + total }),
          texto: g.nombre + ', se ha abierto la ofensiva ' + n + ' de ' + total + '. A votar: ' + enlacePersonal(g)
        });
        enviados++;
      } catch (e) { g.correoError = String(e && e.message || e).slice(0, 200); }
    });
    anotar(doc, '', 'correo', 'Aviso de la ofensiva ' + n + ': ' + enviados + ' correos');
  }
  function avisarFin(doc, t) {
    var x = doc.extras, enviados = 0;
    doc.finAvisado = t;
    votantes(doc).forEach(function (g) {
      if (!g.correo) return;
      try {
        env.correo({
          para: g.correo, nombre: nombreMando(doc), asunto: doc.nombre + ': alto el fuego',
          html: marcoCorreo(doc, '<p style="margin:0 0 14px;font-size:19px;font-weight:bold">' + esc(g.nombre) + ', la guerra ha terminado.</p>' +
            '<p style="margin:0 0 14px;color:#cdc8e6">Ya no quedan batallas por librar. ' + (x.desfile ? 'El parte de guerra se revelará en el desfile de la victoria.' : 'El alto mando publicará el parte de guerra.') + '</p>' +
            (doc.desfileInfo ? '<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b3aecf">' + (x.desfile ? 'El desfile' : 'El parte') + '</p><p style="margin:0 0 18px;font-size:20px;font-weight:bold;color:#ffffff">' + esc(doc.desfileInfo) + '</p>' : '') +
            (x.espia ? '<p style="margin:0 0 14px;color:#cdc8e6">Mientras tanto, puedes mandar a tu espía a descubrir quién ganó un combate. Sólo uno.</p>' : '') +
            botonCorreo(enlacePersonal(g), x.espia ? 'Mandar al espía' : 'Entrar') + pieFirma(doc),
            '¡Sólo puede quedar uno!', { fondo: urlApp() + 'assets/correo-reflectores.jpg', titulo: 'Alto el fuego' }),
          texto: g.nombre + ', la guerra ha terminado. ' + (doc.desfileInfo || '') + ' ' + enlacePersonal(g)
        });
        enviados++;
      } catch (e) { g.correoError = String(e && e.message || e).slice(0, 200); }
    });
    anotar(doc, '', 'correo', 'Aviso de alto el fuego: ' + enviados + ' correos');
  }
  function terminar(doc, t) {
    doc.fase = 'terminada';
    doc.terminada = t;
    doc.resultado = calcular(doc);
    anotar(doc, '', 'fin', 'Guerra terminada');
  }
  function electoresDuelo(doc) {
    var entre = doc.duelo ? doc.duelo.entre : [];
    return votantes(doc).filter(function (v) { return entre.indexOf(v.id) < 0; });
  }
  function abrirDuelo(doc, t, segundos) {
    doc.duelo = { entre: doc.resultado.empate.slice(), votos: {}, abierto: t, cierra: segundos ? t + segundos * 1000 : null, cerrado: null };
  }
  function cerrarDuelo(doc, t) {
    doc.duelo.cerrado = t;
    doc.resultado = calcular(doc);
    if (doc.fase === 'desfile' && doc.desfile) {
      // Tras el duelo se conocen los puestos de cabeza: los perdedores y, al final, el campeón.
      var k = doc.duelo.entre.length;
      doc.desfile.pasos = doc.desfile.pasos.filter(function (p) { return !p.trasDuelo; });
      for (var pos = k; pos > 2; pos--) doc.desfile.pasos.push({ t: 'puesto', pos: pos, trasDuelo: true });
      if (k > 2) doc.desfile.pasos.push({ t: 'finalistas', trasDuelo: true });
      doc.desfile.pasos.push({ t: 'campeon', trasDuelo: true });
    }
    if (doc.fase === 'publicada') doc.cronica = cronicaDe(doc);
    anotar(doc, '', 'duelo', 'Duelo final cerrado');
  }

  // -- personas: quién es quién de una guerra a otra (para grados, escalafón y medallero)
  function personas() { return env.leer('personas', true) || { lista: [], sig: 1 }; }
  function ligarPersonas(doc) {
    var reg = personas();
    doc.gente.forEach(function (g) {
      if (!g.vota && doc.modo === 'cosas') { g.persona = null; return; }
      var p = null;
      if (g.correo) p = reg.lista.filter(function (x) { return x.correo && x.correo === g.correo; })[0];
      if (!p) p = reg.lista.filter(function (x) { return (!x.correo || !g.correo) && norm(x.nombre) === norm(g.nombre); })[0];
      if (!p) { p = { id: 'p' + reg.sig++ }; reg.lista.push(p); }
      p.nombre = g.nombre; p.correo = g.correo || p.correo || ''; p.foto = g.foto || p.foto || null; p.frase = g.frase || p.frase || '';
      g.persona = p.id;
    });
    env.escribir('personas', reg, plural(reg.lista.length, 'persona', 'personas'));
  }
  function cronicas() {
    return indice().filter(function (g) { return g.fase === 'publicada'; })
      .map(function (g) { var d = env.leer('guerra:' + g.id); return d && d.cronica; }).filter(Boolean)
      .sort(function (x, y) { return y.fecha - x.fecha; });
  }
  function guerrasTerminadas(persona, lista) {
    return lista.filter(function (c) { return c.gente.some(function (g) { return g.persona === persona && !g.desertor; }); }).length;
  }
  // Resumen congelado de una guerra publicada: es lo que leen las crónicas.
  function cronicaDe(doc) {
    var r = doc.resultado, pos = {}, fila = porId(r.tabla);
    r.tabla.forEach(function (f) { pos[f.id] = f.pos; });
    var porraPos = {};
    r.porra.lista.forEach(function (p) { porraPos[p.id] = p; });
    var premiosDe = {};
    Object.keys(r.premios).forEach(function (k) {
      (premiosDe[r.premios[k].id] = premiosDe[r.premios[k].id] || []).push(Object.assign({ cual: k }, r.premios[k]));
    });
    return {
      id: doc.id, nombre: doc.nombre, campo: doc.campo || '', serie: norm(doc.nombre) + '|' + norm(doc.campo || ''), pregunta: doc.pregunta, fecha: doc.publicada || doc.terminada,
      modo: doc.modo, puntuacion: doc.puntuacion, premio: doc.premio || '',
      campeon: r.empate ? null : r.tabla[0].id,
      porraGana: r.porra.gana, porraSuma: r.porra.lista.length ? r.porra.lista[0].suma : null,
      gente: doc.gente.map(function (g) {
        var f = fila[g.id], a = r.afinidad[g.id];
        return {
          id: g.id, persona: g.persona || null, nombre: g.nombre, foto: g.foto || null, combate: !!g.combate, vota: !!g.vota,
          desertor: g.estado === 'expulsado', indultado: g.estado === 'indultado',
          pos: pos[g.id] || null, pts: f ? f.pts : null, liga: f ? f.liga : null, g: f ? f.g : null, e: f ? f.e : null, p: f ? f.p : null, dif: f ? f.dif : null,
          porra: porraPos[g.id] ? { pos: porraPos[g.id].pos, suma: porraPos[g.id].suma } : null,
          premios: premiosDe[g.id] || [],
          companero: a ? a.companero : null, enemigo: a ? a.enemigo : null
        };
      })
    };
  }

  // -- vistas
  function fichaPublica(doc, g) {
    return { id: g.id, nombre: g.nombre, frase: g.frase || '', foto: g.foto || null, grado: g.grado || 0,
      combate: !!g.combate, vota: !!g.vota, estado: g.estado, mando: !!g.mando };
  }
  function genteOrdenada(doc) {
    if (!doc.orden) return doc.gente;
    var pos = {};
    doc.orden.forEach(function (id, i) { pos[id] = i; });
    return doc.gente.slice().sort(function (x, y) { return (pos[x.id] == null ? 999 : pos[x.id]) - (pos[y.id] == null ? 999 : pos[y.id]); });
  }
  function vistaGuerra(doc) {
    var bat = doc.batallas || [];
    return {
      id: doc.id, nombre: doc.nombre, campo: doc.campo || '', ritmo: doc.ritmo || 'golpe', pregunta: doc.pregunta, premio: doc.premio || '', botin: doc.botin || '',
      fase: doc.fase, modo: doc.modo, puntuacion: doc.puntuacion, extras: doc.extras,
      ofensivas: bat.length ? Math.max.apply(null, bat.map(function (b) { return b.of; })) : 0,
      ordenanzas: doc.ordenanzas || ordenanzasAuto(doc), desfileInfo: doc.desfileInfo || '',
      declarada: doc.declarada || null, terminada: doc.terminada || null, publicada: doc.publicada || null,
      alto: nombreMando(doc), diana: doc.diana && doc.diana.activa ? doc.diana.cadaDias : 0
    };
  }
  function resultadoPublico(doc) {
    var r = doc.resultado;
    return {
      tabla: r.tabla, batallas: r.batallas, desertores: r.desertores, indultados: r.indultados,
      porra: r.porra, premios: r.premios, curiosidades: r.curiosidades, empate: r.empate, duelo: r.duelo || null,
      proclamas: (doc.estrellas || []).map(function (ref) { return proclamaDe(doc, ref); }).filter(Boolean)
    };
  }
  function proclamaDe(doc, ref) {
    var partes = String(ref).split(':'), b = doc.batallas.filter(function (x) { return String(x.id) === partes[0]; })[0];
    var voto = b && votoDe(doc, b, partes[1]);
    if (!voto || !voto[2]) return null;
    return { batalla: b.id, a: b.a, b: b.b, elegido: voto[0], texto: voto[2] };
  }
  function vistaDuelo(doc, yo) {
    var d = doc.duelo;
    if (!d) return null;
    var electores = electoresDuelo(doc);
    return {
      entre: d.entre, abierto: d.abierto, cierra: d.cierra, cerrado: d.cerrado,
      votaron: electores.filter(function (v) { return d.votos[v.id]; }).length, deben: electores.length,
      puntos: (doc.resultado.tabla.filter(function (f) { return f.id === d.entre[0]; })[0] || {}).pts || 0,
      puedo: !!yo && !d.cerrado && electores.some(function (v) { return v.id === yo.id; }),
      mio: yo ? d.votos[yo.id] || null : null,
      ganador: d.cerrado ? doc.resultado.tabla[0].id : null
    };
  }
  function vistaDesfile(doc, yo) {
    var df = doc.desfile, r = doc.resultado, fila = {};
    r.tabla.forEach(function (f) { fila[f.pos] = f; });
    var vistos = df.pasos.slice(0, df.paso + 1), revelados = [], premios = [];
    vistos.forEach(function (p) {
      if (p.t === 'puesto') revelados.push(fila[p.pos]);
      if (p.t === 'campeon') { if (fila[2]) revelados.push(fila[2]); revelados.push(fila[1]); }
      if (p.t === 'condecoracion') premios.push(Object.assign({ cual: p.cual }, r.premios[p.cual]));
    });
    var paso = df.pasos[df.paso], actual = { t: paso.t };
    if (paso.t === 'consejo') {
      var des = r.desertores.filter(function (d) { return d.id === paso.id; })[0];
      var orden = r.desertores.map(function (d) { return d.id; });
      Object.assign(actual, { id: paso.id, sentencia: des.sentencia, faltaban: des.faltaban, n: orden.indexOf(paso.id) + 1, de: orden.length });
    } else if (paso.t === 'puesto') {
      Object.assign(actual, { pos: paso.pos, fila: fila[paso.pos] });
    } else if (paso.t === 'proclama') {
      Object.assign(actual, proclamaDe(doc, paso.ref) || {}, { n: paso.n, de: paso.de });
    } else if (paso.t === 'condecoracion') {
      Object.assign(actual, { cual: paso.cual }, r.premios[paso.cual]);
    } else if (paso.t === 'duelo') {
      actual.duelo = vistaDuelo(doc, yo);
      if (actual.duelo) actual.duelo.ganador = null;   // el campeón se desvela en su propio paso
    } else if (paso.t === 'finalistas') {
      var ord = doc.orden || [];
      actual.entre = [fila[1].id, fila[2].id].sort(function (x, y) { return ord.indexOf(x) - ord.indexOf(y); });   // orden del sorteo: no delata a nadie
    } else if (paso.t === 'campeon') {
      Object.assign(actual, { fila: fila[1], segundo: fila[2] || null, porra: { gana: r.porra.gana, suma: r.porra.lista.length ? r.porra.lista[0].suma : null } });
    }
    var sig = df.pasos[df.paso + 1] || null;
    return {
      paso: df.paso, pasos: df.pasos.length, pendienteDuelo: !!r.empate, actual: actual,
      revelados: revelados, premios: premios, deContendientes: r.tabla.length,
      porra: doc.extras.porra ? porraParcial(doc, revelados) : [],
      siguiente: sig ? { t: sig.t, pos: sig.pos || null, cual: sig.cual || null } : null,
      ultimo: !sig && !(paso.t === 'duelo')
    };
  }
  function vistaMando(doc, t) {
    var pend = (doc.pullas || []).filter(function (p) { return p.estado === 'pendiente'; });
    var d = doc.diana || {};
    return {
      general: doc.clave ? claveGeneral(doc) : null,
      pullas: pend.map(function (p) { return { id: p.id, de: p.de, texto: p.texto, ts: p.ts }; }),
      emitidas: (doc.pullas || []).filter(function (p) { return p.estado === 'emitida'; }).length,
      proximaDiana: doc.fase === 'abierta' && d.activa ? (d.ultimo || doc.declarada) + d.cadaDias * DIA : null,
      correos: doc.gente.filter(function (g) { return g.vota; }).map(function (g) {
        return { id: g.id, correo: g.correo || '', enviado: g.correoEnviado || null, error: g.correoError || null, reclamada: g.reclamada || null };
      }),
      voluntarios: (doc.llamamiento && doc.llamamiento.voluntarios) || [],
      fuera: doc.fuera || []
    };
  }

  function vistaEstado(ctx) {
    var doc = ctx.doc, yo = ctx.yo, t = ctx.ahora;
    var res = { rev: doc.rev, ahora: t, guerra: vistaGuerra(doc), gente: genteOrdenada(doc).map(function (g) { return fichaPublica(doc, g); }) };
    if (yo) res.yo = { id: yo.id, nombre: yo.nombre, mando: !!yo.mando, vota: !!yo.vota, combate: !!yo.combate, estado: yo.estado, fin: yo.fin || null, grado: yo.grado || 0, persona: yo.persona || null };
    var declarada = ['abierta', 'terminada', 'desfile', 'publicada'].indexOf(doc.fase) >= 0;
    if (declarada) {
      var ab = abiertas(doc, t), pr = progreso(doc, ab);
      res.guerra.abiertas = ab; res.guerra.proxima = proximaOfensiva(doc, t);
      res.progreso = pr;
      res.batallas = batallasVivas(doc).map(function (b) {
        var fila = { id: b.id, of: b.of, a: b.a, b: b.b };
        if (yo && puedeVotar(yo, b)) { var v = votoDe(doc, b, yo.id); fila.mia = true; fila.voto = v ? v[0] : null; fila.ts = v ? v[1] : null; }
        return fila;
      });
      if (doc.extras.porra) {
        var puedePorra = !!yo && yo.vota && yo.estado === 'activo' && faltan(doc, yo) === 0 &&
          (doc.fase === 'abierta' || (doc.fase === 'terminada' && !doc.porras[yo.id] && !(doc.espias || {})[yo.id]));
        res.porra = { abierta: puedePorra, mia: yo && doc.porras[yo.id] ? doc.porras[yo.id] : null,
          recibidas: Object.keys(doc.porras).length, de: votantes(doc).filter(function (v) { return v.estado === 'activo'; }).length };
      }
      if (doc.extras.radio) {
        var emitidas = (doc.pullas || []).filter(function (p) { return p.estado === 'emitida'; })
          .sort(function (x, y) { return y.tsEmision - x.tsEmision; });
        res.radio = { antena: emitidas.slice(0, 30).map(function (p) { return { id: p.id, texto: p.texto, ts: p.tsEmision }; }),
          enCensura: yo ? (doc.pullas || []).filter(function (p) { return p.de === yo.id && p.estado === 'pendiente'; }).length : 0 };
      }
      if (doc.extras.parte && doc.parte) res.parte = { ts: doc.parte };
    }
    if (doc.fase === 'terminada' && doc.extras.espia && yo) {
      var b = (doc.espias || {})[yo.id], usado = null;
      if (b) { var rb = doc.resultado.batallas.filter(function (x) { return x.id === b; })[0]; usado = { batalla: b, gana: rb.va > rb.vb ? rb.a : rb.vb > rb.va ? rb.b : 'empate' }; }
      res.espia = { usado: usado };
    }
    if (doc.fase === 'desfile') res.desfile = vistaDesfile(doc, yo);
    if (doc.fase === 'publicada') {
      res.resultado = resultadoPublico(doc);
      res.duelo = vistaDuelo(doc, yo);
      if (yo) res.mia = { afinidad: doc.resultado.afinidad[yo.id] || null };
    }
    if (doc.fase === 'terminada' || doc.fase === 'desfile') {
      res.bajas = { desertores: doc.resultado.desertores.map(function (d) { return d.id; }), indultados: doc.resultado.indultados };
    }
    if (ctx.esMando) res.mando = vistaMando(doc, t);
    return res;
  }

  // ------------------------------------------------------------ acciones de lectura

  definir('ping', {}, function () { return { version: VERSION, ahora: ahora() }; });

  // Estado completo de la guerra para quien llama. Si algo debe cambiar solo (fin de la guerra,
  // cierre del duelo, carta reclamada), se hace aquí bajo candado antes de responder.
  definir('estado', { quien: 'general' }, function (ctx, p) {
    var doc = ctx.doc, yo = ctx.yo;
    if (debeMadurar(doc, ctx.ahora) || (yo && !yo.reclamada && doc.fase !== 'borrador' && doc.fase !== 'llamamiento')) {
      env.candado(function () {
        var c2 = contexto(p, true);
        madurar(c2.doc, c2.ahora);
        if (c2.yo && !c2.yo.reclamada) c2.yo.reclamada = c2.ahora;
        guardar(c2.doc);
        ctx.doc = c2.doc; ctx.yo = c2.yo;
      });
    }
    if (p.rev != null && Number(p.rev) === ctx.doc.rev) return { rev: ctx.doc.rev, igual: true, ahora: ctx.ahora };
    return vistaEstado(ctx);
  });

  definir('fotos', {}, function (ctx, p) {
    var res = {};
    (p.ids || []).slice(0, 40).forEach(function (id) { var f = env.leerFoto(String(id)); if (f) res[id] = f; });
    return res;
  });

  // Entrada del alto mando: sus guerras y, en cada una, su propia carta.
  definir('cuartel', { quien: 'mando' }, function () {
    return {
      guerras: indice().map(function (g) {
        var d = env.leer('guerra:' + g.id), m = d && mandoDe(d);
        return Object.assign({}, g, { token: m && m.token ? m.token : null });
      }).sort(function (x, y) { return y.creada - x.creada; })
    };
  });

  definir('plan', { quien: 'mando' }, function (ctx) {
    var doc = ctx.doc;
    exigir(doc, 'noexiste', 'Esa guerra no existe.');
    return {
      rev: doc.rev,
      plan: {
        id: doc.id, fase: doc.fase, nombre: doc.nombre, pregunta: doc.pregunta, premio: doc.premio, botin: doc.botin, firma: doc.firma || '', campo: doc.campo || '', ritmo: doc.ritmo || 'golpe',
        pitch: doc.pitch || '', presenta: doc.presenta ? doc.id + '.' + doc.presenta : null,
        modo: doc.modo, puntuacion: doc.puntuacion, extras: doc.extras, diana: doc.diana, correo: doc.correo,
        ordenanzas: doc.ordenanzas, ordenanzasAuto: ordenanzasAuto(doc), desfileInfo: doc.desfileInfo || '',
        llamamiento: doc.llamamiento, dueloPorPuntos: doc.dueloPorPuntos !== false,
        gente: doc.gente.map(function (g) {
          return { id: g.id, nombre: g.nombre, correo: g.correo || '', frase: g.frase || '', foto: g.foto || null,
            combate: !!g.combate, vota: !!g.vota, mando: !!g.mando, alistado: g.alistado, estado: g.estado,
            llamada: g.llamada || null, llamadaError: g.llamadaError || null };
        })
      },
      mando: vistaMando(doc, ctx.ahora)
    };
  });

  // Informe clasificado: todo, incluido quién votó a quién. Sólo el alto mando.
  definir('informe', { quien: 'mando' }, function (ctx) {
    var doc = ctx.doc;
    exigir(doc.resultado, 'fase', 'El informe se abre cuando acabe la guerra.');
    var estrellas = {};
    (doc.estrellas || []).forEach(function (r) { estrellas[r] = true; });
    var proclamas = [];
    var detalle = doc.resultado.batallas.map(function (b) {
      var vs = doc.votos[b.id] || {}, a = [], bb = [];
      Object.keys(vs).forEach(function (vid) {
        (vs[vid][0] === b.a ? a : bb).push(vid);
        if (vs[vid][2]) proclamas.push({ ref: b.id + ':' + vid, batalla: b.id, de: vid, elegido: vs[vid][0], texto: vs[vid][2], estrella: !!estrellas[b.id + ':' + vid] });
      });
      return { id: b.id, a: a, b: bb };
    });
    return {
      rev: doc.rev, guerra: vistaGuerra(doc), gente: genteOrdenada(doc).map(function (g) { return fichaPublica(doc, g); }),
      resultado: doc.resultado, votos: detalle, proclamas: proclamas,
      porras: doc.porras, espias: doc.espias || {}, duelo: doc.duelo || null,
      pullas: (doc.pullas || []).map(function (x) { return { id: x.id, de: x.de, texto: x.texto, ts: x.ts, estado: x.estado }; })
    };
  });

  // Presentación de la guerra: una página sólo explicativa para animar a la gente. Sin nombres ni cartas.
  definir('presentacion', {}, function (ctx, p) {
    exigir(ctx.doc && p.p, 'enlace', 'Este enlace no vale.');
    var doc = ctx.doc, x = doc.extras || {};
    return {
      nombre: doc.nombre, campo: doc.campo || '', pregunta: doc.pregunta, premio: doc.premio || '', botin: doc.botin || '',
      modo: doc.modo, ritmo: doc.ritmo || 'golpe', puntuacion: doc.puntuacion, hora: HORA_OFENSIVA,
      extras: { porra: !!x.porra, espia: !!x.espia, desfile: !!x.desfile, proclamas: !!x.proclamas, condecoraciones: !!x.condecoraciones, radio: !!x.radio },
      firma: nombreMando(doc), pitch: doc.pitch || '', enMarcha: ['borrador', 'llamamiento'].indexOf(doc.fase) < 0
    };
  });

  // Ensayo privado del desfile: todos sus pasos, sin tocar la guerra ni enseñárselos a nadie.
  definir('ensayo', { quien: 'mando' }, function (ctx) {
    exigir(ctx.doc.fase === 'terminada' && ctx.doc.resultado, 'fase', 'El ensayo se hace entre el alto el fuego y el desfile.');
    var doc = JSON.parse(JSON.stringify(ctx.doc)), vistas = [];
    doc.fase = 'desfile';
    doc.desfile = { paso: 0, pasos: pasosDesfile(doc), iniciado: ctx.ahora };
    for (var i = 0; i < doc.desfile.pasos.length; i++) {
      doc.desfile.paso = i;
      if (doc.desfile.pasos[i].t === 'duelo' && !doc.duelo) abrirDuelo(doc, ctx.ahora, DUELO_SEG);
      vistas.push(vistaDesfile(doc, ctx.yo));
    }
    return { vistas: vistas, conDuelo: !!doc.resultado.empate };
  });

  // Llamamiento a filas y «quién eres»: lo que ve cualquiera con el enlace general.
  definir('convocatoria', { quien: 'general' }, function (ctx) {
    var doc = ctx.doc, ll = doc.llamamiento || {};
    var nc = doc.gente.filter(function (g) { return g.combate; }).length;
    return {
      rev: doc.rev, ahora: ctx.ahora, guerra: vistaGuerra(doc), cierre: ll.cierre || '', cierreTs: ll.cierreTs || null, explicacion: resumenJuego(doc),
      gente: genteOrdenada(doc).map(function (g) {
        return Object.assign(fichaPublica(doc, g), { alistado: g.alistado == null ? null : !!g.alistado, ocupada: !!g.reclamada });
      }),
      batallasSiTodos: nc * (nc - 1) / 2
    };
  });

  // Escalafón: suma de todas las ediciones de una misma guerra, siempre a 3-1-0.
  function escalafones(lista, visible) {
    var series = {};
    lista.forEach(function (c) { (series[c.serie] = series[c.serie] || []).push(c); });
    return Object.keys(series).filter(function (s) { return series[s].some(visible); }).map(function (s) {
      var filas = {};
      series[s].forEach(function (c) {
        c.gente.filter(function (g) { return g.combate; }).forEach(function (g) {
          var k = g.persona || 'cosa:' + norm(g.nombre);
          var f = filas[k] || (filas[k] = { clave: k, persona: g.persona, nombre: g.nombre, foto: g.foto, gj: 0, tit: 0, pts: 0, dif: 0, des: 0 });
          if (g.desertor) { f.des++; return; }
          f.gj++; f.pts += g.liga || 0; f.dif += g.dif || 0;
          if (c.campeon === g.id) f.tit++;
        });
      });
      var orden = Object.keys(filas).map(function (k) { return filas[k]; })
        .sort(function (x, y) { return y.pts - x.pts || y.dif - x.dif || y.tit - x.tit; });
      return { serie: s, nombre: series[s][0].nombre + (series[s][0].campo ? ' · ' + series[s][0].campo : ''), ediciones: series[s].length, filas: orden };
    });
  }
  definir('cronicas', {}, function (ctx) {
    exigir(ctx.yo || ctx.esMando, 'enlace', 'Entra con tu enlace personal.');
    var lista = cronicas(), persona = ctx.yo ? ctx.yo.persona : null;
    var visible = function (c) { return persona ? c.gente.some(function (g) { return g.persona === persona; }) : ctx.esMando; };
    var grados = {};
    lista.forEach(function (c) { c.gente.forEach(function (g) { if (g.persona && !g.desertor) grados[g.persona] = (grados[g.persona] || 0) + 1; }); });
    return { persona: persona, guerras: lista.filter(visible), series: escalafones(lista, visible), grados: grados, nombresGrado: GRADOS };
  });

  // ------------------------------------------------------------ plan de guerra y llamamiento

  function guerraNueva(t) {
    var extras = {};
    EXTRAS.forEach(function (k) { extras[k] = true; });
    return {
      id: 'g' + env.id(8), v: 1, rev: 0, creada: t, fase: 'borrador',
      nombre: '', pregunta: '', premio: '', botin: '', modo: 'combatientes', puntuacion: 'liga', extras: extras,
      diana: { activa: true, cadaDias: 2, frases: [], ultimo: null },
      correo: { asunto: '', apertura: '', remate: '' },
      ordenanzas: null, desfileInfo: '', dueloPorPuntos: true,
      llamamiento: { activo: false, cierre: '', soloAlistados: true, voluntarios: [] },
      clave: env.id(12), presenta: env.id(12), pitch: '', gente: [], sig: 1,
      batallas: [], votos: {}, porras: {}, espias: {}, pullas: [], estrellas: [], parte: null, duelo: null, desfile: null, resultado: null
    };
  }
  function aplicarPlan(doc, p) {
    var previa = ['borrador', 'llamamiento'].indexOf(doc.fase) >= 0;
    if (p.premio != null) doc.premio = txt(p.premio, 160);
    if (p.firma != null) doc.firma = txt(p.firma, 60);
    if (p.pitch != null) doc.pitch = txt(p.pitch, 600);
    if (!doc.presenta) doc.presenta = env.id(12);
    if (p.campo != null) doc.campo = txt(p.campo, 60);
    if (p.botin != null) doc.botin = txt(p.botin, 160);
    if (p.desfileInfo != null) doc.desfileInfo = txt(p.desfileInfo, 200);
    if (p.ordenanzas !== undefined) {
      doc.ordenanzas = Array.isArray(p.ordenanzas) && p.ordenanzas.length
        ? p.ordenanzas.slice(0, 20).map(function (o) { return { t: txt(o.t, 80), x: parrafo(o.x, 1200), puntos: !!o.puntos }; }) : null;
    }
    if (p.diana) {
      doc.diana.activa = !!p.diana.activa;
      doc.diana.cadaDias = [1, 2, 3].indexOf(Number(p.diana.cadaDias)) >= 0 ? Number(p.diana.cadaDias) : 2;
      doc.diana.frases = (p.diana.frases || []).map(function (f) { return txt(f, 200); }).filter(Boolean).slice(0, 30);
    }
    if (p.correo) doc.correo = { asunto: txt(p.correo.asunto, 150), apertura: parrafo(p.correo.apertura, 1500), remate: parrafo(p.correo.remate, 1500) };
    if (previa) {
      if (p.nombre != null) doc.nombre = txt(p.nombre, 80);
      if (p.pregunta != null) doc.pregunta = txt(p.pregunta, 160);
      if (p.modo) doc.modo = p.modo === 'cosas' ? 'cosas' : 'combatientes';
      if (p.puntuacion) doc.puntuacion = p.puntuacion === 'votos' ? 'votos' : 'liga';
      if (p.ritmo) doc.ritmo = p.ritmo === 'diaria' ? 'diaria' : 'golpe';
      if (p.dueloPorPuntos != null) doc.dueloPorPuntos = !!p.dueloPorPuntos;
      if (p.extras) EXTRAS.forEach(function (k) { if (p.extras[k] != null) doc.extras[k] = !!p.extras[k]; });
      if (p.llamamiento) {
        if (p.llamamiento.cierre != null) doc.llamamiento.cierre = txt(p.llamamiento.cierre, 80);
        if (p.llamamiento.cierreTs !== undefined) doc.llamamiento.cierreTs = Number(p.llamamiento.cierreTs) > 0 ? Number(p.llamamiento.cierreTs) : null;
        if (p.llamamiento.nota != null) doc.llamamiento.nota = parrafo(p.llamamiento.nota, 1500);
        if (p.llamamiento.soloAlistados != null) doc.llamamiento.soloAlistados = !!p.llamamiento.soloAlistados;
      }
    }
    if (Array.isArray(p.gente)) {
      var vieja = porId(doc.gente), lista = [];
      p.gente.slice(0, 40).forEach(function (g) {
        var nombre = txt(g.nombre, 40);
        if (!nombre) return;
        var item = g.id && vieja[g.id];
        if (!item) {
          if (!previa) return;   // con la guerra declarada no entra ni sale nadie
          item = { id: 'c' + doc.sig++, token: null, alistado: null, reclamada: null, estado: 'activo', fin: null };
        }
        item.nombre = nombre;
        item.correo = txt(g.correo, 120).toLowerCase();
        item.frase = txt(g.frase, 100);
        item.foto = g.foto ? txt(g.foto, 40) : null;
        if (previa) {
          item.combate = doc.modo === 'cosas' ? !!g.combate : true;
          item.vota = doc.modo === 'cosas' ? !g.combate : true;
          item.mando = !!g.mando && item.vota;
        }
        lista.push(item);
      });
      if (previa) doc.gente = lista;
      var mandos = doc.gente.filter(function (g) { return g.mando; });
      mandos.slice(1).forEach(function (g) { g.mando = false; });
      if (doc.llamamiento.activo && mandos[0]) mandos[0].alistado = true;
    }
  }

  definir('crearGuerra', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var doc = guerraNueva(ctx.ahora);
    aplicarPlan(doc, p.plan || {});
    ctx.doc = doc;
    anotar(doc, 'mando', 'crear', doc.nombre);
    return { id: doc.id };
  });

  definir('guardarPlan', { escribe: true, quien: 'mando' }, function (ctx, p) {
    exigir(ctx.doc, 'noexiste', 'Esa guerra no existe.');
    aplicarPlan(ctx.doc, p.plan || {});
    return { rev: ctx.doc.rev + 1 };
  });

  // Se puede borrar en cualquier fase: desaparece de las crónicas, del escalafón y de los grados.
  definir('borrarGuerra', { escribe: true, quien: 'mando' }, function (ctx) {
    var doc = ctx.doc;
    anotar(doc, 'mando', 'borrar', doc.nombre + ' (' + doc.fase + ')');
    env.borrar('guerra:' + doc.id);
    var ind = env.leer('indice', true) || { guerras: [] };
    ind.guerras = ind.guerras.filter(function (g) { return g.id !== doc.id; });
    env.escribir('indice', ind, plural(ind.guerras.length, 'guerra', 'guerras'));
    ctx.sinGuardar = true;
    return {};
  });

  definir('abrirLlamamiento', { escribe: true, quien: 'mando' }, function (ctx) {
    var doc = ctx.doc;
    exigir(doc.fase === 'borrador' || doc.fase === 'llamamiento', 'fase', 'La guerra ya está declarada.');
    exigir(doc.nombre && doc.pregunta, 'plan', 'Pon antes el nombre y la pregunta de la guerra.');
    doc.fase = 'llamamiento';
    doc.llamamiento.activo = true;
    var m = mandoDe(doc);
    if (m) m.alistado = true;
    return { general: claveGeneral(doc) };
  });

  definir('alistar', { escribe: true, quien: 'general' }, function (ctx, p) {
    var doc = ctx.doc;
    exigir(doc.fase === 'llamamiento', 'fase', 'El alistamiento está cerrado.');
    var g = doc.gente.filter(function (x) { return x.id === p.id; })[0];
    exigir(g && (g.vota || g.combate), 'noexiste', 'Esa carta no está en la lista.');
    var conLlave = !!g.llave && p.llave === g.llave;
    exigir(g.alistado == null || conLlave || ctx.esMando, 'respondida',
      'Esta carta ya ha respondido. Si eres ' + g.nombre + ' y quieres cambiarlo, usa el enlace de tu correo o avisa al alto mando.');
    g.alistado = !!p.si;
    anotar(doc, g.nombre, 'alistar', p.si ? 'se alista' : 'no se alista');
    return { alistado: g.alistado };
  });

  definir('voluntario', { escribe: true, quien: 'general' }, function (ctx, p) {
    var doc = ctx.doc, nombre = txt(p.nombre, 40);
    exigir(doc.fase === 'llamamiento', 'fase', 'El alistamiento está cerrado.');
    exigir(nombre, 'nombre', 'Dinos cómo te llamas.');
    exigir(doc.llamamiento.voluntarios.length < 30, 'lleno', 'Hay demasiados voluntarios en espera.');
    if (!doc.llamamiento.voluntarios.some(function (v) { return norm(v.nombre) === norm(nombre); })) {
      doc.llamamiento.voluntarios.push({ id: 'v' + doc.sig++, nombre: nombre, ts: ctx.ahora });
    }
    return {};
  });

  definir('reclutar', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var doc = ctx.doc, ll = doc.llamamiento;
    var v = ll.voluntarios.filter(function (x) { return x.id === p.id; })[0];
    exigir(v, 'noexiste', 'Ese voluntario ya no está.');
    ll.voluntarios = ll.voluntarios.filter(function (x) { return x.id !== p.id; });
    if (p.si !== false) {
      doc.gente.push({ id: 'c' + doc.sig++, nombre: v.nombre, correo: '', frase: '', foto: null, token: null,
        alistado: true, reclamada: null, estado: 'activo', fin: null, combate: doc.modo !== 'cosas', vota: true, mando: false });
    }
    return {};
  });

  definir('declarar', { escribe: true, quien: 'mando' }, function (ctx) {
    var doc = ctx.doc, t = ctx.ahora;
    exigir(doc.fase === 'borrador' || doc.fase === 'llamamiento', 'fase', 'La guerra ya está declarada.');
    exigir(doc.nombre && doc.pregunta, 'plan', 'Faltan el nombre o la pregunta de la guerra.');
    if (doc.llamamiento.activo && doc.llamamiento.soloAlistados) {
      doc.fuera = doc.gente.filter(function (g) { return g.vota && g.alistado !== true; })
        .map(function (g) { return { nombre: g.nombre, objetor: g.alistado === false }; });
      doc.gente = doc.gente.filter(function (g) { return !g.vota || g.alistado === true; });
    }
    var cs = doc.gente.filter(function (g) { return g.combate; }), vs = doc.gente.filter(function (g) { return g.vota; });
    exigir(cs.length >= 3, 'gente', 'Hacen falta al menos 3 contendientes.');
    exigir(vs.length >= (doc.modo === 'cosas' ? 2 : 3), 'gente', 'Hacen falta más votantes.');
    var nombres = {};
    doc.gente.forEach(function (g) {
      exigir(!nombres[norm(g.nombre)], 'gente', 'Hay dos cartas con el nombre «' + g.nombre + '».');
      nombres[norm(g.nombre)] = true;
      exigir(!g.correo || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.correo), 'gente', 'El correo de ' + g.nombre + ' no parece válido.');
    });
    ligarPersonas(doc);
    var previas = cronicas();
    doc.gente.forEach(function (g) {
      g.grado = g.persona ? Math.min(guerrasTerminadas(g.persona, previas), GRADOS.length - 1) : 0;
      g.estado = 'activo'; g.fin = null;
      if (g.vota) g.token = doc.id + '.' + env.id(20);
    });
    doc.orden = barajar(doc.gente.map(function (g) { return g.id; }), env.azar);
    doc.batallas = calendario(cs.map(function (g) { return g.id; }), env.azar);
    doc.votos = {}; doc.porras = {}; doc.espias = {}; doc.estrellas = []; doc.parte = null;
    doc.fase = 'abierta';
    doc.declarada = t;
    doc.avisadas = 1; doc.finAvisado = null;
    doc.diana.ultimo = null;
    guardar(doc);                       // primero se guarda la guerra; los correos no pueden dejarla a medias
    anotar(doc, 'mando', 'declarar', cs.length + ' contendientes, ' + doc.batallas.length + ' batallas');
    var enviados = 0;
    vs.forEach(function (g) { if (enviarOrden(doc, g, t)) enviados++; });
    return { batallas: doc.batallas.length, enviados: enviados, sinCorreo: vs.filter(function (g) { return !g.correo; }).length };
  });

  // Con la guerra sin declarar aún no hay batallas: se calculan como quedarán.
  function cuentasDe(doc, g) {
    if (doc.batallas && doc.batallas.length) {
      return { mias: batallasDe(doc, g).length, of: Math.max.apply(null, doc.batallas.map(function (b) { return b.of; })) };
    }
    var nc = doc.gente.filter(function (x) { return x.combate; }).length, nb = nc * (nc - 1) / 2;
    return { mias: g.combate ? nb - (nc - 1) : nb, of: nc % 2 ? nc : nc - 1 };
  }
  function componerOrden(doc, g, enlace) {
    var k = cuentasDe(doc, g), mias = k.mias, of = k.of;
    var c = doc.correo || {};
    var cuerpo = '<p style="margin:0 0 14px;font-size:19px;font-weight:bold">' + esc(g.nombre) + ', la patria te reclama.</p>' + parrafos(c.apertura) +
      (doc.ritmo === 'diaria'
        ? '<p style="margin:0 0 14px">La primera ofensiva ya está abierta. Después se abrirá una nueva cada mañana a las ' + HORA_OFENSIVA + ':00, hasta completar las ' + of + ', y te avisaremos por correo. En total tienes ' + plural(mias, 'batalla', 'batallas') + ' por votar. La guerra no termina hasta que vota todo el mundo.</p>'
        : '<p style="margin:0 0 14px">Las ' + of + ' ofensivas ya están abiertas, todas a la vez. Tienes ' + plural(mias, 'batalla', 'batallas') +
      ' por votar, a tu ritmo. La guerra no termina hasta que vota todo el mundo, y todos verán quién la tiene en pausa.</p>') +
      (doc.llamamiento && doc.llamamiento.activo ? '' : '<p style="margin:0 0 8px;font-weight:bold;color:#5ef0d0">Así es esta guerra</p>' + listaCorreo(resumenJuego(doc))) +
      botonCorreo(enlace, 'Entrar a la guerra') + parrafos(c.remate) +
      '<p style="margin:18px 0 0"><strong>' + esc(nombreMando(doc)) + '</strong><br><span style="font-size:13px;color:#b3aecf">Alto mando de la guerra</span></p>';
    var extras = ['las ordenanzas'].concat(doc.extras.porra ? ['la porra'] : []).concat(['las crónicas']);
    return {
      para: g.correo, nombre: nombreMando(doc), asunto: c.asunto || '¡Comienza la ' + doc.nombre + '!',
      html: marcoCorreo(doc, cuerpo, 'Dentro tienes ' + enumerar(extras) + '.', { fondo: urlApp() + 'assets/correo-reflectores.jpg', titulo: 'Orden de movilización' }),
      texto: (c.apertura ? c.apertura + '\n\n' : '') + 'Entra a la guerra con tu enlace personal (no lo reenvíes): ' + enlace + (c.remate ? '\n\n' + c.remate : '')
    };
  }
  function enviarOrden(doc, g, t) {
    if (!g.correo) return false;
    try {
      env.correo(componerOrden(doc, g, enlacePersonal(g)));
      g.correoEnviado = t; g.correoError = null;
      anotar(doc, 'mando', 'correo', 'Orden de movilización a ' + g.nombre + ' <' + g.correo + '>');
      return true;
    } catch (e) {
      g.correoError = String(e && e.message || e).slice(0, 200);
      anotar(doc, 'mando', 'correo fallido', 'Orden de movilización a ' + g.nombre + ': ' + g.correoError);
      return false;
    }
  }

  function componerLlamada(doc, g, url) {
    var ll = doc.llamamiento;
    var cuerpo = (ll.nota ? parrafos(ll.nota) : '') +
      '<p style="margin:0 0 14px">El alto mando prepara una nueva guerra, la <strong>' + esc(doc.nombre) + '</strong>, y estás en la lista de reclutas.</p>' +
      '<p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b3aecf">Qué se dirime</p>' +
      '<p style="margin:0 0 18px;font-size:20px;font-weight:bold;color:#ffffff">' + esc(doc.pregunta) + '</p>' +
      '<p style="margin:0 0 8px;font-weight:bold;color:#5ef0d0">Así es esta guerra</p>' + listaCorreo(resumenJuego(doc)) +
      '<p style="margin:0 0 14px">¿Te alistas? Responde con este botón, que te lleva directo a tu carta. Es sólo tuyo: con él puedes cambiar de opinión hasta que se declare la guerra.' + (ll.cierre ? ' Cierre del alistamiento: <strong>' + esc(ll.cierre) + '</strong>.' : '') + '</p>' +
      '<p style="margin:24px 0 8px;text-align:center"><a href="' + esc(url) + '" style="display:inline-block;padding:14px 28px;border-radius:12px;background:#5ef0d0;color:#0d0b1a;font-size:17px;font-weight:bold;text-decoration:none;text-transform:uppercase">Responder al llamamiento</a></p>' +
      '<p style="margin:0 0 14px;font-size:13px;color:#b3aecf">Si te alistas, cuando se declare la guerra te llegará otro correo: tu orden de movilización, con tu enlace personal para votar.</p>' +
      '<p style="margin:18px 0 0"><strong>' + esc(nombreMando(doc)) + '</strong><br><span style="font-size:13px;color:#b3aecf">Alto mando de la guerra</span></p>';
    return {
      para: g.correo, nombre: nombreMando(doc), asunto: '¡Llamamiento a filas! Se avecina la ' + doc.nombre,
      html: marcoCorreo(doc, cuerpo, 'Responde antes del cierre del alistamiento.', { fondo: urlApp() + 'assets/correo-reflectores.jpg', titulo: '¡Llamamiento a filas!' }),
      texto: 'El alto mando prepara la ' + doc.nombre + ': ' + doc.pregunta + '\n\n' + resumenJuego(doc).join('\n') + '\n\n¿Te alistas? Responde aquí: ' + url
    };
  }
  function enviarLlamada(doc, g, t) {
    if (!g.llave) g.llave = env.id(16);
    try {
      env.correo(componerLlamada(doc, g, urlApp() + '#g=' + claveGeneral(doc) + '&r=' + g.id + '~' + g.llave));
      g.llamada = t; g.llamadaError = null;
      anotar(doc, 'mando', 'correo', 'Llamamiento a ' + g.nombre + ' <' + g.correo + '>');
      return true;
    } catch (e) {
      g.llamadaError = String(e && e.message || e).slice(0, 200);
      anotar(doc, 'mando', 'correo fallido', 'Llamamiento a ' + g.nombre + ': ' + g.llamadaError);
      return false;
    }
  }

  definir('previaCorreo', { quien: 'mando' }, function (ctx, p) {
    var doc = ctx.doc, votan = doc.gente.filter(function (g) { return g.vota; });
    var g = votan.filter(function (x) { return !x.mando && x.correo; })[0] || votan.filter(function (x) { return x.correo; })[0] ||
      votan[0] || { id: 'c0', nombre: 'Recluta', correo: 'recluta@ejemplo.com', combate: doc.modo !== 'cosas', vota: true };
    var m = p.tipo === 'llamamiento'
      ? componerLlamada(doc, g, urlApp() + '#g=' + (doc.clave ? claveGeneral(doc) : 'ejemplo') + '&r=' + g.id)
      : componerOrden(doc, g, urlApp() + '#t=enlace-personal-de-' + norm(g.nombre).replace(/[^a-z0-9]+/g, '-'));
    return { para: g.nombre + (g.correo ? ' <' + g.correo + '>' : ''), de: m.nombre, asunto: m.asunto, html: m.html };
  });

  definir('enviarLlamamiento', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var doc = ctx.doc;
    exigir(doc.fase === 'llamamiento', 'fase', 'El llamamiento no está abierto.');
    var lista = doc.gente.filter(function (g) { return g.vota && !g.mando && g.alistado == null && g.correo && (p.todos || !g.llamada); });
    exigir(lista.length, 'nadie', 'No queda nadie sin respuesta a quien mandárselo.');
    var enviados = 0, fallos = [];
    lista.forEach(function (g) { if (enviarLlamada(doc, g, ctx.ahora)) enviados++; else fallos.push(g.nombre); });
    return { enviados: enviados, fallos: fallos };
  });

  definir('reenviarOrden', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var doc = ctx.doc, g = doc.gente.filter(function (x) { return x.id === p.id; })[0];
    exigir(doc.fase === 'abierta', 'fase', 'La guerra no está abierta.');
    exigir(g && g.vota, 'noexiste', 'Esa carta no vota en esta guerra.');
    if (p.correo != null) g.correo = txt(p.correo, 120).toLowerCase();
    if (p.nuevoEnlace) { g.token = doc.id + '.' + env.id(20); g.reclamada = null; }
    exigir(g.correo, 'correo', g.nombre + ' no tiene correo.');
    exigir(enviarOrden(doc, g, ctx.ahora), 'correo', 'No se pudo enviar: ' + (g.correoError || ''));
    return {};
  });

  // «¿Alguien entró con tu carta?»: el alto mando la libera y los enlaces viejos dejan de valer.
  definir('liberarCarta', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var doc = ctx.doc, g = doc.gente.filter(function (x) { return x.id === p.id; })[0];
    exigir(g && g.vota && g.token, 'noexiste', 'Esa carta no tiene enlace.');
    g.token = doc.id + '.' + env.id(20);
    g.reclamada = null;
    anotar(doc, 'mando', 'liberar', g.nombre);
    return {};
  });

  // «Identifícate, soldado»: con el enlace general, la primera persona que toca una carta libre se la queda.
  definir('reclamar', { escribe: true, quien: 'general' }, function (ctx, p) {
    var doc = ctx.doc, g = doc.gente.filter(function (x) { return x.id === p.id; })[0];
    exigir(['abierta', 'terminada', 'desfile', 'publicada'].indexOf(doc.fase) >= 0, 'fase', 'La guerra aún no se ha declarado.');
    exigir(g && g.vota && g.token, 'noexiste', 'Esa carta no vota en esta guerra.');
    exigir(!g.reclamada, 'ocupada', 'Esa carta ya tiene dueño en otro móvil. Entra con el enlace de tu orden de movilización.');
    g.reclamada = ctx.ahora;
    anotar(doc, g.nombre, 'reclamar', 'enlace general');
    return { token: g.token };
  });

  // ------------------------------------------------------------ la guerra

  definir('votar', { escribe: true, quien: 'token' }, function (ctx, p) {
    var doc = ctx.doc, yo = ctx.yo, t = ctx.ahora;
    exigir(doc.fase === 'abierta', 'fase', 'La guerra ya no admite votos.');
    exigir(yo.vota && yo.estado === 'activo', 'voto', 'No votas en esta guerra.');
    var b = doc.batallas.filter(function (x) { return x.id === Number(p.batalla); })[0];
    exigir(b, 'noexiste', 'Esa batalla no existe.');
    exigir(puedeVotar(yo, b), 'propia', 'En tus propios combates no votas.');
    exigir(b.of <= abiertas(doc, t), 'cerrada', 'Esa ofensiva aún no se ha abierto.');
    exigir(p.elegido === b.a || p.elegido === b.b, 'voto', 'Hay que elegir a uno de los dos.');
    var vs = doc.votos[b.id] || (doc.votos[b.id] = {});
    if (vs[yo.id]) {
      exigir(vs[yo.id][0] === p.elegido, 'repetido', 'Ya votaste esta batalla y no hay vuelta atrás.');
      ctx.sinGuardar = true;                       // reintento del mismo voto: no pasa nada
      return { ts: vs[yo.id][1], faltan: faltan(doc, yo) };
    }
    var proclama = doc.extras.proclamas ? txt(p.proclama, 200) : '';
    vs[yo.id] = proclama ? [p.elegido, t, proclama] : [p.elegido, t];
    var f = faltan(doc, yo);
    if (f === 0) yo.fin = t;
    if (doc.extras.parte && !doc.parte) { var pr = progreso(doc); if (pr.emitidos * 2 >= pr.total) doc.parte = t; }
    anotar(doc, yo.nombre, 'voto', 'batalla ' + b.id);
    return { ts: t, faltan: f, gracia: GRACIA };
  });

  definir('retirar', { escribe: true, quien: 'token' }, function (ctx, p) {
    var doc = ctx.doc, yo = ctx.yo, vs = doc.votos[Number(p.batalla)];
    exigir(doc.fase === 'abierta', 'fase', 'La guerra ya no admite cambios.');
    exigir(vs && vs[yo.id], 'noexiste', 'No hay voto que retirar.');
    exigir(ctx.ahora - vs[yo.id][1] <= GRACIA + MARGEN, 'tarde', 'Han pasado los 10 segundos de cortesía.');
    delete vs[yo.id];
    yo.fin = null;
    anotar(doc, yo.nombre, 'retirada', 'batalla ' + p.batalla);
    return { faltan: faltan(doc, yo) };
  });

  definir('porra', { escribe: true, quien: 'token' }, function (ctx, p) {
    var doc = ctx.doc, yo = ctx.yo;
    exigir(doc.extras.porra, 'extra', 'En esta guerra no hay porra.');
    exigir(yo.vota && yo.estado === 'activo' && faltan(doc, yo) === 0, 'porra', 'La porra se abre cuando termines tus votos.');
    if (doc.fase === 'terminada') {
      exigir(!doc.porras[yo.id], 'porra', 'La porra se cerró al acabar la guerra.');
      exigir(!(doc.espias || {})[yo.id], 'porra', 'Ya mandaste al espía: no puedes hacer la porra.');
    } else exigir(doc.fase === 'abierta', 'fase', 'La porra está cerrada.');
    var ids = contendientes(doc).map(function (c) { return c.id; }), orden = (p.orden || []).map(String);
    exigir(orden.length === ids.length && ids.every(function (id) { return orden.indexOf(id) >= 0; }), 'porra', 'La porra debe ordenar a todos los contendientes.');
    doc.porras[yo.id] = { orden: orden, ts: ctx.ahora };
    return {};
  });

  definir('pulla', { escribe: true, quien: 'token' }, function (ctx, p) {
    var doc = ctx.doc, yo = ctx.yo, texto = txt(p.texto, 140);
    exigir(doc.extras.radio, 'extra', 'En esta guerra no hay Radio Macuto.');
    exigir(doc.fase === 'abierta' || doc.fase === 'terminada', 'fase', 'Radio Macuto ya ha cerrado la emisión.');
    exigir(texto, 'texto', 'Escribe algo.');
    exigir(doc.pullas.filter(function (x) { return x.de === yo.id && x.estado === 'pendiente'; }).length < 5, 'lleno', 'Tienes demasiadas pullas en censura.');
    var directa = !!yo.mando;
    doc.pullas.push({ id: 'r' + doc.sig++, de: yo.id, texto: texto, ts: ctx.ahora, estado: directa ? 'emitida' : 'pendiente', tsEmision: directa ? ctx.ahora : null });
    var m = mandoDe(doc);
    if (!directa && m && m.correo) {
      try {
        env.correo({
          para: m.correo, nombre: 'Radio Macuto', asunto: doc.nombre + ': pulla de ' + yo.nombre + ' en censura',
          html: marcoCorreo(doc, '<p style="margin:0 0 14px">' + esc(yo.nombre) + ' quiere emitir esto por Radio Macuto:</p>' +
            '<p style="margin:0 0 14px;font-size:19px;font-style:italic">«' + esc(texto) + '»</p>' +
            '<p style="margin:24px 0 8px;text-align:center"><a href="' + esc(enlacePersonal(m) + '&ir=cuartel') + '" style="display:inline-block;padding:14px 28px;border-radius:12px;background:#ff6ad5;color:#0d0b1a;font-size:17px;font-weight:bold;text-decoration:none;text-transform:uppercase">Ir a la censura</a></p>' +
            '<p style="margin:0;font-size:13px;color:#b3aecf">Hasta que no pulses «Emitir», no sale en antena.</p>',
            'Sólo tú recibes este aviso y sólo tú ves quién escribe cada pulla.', { fondo: urlApp() + 'assets/correo-mapa.jpg', mosaico: true, titulo: 'Radio Macuto' }),
          texto: yo.nombre + ' quiere emitir por Radio Macuto: «' + texto + '». Censura: ' + enlacePersonal(m) + '&ir=cuartel'
        });
      } catch (e) { /* el aviso es opcional */ }
    }
    return { emitida: directa };
  });

  definir('moderar', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var pl = ctx.doc.pullas.filter(function (x) { return x.id === p.id; })[0];
    exigir(pl, 'noexiste', 'Esa pulla no existe.');
    pl.estado = p.emitir ? 'emitida' : 'censurada';
    pl.tsEmision = p.emitir ? ctx.ahora : null;
    var doc = ctx.doc, avisados = 0;
    if (p.emitir && p.avisar && !pl.avisada) {
      pl.avisada = ctx.ahora;
      votantes(doc).forEach(function (g) {
        if (!g.correo || g.mando) return;
        try {
          env.correo({
            para: g.correo, nombre: 'Radio Macuto', asunto: doc.nombre + ': Radio Macuto está en antena',
            html: marcoCorreo(doc, '<p style="margin:0 0 14px">' + esc(g.nombre) + ', alguien ha dicho esto por Radio Macuto:</p>' +
              '<p style="margin:0 0 14px;font-size:19px;font-style:italic">«' + esc(pl.texto) + '»</p>' +
              '<p style="margin:24px 0 8px;text-align:center"><a href="' + esc(enlacePersonal(g) + '&ir=radio') + '" style="display:inline-block;padding:14px 28px;border-radius:12px;background:#ff6ad5;color:#0d0b1a;font-size:17px;font-weight:bold;text-decoration:none;text-transform:uppercase">Responder con otra pulla</a></p>' +
              '<p style="margin:0;font-size:13px;color:#b3aecf">Las pullas salen en antena sin firma. Este enlace es sólo tuyo: no lo reenvíes.</p>',
              'Radio Macuto: pullas anónimas desde las trincheras.', { fondo: urlApp() + 'assets/correo-mapa.jpg', mosaico: true, titulo: 'Radio Macuto' }),
            texto: 'Alguien ha dicho por Radio Macuto: «' + pl.texto + '». Responde: ' + enlacePersonal(g) + '&ir=radio'
          });
          avisados++;
        } catch (e) { /* un correo fallido no para la emisión */ }
      });
      anotar(doc, 'mando', 'correo', 'Aviso de Radio Macuto: ' + avisados + ' correos');
    }
    return { avisados: avisados };
  });

  definir('tocarDiana', { escribe: true, quien: 'mando' }, function (ctx) {
    exigir(ctx.doc.fase === 'abierta', 'fase', 'La guerra no está abierta.');
    return { enviados: tocarDiana(ctx.doc, ctx.ahora) };
  });

  function tocarDiana(doc, t) {
    var pr = progreso(doc, abiertas(doc, t)), gente = porId(doc.gente), enviados = 0;
    var frases = doc.diana.frases && doc.diana.frases.length ? doc.diana.frases : null;
    pr.rezagados.forEach(function (r) {
      var g = gente[r.id];
      if (!g.correo) return;
      var frase = frases ? frases[Math.floor(env.azar() * frases.length)].replace(/\{nombre\}/g, g.nombre).replace(/\{faltan\}/g, r.faltan)
        : g.nombre + ', el enemigo sigue esperando: ' + (r.faltan === 1 ? 'te queda 1 batalla.' : 'te quedan ' + r.faltan + ' batallas.');
      var otros = pr.rezagados.filter(function (x) { return x.id !== r.id; }).map(function (x) { return gente[x.id].nombre + ' (' + x.faltan + ')'; });
      var cuerpo = '<p style="margin:0 0 14px;font-size:19px;font-weight:bold">' + esc(frase) + '</p>' +
        '<p style="margin:0 0 14px;color:#cdc8e6">Llevas ' + (r.de - r.faltan) + ' de ' + r.de + '. ' +
        (otros.length ? 'No eres el único: también ' + (otros.length === 1 ? 'falta ' : 'faltan ') + esc(enumerar(otros)) + '. ' : 'Eres el único que falta. ') +
        'La guerra no termina hasta que ' + (otros.length ? 'votéis todos.' : 'votes.') + '</p>' +
        botonCorreo(enlacePersonal(g), 'Volver a la guerra') +
        '<p style="margin:18px 0 0"><strong>' + esc(nombreMando(doc)) + '</strong><br><span style="font-size:13px;color:#b3aecf">Alto mando de la guerra</span></p>';
      try {
        env.correo({
          para: g.correo, nombre: nombreMando(doc),
          asunto: doc.nombre + ': toque de diana, te ' + (r.faltan === 1 ? 'queda 1 batalla' : 'quedan ' + r.faltan + ' batallas'),
          html: marcoCorreo(doc, cuerpo, doc.diana.activa ? 'Te tocarán diana cada ' + plural(doc.diana.cadaDias, 'día', 'días') + ' mientras te queden batallas.' : 'Toque de diana del alto mando.', { fondo: urlApp() + 'assets/correo-mapa.jpg', mosaico: true, titulo: 'Toque de diana' }),
          texto: frase + '\n\nVuelve a la guerra con tu enlace personal: ' + enlacePersonal(g)
        });
        enviados++;
      } catch (e) { g.correoError = String(e && e.message || e).slice(0, 200); }
    });
    doc.diana.ultimo = t;
    anotar(doc, '', 'diana', enviados + ' toques');
    return enviados;
  }

  definir('armisticio', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var doc = ctx.doc, t = ctx.ahora, dec = p.decisiones || {};
    exigir(doc.fase === 'abierta', 'fase', 'La guerra no está abierta.');
    var rez = progreso(doc).rezagados, gente = porId(doc.gente);
    rez.forEach(function (r) {
      exigir(dec[r.id] && (dec[r.id].accion === 'expulsar' || dec[r.id].accion === 'indultar'), 'decision', 'Falta decidir qué hacer con ' + gente[r.id].nombre + '.');
    });
    var expulsados = rez.filter(function (r) { return dec[r.id].accion === 'expulsar'; });
    var quedan = contendientes(doc).filter(function (c) { return !expulsados.some(function (r) { return r.id === c.id; }); });
    exigir(quedan.length >= 2, 'gente', 'No pueden quedar menos de 2 contendientes.');
    expulsados.forEach(function (r) {
      var g = gente[r.id];
      g.estado = 'expulsado'; g.faltaban = r.faltan; g.sentencia = txt(dec[r.id].sentencia, 300);
      Object.keys(doc.votos).forEach(function (b) { delete doc.votos[b][g.id]; });
      delete doc.porras[g.id];
    });
    // Se limpian los votos de las batallas que desaparecen con los expulsados.
    var vivas = porId(batallasVivas(doc));
    Object.keys(doc.votos).forEach(function (b) { if (!vivas[b]) delete doc.votos[b]; });
    rez.filter(function (r) { return dec[r.id].accion === 'indultar'; }).forEach(function (r) {
      var g = gente[r.id];
      g.estado = 'indultado'; g.faltaban = faltan(doc, g);
    });
    anotar(doc, 'mando', 'armisticio', expulsados.length + ' expulsados, ' + (rez.length - expulsados.length) + ' indultados');
    terminar(doc, t);
    guardar(doc);
    avisarFin(doc, t);
    return { contendientes: quedan.length, batallas: batallasVivas(doc).length };
  });

  definir('espiar', { escribe: true, quien: 'token' }, function (ctx, p) {
    var doc = ctx.doc, yo = ctx.yo;
    exigir(doc.extras.espia, 'extra', 'En esta guerra no hay espías.');
    exigir(doc.fase === 'terminada', 'fase', 'El espía sólo sale entre el alto el fuego y el desfile.');
    exigir(yo.vota && yo.estado !== 'expulsado', 'voto', 'No tienes espía en esta guerra.');
    exigir(!doc.espias[yo.id], 'gastado', 'Ya gastaste a tu espía.');
    var b = doc.resultado.batallas.filter(function (x) { return x.id === Number(p.batalla); })[0];
    exigir(b, 'noexiste', 'Esa batalla no existe.');
    doc.espias[yo.id] = b.id;
    doc.resultado.curiosidades = curiosidades(doc, { batallas: doc.resultado.batallas });
    return { batalla: b.id, gana: b.va > b.vb ? b.a : b.vb > b.va ? b.b : 'empate' };
  });

  definir('estrella', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var doc = ctx.doc, ref = Number(p.batalla) + ':' + String(p.de);
    exigir(doc.fase === 'terminada', 'fase', 'Las proclamas se eligen antes del desfile.');
    exigir(proclamaDe(doc, ref), 'noexiste', 'Esa proclama no existe.');
    doc.estrellas = doc.estrellas.filter(function (r) { return r !== ref; });
    if (p.si) doc.estrellas.push(ref);
    return { estrellas: doc.estrellas.length };
  });

  // ------------------------------------------------------------ desfile, publicación y duelo final

  definir('desfile', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var doc = ctx.doc, t = ctx.ahora, df = doc.desfile;
    if (p.orden === 'empezar') {
      exigir(doc.fase === 'terminada', 'fase', 'El desfile empieza cuando acaba la guerra.');
      exigir(doc.extras.desfile, 'extra', 'Esta guerra no tiene desfile: publica los resultados.');
      doc.fase = 'desfile';
      doc.desfile = df = { paso: 0, pasos: pasosDesfile(doc), iniciado: t };
      if (df.pasos[0].t === 'duelo') abrirDuelo(doc, t, DUELO_SEG);
      anotar(doc, 'mando', 'desfile', 'empieza');
      return { paso: 0 };
    }
    exigir(doc.fase === 'desfile', 'fase', 'El desfile no está en marcha.');
    var actual = df.pasos[df.paso];
    if (p.orden === 'siguiente') {
      if (actual.t === 'duelo' && !doc.duelo.cerrado) cerrarDuelo(doc, t);
      exigir(df.paso < df.pasos.length - 1, 'fin', 'El desfile ha terminado.');
      df.paso++;
      if (df.pasos[df.paso].t === 'duelo' && !doc.duelo) abrirDuelo(doc, t, DUELO_SEG);
    } else if (p.orden === 'anterior') {
      if (df.paso > 0) df.paso--;
    } else if (p.orden === 'terminar') {
      exigir(df.pasos[df.paso].t === 'campeon', 'fase', 'El desfile termina con el campeón.');
      publicar(doc, t);
    } else exigir(false, 'orden', 'Orden desconocida.');
    return { paso: df.paso };
  });

  function publicar(doc, t) {
    doc.fase = 'publicada';
    doc.publicada = t;
    if (doc.desfile) doc.desfile.terminado = t;
    if (doc.resultado.empate && !doc.duelo) abrirDuelo(doc, t, 0);   // sin desfile, el duelo se vota después
    doc.cronica = cronicaDe(doc);
    anotar(doc, 'mando', 'publicar', '');
  }

  definir('publicar', { escribe: true, quien: 'mando' }, function (ctx) {
    exigir(ctx.doc.fase === 'terminada', 'fase', 'Sólo se publica una guerra terminada.');
    exigir(!ctx.doc.extras.desfile, 'extra', 'Esta guerra tiene desfile: los resultados se revelan allí.');
    publicar(ctx.doc, ctx.ahora);
    return {};
  });

  definir('votarDuelo', { escribe: true, quien: 'token' }, function (ctx, p) {
    var doc = ctx.doc, yo = ctx.yo, d = doc.duelo;
    exigir(d && !d.cerrado, 'fase', 'El duelo final está cerrado.');
    exigir(electoresDuelo(doc).some(function (v) { return v.id === yo.id; }), 'voto', 'En este duelo no votas.');
    exigir(d.entre.indexOf(p.elegido) >= 0, 'voto', 'Hay que elegir a uno de los duelistas.');
    exigir(!d.votos[yo.id] || d.votos[yo.id] === p.elegido, 'repetido', 'Ya votaste en el duelo.');
    d.votos[yo.id] = p.elegido;
    if (!d.cierra) madurar(doc, ctx.ahora);        // duelo sin reloj: se cierra cuando votan todos
    return {};
  });

  definir('cerrarDuelo', { escribe: true, quien: 'mando' }, function (ctx) {
    exigir(ctx.doc.duelo && !ctx.doc.duelo.cerrado, 'fase', 'No hay duelo abierto.');
    cerrarDuelo(ctx.doc, ctx.ahora);
    return {};
  });

  definir('contraofensiva', { escribe: true, quien: 'mando' }, function (ctx) {
    var vieja = ctx.doc, doc = guerraNueva(ctx.ahora);
    ['nombre', 'pregunta', 'premio', 'botin', 'firma', 'campo', 'ritmo', 'modo', 'puntuacion', 'desfileInfo', 'dueloPorPuntos'].forEach(function (k) { doc[k] = vieja[k]; });
    doc.extras = JSON.parse(JSON.stringify(vieja.extras));
    doc.diana = { activa: vieja.diana.activa, cadaDias: vieja.diana.cadaDias, frases: vieja.diana.frases.slice(), ultimo: null };
    doc.correo = JSON.parse(JSON.stringify(vieja.correo));
    doc.gente = vieja.gente.concat([]).map(function (g) {
      return { id: 'c' + doc.sig++, nombre: g.nombre, correo: g.correo || '', frase: g.frase || '', foto: g.foto || null, token: null,
        alistado: null, reclamada: null, estado: 'activo', fin: null, combate: !!g.combate, vota: !!g.vota, mando: !!g.mando };
    });
    guardar(doc);
    ctx.sinGuardar = true;
    return { id: doc.id };
  });

  definir('subirFoto', { escribe: true, quien: 'mando' }, function (ctx, p) {
    var datos = String(p.datos || '');
    exigir(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(datos), 'foto', 'La foto no tiene un formato válido.');
    exigir(datos.length <= 120000, 'foto', 'La foto pesa demasiado.');
    var id = 'f' + env.id(14);
    env.escribirFoto(id, datos);
    ctx.sinGuardar = true;
    return { id: id };
  });

  // ------------------------------------------------------------ reloj (cada hora)

  function reloj() {
    var t = ahora(), hora = env.hora();
    indice().filter(function (g) { return g.fase === 'abierta' || g.fase === 'terminada' || g.fase === 'desfile' || g.fase === 'publicada'; }).forEach(function (g) {
      env.candado(function () {
        var doc = env.leer('guerra:' + g.id, true);
        if (!doc) return;
        var cambio = madurar(doc, t);
        var d = doc.diana;
        if (doc.fase === 'abierta' && d.activa && hora >= 10 && hora < 22 && t >= (d.ultimo || doc.declarada) + d.cadaDias * DIA) {
          tocarDiana(doc, t);
          cambio = true;
        }
        if (doc.fase === 'abierta' && doc.ritmo === 'diaria') {
          var ab = abiertas(doc, t);
          if (ab > (doc.avisadas || 1)) { doc.avisadas = ab; avisarOfensiva(doc, ab, t); cambio = true; }
        }
        if (doc.fase === 'terminada' && !doc.finAvisado && t - doc.terminada < 2 * DIA) { avisarFin(doc, t); cambio = true; }
        if (cambio) guardar(doc);
      });
    });
  }

  return { atender: atender, reloj: reloj, acciones: Object.keys(ACC) };
}

// ---------------------------------------------------------------- adaptador de Google Apps Script

function gas(cfg) {
  /* global SpreadsheetApp, CacheService, PropertiesService, LockService, MailApp, Utilities, ContentService, ScriptApp */
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var cache = CacheService.getScriptCache();
  var props = PropertiesService.getScriptProperties();
  var TROZO = 45000, TROZO_CACHE = 30000, hojas = {};

  function hoja(nombre, cabecera) {
    if (hojas[nombre]) return hojas[nombre];
    var h = libro.getSheetByName(nombre);
    if (!h) { h = libro.insertSheet(nombre); h.appendRow(cabecera); h.setFrozenRows(1); }
    return (hojas[nombre] = h);
  }
  function documentos() { return hoja('documentos', ['clave', 'resumen', 'actualizado', 'datos']); }
  function fotos() { return hoja('fotos', ['id', 'subida', 'datos']); }
  function fila(h, clave) {
    var ck = 'fila:' + h.getName() + ':' + clave, f = Number(cache.get(ck));
    if (f && f <= h.getLastRow() && h.getRange(f, 1).getValue() === clave) return f;
    var celda = h.getRange(1, 1, Math.max(h.getLastRow(), 1), 1).createTextFinder(clave).matchEntireCell(true).matchCase(true).findNext();
    if (!celda) return 0;
    cache.put(ck, String(celda.getRow()), 21600);
    return celda.getRow();
  }
  function leerFila(h, clave, desde) {
    var f = fila(h, clave);
    if (!f) return null;
    var ancho = h.getLastColumn() - desde + 1;
    if (ancho < 1) return null;
    return h.getRange(f, desde, 1, ancho).getValues()[0].map(function (v) { v = String(v); return v ? v.slice(1) : ''; }).join('');
  }
  function escribirFila(h, clave, previos, texto) {
    var trozos = [];
    // Cada trozo lleva una virgulilla delante: así Sheets nunca lo toma por número, fecha o fórmula.
    for (var i = 0; i < texto.length; i += TROZO) trozos.push('~' + texto.slice(i, i + TROZO));
    var f = fila(h, clave), valores = [clave].concat(previos).concat(trozos);
    if (valores.length > h.getMaxColumns()) h.insertColumnsAfter(h.getMaxColumns(), valores.length - h.getMaxColumns());
    if (!f) { h.appendRow(valores); return; }
    var ancho = Math.max(h.getLastColumn(), valores.length);
    while (valores.length < ancho) valores.push('');
    h.getRange(f, 1, 1, ancho).setValues([valores]);
  }
  function cachePoner(clave, texto) {
    try {
      var mapa = {}, n = 0;
      for (var i = 0; i < texto.length; i += TROZO_CACHE) mapa['d:' + clave + ':' + n++] = texto.slice(i, i + TROZO_CACHE);
      mapa['d:' + clave] = String(n);
      cache.putAll(mapa, 900);
    } catch (e) { cache.remove('d:' + clave); }
  }
  function cacheLeer(clave) {
    var n = Number(cache.get('d:' + clave));
    if (!n) return null;
    var claves = [];
    for (var i = 0; i < n; i++) claves.push('d:' + clave + ':' + i);
    var mapa = cache.getAll(claves), texto = '';
    for (var j = 0; j < n; j++) { if (mapa[claves[j]] == null) return null; texto += mapa[claves[j]]; }
    return texto;
  }

  var env = {
    ahora: function () { return Date.now(); },
    azar: Math.random,
    hora: function () { return Number(Utilities.formatDate(new Date(), 'Europe/Madrid', 'H')); },
    inicioDia: function (ts) {
      var p = Utilities.formatDate(new Date(ts), 'Europe/Madrid', 'H:m:s').split(':').map(Number);
      return ts - (ts % 1000) - (p[0] * 3600 + p[1] * 60 + p[2]) * 1000;
    },
    id: function (n) { var s = ''; while (s.length < n) s += Utilities.getUuid().replace(/-/g, ''); return s.slice(0, n); },
    leer: function (clave, fresco) {
      var texto = fresco ? null : cacheLeer(clave);
      if (texto == null) {
        texto = leerFila(documentos(), clave, 4);
        if (texto && !fresco) cachePoner(clave, texto);
      }
      return texto ? JSON.parse(texto) : null;
    },
    escribir: function (clave, obj, resumen) {
      var texto = JSON.stringify(obj);
      cache.remove('d:' + clave);
      escribirFila(documentos(), clave, [resumen || '', new Date()], texto);
      cachePoner(clave, texto);
    },
    borrar: function (clave) {
      var h = documentos(), f = fila(h, clave);
      cache.remove('d:' + clave);
      if (f) h.deleteRow(f);
      cache.remove('fila:' + h.getName() + ':' + clave);
    },
    leerFoto: function (id) {
      var texto = cache.get('f:' + id);
      if (texto) return texto;
      texto = leerFila(fotos(), id, 3);
      if (texto && texto.length < 90000) cache.put('f:' + id, texto, 21600);
      return texto;
    },
    escribirFoto: function (id, datos) { escribirFila(fotos(), id, [new Date()], datos); },
    registrar: function (f) { hoja('registro', ['cuándo', 'guerra', 'quién', 'qué', 'detalle']).appendRow(f); },
    candado: function (fn) {
      var c = LockService.getScriptLock();
      c.waitLock(25000);
      try { return fn(); } finally { c.releaseLock(); }
    },
    correo: function (m) { MailApp.sendEmail({ to: m.para, subject: m.asunto, htmlBody: m.html, body: m.texto, name: m.nombre }); },
    ajuste: function (k) { return props.getProperty(k); }
  };
  var motor = crearMotor(env);

  function salida(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
  function web(e) {
    try {
      var p = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : { accion: 'ping' };
      return salida({ ok: true, datos: motor.atender(p) });
    } catch (err) {
      if (!err.fallo) { try { env.registrar([new Date().toISOString(), '', '', 'ERROR', String(err && err.stack || err).slice(0, 900)]); } catch (e2) { /* nada */ } }
      return salida({ ok: false, codigo: err.codigo || 'interno', error: err.fallo ? err.message : 'El cuartel general ha tenido un problema. Vuelve a intentarlo.' });
    }
  }
  // Se ejecuta una vez desde el editor: prepara la hoja, la clave del alto mando y el reloj.
  function instalar() {
    documentos(); fotos(); hoja('registro', ['cuándo', 'guerra', 'quién', 'qué', 'detalle']);
    if (!props.getProperty('CLAVE_MANDO')) props.setProperty('CLAVE_MANDO', env.id(28));
    props.setProperty('URL_APP', cfg.urlApp);
    var hay = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'tictac'; });
    if (!hay) ScriptApp.newTrigger('tictac').timeBased().everyHours(1).create();
    var enlace = cfg.urlApp + '#mando=' + props.getProperty('CLAVE_MANDO');
    var h = hoja('inicio', ['Guerra de la Normalidad']);
    h.getRange(2, 1, 4, 1).setValues([
      ['Tu enlace de alto mando (no lo compartas con nadie):'], [enlace],
      ['Esta hoja guarda las guerras, los votos y las fotos. No hace falta tocarla: se maneja sola desde la app.'],
      ['Motor instalado: versión ' + VERSION]
    ]);
    return enlace;
  }
  return { web: web, reloj: motor.reloj, instalar: instalar, motor: motor };
}

return {
  VERSION: VERSION, GRADOS: GRADOS, GRACIA: GRACIA, MARGEN: MARGEN,
  crear: crearMotor, gas: gas,
  reglas: { calendario: calendario, recuento: recuento, clasificar: clasificar, calcular: calcular, pasosDesfile: pasosDesfile, ordenanzasAuto: ordenanzasAuto, progreso: progreso }
};
})()
