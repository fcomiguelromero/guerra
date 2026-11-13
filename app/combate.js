// Pantallas del combatiente: batallas, alto el fuego, desfile, parte final, porra, ordenanzas y Radio Macuto.
import { S, llamar, encolar, refrescar, ahoraServidor, esc, plural, signo, ordinal, enumerar, porId, hace, duracion,
  ico, carta, avatar, nombreDe, marco, cargando, pintar, ir, aviso, registrar, accion, alEntrar, recordar } from './base.js';

const GRACIA = 10000;
const gente = () => porId(S.est.gente);
const yo = () => S.est.yo || {};
const mias = () => S.est.batallas.filter((b) => b.mia);

function cabecera(titulo, extra = '') {
  return `<header class="fila entre" style="align-items:flex-start">
    <div class="col g4 crece"><div class="sobre">${esc(S.est.guerra.nombre)}</div><h1 class="h1">${esc(titulo)}</h1></div>${extra}</header>`;
}

// ---------------------------------------------------------------- conflicto en curso y radio

function rezagados() {
  const lista = S.est.progreso.rezagados.filter((r) => r.id !== yo().id);
  const f = yo().vota ? mias().filter((b) => !b.voto).length : 0;
  if (f > 0 && yo().estado === 'activo') lista.push({ id: yo().id, faltan: f });
  return lista.sort((x, y) => y.faltan - x.faltan);
}
function cajaConflicto(clase) {
  const G = gente(), lista = rezagados();
  const filas = lista.map((r) => `<li class="fila" style="gap:8px">${avatar(G[r.id], '', true)}<span class="col" style="gap:0;min-width:0">
    <span style="font-weight:600;font-size:14px;line-height:1.2">${esc(nombreDe(G[r.id]))}</span><span class="peq t2" style="line-height:1.2">${plural(r.faltan, 'batalla', 'batallas')}</span></span></li>`).join('');
  return `<section class="caja ${clase}" style="gap:8px">
    <div class="fila entre" style="align-items:baseline"><h2 class="h2">Conflicto en curso</h2><span class="peq t2">${lista.length ? 'Rezagados' : ''}</span></div>
    ${lista.length ? `<ul class="${clase === 'solo-movil' ? 'rejilla3' : 'col'}">${filas}</ul>` : '<p class="med t2">Ya ha votado todo el mundo.</p>'}
  </section>`;
}
function ultimaPulla() { const r = S.est.radio; return r && r.antena.length ? '«' + r.antena[0].texto + '»' : 'Silencio en las ondas. Lanza la primera pulla.'; }
function tickerRadio() {
  if (!S.est.radio) return '';
  return `<button class="ticker solo-movil" data-a="ir" data-v="/radio" aria-label="Abrir Radio Macuto"><b><i aria-hidden="true" style="width:6px;height:6px;border-radius:50%;background:#0d0b1a"></i>Radio Macuto</b><span>${esc(ultimaPulla())}</span>${ico('der', 14)}</button>`;
}
function cajaRadio() {
  if (!S.est.radio) return '';
  return `<section class="caja rosa"><div class="fila"><span aria-hidden="true" style="width:8px;height:8px;border-radius:50%;background:#ff6ad5;box-shadow:0 0 0 4px rgba(255,106,213,0.2)"></span>
    <h2 class="h2">Radio Macuto</h2><span class="rosa" style="margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase">En antena</span></div>
    <p class="med t3" style="font-style:italic">${esc(ultimaPulla())}</p><button class="btn linea chico teal" data-a="ir" data-v="/radio">Abrir Radio Macuto</button></section>`;
}
const lateral = () => cajaRadio() + (S.est.guerra.fase === 'abierta' ? cajaConflicto('') : '');

// ---------------------------------------------------------------- batallas (guerra abierta)

function posicion() {
  const m = mias();
  if (S.ui.cursor == null || S.ui.cursor >= m.length) {
    const i = m.findIndex((b) => !b.voto);
    S.ui.cursor = i < 0 ? Math.max(0, m.length - 1) : i;
  }
  return S.ui.cursor;
}
function navegador(lista, i, llevas) {
  const b = lista[i], of = S.est.guerra.ofensivas;
  const enOf = lista.filter((x) => x.of === b.of);
  const tramos = Array.from({ length: of }, (_, k) => {
    const suyas = lista.filter((x) => x.of === k + 1);
    return `<i class="${k + 1 === b.of ? 'ahora' : llevas && suyas.length && suyas.every((x) => x.voto) ? 'hecho' : ''}"></i>`;
  }).join('');
  return `<div class="col" style="gap:6px"><div class="fila entre">
      <button class="cuadro" data-a="mover" data-v="-1" aria-label="Batalla anterior" ${i === 0 ? 'disabled' : ''}>${ico('izq')}</button>
      <div class="col g4" style="align-items:center"><div class="bc" style="font-weight:700;font-size:20px;color:#fff">Ofensiva ${b.of} de ${of}</div>
        <div class="peq t2">Batalla ${enOf.indexOf(b) + 1} de ${enOf.length}${llevas ? ' · ' + llevas : ''}</div></div>
      <button class="cuadro" data-a="mover" data-v="1" aria-label="Batalla siguiente" ${i === lista.length - 1 ? 'disabled' : ''}>${ico('der')}</button>
    </div><div class="tramos" aria-hidden="true">${tramos}</div></div>`;
}
function barraRetirada() {
  const r = S.ui.retirada;
  if (!r || Date.now() >= r.hasta) return '';
  const seg = Math.max(1, Math.ceil((r.hasta - Date.now()) / 1000));
  return `<div class="estado-voto" role="status"><span class="fila">${ico('visto', 16, 'style="color:#5ef0d0"')}Has tomado partido por ${esc(gente()[r.elegido].nombre)}</span>
    <button data-a="retirar" id="retirada">Retirada · ${seg} s</button></div>`;
}
let relojRetirada = null;
function cuentaAtras() {
  clearInterval(relojRetirada);
  relojRetirada = setInterval(() => {
    const r = S.ui.retirada, el = document.getElementById('retirada');
    if (!r || Date.now() >= r.hasta) { clearInterval(relojRetirada); S.ui.retirada = null; pintar(); return; }
    if (el) el.textContent = 'Retirada · ' + Math.max(1, Math.ceil((r.hasta - Date.now()) / 1000)) + ' s';
  }, 250);
}

