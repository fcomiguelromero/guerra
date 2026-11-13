// Pruebas del motor: guerras completas simuladas en memoria. Ejecutar con: node pruebas/motor.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const M = (0, eval)(fs.readFileSync(path.join(__dirname, '..', 'motor', 'motor.js'), 'utf8'));

function semilla(n) { return function () { n |= 0; n = n + 0x6D2B79F5 | 0; let t = Math.imul(n ^ n >>> 15, 1 | n); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function mundo(seed) {
  const docs = new Map(), fotos = new Map(), azar = semilla(seed || 1);
  const w = { t: Date.UTC(2026, 10, 12, 17, 0, 0), correos: [], registro: [], hora: 12, n: 0 };
  const env = {
    ahora: () => w.t, azar, hora: () => w.hora, inicioDia: (ts) => ts - ts % 86400000,
    id: (n) => { let s = ''; while (s.length < n) s += Math.floor(azar() * 36).toString(36); return s; },
    leer: (k) => docs.has(k) ? JSON.parse(docs.get(k)) : null,
    escribir: (k, o) => docs.set(k, JSON.stringify(o)),
    borrar: (k) => docs.delete(k),
    leerFoto: (id) => fotos.get(id) || null, escribirFoto: (id, d) => fotos.set(id, d),
    registrar: (f) => w.registro.push(f),
    candado: (fn) => fn(),
    correo: (m) => { if (/falla/.test(m.para)) throw new Error('buzón inexistente'); w.correos.push(m); },
    ajuste: (k) => ({ CLAVE_MANDO: 'clave-mando', URL_APP: 'https://ejemplo.test/guerra/' })[k]
  };
  w.motor = M.crear(env);
  w.docs = docs;
  w.do = (accion, p) => w.motor.atender(Object.assign({ accion }, p));
  w.mando = (accion, p) => w.do(accion, Object.assign({ mando: 'clave-mando' }, p));
  w.falla = (codigo, fn) => { try { fn(); } catch (e) { assert.ok(e.fallo, 'error inesperado: ' + e.stack); assert.strictEqual(e.codigo, codigo); return; } assert.fail('debía fallar con ' + codigo); };
  w.doc = (id) => JSON.parse(docs.get('guerra:' + id));
  w.pasa = (ms) => { w.t += ms; };
  return w;
}

const NOMBRES = ['María', 'Andrés', 'Carmen', 'Fran', 'Javier', 'Elena', 'Rafa', 'Lola', 'Nuria', 'Paco'];

function crearGuerra(w, opciones) {
  const o = Object.assign({ nombres: NOMBRES, plan: {} }, opciones);
  const plan = Object.assign({
    nombre: 'Guerra de la Normalidad', pregunta: '¿Quién es más normal?', premio: 'Una cena', botin: '2 € por cabeza',
    gente: o.nombres.map((n, i) => ({ nombre: n, correo: n.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + '@ejemplo.test', frase: 'Frase de ' + n, mando: i === 3 }))
  }, o.plan);
  const { id } = w.mando('crearGuerra', { plan });
  return id;
}
function declarar(w, id) {
  const r = w.mando('declarar', { guerra: id });
  const doc = w.doc(id), tok = {};
  doc.gente.forEach((g) => { tok[g.nombre] = g.token; });
  return { r, doc, tok, id: Object.fromEntries(doc.gente.map((g) => [g.nombre, g.id])), nombre: Object.fromEntries(doc.gente.map((g) => [g.id, g.nombre])) };
}
// Cada votante elige según una «fuerza» fija: gana el de menor índice, salvo que la función diga otra cosa.
function votarTodo(w, g, quien, elegir, cuantas) {
  const est = w.do('estado', { token: g.tok[quien] });
  let n = 0;
  est.batallas.filter((b) => b.mia && !b.voto).forEach((b) => {
    if (cuantas != null && n >= cuantas) return;
    const fa = g.doc.gente.findIndex((x) => x.id === b.a), fb = g.doc.gente.findIndex((x) => x.id === b.b);
    const elegido = elegir ? elegir(b, g.nombre[b.a], g.nombre[b.b]) : (fa < fb ? b.a : b.b);
    w.do('votar', { token: g.tok[quien], batalla: b.id, elegido });
    w.pasa(1000); n++;
  });
  return n;
}

let pruebas = 0;
function prueba(nombre, fn) { fn(); pruebas++; console.log('  ✓ ' + nombre); }

// ---------------------------------------------------------------------------------------------
prueba('calendario: todos contra todos, una vez, sin repetir en la misma ofensiva', () => {
  [3, 4, 5, 9, 10, 11].forEach((n) => {
    const ids = Array.from({ length: n }, (_, i) => 'c' + (i + 1));
    const bat = M.reglas.calendario(ids, semilla(n));
    assert.strictEqual(bat.length, n * (n - 1) / 2);
    const pares = new Set(bat.map((b) => [b.a, b.b].sort().join('-')));
    assert.strictEqual(pares.size, bat.length);
    const of = Math.max(...bat.map((b) => b.of));
    assert.strictEqual(of, n % 2 ? n : n - 1);
    for (let r = 1; r <= of; r++) {
      const enLiza = bat.filter((b) => b.of === r).flatMap((b) => [b.a, b.b]);
      assert.strictEqual(new Set(enLiza).size, enLiza.length);
      assert.strictEqual(enLiza.length, n % 2 ? n - 1 : n);
    }
  });
});

prueba('permisos: sin clave de mando no se crea ni se lee nada reservado', () => {
  const w = mundo(2);
  w.falla('mando', () => w.do('crearGuerra', { plan: {} }));
  w.falla('mando', () => w.do('crearGuerra', { mando: 'otra', plan: {} }));
  const id = crearGuerra(w);
  w.falla('mando', () => w.do('plan', { guerra: id }));
  w.falla('mando', () => w.do('informe', { guerra: id }));
  w.falla('enlace', () => w.do('estado', { token: id + '.inventado' }));
  w.falla('enlace', () => w.do('convocatoria', { g: id + '.inventada' }));
});

prueba('llamamiento: alistados, objetor, voluntario y declaración sólo con los alistados', () => {
  const w = mundo(3);
  const id = crearGuerra(w, { nombres: NOMBRES.concat(['Sergio-no']) });
  const { general } = w.mando('abrirLlamamiento', { guerra: id });
  let conv = w.do('convocatoria', { g: general });
  assert.strictEqual(conv.gente.length, 11);
  assert.strictEqual(conv.batallasSiTodos, 55);
  assert.strictEqual(conv.gente.filter((g) => g.alistado === true).length, 1, 'el alto mando entra alistado');
  assert.ok(!JSON.stringify(conv).includes('@'), 'el llamamiento no enseña correos');
  const idDe = Object.fromEntries(conv.gente.map((g) => [g.nombre, g.id]));
  NOMBRES.filter((n) => n !== 'Fran' && n !== 'Paco').forEach((n) => w.do('alistar', { g: general, id: idDe[n], si: true }));
  w.do('alistar', { g: general, id: idDe['Sergio-no'], si: false });
  w.do('voluntario', { g: general, nombre: 'Sergio' });
  const plan = w.mando('plan', { guerra: id });
  assert.strictEqual(plan.mando.voluntarios.length, 1);
  w.mando('reclutar', { guerra: id, id: plan.mando.voluntarios[0].id });
  const g = declarar(w, id);
  assert.strictEqual(g.doc.gente.length, 10, '9 alistados de la lista + el voluntario');
  assert.ok(!g.id['Paco'] && !g.id['Sergio-no'] && g.id['Sergio']);
  assert.deepStrictEqual(g.doc.fuera.map((f) => f.nombre + (f.objetor ? '*' : '')).sort(), ['Paco', 'Sergio-no*']);
  assert.strictEqual(g.r.batallas, 45);
  assert.strictEqual(g.r.enviados, 9);
  assert.strictEqual(g.r.sinCorreo, 1, 'el voluntario no tiene correo');
  w.falla('fase', () => w.do('alistar', { g: general, id: idDe['María'], si: false }));
  // El voluntario entra por el enlace general tocando su carta; la segunda vez ya está ocupada.
  const { token } = w.do('reclamar', { g: general, id: g.id['Sergio'] });
  assert.strictEqual(token, g.tok['Sergio']);
  w.falla('ocupada', () => w.do('reclamar', { g: general, id: g.id['Sergio'] }));
});

prueba('llamamiento por correo: explica el juego, lleva a la carta y no repite', () => {
  const w = mundo(15);
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 5), plan: { llamamiento: { cierre: 'Viernes, 20:00', nota: 'Atención, reclutas.' } } });
  w.falla('fase', () => w.mando('enviarLlamamiento', { guerra: id }));
  const { general } = w.mando('abrirLlamamiento', { guerra: id });
  const conv = w.do('convocatoria', { g: general });
  assert.ok(conv.explicacion.length >= 4 && /10 batallas/.test(conv.explicacion[1]));
  const idDe = Object.fromEntries(conv.gente.map((g) => [g.nombre, g.id]));
  w.do('alistar', { g: general, id: idDe['María'], si: true });
  let r = w.mando('enviarLlamamiento', { guerra: id });
  assert.strictEqual(r.enviados, 3, 'ni al alto mando ni a quien ya respondió');
  const c = w.correos.find((m) => m.para === 'andres@ejemplo.test');
  assert.ok(/Se avecina la Guerra de la Normalidad/.test(c.asunto));
  const llaveAndres = new RegExp('#g=' + general.replace('.', '\\.') + '&amp;r=' + idDe['Andrés'] + '~(\\w+)').exec(c.html)[1];
  assert.ok(llaveAndres && c.html.includes('Atención, reclutas.') && c.html.includes('Viernes, 20:00') && c.html.includes('Así es esta guerra'));
  // Por el enlace general nadie cambia una respuesta ya dada; con la llave del correo, sí.
  w.do('alistar', { g: general, id: idDe['Andrés'], si: false });
  w.falla('respondida', () => w.do('alistar', { g: general, id: idDe['Andrés'], si: true }));
  w.falla('respondida', () => w.do('alistar', { g: general, id: idDe['Andrés'], si: true, llave: 'inventada' }));
  w.do('alistar', { g: general, id: idDe['Andrés'], si: true, llave: llaveAndres });
  w.falla('nadie', () => w.mando('enviarLlamamiento', { guerra: id }));
  assert.strictEqual(w.mando('enviarLlamamiento', { guerra: id, todos: true }).enviados, 2, 'Andrés ya ha contestado');
  assert.ok(w.mando('plan', { guerra: id }).plan.gente.find((g) => g.nombre === 'Andrés').llamada);
  assert.ok(w.registro.some((f) => f[3] === 'correo' && /Llamamiento a Andrés/.test(f[4])));
  // Con llamamiento, la orden de movilización ya no repite la explicación.
  w.do('alistar', { g: general, id: idDe['Carmen'], si: false });
  w.do('alistar', { g: general, id: idDe['Javier'], si: true });
  const g = declarar(w, id);
  assert.ok(!w.correos.find((m) => m.asunto.indexOf('Comienza') >= 0).html.includes('Así es esta guerra'));
  assert.deepStrictEqual(g.doc.gente.map((x) => x.nombre).sort(), ['Andrés', 'Fran', 'Javier', 'María'], 'sólo entran los alistados');
});