function pantallaAbierta() {
  const e = S.est, G = gente(), m = mias();
  if (!yo().vota || !m.length) {
    return marco(`${tickerRadio()}${cabecera(e.guerra.pregunta)}<div class="caja"><p>En esta guerra no tienes batallas que votar.</p></div>${cajaConflicto('solo-movil')}`, { lateral: lateral() });
  }
  const hechas = m.filter((b) => b.voto).length;
  if (hechas === m.length && !S.ui.repaso) {
    const faltan = rezagados();
    return marco(`${tickerRadio()}${cabecera(e.guerra.pregunta)}
      <main class="col g12" style="flex:1;justify-content:center">
        <div class="caja teal centro" style="align-items:center;padding:20px 14px">
          <div class="enorme teal" style="font-size:40px">¡Misión cumplida!</div>
          <p class="t3">Has librado tus ${m.length} batallas. ${faltan.length ? 'La guerra sigue en pausa hasta que voten los rezagados.' : 'Ya ha votado todo el mundo: alto el fuego inminente.'}</p>
          ${e.porra ? `<button class="btn ancho" data-a="ir" data-v="/porra">${e.porra.mia ? 'Retocar mi porra' : 'Hacer la porra'}</button>` : ''}
          <button class="btn linea medio ancho" data-a="repaso">Repasar mis votos</button>
        </div>${barraRetirada()}
      </main>${cajaConflicto('solo-movil')}`, { lateral: lateral() });
  }
  const i = posicion(), b = m[i], a = G[b.a], c = G[b.b];
  const votada = b.voto ? `<div class="estado-voto" style="justify-content:center;padding:0 12px"><span class="fila">${ico('visto', 16, 'style="color:#5ef0d0"')}Tomaste partido por ${esc(G[b.voto].nombre)}. No hay vuelta atrás.</span></div>` : `
      ${e.guerra.extras.proclamas ? `<label class="campo"><span>Tu proclama (opcional)</span><input id="proclama" type="text" maxlength="200" data-m="proclama" value="${esc(S.ui.proclama || '')}" placeholder="Se leerá en el desfile, sin tu nombre" autocomplete="off"></label>` : ''}
      <div class="fila" style="gap:10px"><button class="btn crece" data-a="votar" data-v="a">¡Por ${esc(a.nombre)}!</button><button class="btn rosa crece" data-a="votar" data-v="b">¡Por ${esc(c.nombre)}!</button></div>`;
  return marco(`${tickerRadio()}
    <header class="col g4"><div class="sobre solo-movil">${esc(e.guerra.nombre)}</div><h1 class="h1 centrado-pc">${esc(e.guerra.pregunta)}</h1></header>
    ${navegador(m, i, 'llevas ' + hechas + ' de ' + m.length)}
    <main class="col" style="flex:1;justify-content:center;gap:10px">
      <div class="duelo">${carta(a, { clase: b.voto === a.id ? '' : b.voto ? 'gris' : '' })}${carta(c, { clase: 'izq' + (b.voto && b.voto !== c.id ? ' gris' : '') })}<div class="vs" aria-hidden="true">VS</div></div>
      ${votada}${barraRetirada()}
      ${S.ui.repaso ? '<button class="btn linea medio" data-a="repaso">Volver</button>' : ''}
    </main>${cajaConflicto('solo-movil')}`, { lateral: lateral() });
}

accion('mover', (paso) => {
  const lista = S.est.guerra.fase === 'abierta' ? mias() : S.est.batallas;
  const clave = S.est.guerra.fase === 'abierta' ? 'cursor' : 'cursorEspia';
  S.ui[clave] = Math.min(lista.length - 1, Math.max(0, (S.ui[clave] || 0) + Number(paso)));
  S.ui.confirmaEspia = false;
  pintar();
});
accion('repaso', () => { S.ui.repaso = !S.ui.repaso; S.ui.cursor = S.ui.repaso ? 0 : null; pintar(); });
accion('votar', (lado) => {
  const m = mias(), b = m[posicion()];
  if (!b || b.voto) return;
  const elegido = b[lado], proclama = (S.ui.proclama || '').trim();
  b.voto = elegido; b.ts = Date.now();
  S.ui.proclama = '';
  S.ui.retirada = { batalla: b.id, elegido, hasta: Date.now() + GRACIA };
  const sig = m.findIndex((x) => !x.voto);
  S.ui.cursor = sig < 0 ? null : sig;
  pintar(); cuentaAtras();
  encolar(async () => {
    try { await llamar('votar', { batalla: b.id, elegido, proclama }, 2); } catch (err) {
      b.voto = null;
      if (S.ui.retirada && S.ui.retirada.batalla === b.id) S.ui.retirada = null;
      S.ui.cursor = mias().indexOf(b);
      aviso(err.codigo === 'red' ? 'Tu voto no ha llegado al cuartel general. Vuelve a intentarlo.' : err.message);
      if (err.codigo !== 'red') await refrescar(true).catch(() => {});
      pintar();
    }
  });
});
accion('retirar', () => {
  const r = S.ui.retirada;
  if (!r) return;
  const b = mias().find((x) => x.id === r.batalla);
  S.ui.retirada = null;
  encolar(async () => {
    try {
      await llamar('retirar', { batalla: r.batalla });
      b.voto = null;
      S.ui.cursor = mias().indexOf(b);
    } catch (err) { aviso(err.message); }
    pintar();
  });
});

// ---------------------------------------------------------------- alto el fuego y espía (guerra terminada)