prueba('vista previa: los dos correos se componen sin enviar nada, antes de declarar', () => {
  const w = mundo(16);
  const id = crearGuerra(w, { plan: { correo: { asunto: '¡A las armas!', apertura: 'Ha llegado la hora.', remate: '' } } });
  let v = w.mando('previaCorreo', { guerra: id });
  assert.strictEqual(v.asunto, '¡A las armas!');
  assert.strictEqual(v.de, 'Fran');
  assert.ok(/^María </.test(v.para), 'se previsualiza para un combatiente que no es el alto mando');
  assert.ok(v.html.includes('Las 9 ofensivas') && v.html.includes('36 batallas') && v.html.includes('Ha llegado la hora.') && v.html.includes('Así es esta guerra'));
  w.mando('abrirLlamamiento', { guerra: id });
  v = w.mando('previaCorreo', { guerra: id, tipo: 'llamamiento' });
  assert.ok(/Se avecina/.test(v.asunto) && v.html.includes('Responder al llamamiento'));
  assert.ok(!v.html.includes('~'), 'la vista previa no lleva la llave de nadie');
  assert.strictEqual(w.correos.length, 0);
  w.falla('mando', () => w.do('previaCorreo', { guerra: id }));
});

prueba('borrar una guerra publicada: desaparece de crónicas, escalafón y grados', () => {
  const w = mundo(17);
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 4), plan: { extras: { desfile: false } } });
  const g = declarar(w, id);
  NOMBRES.slice(0, 4).forEach((n) => votarTodo(w, g, n));
  w.pasa(60000);
  w.do('estado', { token: g.tok['María'] });
  w.mando('publicar', { guerra: id });
  assert.strictEqual(w.do('cronicas', { token: g.tok['María'] }).guerras.length, 1);
  const { id: id2 } = w.mando('contraofensiva', { guerra: id });
  w.mando('borrarGuerra', { guerra: id });
  assert.deepStrictEqual(w.mando('cuartel', {}).guerras.map((x) => x.id), [id2]);
  w.falla('noexiste', () => w.do('estado', { token: g.tok['María'] }));
  const g2 = declarar(w, id2);
  assert.ok(g2.doc.gente.every((x) => x.grado === 0), 'la guerra borrada ya no asciende a nadie');
  assert.strictEqual(w.do('cronicas', { token: g2.tok['María'] }).guerras.length, 0);
  assert.ok(w.registro.some((f) => f[3] === 'borrar'));
});