function bajas() {
  const e = S.est, G = gente();
  if (!e.bajas) return '';
  const des = e.bajas.desertores.map((id) => G[id].nombre), ind = e.bajas.indultados;
  const frases = [];
  if (des.length) frases.push(`${esc(enumerar(des))} ${des.length === 1 ? 'ha sido expulsado' : 'han sido expulsados'} con deshonor por ${des.length === 1 ? 'desertor' : 'desertores'}: sus combates y sus votos no cuentan.`);
  ind.forEach((x) => frases.push(`Indulto a ${esc(G[x.id].nombre)}: ${plural(x.faltaban, 'voto', 'votos')} sin emitir.`));
  return frases.length ? `<p class="med t2">${frases.join(' ')}</p>` : '';
}
function pantallaTerminada() {
  const e = S.est, G = gente(), puedeEspiar = e.espia && yo().vota;
  let espia = '';
  if (puedeEspiar) {
    const lista = e.batallas, usado = e.espia.usado;
    if (S.ui.cursorEspia == null) S.ui.cursorEspia = usado ? Math.max(0, lista.findIndex((b) => b.id === usado.batalla)) : 0;
    const i = S.ui.cursorEspia, b = lista[i], aqui = usado && usado.batalla === b.id;
    const sello = (id) => !aqui ? {} : usado.gana === 'empate' ? { sello: 'Empate', selloClase: 'teal' } : usado.gana === id ? { sello: 'Gana', selloClase: 'teal' } : { clase: 'gris' };
    const sa = sello(b.a), sb = sello(b.b);
    espia = `${navegador(lista, i, '')}
      <div class="duelo">${carta(G[b.a], sa)}${carta(G[b.b], Object.assign({}, sb, { clase: 'izq ' + (sb.clase || '') }))}<div class="vs" aria-hidden="true">VS</div></div>
      ${usado ? `<div class="estado-voto" style="padding:0 12px"><span><strong class="teal">${usado.gana === 'empate' ? 'Empate' : 'Gana ' + esc(G[usado.gana].nombre)}</strong> en ${esc(G[lista.find((x) => x.id === usado.batalla).a].nombre)} contra ${esc(G[lista.find((x) => x.id === usado.batalla).b].nombre)}. Espía gastado: los puntos, en el desfile.</span></div>`
        : `<button class="btn ${S.ui.confirmaEspia ? 'oro' : ''}" data-a="espiar">${S.ui.confirmaEspia ? '¿Seguro? Sólo tienes un espía · Confirmar' : 'Mandar al espía a este combate'}</button>`}`;
  }
  const porra = e.porra && e.porra.abierta ? `<div class="caja oro"><strong>Aún puedes hacer la porra.</strong><span class="med t2">Sólo un intento${puedeEspiar ? ', y antes de mandar al espía: si espías, la pierdes' : ''}.</span><button class="btn oro medio" data-a="ir" data-v="/porra">Hacer la porra</button></div>` : '';
  return marco(`${tickerRadio()}${cabecera('Alto el fuego')}
    <p class="t3">Ya ha votado todo el mundo. ${puedeEspiar ? 'Antes del desfile puedes mandar al espía a descubrir quién ganó un combate: sólo uno, y sin ver los puntos.' : e.guerra.extras.desfile ? 'El parte de guerra se revelará en el desfile.' : 'El alto mando publicará el parte de guerra.'}</p>
    ${porra}${espia}
    <section class="caja"><h2 class="h2">${e.guerra.extras.desfile ? 'El desfile de la victoria' : 'El parte de guerra'}</h2><p class="med teal">Todos han votado</p>
      <p class="med t3">${esc(e.guerra.desfileInfo || (e.guerra.extras.desfile ? 'El alto mando anunciará el día y la hora.' : 'El alto mando lo publicará en breve.'))}</p></section>
    ${bajas()}`, { lateral: lateral() });
}
accion('espiar', async () => {
  if (!S.ui.confirmaEspia) { S.ui.confirmaEspia = true; pintar(); return; }
  const b = S.est.batallas[S.ui.cursorEspia || 0];
  S.ui.confirmaEspia = false;
  await llamar('espiar', { batalla: b.id });
  await refrescar(true);
  pintar();
});

// ---------------------------------------------------------------- desfile de la victoria