prueba('orden de movilización: un correo por combatiente con su enlace personal', () => {
  const w = mundo(4);
  const id = crearGuerra(w, { plan: { correo: { asunto: '¡A las armas!', apertura: 'Ha llegado la hora.', remate: 'Suerte.' } } });
  const g = declarar(w, id);
  assert.strictEqual(w.correos.length, 10);
  const c = w.correos.find((m) => m.para === 'maria@ejemplo.test');
  assert.strictEqual(c.asunto, '¡A las armas!');
  assert.strictEqual(c.nombre, 'Fran');
  assert.ok(c.html.includes('https://ejemplo.test/guerra/#t=' + g.tok['María']));
  assert.ok(c.html.includes('Las 9 ofensivas') && c.html.includes('36 batallas'));
  assert.ok(c.html.includes('Ha llegado la hora.') && c.html.includes('Suerte.') && c.html.includes('María, la patria te reclama.'));
  assert.strictEqual(new Set(Object.values(g.tok)).size, 10);
  assert.ok(c.html.includes('Así es esta guerra'), 'sin llamamiento, la orden explica el juego');
});

prueba('votar: no en combates propios, sin repetir, con retirada sólo en los 10 segundos', () => {
  const w = mundo(5);
  const g = declarar(w, crearGuerra(w));
  const est = w.do('estado', { token: g.tok['Javier'] });
  assert.strictEqual(est.batallas.length, 45);
  assert.strictEqual(est.batallas.filter((b) => b.mia).length, 36);
  assert.strictEqual(est.progreso.total, 360);
  assert.strictEqual(est.guerra.ofensivas, 9);
  assert.ok(!est.mando && !JSON.stringify(est).includes('@'), 'un combatiente no ve correos ni datos del mando');
  const propia = est.batallas.find((b) => !b.mia), ajena = est.batallas.filter((b) => b.mia);
  w.falla('propia', () => w.do('votar', { token: g.tok['Javier'], batalla: propia.id, elegido: propia.a }));
  w.falla('voto', () => w.do('votar', { token: g.tok['Javier'], batalla: ajena[0].id, elegido: g.id['Javier'] }));
  w.do('votar', { token: g.tok['Javier'], batalla: ajena[0].id, elegido: ajena[0].a, proclama: '  Porque sí.  ' });
  w.do('votar', { token: g.tok['Javier'], batalla: ajena[0].id, elegido: ajena[0].a });          // reintento idéntico: inocuo
  w.falla('repetido', () => w.do('votar', { token: g.tok['Javier'], batalla: ajena[0].id, elegido: ajena[0].b }));
  w.pasa(8000);
  assert.strictEqual(w.do('retirar', { token: g.tok['Javier'], batalla: ajena[0].id }).faltan, 36);
  w.do('votar', { token: g.tok['Javier'], batalla: ajena[0].id, elegido: ajena[0].b });
  w.pasa(15000);
  w.falla('tarde', () => w.do('retirar', { token: g.tok['Javier'], batalla: ajena[0].id }));
  const est2 = w.do('estado', { token: g.tok['Javier'] });
  assert.strictEqual(est2.batallas.find((b) => b.id === ajena[0].id).voto, ajena[0].b);
  assert.strictEqual(est2.progreso.emitidos, 1);
  assert.strictEqual(est2.progreso.rezagados.find((r) => r.id === g.id['Javier']).faltan, 35);
  // El voto de Javier no aparece en el estado de otro combatiente.
  const otro = JSON.stringify(w.do('estado', { token: g.tok['María'] }));
  assert.ok(!otro.includes('Porque sí'));
  // Sondeo barato: con la misma revisión no se reenvía nada.
  const rev = w.do('estado', { token: g.tok['Javier'] }).rev;
  assert.strictEqual(w.do('estado', { token: g.tok['Javier'], rev }).igual, true);
});

prueba('guerra completa: porra, parte, armisticio con expulsión e indulto, informe, espía, desfile y crónicas', () => {
  const w = mundo(6);
  const id = crearGuerra(w);
  const g = declarar(w, id);
  // La porra no se abre hasta terminar los votos.
  w.falla('porra', () => w.do('porra', { token: g.tok['María'], orden: g.doc.gente.map((x) => x.id) }));
  // Votan todos menos Paco (nada) y Lola (se deja 4). Javier lleva la contraria a menudo.
  const rebelde = (b, a, bb) => { const fa = NOMBRES.indexOf(a), fb = NOMBRES.indexOf(bb); return (b.id % 3 === 0) === (fa < fb) ? b.b : b.a; };
  NOMBRES.filter((n) => n !== 'Paco' && n !== 'Lola').forEach((n) => { votarTodo(w, g, n, n === 'Javier' ? rebelde : null); w.pasa(3600000); });
  assert.ok(w.doc(id).parte, 'el parte de mitad de contienda está listo');
  votarTodo(w, g, 'Lola', null, 32);
  let est = w.do('estado', { token: g.tok['Fran'], mando: 'clave-mando' });
  assert.deepStrictEqual(est.progreso.rezagados.map((r) => g.nombre[r.id] + ':' + r.faltan), ['Paco:36', 'Lola:4']);
  assert.strictEqual(est.progreso.emitidos, 8 * 36 + 32);
  assert.ok(est.mando && est.mando.general, 'el alto mando recibe su panel');
  assert.strictEqual(est.guerra.fase, 'abierta');
  // Porras: orden real esperado para María; al revés para Rafa.
  const orden = NOMBRES.map((n) => g.id[n]);
  w.do('porra', { token: g.tok['María'], orden });
  w.do('porra', { token: g.tok['Rafa'], orden: orden.slice().reverse() });
  w.falla('porra', () => w.do('porra', { token: g.tok['Lola'], orden }));
  w.falla('porra', () => w.do('porra', { token: g.tok['Elena'], orden: orden.slice(1) }));
  // Radio Macuto: la pulla espera en censura y sólo el alto mando ve de quién es.
  w.do('pulla', { token: g.tok['Rafa'], texto: 'Que alguien despierte a Paco.' });
  assert.strictEqual(w.do('estado', { token: g.tok['Rafa'] }).radio.enCensura, 1);
  const avisoPulla = w.correos[w.correos.length - 1];
  assert.ok(avisoPulla.para === 'fran@ejemplo.test' && /pulla de Rafa/.test(avisoPulla.asunto) && avisoPulla.html.includes('despierte a Paco'));
  assert.strictEqual(w.do('estado', { token: g.tok['María'] }).radio.antena.length, 0);
  est = w.do('estado', { token: g.tok['Fran'], mando: 'clave-mando' });
  assert.strictEqual(est.mando.pullas[0].de, g.id['Rafa']);
  w.mando('moderar', { guerra: id, id: est.mando.pullas[0].id, emitir: true });
  const antena = w.do('estado', { token: g.tok['María'] }).radio.antena;
  assert.strictEqual(antena.length, 1);
  assert.ok(!('de' in antena[0]), 'en antena no sale el autor');
  // Toque de diana manual: a los dos rezagados.
  const antes = w.correos.length;
  w.mando('guardarPlan', { guerra: id, plan: { firma: 'Francisco M. Romero' } });
  assert.strictEqual(w.mando('tocarDiana', { guerra: id }).enviados, 2);
  const toque = w.correos.slice(antes).find((m) => m.para === 'paco@ejemplo.test');
  assert.ok(/toque de diana, te quedan 36 batallas/.test(toque.asunto) && toque.html.includes('Lola (4)') && toque.html.includes('Paco, el enemigo sigue esperando: te quedan 36 batallas.') && toque.nombre === 'Francisco M. Romero');
  // Armisticio: hay que decidir sobre todos los rezagados.
  w.falla('mando', () => w.do('armisticio', { token: g.tok['María'], decisiones: {} }));
  w.falla('decision', () => w.mando('armisticio', { guerra: id, decisiones: { [g.id['Paco']]: { accion: 'expulsar' } } }));
  w.falla('fase', () => w.mando('informe', { guerra: id }));
  const arm = w.mando('armisticio', { guerra: id, decisiones: {
    [g.id['Paco']]: { accion: 'expulsar', sentencia: 'Condenado a pelar patatas.' }, [g.id['Lola']]: { accion: 'indultar' } } });
  assert.deepStrictEqual(arm, { contendientes: 9, batallas: 36 });
  w.falla('fase', () => w.do('votar', { token: g.tok['Lola'], batalla: 1, elegido: g.id['María'] }));

  // Informe clasificado.
  const inf = w.mando('informe', { guerra: id });
  const t = inf.resultado.tabla;
  assert.strictEqual(t.length, 9);
  assert.deepStrictEqual(t.map((f) => f.pos), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.strictEqual(g.nombre[t[0].id], 'María');
  assert.strictEqual(g.nombre[t[8].id], 'Nuria');
  t.forEach((f) => { assert.strictEqual(f.g + f.e + f.p, 8); assert.strictEqual(f.pts, 3 * f.g + f.e); assert.strictEqual(f.dif, f.vf - f.vc); });
  assert.strictEqual(t.reduce((s, f) => s + f.g, 0), t.reduce((s, f) => s + f.p, 0));
  assert.strictEqual(t.reduce((s, f) => s + f.dif, 0), 0);
  for (let i = 1; i < t.length; i++) assert.ok(t[i - 1].pts > t[i].pts || (t[i - 1].pts === t[i].pts && t[i - 1].dif >= t[i].dif));
  assert.strictEqual(inf.resultado.batallas.length, 36);
  const votosTotales = inf.resultado.batallas.reduce((s, b) => s + b.va + b.vb, 0);
  assert.strictEqual(votosTotales, 8 * 28 + (28 - inf.resultado.indultados[0].faltaban), 'cada batalla sólo cuenta votos de quienes siguen en la guerra');
  assert.strictEqual(g.nombre[inf.resultado.desertores[0].id], 'Paco');
  assert.strictEqual(inf.resultado.desertores[0].sentencia, 'Condenado a pelar patatas.');
  assert.ok(!inf.resultado.batallas.some((b) => b.a === g.id['Paco'] || b.b === g.id['Paco']));
  assert.ok(inf.votos.every((v) => !v.a.includes(g.id['Paco']) && !v.b.includes(g.id['Paco'])));
  assert.strictEqual(g.nombre[inf.resultado.premios.rebelde.id], 'Javier');
  assert.strictEqual(g.nombre[inf.resultado.premios.tardon.id], 'Lola');
  assert.strictEqual(inf.resultado.premios.tardon.motivo, 'indulto');
  assert.ok(inf.resultado.premios.borrego && inf.resultado.premios.borrego.id !== inf.resultado.premios.rebelde.id);
  assert.strictEqual(g.nombre[inf.resultado.porra.gana[0]], 'María');
  assert.ok(inf.resultado.porra.lista[0].suma < inf.resultado.porra.lista[1].suma);
  const af = inf.resultado.afinidad[g.id['María']];
  assert.ok(af && af.companero.de === 21 && af.enemigo.n <= af.companero.n);
  assert.strictEqual(g.nombre[af.enemigo.id], 'Javier');

  // Alto el fuego: nadie ve resultados; cada uno tiene un espía.
  est = w.do('estado', { token: g.tok['Elena'] });
  assert.strictEqual(est.guerra.fase, 'terminada');
  assert.ok(!est.resultado && !est.desfile);
  assert.ok(!JSON.stringify(est).includes('"va"'), 'antes del desfile no viajan recuentos');
  const una = est.batallas[0];
  const esp = w.do('espiar', { token: g.tok['Elena'], batalla: una.id });
  assert.ok([una.a, una.b, 'empate'].includes(esp.gana));
  w.falla('gastado', () => w.do('espiar', { token: g.tok['Elena'], batalla: est.batallas[1].id }));
  assert.strictEqual(w.do('estado', { token: g.tok['Elena'] }).espia.usado.gana, esp.gana);
  // Quien no hizo la porra aún puede hacerla una vez, salvo que ya haya espiado.
  w.falla('porra', () => w.do('porra', { token: g.tok['Elena'], orden: orden.filter((x) => x !== g.id['Paco']) }));
  w.do('porra', { token: g.tok['Carmen'], orden: orden.filter((x) => x !== g.id['Paco']) });
  w.falla('porra', () => w.do('porra', { token: g.tok['Carmen'], orden: orden.filter((x) => x !== g.id['Paco']) }));

  // Proclamas con estrella para el desfile.
  const b0 = w.doc(id).batallas.find((b) => b.a !== g.id['Paco'] && b.b !== g.id['Paco'] && b.a !== g.id['Elena'] && b.b !== g.id['Elena']);
  w.falla('noexiste', () => w.mando('estrella', { guerra: id, batalla: b0.id, de: g.id['Elena'], si: true }));

  // Desfile.
  w.falla('mando', () => w.do('desfile', { token: g.tok['María'], orden: 'empezar' }));
  w.mando('desfile', { guerra: id, orden: 'empezar' });
  const tipos = [];
  let v;
  for (;;) {
    v = w.do('estado', { token: g.tok['Rafa'] }).desfile;
    tipos.push(v.actual.t + (v.actual.pos || v.actual.cual || ''));
    if (v.ultimo) break;
    // En cada paso, el público sólo conoce los puestos ya revelados.
    const reveladosIds = v.revelados.map((r) => r.id);
    if (v.actual.t === 'finalistas') { assert.strictEqual(v.actual.entre.length, 2); assert.ok(!reveladosIds.includes(t[1].id), 'el 2.º puesto no se desvela antes que el campeón'); }
    assert.ok(!reveladosIds.includes(t[0].id), 'el campeón no se filtra antes de tiempo');
    w.mando('desfile', { guerra: id, orden: 'siguiente' });
  }
  assert.deepStrictEqual(tipos, ['consejo', 'puesto9', 'puesto8', 'puesto7', 'puesto6', 'puesto5', 'puesto4',
    'condecoracionrebelde', 'condecoracionborrego', 'condecoraciontardon', 'puesto3', 'finalistas', 'campeon']);
  assert.strictEqual(v.revelados.length, 9);
  assert.strictEqual(v.actual.fila.id, t[0].id);
  assert.strictEqual(g.nombre[v.actual.porra.gana[0]], 'María');
  assert.strictEqual(v.porra[0].suma, inf.resultado.porra.lista[0].suma, 'la porra en directo acaba igual que la final');
  w.falla('fin', () => w.mando('desfile', { guerra: id, orden: 'siguiente' }));
  w.mando('desfile', { guerra: id, orden: 'terminar' });

  // Publicada: todos ven el parte, pero no quién votó a quién.
  est = w.do('estado', { token: g.tok['Rafa'] });
  assert.strictEqual(est.guerra.fase, 'publicada');
  assert.strictEqual(est.resultado.tabla.length, 9);
  assert.ok(est.mia.afinidad.companero);
  assert.ok(!JSON.stringify(est).includes('"votos":[{'), 'el detalle de votos no llega a los combatientes');

  // Crónicas y grados: todos ascienden menos el desertor.
  const cr = w.do('cronicas', { token: g.tok['Rafa'] });
  assert.strictEqual(cr.guerras.length, 1);
  assert.strictEqual(cr.guerras[0].campeon, t[0].id);
  const personaPaco = cr.guerras[0].gente.find((x) => x.nombre === 'Paco');
  assert.ok(personaPaco.desertor && !cr.grados[personaPaco.persona]);
  assert.strictEqual(cr.grados[cr.persona], 1);
  assert.strictEqual(cr.series[0].ediciones, 1);
  assert.strictEqual(cr.series[0].filas[0].nombre, 'María');
  assert.strictEqual(cr.series[0].filas.find((f) => f.nombre === 'Paco').des, 1);

  // Contraofensiva: misma gente, y los grados se ven en la nueva guerra.
  const { id: id2 } = w.mando('contraofensiva', { guerra: id });
  const g2 = declarar(w, id2);
  assert.strictEqual(g2.doc.gente.length, 10);
  assert.strictEqual(g2.doc.gente.find((x) => x.nombre === 'María').grado, 1);
  assert.strictEqual(g2.doc.gente.find((x) => x.nombre === 'Paco').grado, 0);
  assert.strictEqual(w.mando('cuartel', {}).guerras.length, 2);
});

prueba('fin automático: la guerra acaba sola pasada la cortesía del último voto, y el último aún puede hacer la porra', () => {
  const w = mundo(7);
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 5) });
  const g = declarar(w, id);
  NOMBRES.slice(0, 5).forEach((n) => votarTodo(w, g, n));
  w.t -= 1000;   // el último voto es de «ahora mismo»
  assert.strictEqual(w.do('estado', { token: g.tok['María'] }).guerra.fase, 'abierta', 'durante la cortesía sigue abierta');
  w.pasa(20000);
  const est = w.do('estado', { token: g.tok['Javier'] });
  assert.strictEqual(est.guerra.fase, 'terminada');
  assert.strictEqual(est.porra.abierta, true);
  w.do('porra', { token: g.tok['Javier'], orden: g.doc.gente.map((x) => x.id) });
  assert.strictEqual(w.do('estado', { token: g.tok['Javier'] }).porra.abierta, false);
});