const textoPuntos = (f) => `<span class="teal">${plural(f.pts, 'punto', 'puntos')}</span>`;
const textoBatallas = (f) => `${f.g} de ${f.g + f.e + f.p} batallas`;
const TITULOS = { rebelde: 'El más rebelde', borrego: 'El más borrego', tardon: 'El más tardón' };
function detallePremio(p) {
  if (p.cual === 'rebelde') return `Contra la mayoría en ${p.n} de ${p.de}`;
  if (p.cual === 'borrego') return `Con la mayoría en ${p.n} de ${p.de}`;
  return p.motivo === 'indulto' ? `Indulto con ${plural(p.n, 'voto', 'votos')} sin emitir` : `La última papeleta, a los ${duracion(p.n).replace(/^1 /, 'un ')}`;
}
function listaPremios(lista) {
  const G = gente();
  return `<ul class="col g12">${lista.map((p) => `<li class="caja oro" style="flex-direction:row;align-items:center;gap:12px">${avatar(G[p.id], 'grande')}
    <span class="col g4 crece"><span class="bc oro" style="font-weight:800;font-size:18px">${TITULOS[p.cual]}</span><span style="font-weight:700;font-size:17px">${esc(nombreDe(G[p.id]))}</span><span class="med t2">${detallePremio(p)}</span></span></li>`).join('')}</ul>`;
}
function parteEnVivo(d) {
  const G = gente(), pos = {};
  d.revelados.forEach((f) => { pos[f.pos] = f; });
  const filas = Array.from({ length: d.deContendientes }, (_, k) => {
    const f = pos[k + 1];
    return f ? `<li><b>${k + 1}</b><span>${esc(nombreDe(G[f.id]))}</span><em>${f.pts}</em></li>` : `<li class="oculto"><b>${k + 1}</b><span>Por revelar</span><em>?</em></li>`;
  }).join('');
  const des = S.est.bajas ? S.est.bajas.desertores.map((id) => `<li class="oculto"><b>—</b><span>${esc(G[id].nombre)}</span><em class="rosa" style="font-size:14px">Desertor</em></li>`).join('') : '';
  return `<section class="caja"><h2 class="h2">Parte de guerra</h2><ol class="lista-puestos">${filas}${des}</ol></section>`;
}
function porraEnVivo(d) {
  if (!d.porra.length) return '';
  const G = gente(), mia = d.porra.findIndex((p) => p.id === yo().id), lider = d.porra[0];
  const resumen = mia >= 0 ? `Vas ${ordinal(mia + 1)}, a ${plural(d.porra[mia].suma, 'puesto', 'puestos')}` : 'No hiciste la porra';
  return `<section class="caja"><div class="fila entre"><h2 class="h2">Porra en directo</h2><span class="peq t2">${d.revelados.length} de ${d.deContendientes} revelados</span></div>
    <p class="med solo-movil"><strong>${resumen}</strong> · Manda ${esc(nombreDe(G[lider.id]))}, a ${lider.suma}</p>
    <ol class="lista-puestos solo-pc" style="flex-direction:column">${d.porra.map((p, k) => `<li><b>${k + 1}</b><span>${esc(nombreDe(G[p.id]))}</span><em>${p.suma}</em></li>`).join('')}</ol></section>`;
}
function restante(cierra) {
  const s = Math.max(0, Math.ceil((cierra - ahoraServidor()) / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function bloqueDuelo(du, enVivo) {
  const G = gente(), entre = du.entre.map((id) => G[id]);
  const nombres = enumerar(entre.map((g) => g.nombre));
  let pie;
  if (du.cerrado) pie = `<div class="estado-voto" style="justify-content:center">${du.ganador ? 'Duelo resuelto: gana ' + esc(G[du.ganador].nombre) + '.' : 'Duelo cerrado. El campeón, enseguida.'}</div>`;
  else if (du.mio) pie = `<div class="estado-voto" style="justify-content:center"><span class="fila">${ico('visto', 16, 'style="color:#5ef0d0"')}Has tomado partido por ${esc(G[du.mio].nombre)}</span></div>`;
  else if (du.puedo) pie = `<div class="fila" style="gap:10px;flex-wrap:wrap">${entre.map((g, k) => `<button class="btn crece ${k % 2 ? 'rosa' : ''}" data-a="votarDuelo" data-v="${g.id}">¡Por ${esc(g.nombre)}!</button>`).join('')}</div>`;
  else pie = `<div class="estado-voto" style="justify-content:center">En este duelo no votas: decide el resto.</div>`;
  return `<div class="col g12">
    <div class="col g4 centro"><div class="bc oro" style="font-weight:800;font-size:30px">¡Empate en el primer puesto!</div>
      <p class="t3">${esc(nombres)}, a ${plural(du.puntos, 'punto', 'puntos')}. ${du.puedo ? 'Tú decides.' : 'Decide el resto.'}</p>
      ${du.cierra && !du.cerrado ? `<p class="bc" style="font-weight:700;font-size:22px;color:#fff">Te quedan <span id="reloj-duelo">${restante(du.cierra)}</span></p>` : ''}</div>
    <div class="duelo" style="flex-wrap:wrap;justify-content:center">${entre.map((g, k) => carta(g, { clase: k % 2 ? 'izq' : '' })).join('')}${entre.length === 2 ? '<div class="vs" aria-hidden="true">VS</div>' : ''}</div>
    ${pie}
    <p class="peq t2 centro">Han votado ${du.votaron} de ${du.deben}. ${enVivo ? 'Si no llegas a tiempo, no pasa nada: el desfile sigue.' : 'Se cierra cuando votéis todos.'}</p></div>`;
}
let relojDuelo = null;
function latidoDuelo() {
  clearInterval(relojDuelo);
  relojDuelo = setInterval(() => {
    const el = document.getElementById('reloj-duelo');
    const du = S.est && ((S.est.desfile && S.est.desfile.actual.duelo) || S.est.duelo);
    if (!el || !du || !du.cierra) { clearInterval(relojDuelo); return; }
    el.textContent = restante(du.cierra);
  }, 500);
}
accion('votarDuelo', async (id) => { await llamar('votarDuelo', { elegido: id }, 1); await refrescar(true); pintar(); });

function etiquetaSiguiente(s) {
  if (!s) return 'Terminar el desfile';
  return 'Siguiente: ' + ({ consejo: 'consejo de guerra', proclama: 'una proclama', condecoracion: 'condecoración', duelo: 'el duelo final', campeon: 'el campeón' }[s.t] || ordinal(s.pos) + ' puesto');
}
export { etiquetaSiguiente, bloqueDuelo, listaPremios, detallePremio, TITULOS, textoBatallas };

function pantallaDesfile() {
  const e = S.est, d = e.desfile, a = d.actual, G = gente();
  let centro = '';
  if (a.t === 'consejo') {
    centro = `<div class="col g4 centro"><span class="peq rosa" style="font-weight:600;letter-spacing:.14em;text-transform:uppercase">Acta del consejo · desertor ${a.n} de ${a.de}</span><h2 class="enorme">Consejo de guerra</h2></div>
      ${carta(G[a.id], { clase: 'gris sola', sello: 'Desertor' })}
      <p class="med t3 centro">Cargo: deserción. Dejó ${plural(a.faltaban, 'batalla', 'batallas')} sin librar.</p>
      <div class="col centro"><div class="bc oro" style="font-weight:700;font-size:16px;letter-spacing:.06em">Sentencia</div>
        <blockquote class="cita" style="margin:0">«${esc(a.sentencia || 'Expulsado con deshonor.')}»</blockquote>
        <p><span class="bc oro" style="font-weight:800;font-size:20px">Que conste en acta.</span> <span class="peq t2">Firmado: el alto mando</span></p></div>`;
  } else if (a.t === 'puesto') {
    centro = `<div class="bc oro centro" style="font-weight:800;font-size:32px;letter-spacing:.04em">${ordinal(a.pos)} puesto</div>
      ${carta(G[a.fila.id], { clase: 'sola', pie: `<div class="fila bc" style="padding:0 10px 12px;gap:12px;font-weight:700;font-size:18px">${textoPuntos(a.fila)}<span class="t2">${textoBatallas(a.fila)}</span><span class="t2">${signo(a.fila.dif)}</span></div>` })}`;
  } else if (a.t === 'proclama') {
    centro = `<div class="col g4 centro"><h2 class="enorme" style="font-size:36px">Proclamas anónimas</h2><span class="peq rosa" style="font-weight:600;letter-spacing:.14em;text-transform:uppercase">Proclama anónima · ${a.n} de ${a.de}</span></div>
      <blockquote class="cita" style="margin:0">«${esc(a.texto || '')}»</blockquote>
      <div class="fila" style="justify-content:center;gap:10px">${avatar(G[a.a])}<strong>${esc(G[a.a].nombre)}</strong><span class="t2">contra</span>${avatar(G[a.b], 'rosa')}<strong>${esc(G[a.b].nombre)}</strong></div>
      <p class="med t2 centro">Alguien tomó partido por ${esc(G[a.elegido].nombre)}</p>`;
  } else if (a.t === 'condecoracion') {
    centro = `<div class="col g4 centro"><h2 class="enorme" style="font-size:36px">Condecoraciones</h2><span class="med t2">Calculadas con vuestros votos</span></div>${listaPremios(d.premios)}`;
  } else if (a.t === 'duelo') {
    centro = bloqueDuelo(a.duelo, true);
  } else if (a.t === 'campeon') {
    const f = a.fila, gana = a.porra.gana.map((id) => nombreDe(G[id]));
    centro = `<p class="sobre centro">${esc(e.guerra.pregunta)}</p>
      <div class="enorme oro centro">1.er puesto</div>
      ${carta(G[f.id], { clase: 'sola', pie: `<div class="fila bc" style="padding:0 10px 12px;gap:12px;font-weight:700;font-size:18px">${textoPuntos(f)}<span class="t2">${textoBatallas(f)}</span><span class="t2">${signo(f.dif)}</span></div>` })}
      ${e.guerra.premio ? `<div class="caja oro"><span class="sobre oro">Premio</span><strong>${esc(e.guerra.premio)}</strong></div>` : ''}
      ${gana.length ? `<div class="caja"><span class="sobre">La porra</span><span>${gana.length > 1 ? 'Ganan' : 'Gana'} <strong>${esc(enumerar(gana))}</strong>, a ${plural(a.porra.suma, 'puesto', 'puestos')} del parte final${e.guerra.botin ? ', y se lleva' + (gana.length > 1 ? 'n' : '') + ' ' + esc(e.guerra.botin) : ''}.</span></div>` : ''}`;
  }
  const control = S.mando ? `<div class="fila solo-pc" style="justify-content:flex-end;gap:16px"><span class="med t4">Barra espaciadora o flecha derecha</span>
    <button class="btn claro" data-a="desfile" data-v="${d.ultimo ? 'terminar' : 'siguiente'}">${etiquetaSiguiente(d.siguiente)}</button></div>` : '';
  if (a.t === 'duelo') setTimeout(latidoDuelo, 0);
  return marco(`${cabecera('Desfile de la victoria', '<span class="chapa">En directo</span>')}
    <div class="cols-pc"><main class="col g12" style="justify-content:center">${centro}</main>
    <div class="col g12">${porraEnVivo(d)}${parteEnVivo(d)}</div></div>${control}`, { ancha: true });
}

// ---------------------------------------------------------------- parte de guerra publicado

function tablaFinal(r) {
  const G = gente();
  return `<table class="tabla"><thead><tr><th>#</th><th>Combatiente</th><th>G</th><th>E</th><th>P</th><th>Pts</th><th>Dif.</th></tr></thead><tbody>
    ${r.tabla.map((f) => `<tr class="${f.id === yo().id ? 'yo' : ''}"><td>${f.pos}</td><td>${esc(nombreDe(G[f.id]))}</td><td>${f.g}</td><td>${f.e}</td><td>${f.p}</td><td class="pts">${f.pts}</td><td>${signo(f.dif)}</td></tr>`).join('')}
    ${r.desertores.map((x) => `<tr><td>—</td><td class="t2">${esc(G[x.id].nombre)}</td><td colspan="5" class="rosa" style="font-size:12px">Desertor</td></tr>`).join('')}
  </tbody></table>`;
}
export { tablaFinal };
function pantallaPublicada() {
  const e = S.est, r = e.resultado, G = gente(), campeon = r.tabla[0];
  const duelo = e.duelo && !e.duelo.cerrado;
  if (duelo && e.duelo.cierra) setTimeout(latidoDuelo, 0);
  const mia = e.mia && e.mia.afinidad;
  const gana = r.porra.gana.map((id) => nombreDe(G[id]));
  const premios = ['rebelde', 'borrego', 'tardon'].filter((k) => r.premios[k]).map((k) => Object.assign({ cual: k }, r.premios[k]));
  return marco(`${cabecera(duelo ? 'Duelo final' : 'Parte de guerra')}
    ${duelo ? `<p class="med t3">El resto del parte de guerra ya es oficial: sólo falta decidir quién se lleva la guerra.</p>${bloqueDuelo(e.duelo, false)}`
      : `<div class="cols-pc">${carta(G[campeon.id], { clase: 'sola', pie: `<div class="fila bc" style="padding:0 10px 12px;gap:12px;font-weight:700;font-size:18px">${textoPuntos(campeon)}<span class="t2">${textoBatallas(campeon)}</span><span class="t2">${signo(campeon.dif)}</span></div>` })}
        <div class="col g12"><div class="enorme oro">1.er puesto</div>${e.guerra.premio ? `<div class="caja oro"><span class="sobre oro">Premio</span><strong>${esc(e.guerra.premio)}</strong></div>` : ''}
        ${gana.length ? `<div class="caja"><span class="sobre">La porra</span><span>${gana.length > 1 ? 'Ganan' : 'Gana'} <strong>${esc(enumerar(gana))}</strong>, a ${plural(r.porra.lista[0].suma, 'puesto', 'puestos')} del parte final.</span></div>` : ''}</div></div>`}
    <section class="caja"><h2 class="h2">Parte de guerra</h2>${tablaFinal(r)}</section>
    ${mia ? `<section class="caja"><h2 class="h2">Tu guerra</h2>
      <div class="fila g12">${avatar(G[mia.companero.id], 'grande')}<span class="col g4"><strong>Compañero de trinchera: ${esc(G[mia.companero.id].nombre)}</strong><span class="med t2">Coincidisteis en ${mia.companero.n} de ${mia.companero.de} batallas</span></span></div>
      <div class="fila g12">${avatar(G[mia.enemigo.id], 'grande rosa')}<span class="col g4"><strong>Enemigo íntimo: ${esc(G[mia.enemigo.id].nombre)}</strong><span class="med t2">Sólo coincidisteis en ${mia.enemigo.n} de ${mia.enemigo.de}</span></span></div></section>` : ''}
    ${premios.length ? `<section class="col"><h2 class="h2">Condecoraciones</h2>${listaPremios(premios)}</section>` : ''}
    ${r.proclamas.length ? `<section class="caja"><h2 class="h2">Proclamas anónimas</h2>${r.proclamas.map((p) => `<p class="med"><span class="t2">${esc(G[p.a].nombre)} contra ${esc(G[p.b].nombre)} · a ${esc(G[p.elegido].nombre)}</span><br><em>«${esc(p.texto)}»</em></p>`).join('')}</section>` : ''}`,
    { fondo: 'a', ancha: true });
}

registrar('/batallas', () => {
  if (!S.est) return marco(cargando('Entrando en combate'), { sinNav: true });
  const fase = S.est.guerra.fase;
  if (fase === 'abierta') return pantallaAbierta();
  if (fase === 'terminada') return pantallaTerminada();
  if (fase === 'desfile') return pantallaDesfile();
  if (fase === 'publicada') return pantallaPublicada();
  return marco(`${cabecera('Guerra en preparación')}<div class="caja"><p>El alto mando aún no ha declarado la guerra. Cuando lo haga, te llegará tu orden de movilización por correo.</p></div>`, { sinNav: true });
});

// ---------------------------------------------------------------- porra

function ordenPorra() {
  const e = S.est, vivos = e.gente.filter((g) => g.combate && g.estado !== 'expulsado').map((g) => g.id);
  if (!S.ui.porra || S.ui.porra.length !== vivos.length) {
    const base = e.porra.mia ? e.porra.mia.orden.filter((id) => vivos.indexOf(id) >= 0) : [];
    S.ui.porra = base.concat(vivos.filter((id) => base.indexOf(id) < 0));
  }
  return S.ui.porra;
}
registrar('/porra', () => {
  if (!S.est) return marco(cargando(), { sinNav: true });
  const e = S.est, G = gente(), p = e.porra;
  if (!p) return marco(`${cabecera('La porra')}<div class="caja"><p>En esta guerra no hay porra.</p></div>`, { fondo: 'a' });
  const total = mias().length, hechas = mias().filter((b) => b.voto).length;
  let cuerpo;
  if (p.abierta) {
    const orden = ordenPorra();
    cuerpo = `<span class="chapa teal" style="align-self:flex-start">Desbloqueada: has votado tus ${total} batallas</span>
      <p class="t3">Ordena a los combatientes del primero al último. Gana quien más se acerque al parte final. ${e.guerra.fase === 'abierta' ? 'Se cierra cuando acabe la guerra.' : ''}</p>
      ${e.guerra.botin ? `<div class="caja oro" style="flex-direction:row;gap:8px"><span class="sobre oro">Botín</span><strong>${esc(e.guerra.botin)}</strong></div>` : ''}
      <ol class="col" style="gap:6px">${orden.map((id, k) => `<li class="caja" style="flex-direction:row;align-items:center;padding:6px 8px 6px 12px;gap:10px">
        <b class="bc t2" style="width:22px;font-size:20px">${k + 1}</b>${avatar(G[id])}<span class="crece" style="font-weight:600">${esc(nombreDe(G[id]))}</span>
        <button class="cuadro" data-a="porraMover" data-v="${k}:-1" aria-label="Subir a ${esc(G[id].nombre)}" ${k === 0 ? 'disabled' : ''}>${ico('arriba')}</button>
        <button class="cuadro" data-a="porraMover" data-v="${k}:1" aria-label="Bajar a ${esc(G[id].nombre)}" ${k === orden.length - 1 ? 'disabled' : ''}>${ico('abajo')}</button></li>`).join('')}</ol>
      <button class="btn" data-a="porraEnviar">${p.mia ? 'Guardar la porra' : 'Enviar porra'}</button>
      <p class="peq t2 centro">${e.guerra.fase === 'abierta' ? (p.mia ? 'Porra enviada. Puedes cambiarla hasta que acabe la guerra.' : 'Puedes cambiarla hasta que acabe la guerra.') : 'Sólo tienes un intento: la guerra ya ha acabado.'}</p>`;
  } else if (p.mia) {
    cuerpo = `<p class="t3">Tu porra está entregada y sellada. ${e.guerra.fase === 'publicada' ? '' : 'Se puntuará con el parte final.'}</p>
      <ol class="lista-puestos caja">${p.mia.orden.filter((id) => G[id] && G[id].estado !== 'expulsado').map((id, k) => `<li><b>${k + 1}</b>${avatar(G[id])}<span>${esc(nombreDe(G[id]))}</span></li>`).join('')}</ol>`;
  } else if (e.guerra.fase === 'abierta' && yo().vota) {
    cuerpo = `<div class="caja"><strong>La porra está bajo llave.</strong><p class="med t2">Se desbloquea cuando votes tus ${total} batallas. Llevas ${hechas}.</p>
      <div class="medidor"><i style="width:${total ? Math.round(100 * hechas / total) : 0}%"></i></div><button class="btn medio" data-a="ir" data-v="/batallas">Volver a las batallas</button></div>`;
  } else {
    cuerpo = `<div class="caja"><p>La porra está cerrada y no llegaste a entregar la tuya.</p></div>`;
  }
  return marco(`${cabecera('La porra')}${cuerpo}<p class="peq t2 centro">Porras recibidas: ${p.recibidas} de ${p.de}</p>`, { fondo: 'a' });
});
accion('porraMover', (v) => {
  const [k, d] = v.split(':').map(Number), o = ordenPorra(), j = k + d;
  if (j < 0 || j >= o.length) return;
  const t = o[k]; o[k] = o[j]; o[j] = t;
  pintar();
});
accion('porraEnviar', async () => {
  await llamar('porra', { orden: ordenPorra() });
  await refrescar(true);
  aviso('Porra entregada.', true);
});

// ---------------------------------------------------------------- ordenanzas

registrar('/ordenanzas', () => {
  if (!S.est) return marco(cargando(), { sinNav: true });
  const o = S.est.guerra.ordenanzas;
  return marco(`${cabecera('Ordenanzas')}
    <p class="t3">De todos es de sobra conocido el sistema, pero lo repasaremos para los nuevos reclutas.</p>
    <ol class="col g12">${o.map((r, k) => `<li class="caja"><div class="fila" style="gap:10px"><b class="bc teal" style="font-size:26px;font-weight:800">${k + 1}</b><h2 class="h2">${esc(r.t)}</h2></div>
      ${r.puntos ? '<div class="puntos310"><div><b>3</b>Ganar</div><div><b>1</b>Empatar</div><div><b>0</b>Perder</div></div>' : ''}<p class="med t3" style="white-space:pre-line">${esc(r.x)}</p></li>`).join('')}</ol>
    <p class="bc centro" style="font-weight:800;font-size:22px;color:#fff">¡Sólo puede quedar uno!</p>`, { fondo: 'a' });
});

// ---------------------------------------------------------------- Radio Macuto

registrar('/radio', () => {
  if (!S.est) return marco(cargando(), { sinNav: true });
  const r = S.est.radio;
  if (!r) return marco(`${cabecera('Radio Macuto')}<div class="caja"><p>En esta guerra no hay Radio Macuto.</p></div>`, { fondo: 'a' });
  const abierta = S.est.guerra.fase === 'abierta' || S.est.guerra.fase === 'terminada';
  return marco(`<button class="btn linea chico" style="align-self:flex-start" data-a="ir" data-v="/batallas">${ico('izq', 14)}Batallas</button>
    ${cabecera('Radio Macuto', '<span class="chapa">En antena</span>')}
    <p class="t3">Pullas anónimas desde las trincheras.</p>
    ${abierta && S.est.yo ? `<section class="caja rosa"><label class="campo"><span>Tu pulla</span>
      <textarea id="pulla" maxlength="140" data-m="pulla" data-cuenta="cuenta-pulla" placeholder="Dispara: saldrá en antena sin firma">${esc(S.ui.pulla || '')}</textarea></label>
      <div class="fila entre"><span class="peq t2" id="cuenta-pulla">${(S.ui.pulla || '').length}/140</span><button class="btn rosa medio" data-a="emitir">Emitir</button></div>
      <p class="peq t2">Pasa por la censura del alto mando antes de salir en antena.</p>
      ${r.enCensura ? `<span class="chapa" style="align-self:flex-start">Tienes ${plural(r.enCensura, 'pulla', 'pullas')} en censura</span>` : ''}</section>` : ''}
    <section class="col"><h2 class="h2">Lo último en antena</h2>
      ${r.antena.length ? r.antena.map((p) => `<div class="caja" style="gap:4px"><p style="font-style:italic">«${esc(p.texto)}»</p><span class="peq t2">${hace(p.ts)}</span></div>`).join('') : '<p class="med t2">Silencio en las ondas.</p>'}</section>`, { fondo: 'a' });
});
accion('emitir', async () => {
  const texto = (S.ui.pulla || '').trim();
  if (!texto) return;
  const r = await llamar('pulla', { texto });
  S.ui.pulla = '';
  await refrescar(true);
  aviso(r.emitida ? 'Pulla en antena.' : 'Pulla enviada a la censura.', true);
});

// ---------------------------------------------------------------- crónicas (versión inicial)

alEntrar('/cronicas', async () => { S.ui.cronicas = await llamar('cronicas', {}, 1); pintar(); });
registrar('/cronicas', () => {
  const c = S.ui.cronicas;
  if (!S.est || !c) return marco(cargando('Abriendo las crónicas'), { fondo: 'a' });
  const lista = c.guerras.map((g) => {
    const campeon = g.gente.find((x) => x.id === g.campeon), des = g.gente.filter((x) => x.desertor).length;
    const porra = g.gente.filter((x) => g.porraGana.indexOf(x.id) >= 0).map((x) => x.nombre);
    return `<div class="caja"><div class="fila entre"><h2 class="h2">${esc(g.nombre)}</h2><span class="peq t2">${new Date(g.fecha).toLocaleDateString('es-ES')}</span></div>
      <p class="med"><span class="oro">1.er puesto:</span> ${campeon ? esc(campeon.nombre) : 'pendiente del duelo final'}</p>
      <p class="peq t2">${porra.length ? 'Porra: ' + esc(enumerar(porra)) + ' · ' : ''}${des ? plural(des, 'desertor', 'desertores') : 'Sin desertores'}</p></div>`;
  }).join('');
  return marco(`<header class="col g4"><div class="sobre">Palmarés</div><h1 class="h1">Crónicas</h1></header>
    ${lista || '<div class="caja"><p>Las crónicas se estrenan cuando acabe la primera guerra.</p></div>'}
    <p class="peq t2 centro">Sólo ves las guerras en las que has combatido.</p>`, { fondo: 'a' });
});

// ---------------------------------------------------------------- entrada con el enlace general

alEntrar('/entrada', async () => { S.ui.conv = null; S.ui.conv = await llamar('convocatoria', {}, 1); pintar(); });
registrar('/entrada', () => {
  const c = S.ui.conv;
  if (!c) return marco(cargando('Llamando a filas'), { sinNav: true });
  const fase = c.guerra.fase, G = c.gente, sel = S.ui.carta && G.find((g) => g.id === S.ui.carta);
  if (fase === 'borrador') return marco(`<div class="caja"><p>El alto mando aún está preparando esta guerra.</p></div>`, { sinNav: true, marca: c.guerra.nombre });
  const llamamiento = fase === 'llamamiento';
  const votan = G.filter((g) => g.vota);
  const rejilla = votan.map((g) => {
    const estado = llamamiento ? (g.alistado === true ? 'En filas' : g.alistado === false ? 'Objetor' : 'Pendiente') : (g.ocupada ? 'En su puesto' : '');
    const libre = llamamiento || !g.ocupada;
    return `<button class="caja" style="align-items:center;gap:6px;padding:10px 6px;${sel && sel.id === g.id ? 'border-color:#5ef0d0;' : ''}${libre ? '' : 'opacity:.55;'}" data-a="elegirCarta" data-v="${g.id}" ${libre ? '' : 'disabled'}>
      ${avatarSuelto(g)}<strong style="font-size:14px">${esc(g.nombre)}</strong><span class="peq ${g.alistado === false ? 'rosa' : estado === 'Pendiente' ? 't2' : 'teal'}">${estado || '&nbsp;'}</span></button>`;
  }).join('');
  const enFilas = votan.filter((g) => g.alistado === true).length;
  const desdeCorreo = sel && S.ui.cartaEnlace === sel.id && llamamiento;
  const explicacion = llamamiento ? `<section class="caja"><h2 class="h2">Así es esta guerra</h2>
      <ul class="col" style="gap:10px">${(c.explicacion || []).map((x) => `<li class="fila" style="align-items:flex-start;gap:10px"><span class="teal" style="flex:none;margin-top:1px">${ico('visto', 16)}</span><span class="med t3">${esc(x)}</span></li>`).join('')}</ul>
      <details><summary class="med teal" style="cursor:pointer">Leer las ordenanzas completas</summary>
        <ol class="col" style="margin-top:10px;gap:10px">${c.guerra.ordenanzas.map((r, k) => `<li class="col g4"><strong class="bc" style="font-size:18px;color:#fff">${k + 1}. ${esc(r.t)}</strong><span class="med t3" style="white-space:pre-line">${esc(r.x)}</span></li>`).join('')}</ol></details>
      <p class="med t2">Si te alistas, cuando se declare la guerra te llegará por correo tu orden de movilización, con tu enlace personal para votar.</p></section>` : '';
  const miLlave = sel && S.llaves[S.guerra + ':' + sel.id];
  const bloqueada = sel && sel.alistado != null && !miLlave;
  const pie = !sel ? '' : llamamiento && bloqueada
    ? `<div class="caja" id="respuesta"><span><strong>${esc(sel.nombre)}</strong> ya ha respondido: ${sel.alistado ? '<span class="teal">en filas</span>' : '<span class="rosa">objetor</span>'}.</span>
        <p class="med t2">Si eres ${esc(sel.nombre)} y quieres cambiarlo, o alguien ha respondido por ti, usa el enlace del correo del llamamiento o avisa al alto mando.</p></div>`
    : llamamiento
    ? `<div class="caja teal" id="respuesta"><span>Te has identificado como <strong>${esc(sel.nombre)}</strong>${sel.alistado === true ? ' · <span class="teal">En filas</span>' : sel.alistado === false ? ' · <span class="rosa">Objetor</span>' : ''}</span>
        <div class="fila" style="gap:10px"><button class="btn crece" data-a="alistar" data-v="1">¡Me alisto!</button><button class="btn linea crece" data-a="alistar" data-v="0">No me alisto</button></div>
        <p class="peq t2">Puedes cambiar de opinión hasta que se declare la guerra. Si te alistas, te llegará tu orden de movilización por correo.</p></div>`
    : `<button class="btn" data-a="reclamar">¡Presente! Soy ${esc(sel.nombre)}</button>`;
  return marco(`<header class="col g4"><div class="sobre">${llamamiento ? 'Orden de movilización' : esc(c.guerra.nombre)}</div>
      <h1 class="h1">${llamamiento ? '¡Llamamiento a filas!' : 'Identifícate, soldado'}</h1></header>
    ${llamamiento ? `<p class="t3">Se avecina una guerra. El alto mando prepara la ${esc(c.guerra.nombre)} y estás en la lista de reclutas. ${desdeCorreo ? 'Lee de qué va y responde' : 'Lee de qué va, busca tu carta y responde'}: ¿te alistas?</p>
      ${desdeCorreo ? pie : ''}
      <div class="caja"><span class="sobre">Qué se dirime</span><strong class="bc" style="font-size:24px;color:#fff">${esc(c.guerra.pregunta)}</strong>
        <span class="med t2">Cada batalla se decide con esta pregunta.</span></div>
      ${explicacion}
      <div class="fila entre"><h2 class="h2">Convocados</h2><span class="med teal">${enFilas} de ${votan.length} en filas</span></div>${c.cierre ? `<p class="med t2">Cierre del alistamiento: ${esc(c.cierre)}</p>` : ''}`
      : '<p class="t3">Toca tu carta para entrar en combate.</p>'}
    <div class="rejilla3">${rejilla}</div>${desdeCorreo ? '' : pie}
    ${llamamiento ? `<div class="caja"><span class="med">¿No sales en la lista? Preséntate voluntario</span><div class="fila"><input class="entrada" id="voluntario" data-m="voluntario" maxlength="40" placeholder="Tu nombre" value="${esc(S.ui.voluntario || '')}"><button class="btn medio" data-a="voluntario">Enviar</button></div></div>`
      : '<p class="peq t2">Las cartas «En su puesto» ya tienen dueño en otro móvil. Si la tuya es una de ellas, entra con el enlace de tu orden de movilización: te llegó por correo. ¿Alguien entró con tu carta? Avisa al alto mando.</p>'}
    <p class="bc centro" style="font-weight:800;font-size:20px;color:#fff">¡Sólo puede quedar uno!</p>`, { sinNav: true, fondo: llamamiento ? 'a' : 'b', marca: c.guerra.nombre });
});
function avatarSuelto(g) {
  const foto = g.foto && S.fotos[g.foto];
  return `<span class="avatar grande" aria-hidden="true">${foto ? `<img src="${foto}" alt="">` : esc(g.nombre.charAt(0).toUpperCase())}</span>`;
}
accion('elegirCarta', (id) => {
  S.ui.carta = id; S.ui.cartaEnlace = null;
  pintar();
  const caja = document.getElementById('respuesta');
  if (caja) caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
accion('alistar', async (si) => {
  await llamar('alistar', { id: S.ui.carta, si: si === '1', llave: S.llaves[S.guerra + ':' + S.ui.carta] || undefined });
  recordar();
  S.ui.conv = await llamar('convocatoria', {}, 1);
  aviso(si === '1' ? '¡Alistado! Te llegará la orden de movilización cuando se declare la guerra.' : 'Anotado: no te alistas.', true);
});
accion('voluntario', async () => {
  const nombre = (S.ui.voluntario || '').trim();
  if (!nombre) return;
  await llamar('voluntario', { nombre });
  S.ui.voluntario = '';
  aviso('El alto mando ha recibido tu solicitud.', true);
});
accion('reclamar', async () => {
  const r = await llamar('reclamar', { id: S.ui.carta });
  S.sesiones[S.guerra] = r.token;
  recordar();
  await refrescar(true);
  ir('/batallas', true);
});