prueba('empate a puntos en cabeza: duelo final en directo durante el desfile', () => {
  const w = mundo(8);
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 5), plan: { extras: { condecoraciones: false } } });
  const g = declarar(w, id);
  // María y Andrés ganan a todos los demás y empatan su combate directo (votan 3: Carmen, Fran, Javier → forzamos 1-1 con abstención imposible, así que usamos 4 jugadores votando 2-... )
  // Con 5 jugadores cada batalla tiene 3 votos: no hay empates de batalla. Hacemos que María gane a Andrés pero pierda con Carmen, y Andrés gane a Carmen.
  const elegir = (b, a, bb) => {
    const par = [a, bb].sort().join('-');
    if (par === 'Andrés-María') return a === 'María' ? b.a : b.b;
    if (par === 'Carmen-María') return a === 'Carmen' ? b.a : b.b;
    if (par === 'Andrés-Carmen') return a === 'Andrés' ? b.a : b.b;
    return NOMBRES.indexOf(a) < NOMBRES.indexOf(bb) ? b.a : b.b;
  };
  NOMBRES.slice(0, 5).forEach((n) => votarTodo(w, g, n, elegir));
  w.pasa(60000);
  w.do('estado', { token: g.tok['Fran'] });
  const inf = w.mando('informe', { guerra: id });
  assert.deepStrictEqual(inf.resultado.empate.map((x) => g.nombre[x]).sort(), ['Andrés', 'Carmen', 'María']);
  assert.ok(inf.resultado.tabla.slice(0, 3).every((f) => f.pts === 9));
  w.mando('desfile', { guerra: id, orden: 'empezar' });
  const tipos = [];
  let v = w.do('estado', { token: g.tok['Fran'] }).desfile;
  while (v.actual.t !== 'duelo') { tipos.push(v.actual.t + (v.actual.pos || '')); w.mando('desfile', { guerra: id, orden: 'siguiente' }); v = w.do('estado', { token: g.tok['Fran'] }).desfile; }
  assert.deepStrictEqual(tipos, ['puesto5', 'puesto4']);
  assert.strictEqual(v.actual.duelo.deben, 2);
  assert.strictEqual(v.actual.duelo.puedo, true);
  assert.strictEqual(v.revelados.length, 2, 'los empatados no se revelan antes del duelo');
  w.falla('voto', () => w.do('votarDuelo', { token: g.tok['María'], elegido: g.id['María'] }));
  w.do('votarDuelo', { token: g.tok['Fran'], elegido: g.id['Carmen'] });
  w.falla('repetido', () => w.do('votarDuelo', { token: g.tok['Fran'], elegido: g.id['María'] }));
  w.do('votarDuelo', { token: g.tok['Javier'], elegido: g.id['Carmen'] });
  v = w.do('estado', { token: g.tok['Fran'] }).desfile;
  assert.strictEqual(v.actual.duelo.ganador, null, 'el ganador no se canta en la pantalla del duelo');
  const resto = [];
  for (;;) { w.mando('desfile', { guerra: id, orden: 'siguiente' }); v = w.do('estado', { token: g.tok['Fran'] }).desfile; resto.push(v.actual.t + (v.actual.pos || '')); if (v.ultimo) break; }
  assert.deepStrictEqual(resto, ['puesto3', 'finalistas', 'campeon']);
  assert.strictEqual(g.nombre[v.actual.fila.id], 'Carmen');
  w.mando('desfile', { guerra: id, orden: 'terminar' });
  const cr = w.do('cronicas', { token: g.tok['Fran'] });
  assert.strictEqual(g.nombre[cr.guerras[0].campeon], 'Carmen');
});

prueba('duelo con reloj: si nadie avanza, se cierra solo al agotarse el minuto', () => {
  const w = mundo(9);
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 4), plan: { extras: { condecoraciones: false } } });
  const g = declarar(w, id);
  // Con 4 jugadores cada batalla tiene 2 votos. Empate total: todas las batallas 1-1.
  let alterna = 0;
  NOMBRES.slice(0, 4).forEach((n) => votarTodo(w, g, n, (b) => (alterna++ % 2 ? b.a : b.b)));
  w.pasa(60000);
  w.do('estado', { token: g.tok['María'] });
  w.mando('desfile', { guerra: id, orden: 'empezar' });
  let v = w.do('estado', { token: g.tok['María'] }).desfile;
  assert.ok(v.actual.t === 'duelo' || v.actual.t === 'puesto');
  while (v.actual.t !== 'duelo') { w.mando('desfile', { guerra: id, orden: 'siguiente' }); v = w.do('estado', { token: g.tok['María'] }).desfile; }
  assert.ok(v.actual.duelo.cierra > w.t);
  w.pasa(61000);
  v = w.do('estado', { token: g.tok['María'] }).desfile;
  assert.ok(v.actual.duelo.cerrado, 'el reloj cierra el duelo');
  assert.strictEqual(v.pasos, w.doc(id).desfile.pasos.length);
  assert.strictEqual(w.doc(id).desfile.pasos[w.doc(id).desfile.pasos.length - 1].t, 'campeon');
});

prueba('sin desfile: se publica de golpe y el duelo final se vota después, sin reloj', () => {
  const w = mundo(10);
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 5), plan: { extras: { desfile: false } } });
  const g = declarar(w, id);
  const elegir = (b, a, bb) => {
    const par = [a, bb].sort().join('-');
    if (par === 'Andrés-María') return a === 'María' ? b.a : b.b;
    if (par === 'Carmen-María') return a === 'Carmen' ? b.a : b.b;
    if (par === 'Andrés-Carmen') return a === 'Andrés' ? b.a : b.b;
    return NOMBRES.indexOf(a) < NOMBRES.indexOf(bb) ? b.a : b.b;
  };
  NOMBRES.slice(0, 5).forEach((n) => votarTodo(w, g, n, elegir));
  w.pasa(60000);
  w.do('estado', { token: g.tok['Fran'] });
  w.falla('extra', () => w.mando('desfile', { guerra: id, orden: 'empezar' }));
  w.mando('publicar', { guerra: id });
  let est = w.do('estado', { token: g.tok['Fran'] });
  assert.strictEqual(est.guerra.fase, 'publicada');
  assert.ok(est.duelo && !est.duelo.cerrado && est.duelo.cierra === null && est.duelo.puedo);
  assert.strictEqual(w.do('cronicas', { token: g.tok['Fran'] }).guerras[0].campeon, null);
  w.do('votarDuelo', { token: g.tok['Fran'], elegido: g.id['Andrés'] });
  w.do('votarDuelo', { token: g.tok['Javier'], elegido: g.id['Andrés'] });
  est = w.do('estado', { token: g.tok['María'] });
  assert.ok(est.duelo.cerrado);
  assert.strictEqual(g.nombre[est.resultado.tabla[0].id], 'Andrés');
  assert.strictEqual(g.nombre[w.do('cronicas', { token: g.tok['Fran'] }).guerras[0].campeon], 'Andrés');
});

prueba('puntuación por votos: 3 puntos por voto recibido', () => {
  const w = mundo(11);
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 6), plan: { puntuacion: 'votos' } });
  const g = declarar(w, id);
  NOMBRES.slice(0, 6).forEach((n) => votarTodo(w, g, n));
  w.pasa(60000);
  w.do('estado', { token: g.tok['Fran'] });
  const t = w.mando('informe', { guerra: id }).resultado.tabla;
  t.forEach((f) => { assert.strictEqual(f.pts, 3 * f.vf); assert.strictEqual(f.liga, 3 * f.g + f.e); });
  assert.strictEqual(g.nombre[t[0].id], 'María');
});

prueba('guerra de «otra cosa»: los votantes no compiten y votan todas las batallas', () => {
  const w = mundo(12);
  const cosas = ['Boda de Ana', 'Boda de Luis', 'Boda de Eva', 'Boda de Pepe'].map((n) => ({ nombre: n, combate: true }));
  const votan = NOMBRES.slice(0, 3).map((n, i) => ({ nombre: n, correo: 'v' + i + '@ejemplo.test', mando: i === 0 }));
  const id = crearGuerra(w, { plan: { nombre: 'Guerra de la mejor boda', pregunta: '¿Qué boda fue mejor?', modo: 'cosas', gente: cosas.concat(votan) } });
  const g = declarar(w, id);
  assert.strictEqual(g.r.batallas, 6);
  assert.strictEqual(w.correos.length, 3);
  const est = w.do('estado', { token: g.tok['María'] });
  assert.strictEqual(est.batallas.filter((b) => b.mia).length, 6);
  assert.strictEqual(est.progreso.total, 18);
  assert.ok(est.guerra.ordenanzas.every((o) => !/propios combates/.test(o.x)));
  NOMBRES.slice(0, 3).forEach((n) => votarTodo(w, g, n));
  w.pasa(60000);
  w.do('estado', { token: g.tok['María'] });
  const r = w.mando('informe', { guerra: id }).resultado;
  assert.strictEqual(r.tabla.length, 4);
  assert.strictEqual(g.nombre[r.tabla[0].id], 'Boda de Ana');
});

prueba('toque de diana automático: sólo de día y cuando toca', () => {
  const w = mundo(13);
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 4), plan: { diana: { activa: true, cadaDias: 2, frases: ['{nombre}: quedan {faltan}.'] } } });
  declarar(w, id);
  const n0 = w.correos.length;
  w.pasa(86400000); w.motor.reloj();
  assert.strictEqual(w.correos.length, n0, 'al día siguiente aún no toca');
  w.pasa(86400000); w.hora = 3; w.motor.reloj();
  assert.strictEqual(w.correos.length, n0, 'de madrugada no se toca diana');
  w.hora = 11; w.motor.reloj();
  assert.strictEqual(w.correos.length, n0 + 4);
  assert.ok(w.correos[w.correos.length - 1].html.includes(': quedan 3.'));
  w.motor.reloj();
  assert.strictEqual(w.correos.length, n0 + 4, 'no repite hasta dentro de dos días');
});

prueba('una ofensiva al día: se abren a las 9:00, con aviso diario, y al final llega el alto el fuego', () => {
  const w = mundo(18);     // el mundo arranca a las 17:00
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 4), plan: { ritmo: 'diaria', campo: 'Compañeros de trabajo', desfileInfo: 'Sábado a las 21:00', diana: { activa: false } } });
  const g = declarar(w, id);
  assert.ok(w.correos[0].html.includes('una nueva cada mañana a las 9:00') && w.correos[0].html.includes('Compañeros de trabajo'));
  let est = w.do('estado', { token: g.tok['María'] });
  assert.strictEqual(est.guerra.abiertas, 1);
  assert.strictEqual(est.guerra.ofensivas, 3);
  assert.ok(/Una ofensiva al día/.test(est.guerra.ordenanzas[1].t));
  assert.strictEqual(est.guerra.proxima - w.t, 16 * 3600000, 'la siguiente, mañana a las 9:00');
  const de = (of) => est.batallas.filter((b) => b.mia && b.of === of);
  w.falla('cerrada', () => w.do('votar', { token: g.tok['María'], batalla: de(2)[0].id, elegido: de(2)[0].a }));
  w.do('votar', { token: g.tok['María'], batalla: de(1)[0].id, elegido: de(1)[0].a });
  est = w.do('estado', { token: g.tok['María'] });
  assert.ok(!est.progreso.rezagados.some((r) => r.id === g.id['María']), 'quien ha votado lo abierto no es rezagado');
  assert.strictEqual(est.progreso.rezagados.length, 3);
  const n0 = w.correos.length;
  w.pasa(15 * 3600000); w.motor.reloj();
  assert.strictEqual(w.correos.length, n0, 'a las 8:00 aún no hay ofensiva nueva');
  w.pasa(2 * 3600000); w.motor.reloj(); w.motor.reloj();
  const avisos = w.correos.slice(n0);
  assert.strictEqual(avisos.length, 4, 'un aviso por combatiente, una sola vez');
  assert.ok(/se abre la ofensiva 2 de 3/.test(avisos[0].asunto) && avisos[0].html.includes('hay batallas nuevas'));
  assert.strictEqual(w.do('estado', { token: g.tok['María'] }).guerra.abiertas, 2);
  w.pasa(24 * 3600000); w.motor.reloj();
  NOMBRES.slice(0, 4).forEach((n) => votarTodo(w, g, n));
  w.pasa(60000);
  const n1 = w.correos.length;
  w.motor.reloj(); w.motor.reloj();
  const fin = w.correos.slice(n1);
  assert.strictEqual(fin.length, 4);
  assert.ok(/alto el fuego/.test(fin[0].asunto) && fin[0].html.includes('Sábado a las 21:00'));
  // Ensayo privado del desfile: no cambia nada.
  const ens = w.mando('ensayo', { guerra: id });
  assert.ok(ens.vistas.length >= 3 && ['campeon', 'duelo'].includes(ens.vistas[ens.vistas.length - 1].actual.t));
  assert.strictEqual(w.doc(id).fase, 'terminada');
  w.falla('mando', () => w.do('ensayo', { token: g.tok['María'] }));
});

prueba('Radio Macuto: emitir avisando a los combatientes, sin autor', () => {
  const w = mundo(19);
  const id = crearGuerra(w, { nombres: NOMBRES.slice(0, 4) });
  const g = declarar(w, id);
  w.do('pulla', { token: g.tok['María'], texto: 'Andrés vota con los ojos cerrados.' });
  const pl = w.do('estado', { token: g.tok['Fran'], mando: 'clave-mando' }).mando.pullas[0];
  const n0 = w.correos.length;
  assert.strictEqual(w.mando('moderar', { guerra: id, id: pl.id, emitir: true, avisar: true }).avisados, 3);
  const c = w.correos.slice(n0);
  assert.ok(c.every((m) => m.html.includes('ojos cerrados') && !/María/.test(m.html.replace(/María, alguien/, '')) && m.html.includes('&amp;ir=radio')));
  assert.ok(!c.some((m) => m.para === 'fran@ejemplo.test'));
  assert.strictEqual(w.mando('moderar', { guerra: id, id: pl.id, emitir: true, avisar: true }).avisados, 0, 'no se avisa dos veces');
});

prueba('enlaces: reenviar, liberar una carta y correos que fallan', () => {
  const w = mundo(14);
  const plan = { gente: NOMBRES.slice(0, 4).map((n, i) => ({ nombre: n, correo: (i === 1 ? 'falla' : 'ok' + i) + '@ejemplo.test', mando: i === 0 })) };
  const id = crearGuerra(w, { plan });
  const g = declarar(w, id);
  assert.strictEqual(g.r.enviados, 3);
  const panel = w.mando('plan', { guerra: id }).mando.correos;
  assert.ok(panel.find((c) => c.id === g.id['Andrés']).error);
  w.mando('reenviarOrden', { guerra: id, id: g.id['Andrés'], correo: 'andres@ejemplo.test' });
  assert.ok(w.correos.some((m) => m.para === 'andres@ejemplo.test'));
  w.do('estado', { token: g.tok['Carmen'] });
  w.mando('liberarCarta', { guerra: id, id: g.id['Carmen'] });
  w.falla('enlace', () => w.do('estado', { token: g.tok['Carmen'] }));
});

prueba('sello: motor/version.txt coincide con la huella del motor', () => {
  const huella = require('crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname, '..', 'motor', 'motor.js'))).digest('hex');
  assert.strictEqual(fs.readFileSync(path.join(__dirname, '..', 'motor', 'version.txt'), 'utf8').trim(), huella, 'ejecuta: node herramientas/sellar.js');
});

console.log('\n' + pruebas + ' pruebas superadas.');
