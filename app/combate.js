// Pantallas del combatiente: batallas, alto el fuego, desfile, parte final, porra, ordenanzas y Radio Macuto.
import { botonCartel } from './carteles.js?v=36';
import { botonesCalendario } from './calendario.js?v=36';
import { botonAlbum } from './album.js?v=36';
import { icono, ILU, piezas } from './dibujos.js?v=36';
import { escena } from './monigotes.js?v=36';
import { campoBatalla, campoDescanso } from './fondo-batalla.js?v=36';
import { enfadar } from './caras.js?v=36';
import { frente, filaRezagados, confeti, mapaCampana } from './graficos.js?v=36';
import { nombreRonda, preferencia } from './base.js?v=36';
import { S, tras, llamar, encolar, refrescar, ahoraServidor, esc, tituloGuerra, plural, signo, ordinal, enumerar, porId, hace, duracion,
  ico, carta, avatar, nombreDe, marco, cargando, pintar, ir, aviso, registrar, accion, alEntrar, recordar } from './base.js?v=36';

const GRACIA = 10000;
const gente = () => porId(S.est.gente);
const yo = () => S.est.yo || {};
const mias = () => S.est.batallas.filter((b) => b.mia);
// ---- termómetro y batalla del día
const TERMO = { con: ['teal', 'Vas con la mayoría'], contra: ['rosa', 'Vas contra la mayoría'], empate: ['', 'De momento, empate'], solo: ['', 'Eres el primero en votarla'] };
function lineaTermo(b) {
  if (b.termoEspera) return `<span class="peq t2">El termómetro de la ${nombreDelDia().toLowerCase()} sale cuando apuestes, al final de las batallas.</span>`;
  if (!b.termo) return S.est.guerra.extras.termometro && b.voto ? '<span class="peq t2">El termómetro sale cuando pasen los 10 segundos de cortesía.</span>' : '';
  const [color, texto] = TERMO[b.termo];
  return `<span class="fila termo ${color}">${ico('termo', 16)}<strong>Termómetro:</strong> ${texto}.</span>`;
}
function resumenTermo() {
  const cuenta = (t) => mias().filter((b) => b.termo === t).length;
  const con = cuenta('con'), contra = cuenta('contra'), empate = cuenta('empate'), solo = cuenta('solo');
  if (!S.est.guerra.extras.termometro || con + contra + empate + solo === 0) return '';
  const partes = [con ? `con la mayoría en <strong class="teal">${con}</strong>` : '', contra ? `contra ella en <strong class="rosa">${contra}</strong>` : '',
    empate ? `empatado en <strong>${empate}</strong>` : ''].filter(Boolean);
  return `<p class="med termo-resumen">${ico('termo', 16)} <strong>Termómetro:</strong> ${partes.length ? 'vas ' + enumerar(partes) + '.' : ''}${solo ? ` En ${plural(solo, 'batalla', 'batallas')} aún no ha votado nadie más.` : ''}</p>`;
}
// Con varias preguntas, cada ofensiva tiene la suya, por turnos.
const preguntaDe = (of) => { const l = S.est.guerra.preguntas || [S.est.guerra.pregunta]; return l.length ? l[(of - 1) % l.length] : S.est.guerra.pregunta; };
const nombreDelDia = () => (S.est.guerra.ritmo === 'diaria' ? 'Batalla del día' : 'Batalla estrella');
// Batalla estrella en la que combato yo: no la voto, pero puedo apostar. Tiene su propia tarjeta de combate,
// al final de las batallas del día, con las dos fotos: se apuesta tocando una (como al votar).
function estrellaPropia() {
  const e = S.est, ab = e.guerra.abiertas || e.guerra.ofensivas, id = yo().id;
  if (!e.guerra.extras.apuestas || e.guerra.fase !== 'abierta' || !yo().vota) return null;
  const rec = S.ui.recienApuesta && Date.now() < S.ui.recienApuesta.hasta ? S.ui.recienApuesta.id : null;
  // La batalla del día tiene su propia carta al final: en la tuya, porque no la votas; en las demás, una vez votada.
  return e.batallas.find((b) => b.delDia && b.of <= ab && (b.a === id || b.b === id || b.voto) && (!b.apuesta || b.id === rec)) || null;
}
const saltadas = () => preferencia.leer('estrellasSaltadas', {});
function estrellaPendiente() {
  const b = estrellaPropia();
  return b && !saltadas()[S.est.guerra.id + ':' + b.id] ? b : null;
}
function pantallaEstrella(b) {
  const e = S.est, G = gente(), id = yo().id, mia = b.a === id || b.b === id, rival = G[b.a === id ? b.b : b.a];
  const rec = S.ui.recienApuesta && S.ui.recienApuesta.id === b.id && Date.now() < S.ui.recienApuesta.hasta;
  const opciones = (lado) => {
    const g = G[b[lado]], elegida = b.apuesta === g.id, foto = g.foto && S.fotos[g.foto];
    return Object.assign({ clase: 'dorada ' + (lado === 'b' ? 'izq ' : '') + (rec && !elegida ? 'gris' : ''), capa: enfadar(g.foto, foto, lado === 'a' ? 1 : -1, () => { if (S.ruta === '/batallas') pintar(); }) },
      rec ? (elegida ? { sello: 'Apostado', selloClase: 'teal cae' } : {}) : { votar: lado, accion: 'apostar', valor: b.id + ':' + lado, etiqueta: 'Apostar por ' + (g.id === id ? 'ti' : g.nombre) });
  };
  const tramo = e.guerra.ofensivas > 1 ? ' · ' + (e.guerra.cuadro ? esc(nombreRonda(b.of, e.guerra.ofensivas)) : 'ofensiva ' + b.of) : '';
  return marco(`${campoBatalla()}${tickerRadio()}
    <header class="col g4"><div class="sobre oro centrado-pc">★ ${esc(nombreDelDia())}${tramo} · carta extra</div>
      <h1 class="h1 centrado-pc">${esc(preguntaDe(b.of))}</h1></header>
    <main class="col combate-main" style="gap:10px">
      <div class="aviso-tarjeta-estrella">${mia ? `<b>¡Combates tú, contra ${esc(rival.nombre)}!</b> No la votas, pero puedes apostar quién crees que ganará.`
        : `<b>Ya la votaste.</b> Ahora, la apuesta: ¿quién crees que ganará cuando vote todo el mundo?`}</div>
      ${b.motivo ? `<p class="peq centro" style="color:#fff;margin:0">${esc(b.motivo)}</p>` : ''}
      <div class="duelo anima entra-der" data-anim="estrella:${b.id}">${carta(G[b.a], opciones('a'))}${carta(G[b.b], opciones('b'))}<div class="vs estrella" aria-hidden="true">VS</div></div>
      ${rec ? '' : `<p class="pista-voto">${ico('arriba', 16)}Toca la foto de quien creas que ganará</p>
      <button class="btn linea medio" style="align-self:center" data-a="saltarEstrella" data-v="${b.id}">Ahora no</button>`}
    </main>${cajaConflicto('solo-movil')}`, { lateral: lateral() });
}
// En «Cumplido por hoy», si pasaste de apostar, un botón para volver a la tarjeta.
function botonEstrellaSaltada() {
  const b = estrellaPropia();
  if (!b || !saltadas()[S.est.guerra.id + ':' + b.id]) return '';
  return `<button class="chip-apuesta" style="border-radius:14px" data-a="verEstrella" data-v="${b.id}"><span class="chip-t"><b class="oro">★ ${esc(nombreDelDia())}</b> · ${b.a === yo().id || b.b === yo().id ? 'Combates tú' : 'Carta extra'}: aún puedes apostar ›</span></button>`;
}
accion('saltarEstrella', (bid) => { const m = saltadas(); m[S.est.guerra.id + ':' + bid] = true; preferencia.poner('estrellasSaltadas', m); pintar(); });
accion('verEstrella', (bid) => { const m = saltadas(); delete m[S.est.guerra.id + ':' + bid]; preferencia.poner('estrellasSaltadas', m); pintar(); });
function avisoTermo(id) {
  setTimeout(async () => {
    try {
      await refrescar(true);
      const b = S.est.batallas.find((x) => x.id === id);
      if (b && b.termo) { const G = gente(); aviso(`Termómetro de ${G[b.a].nombre} contra ${G[b.b].nombre}: ${TERMO[b.termo][1].toLowerCase()}.`, true); }
      pintar();
    } catch (e) { /* ya saldrá en el siguiente refresco */ }
  }, GRACIA + 5500);
}
// Con una ofensiva al día, sólo se pueden votar las batallas de las ofensivas ya abiertas.
const votables = () => {
  const g = S.est.guerra, ab = g.abiertas || g.ofensivas;
  // En un torneo sólo se vota la ronda en juego; lo que quedó sin votar en las cerradas, se perdió.
  return mias().filter((b) => (g.cuadro && g.fase === 'abierta' ? b.of === g.cuadro.actual || (b.of < g.cuadro.actual && b.voto) : b.of <= ab));
};
function cuando(ts) {
  const d = new Date(ts), dia = (x) => new Date(x).setHours(0, 0, 0, 0);
  const dias = Math.round((dia(ts) - dia(ahoraServidor())) / 86400000);
  return (dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : 'el ' + d.toLocaleDateString('es-ES', { weekday: 'long' })) + ' a las ' + d.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' });
}

function cabecera(titulo, extra = '') {
  return `<header class="fila entre" style="align-items:flex-start">
    <div class="col g4 crece"><div class="sobre">${esc(tituloGuerra(S.est.guerra))}</div><h1 class="h1">${esc(titulo)}</h1></div>${extra}</header>`;
}

// ---------------------------------------------------------------- conflicto en curso y radio

function rezagados() {
  const lista = S.est.progreso.rezagados.filter((r) => r.id !== yo().id);
  const f = yo().vota ? votables().filter((b) => !b.voto).length : 0;
  if (f > 0 && yo().estado === 'activo') lista.push({ id: yo().id, faltan: f });
  return lista.sort((x, y) => y.faltan - x.faltan);
}
function cajaConflicto(clase) {
  const G = gente(), lista = rezagados();
  const filas = filaRezagados(lista.map((r) => Object.assign({ nombre: nombreDe(G[r.id]) }, r)), (r) => avatar(G[r.id], '', true));
  return `<section class="caja ${clase}" style="gap:8px">
    <div class="fila entre" style="align-items:baseline"><h2 class="h2">Conflicto en curso</h2><span class="peq t2">${lista.length ? 'Rezagados' : ''}</span></div>
    ${lista.length ? `${filas}<p class="peq t2">Encima, las batallas que le faltan a cada uno.</p>` : '<p class="med t2">Ya ha votado todo el mundo.</p>'}
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
  const m = votables();
  if (S.ui.cursor == null || S.ui.cursor >= m.length) {
    const i = m.findIndex((b) => !b.voto);
    S.ui.cursor = i < 0 ? Math.max(0, m.length - 1) : i;
  }
  return S.ui.cursor;
}
function navegador(lista, i, llevas) {
  const b = lista[i], of = S.est.guerra.ofensivas;
  const enOf = lista.filter((x) => x.of === b.of);
  return `<div class="col" style="gap:6px"><div class="fila entre">
      <button class="cuadro" data-a="mover" data-v="-1" aria-label="Batalla anterior" ${i === 0 ? 'disabled' : ''}>${ico('izq')}</button>
      <div class="col g4" style="align-items:center"><div class="bc" style="font-weight:700;font-size:20px;color:#fff">${S.est.guerra.cuadro ? (b.tercero ? 'Por el 3.er puesto' : nombreRonda(b.of, of)) : `Ofensiva ${b.of} de ${of}`}</div>
        <div class="peq t2">Batalla ${enOf.indexOf(b) + 1} de ${enOf.length}${llevas ? ' · ' + llevas : ''}</div></div>
      <button class="cuadro" data-a="mover" data-v="1" aria-label="Batalla siguiente" ${i === lista.length - 1 ? 'disabled' : ''}>${ico('der')}</button>
    </div>${mapaCampana(of, b.of, (k) => { const suyas = lista.filter((x) => x.of === k); return !!llevas && suyas.length > 0 && suyas.every((x) => x.voto); }, (k) => S.est.guerra.cuadro ? nombreRonda(k, of) : 'Ofensiva ' + k)}</div>`;
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
  const v = votables();
  if (!v.length) S.ui.repaso = false;
  const hechas = m.filter((b) => b.voto).length, ab = e.guerra.abiertas || e.guerra.ofensivas;
  const recien = S.ui.recien && Date.now() < S.ui.recien.hasta + 400 ? S.ui.recien : null;
  // Acabadas las batallas del día, la batalla estrella propia (si la hay) tiene su tarjeta antes de «Cumplido por hoy».
  if (v.every((b) => b.voto) && !S.ui.repaso && !recien) { const est = estrellaPendiente(); if (est) return pantallaEstrella(est); }
  if (e.guerra.cuadro && v.every((b) => b.voto) && !S.ui.repaso && !recien) {
    const c = e.guerra.cuadro, ronda = nombreRonda(c.actual, c.R);
    return marco(`${campoDescanso()}${tickerRadio()}${cabecera(e.guerra.pregunta)}${botonEstrellaSaltada()}
      <main class="col g12" style="flex:1;justify-content:center">
        <div class="caja teal centro" style="align-items:center;padding:20px 14px">
          ${escena('trinchera', 'Los dos soldados duermen en la trinchera')}
          <div class="enorme teal" style="font-size:40px">¡${c.actual === c.R ? 'Final votada' : 'Ronda cumplida'}!</div>
          <p class="t3">Has votado ${v.filter((b) => b.of === c.actual).length ? 'todos los cruces de ' + (ronda === 'Final' ? 'la final' : ronda === 'Semifinales' ? 'las semifinales' : 'los ' + ronda.toLowerCase()) : 'lo que te tocaba'}.</p>
          <p class="bc" style="font-weight:700;font-size:22px;color:#fff">${c.actual === c.R ? 'El campeón se sabrá en el desfile' : 'La siguiente ronda se abre cuando vote todo el mundo'}</p>
          <p class="med t2">${c.actual === c.R ? 'Cuando vote todo el mundo, se acaba el torneo.' : 'Te avisaremos por correo, con quién pasa.'}</p>${resumenTermo()}
          <div class="fila" style="gap:8px;width:100%"><button class="btn linea medio crece" data-a="ir" data-v="/cuadro">Ver el cuadro</button><button class="btn linea medio crece" data-a="repaso">Repasar mis votos</button></div>
        </div>${barraRetirada()}
      </main>${cajaConflicto('solo-movil')}`, { lateral: lateral() });
  }
  if (v.every((b) => b.voto) && hechas < m.length && !S.ui.repaso && !recien) {
    return marco(`${campoDescanso()}${tickerRadio()}${cabecera(e.guerra.pregunta)}${botonEstrellaSaltada()}
      <main class="col g12" style="flex:1;justify-content:center">
        <div class="caja teal centro" style="align-items:center;padding:20px 14px">
          ${escena('trinchera', 'Los dos soldados duermen en la trinchera')}
          <div class="enorme teal" style="font-size:40px">¡Cumplido por hoy!</div>
          <p class="t3">Has librado todas las batallas abiertas.</p>${frente(hechas, m.length, 'batallas libradas')}
          <p class="bc" style="font-weight:700;font-size:22px;color:#fff">La ofensiva ${ab + 1} de ${e.guerra.ofensivas} se abre ${e.guerra.proxima ? cuando(e.guerra.proxima) : 'mañana'}</p>
          <p class="med t2">Te avisaremos por correo.</p>${resumenTermo()}
          <button class="btn linea medio ancho" data-a="repaso">Repasar mis votos</button>
        </div>${barraRetirada()}
      </main>${cajaConflicto('solo-movil')}`, { lateral: lateral() });
  }
  if (hechas === m.length && !S.ui.repaso && !recien) {
    const faltan = rezagados();
    return marco(`${campoDescanso()}${tickerRadio()}${cabecera(e.guerra.pregunta)}${botonEstrellaSaltada()}
      <main class="col g12" style="flex:1;justify-content:center">
        <div class="caja teal centro" style="align-items:center;padding:20px 14px">
          ${escena('trinchera', 'Los dos soldados duermen en la trinchera')}
          <div class="enorme teal" style="font-size:40px">¡Misión cumplida!</div>
          <p class="t3">Has librado tus ${m.length} batallas. ${faltan.length ? 'La guerra sigue en pausa hasta que voten los rezagados.' : 'Ya ha votado todo el mundo: alto el fuego inminente.'}</p>
          ${e.porra ? `<button class="btn ancho" data-a="ir" data-v="/porra">${e.porra.mia ? 'Retocar mi porra' : 'Hacer la porra'}</button>` : ''}
          ${resumenTermo()}<button class="btn linea medio ancho" data-a="repaso">Repasar mis votos</button>
        </div>${barraRetirada()}
      </main>${cajaConflicto('solo-movil')}`, { lateral: lateral() });
  }
  const i = posicion(), b = v[i], a = G[b.a], c = G[b.b];
  const votada = b.voto ? `<div class="estado-voto col g4" style="align-items:center;padding:0 12px"><span class="fila">${ico('visto', 16, 'style="color:#5ef0d0"')}Tomaste partido por ${esc(G[b.voto].nombre)}. No hay vuelta atrás.</span>${lineaTermo(b)}</div>` : `<p class="pista-voto">${ico('arriba', 16)}Toca la foto de quien elijas</p>
      ${e.guerra.extras.proclamas ? `<label class="campo"><span>Tu proclama (opcional: escríbela antes de tocar la foto)</span><input id="proclama" type="text" maxlength="200" data-m="proclama" value="${esc(S.ui.proclama || '')}" placeholder="Se leerá en el desfile, sin tu nombre" autocomplete="off"></label>` : ''}`;
  return marco(`${campoBatalla()}${tickerRadio()}
    <header class="col g4"><div class="sobre solo-movil">${esc(tituloGuerra(e.guerra))}</div><h1 class="h1 centrado-pc">${esc(preguntaDe(b.of))}</h1></header>
    ${navegador(v, i, 'llevas ' + hechas + ' de ' + m.length)}${e.guerra.cuadro ? '<button class="btn chico linea" style="align-self:center" data-a="ir" data-v="/cuadro">Ver el cuadro</button>' : ''}
    <main class="col combate-main" style="flex:1;justify-content:center;gap:10px">
      <div class="duelo anima entra-${S.ui.dir === -1 ? 'izq' : 'der'}" data-anim="duelo:${b.id}">${carta(a, Object.assign({ votar: b.voto ? '' : 'a', clase: b.voto === a.id ? '' : b.voto ? 'gris' + (recien && recien.id === b.id ? ' aparta-izq' : '') : '' }, recien && recien.id === b.id && b.voto === a.id ? { sello: 'Votado', selloClase: 'teal cae' } : {}))}${carta(c, Object.assign({ votar: b.voto ? '' : 'b', clase: 'izq' + (b.voto && b.voto !== c.id ? ' gris' + (recien && recien.id === b.id ? ' aparta-der' : '') : '') }, recien && recien.id === b.id && b.voto === c.id ? { sello: 'Votado', selloClase: 'teal cae' } : {}))}<div class="vs" aria-hidden="true">VS</div></div>
      ${votada}${barraRetirada()}
      ${S.ui.repaso ? '<button class="btn linea medio" data-a="repaso">Volver</button>' : ''}
    </main>${cajaConflicto('solo-movil')}`, { lateral: lateral() });
}

accion('mover', (paso) => {
  const lista = S.est.guerra.fase === 'abierta' ? votables() : S.est.batallas;
  const clave = S.est.guerra.fase === 'abierta' ? 'cursor' : 'cursorEspia';
  S.ui[clave] = Math.min(lista.length - 1, Math.max(0, (S.ui[clave] || 0) + Number(paso)));
  S.ui.dir = Number(paso) < 0 ? -1 : 1;
  S.ui.confirmaEspia = false;
  pintar();
});
accion('repaso', () => { S.ui.repaso = !S.ui.repaso; S.ui.cursor = S.ui.repaso ? 0 : null; pintar(); });
accion('votar', (lado) => {
  const m = votables(), b = m[posicion()];
  if (!b || b.voto) return;
  const elegido = b[lado], proclama = (S.ui.proclama || '').trim();
  b.voto = elegido; b.ts = Date.now();
  S.ui.proclama = '';
  S.ui.retirada = { batalla: b.id, elegido, hasta: Date.now() + GRACIA };
  // El sello de «Votado» cae sobre la carta elegida y el rival se aparta; luego entra la batalla siguiente.
  S.ui.recien = { id: b.id, hasta: Date.now() + 750 };
  pintar(); cuentaAtras();
  setTimeout(() => {
    if (!S.ui.recien || S.ui.recien.id !== b.id) return;
    S.ui.recien = null;
    const lista = votables(), sig = lista.findIndex((x) => !x.voto);
    S.ui.cursor = sig < 0 ? null : sig; S.ui.dir = 1;
    pintar();
    if (sig < 0 && b.voto) confeti();
  }, 750);
  encolar(async () => {
    try { await llamar('votar', { batalla: b.id, elegido, proclama }, 2); if (S.est.guerra.extras.termometro) avisoTermo(b.id); } catch (err) {
      b.voto = null;
      if (S.ui.retirada && S.ui.retirada.batalla === b.id) S.ui.retirada = null;
      S.ui.cursor = votables().indexOf(b);
      aviso(err.codigo === 'red' ? 'Tu voto no ha llegado al cuartel general. Vuelve a intentarlo.' : err.message);
      if (err.codigo !== 'red') await refrescar(true).catch(() => {});
      pintar();
    }
  });
});
accion('apostar', (v) => {
  const [id, lado] = v.split(':'), b = S.est.batallas.find((x) => x.id === Number(id));
  if (!b || (b.voto && b.apuesta)) return;
  const antes = b.apuesta, elegido = b[lado];
  if (antes === elegido) return;
  b.apuesta = elegido;
  // Cae el sello de «Apostado» sobre la carta elegida y, al poco, sigue la guerra.
  S.ui.recienApuesta = { id: b.id, hasta: Date.now() + 1100 }; setTimeout(() => { S.ui.recienApuesta = null; pintar(); }, 1150);
  pintar();
  encolar(async () => {
    try {
      await llamar('apostar', { batalla: b.id, elegido }, 2);
      const G = gente();
      aviso(`Apuesta hecha: ${elegido === yo().id ? 'por ti' : 'por ' + G[elegido].nombre}.`, true);
      refrescar();   // con la apuesta hecha, llega su termómetro (si lo hay)
    }
    catch (err) { b.apuesta = antes; aviso(err.codigo === 'red' ? 'Tu apuesta no ha llegado al cuartel general. Vuelve a intentarlo.' : err.message); pintar(); }
  });
});
accion('retirar', () => {
  const r = S.ui.retirada;
  if (!r) return;
  const b = mias().find((x) => x.id === r.batalla);
  S.ui.retirada = null; S.ui.recien = null;
  encolar(async () => {
    try {
      await llamar('retirar', { batalla: r.batalla });
      b.voto = null;
      S.ui.cursor = votables().indexOf(b);
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
    espia = `<section class="col g8"><div class="fila" style="gap:12px;align-items:center"><div style="width:120px;flex:none">${escena('periodico', 'Un espía escondido tras un periódico', 70)}</div>
      <div class="col g4"><h2 class="h2">Tu espía</h2><p class="med t3">${usado ? 'Ya ha vuelto con su chivatazo.' : 'Elige un combate y descubre quién lo ganó. Sólo uno.'}</p></div></div></section>
      ${navegador(lista, i, '')}
      <div class="duelo">${carta(G[b.a], sa)}${carta(G[b.b], Object.assign({}, sb, { clase: 'izq ' + (sb.clase || '') }))}<div class="vs" aria-hidden="true">VS</div></div>
      ${usado ? `<div class="estado-voto" style="padding:0 12px"><span><strong class="teal">${usado.gana === 'empate' ? 'Empate' : 'Gana ' + esc(G[usado.gana].nombre)}</strong> en ${esc(G[lista.find((x) => x.id === usado.batalla).a].nombre)} contra ${esc(G[lista.find((x) => x.id === usado.batalla).b].nombre)}. Espía gastado: los puntos, en el desfile.</span></div>`
        : `<button class="btn ${S.ui.confirmaEspia ? 'oro' : ''}" data-a="espiar">${S.ui.confirmaEspia ? '¿Seguro? Sólo tienes un espía · Confirmar' : 'Mandar al espía a este combate'}</button>`}`;
  }
  const porra = e.porra && e.porra.abierta ? `<div class="caja oro"><strong>Aún puedes hacer la porra.</strong><span class="med t2">Sólo un intento${puedeEspiar ? ', y antes de mandar al espía: si espías, la pierdes' : ''}.</span><button class="btn oro medio" data-a="ir" data-v="/porra">Hacer la porra</button></div>` : '';
  return marco(`${tickerRadio()}${cabecera('Alto el fuego')}
    ${escena('firma', 'Los dos soldados firman el alto el fuego')}
    <p class="t3">Ya ha votado todo el mundo. ${puedeEspiar ? 'Antes del desfile puedes mandar al espía a descubrir quién ganó un combate: sólo uno, y sin ver los puntos.' : e.guerra.extras.desfile ? 'El parte de guerra se revelará en el desfile.' : 'El alto mando publicará el parte de guerra.'}</p>
    ${porra}${espia}
    <section class="caja"><h2 class="h2">${e.guerra.extras.desfile ? 'El desfile de la victoria' : 'El parte de guerra'}</h2><p class="med teal">Todos han votado</p>
      <p class="med t3">${esc(e.guerra.desfileInfo || (e.guerra.extras.desfile ? 'El alto mando anunciará el día y la hora.' : 'El alto mando lo publicará en breve.'))}</p>${botonesCalendario(e.guerra)}${e.guerra.cuadro ? '<button class="btn linea medio" data-a="ir" data-v="/cuadro">Ver el cuadro</button>' : ''}</section>
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
const TITULOS = { rebelde: 'El más rebelde', borrego: 'El más borrego', tardon: 'El más tardón', adivino: 'El adivino' };
const EXPLICA = { rebelde: 'Quien más veces votó contra la mayoría', borrego: 'Quien más veces votó lo mismo que la mayoría', tardon: 'Quien más tardó en terminar de votar', adivino: 'Quien más acertó en las apuestas' };
function detallePremio(p) {
  if (p.cual === 'rebelde') return `Contra la mayoría en ${p.n} de ${p.de}`;
  if (p.cual === 'borrego') return `Con la mayoría en ${p.n} de ${p.de}`;
  if (p.cual === 'adivino') return `Acertó ${p.n} de ${plural(p.de, 'apuesta', 'apuestas')}`;
  return p.motivo === 'indulto' ? `Indulto con ${plural(p.n, 'voto', 'votos')} sin emitir` : `La última papeleta, ${tras(p.n)}`;
}
// Campeones de cada pregunta, cuando la guerra tiene varias.
function campeonesPregunta(r, G) {
  if (!(r.preguntas || []).length) return '';
  return `<section class="col"><h2 class="h2">Campeones por pregunta</h2><ul class="col g12">${r.preguntas.map((q) => `<li class="caja" style="flex-direction:row;gap:12px;align-items:center">${avatar(G[q.id], 'grande oro')}
    <span class="col g4"><span class="peq t2">Pregunta ${q.k}: ${esc(q.texto)}</span><strong style="font-size:17px">${esc(nombreDe(G[q.id]))}</strong><span class="med t2">${plural(q.pts, 'punto', 'puntos')} en ${plural(q.batallas, 'batalla', 'batallas')}</span></span></li>`).join('')}</ul></section>`;
}
export { campeonesPregunta };
function listaPremios(lista) {
  const G = gente();
  return `<ul class="col g12">${lista.map((p) => `<li class="caja oro" style="flex-direction:row;align-items:center;gap:12px">${avatar(G[p.id], 'grande')}
    <span class="col g4 crece"><span class="bc oro" style="font-weight:800;font-size:18px">${TITULOS[p.cual]}</span><span style="font-weight:700;font-size:17px">${esc(nombreDe(G[p.id]))}</span><span class="med t2">${detallePremio(p)}</span><span class="peq t2" style="font-style:italic">${EXPLICA[p.cual]}.</span></span></li>`).join('')}</ul>`;
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
  return 'Siguiente: ' + ({ consejo: 'consejo de guerra', proclama: 'una proclama', condecoracion: 'condecoración', duelo: 'el duelo final', finalistas: 'los dos finalistas', campeon: 'revelar al campeón', pregunta: 'campeón de la pregunta ' + s.k }[s.t] || ordinal(s.pos) + ' puesto');
}
export { etiquetaSiguiente, bloqueDuelo, listaPremios, detallePremio, TITULOS, textoBatallas, pantallaDesfile };

// Cuadro del torneo: una columna por ronda. Quién pasa se sabe al cerrar cada ronda; los votos, al publicar el parte.
registrar('/cuadro', () => {
  if (!S.est) return marco(cargando('Desplegando el cuadro'));
  const e = S.est, c = e.guerra.cuadro, G = gente();
  if (!c) return marco('<div class="caja"><p>Esta guerra no es un torneo.</p></div>');
  const marc = {};
  if (e.resultado) e.resultado.batallas.forEach((b) => { marc[b.id] = b; });
  const plazas = 2 ** c.R;
  const lado = (id, nd, rival) => {
    if (!id) return `<div class="cruce-lado vacio"><span class="avatar chico">?</span><span class="t2">${rival === undefined ? 'Por decidir' : 'Pasa sin combatir'}</span></div>`;
    const gana = nd.pasa === id, pierde = nd.pasa && nd.pasa !== id, b = marc[nd.bid];
    const votos = b ? (b.a === id ? b.va : b.vb) : null;
    return `<div class="cruce-lado ${gana ? 'gana' : ''} ${pierde ? 'cae' : ''}">${avatar(G[id], 'chico')}<span class="crece">${esc(nombreDe(G[id]))}</span>${votos != null ? `<b>${votos}</b>` : gana ? ico('visto', 16) : ''}</div>`;
  };
  const cruce = (nd) => `<div class="cruce ${nd.bid ? '' : 'libre'}">${lado(nd.a, nd)}${nd.b || nd.bid ? lado(nd.b, nd) : lado(null, nd, null)}</div>`;
  const futura = () => `<div class="cruce">${lado(null, {}, undefined)}${lado(null, {}, undefined)}</div>`;
  const columnas = Array.from({ length: c.R }, (_, i) => {
    const nodos = c.rondas[i], cuantos = plazas / 2 ** (i + 1);
    const actual = e.guerra.fase === 'abierta' && i + 1 === c.actual;
    return `<div class="ronda ${actual ? 'actual' : ''}"><h3 class="bc">${nombreRonda(i + 1, c.R)}${actual ? ' <span class="chapa">En juego</span>' : ''}</h3>
      <div class="ronda-cruces">${(nodos || Array.from({ length: cuantos }, () => null)).map((nd) => (nd ? cruce(nd) : futura())).join('')}</div></div>`;
  }).join('');
  return marco(`${cabecera('El cuadro')}
    <p class="med t2">${e.guerra.fase === 'publicada' ? 'El torneo completo, con los votos de cada cruce.' : 'Quién pasa se sabe al cerrar cada ronda. Los votos de cada cruce y la final, en ' + (e.guerra.extras.desfile ? 'el desfile.' : 'el parte final.')}</p>
    <div class="cuadro-torneo">${columnas}</div>
    ${c.tercero ? `<section class="col g4"><h3 class="bc oro" style="font-size:20px">Por el 3.er puesto</h3>${cruce(c.tercero)}</section>` : ''}
    <button class="btn linea medio" data-a="ir" data-v="${S.mando && !S.est.yo ? '/cuartel' : '/batallas'}">Volver</button>`, S.est.yo ? { lateral: lateral() } : {});
});

// La frase del narrador, debajo de cada puesto.
const narrador = (frase, chica) => (frase ? `<p class="narrador${chica ? ' chica' : ''}">${ico('micro', chica ? 14 : 18)}<span>${esc(frase)}</span></p>` : '');

// «ensayo» es la barra del ensayo privado del alto mando: con ella se pinta la vista que se le pasa, no el desfile real.
function pantallaDesfile(vista, ensayo) {
  const e = S.est, d = vista || e.desfile, a = d.actual, G = gente();
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
      ${carta(G[a.fila.id], { clase: 'sola', pie: `<div class="fila bc" style="padding:0 10px 12px;gap:10px;font-weight:700;font-size:16px;white-space:nowrap">${textoPuntos(a.fila)}<span class="t2">${textoBatallas(a.fila)}</span><span class="t2">${signo(a.fila.dif)}</span></div>` })}
      ${narrador(a.frase)}`;
  } else if (a.t === 'proclama') {
    centro = `<div class="col g4 centro"><h2 class="enorme" style="font-size:36px">Proclamas anónimas</h2><span class="peq rosa" style="font-weight:600;letter-spacing:.14em;text-transform:uppercase">Proclama anónima · ${a.n} de ${a.de}</span></div>
      <blockquote class="cita" style="margin:0">«${esc(a.texto || '')}»</blockquote>
      <div class="fila" style="justify-content:center;gap:10px">${avatar(G[a.a])}<strong>${esc(G[a.a].nombre)}</strong><span class="t2">contra</span>${avatar(G[a.b], 'rosa')}<strong>${esc(G[a.b].nombre)}</strong></div>
      <p class="med t2 centro">Alguien tomó partido por ${esc(G[a.elegido].nombre)}</p>`;
  } else if (a.t === 'condecoracion') {
    centro = `<div class="col g4 centro"><h2 class="enorme" style="font-size:36px">Condecoraciones</h2><span class="med t2">Calculadas con vuestros votos</span></div>${listaPremios(d.premios)}`;
  } else if (a.t === 'pregunta') {
    const q = G[a.id];
    centro = `<div class="col g4 centro"><span class="peq oro" style="font-weight:600;letter-spacing:.14em;text-transform:uppercase">Pregunta ${a.k} de ${a.de}</span>
        <h2 class="enorme" style="font-size:32px;line-height:1.05">${esc(a.texto)}</h2></div>
      ${carta(q, { clase: 'sola', sello: 'Campeón', selloClase: 'oro' })}
      <p class="med t3 centro">${plural(a.pts, 'punto', 'puntos')} en sus ${plural(a.batallas, 'batalla', 'batallas')} de esta pregunta: ${a.g} ${a.g === 1 ? 'ganada' : 'ganadas'}, ${a.e} ${a.e === 1 ? 'empatada' : 'empatadas'} y ${a.p} ${a.p === 1 ? 'perdida' : 'perdidas'}.</p>`;
  } else if (a.t === 'duelo') {
    centro = bloqueDuelo(ensayo ? Object.assign({}, a.duelo, { puedo: false, mio: null, cierra: null }) : a.duelo, true);
  } else if (a.t === 'finalistas') {
    const [fa, fb] = a.entre.map((id) => G[id]);
    centro = `<div class="col g4 centro"><span class="peq oro" style="font-weight:600;letter-spacing:.14em;text-transform:uppercase">La gran final</span><h2 class="enorme">Sólo quedan dos</h2>
        <p class="t3">Uno de los dos se lleva la guerra. El otro, el 2.º puesto.</p></div>
      <div class="duelo">${carta(fa)}${carta(fb, { clase: 'izq' })}<div class="vs" aria-hidden="true" style="background:#ffd36a">?</div></div>
      <p class="bc oro centro" style="font-weight:800;font-size:26px;letter-spacing:.04em">¿${esc(fa.nombre)} o ${esc(fb.nombre)}?</p>
      <p class="med t2 centro">El alto mando tiene el sobre.</p>`;
  } else if (a.t === 'campeon') {
    const f = a.fila, gana = a.porra.gana.map((id) => nombreDe(G[id]));
    centro = `<p class="sobre centro">${esc(e.guerra.pregunta)}</p>
      <div class="enorme oro centro">1.er puesto</div>
      ${carta(G[f.id], { clase: 'sola', pie: `<div class="fila bc" style="padding:0 10px 12px;gap:10px;font-weight:700;font-size:16px;white-space:nowrap">${textoPuntos(f)}<span class="t2">${textoBatallas(f)}</span><span class="t2">${signo(f.dif)}</span></div>` })}
      ${narrador(a.frase)}
      ${a.segundo ? `<p class="centro"><span class="t2">2.º puesto:</span> <strong>${esc(nombreDe(G[a.segundo.id]))}</strong> <span class="t2">· ${plural(a.segundo.pts, 'punto', 'puntos')}</span></p>${narrador(a.fraseSegundo, true)}` : ''}
      ${e.guerra.premio ? `<div class="caja oro"><span class="sobre oro">Premio</span><strong>${esc(e.guerra.premio)}</strong></div>` : ''}
      ${gana.length ? `<div class="caja"><span class="sobre">La porra</span><span>${gana.length > 1 ? 'Ganan' : 'Gana'} <strong>${esc(enumerar(gana))}</strong>, a ${plural(a.porra.suma, 'puesto', 'puestos')} del parte final${e.guerra.botin ? ', y se lleva' + (gana.length > 1 ? 'n' : '') + ' ' + esc(e.guerra.botin) : ''}.</span></div>` : ''}`;
  }
  const control = ensayo ? '' : S.mando ? `<div class="fila solo-pc" style="justify-content:flex-end;gap:16px"><span class="med t4">Barra espaciadora o flecha derecha</span>
    <button class="btn claro" data-a="desfile" data-v="${d.ultimo ? 'terminar' : 'siguiente'}">${etiquetaSiguiente(d.siguiente)}</button></div>` : '';
  if (a.t === 'duelo' && !ensayo) setTimeout(latidoDuelo, 0);
  return marco(`${ensayo || ''}${cabecera('Desfile de la victoria', ensayo ? '<span class="chapa">Ensayo</span>' : '<span class="chapa">En directo</span>')}
    <div class="cols-pc"><main class="col g12 escenario" style="justify-content:center"><div class="focos" aria-hidden="true"><i></i><i></i><i></i></div>${centro}<div class="tablas" aria-hidden="true"></div></main>
    <div class="col g12">${porraEnVivo(d)}${parteEnVivo(d)}</div></div>${control}`, { ancha: true });
}

// ---------------------------------------------------------------- parte de guerra publicado

function tablaFinal(r) {
  const G = gente();
  return `<table class="tabla"><thead><tr><th>#</th><th>Combatiente</th><th>G</th><th>E</th><th>P</th><th>Pts</th><th>Dif.</th></tr></thead><tbody>
    ${r.tabla.map((f) => `<tr class="${f.id === yo().id ? 'yo' : ''}"><td>${f.pos}</td><td>${esc(nombreDe(G[f.id]))}</td><td>${f.g}</td><td>${f.e}</td><td>${f.p}</td><td class="pts">${f.pts}</td><td>${signo(f.dif)}</td></tr>`).join('')}
    ${r.desertores.map((x) => `<tr><td>—</td><td class="t2">${esc(G[x.id].nombre)}</td><td colspan="5" class="rosa" style="font-size:12px">Desertor</td></tr>`).join('')}
  </tbody></table>
  <details class="leyenda"><summary>Cómo se lee la tabla</summary><dl>
    <dt>G, E, P</dt><dd>Batallas ganadas, empatadas y perdidas.</dd>
    <dt>Pts</dt><dd>Puntos.</dd>
    <dt>Dif.</dt><dd>Diferencia de votos: todos los votos que recibió en sus batallas menos todos los que recibieron sus rivales contra él. Si gana una batalla 5 a 2, suma +3; si pierde otra 1 a 6, resta 5. Desempata cuando dos acaban con los mismos puntos.</dd>
  </dl></details>`;
}
export { tablaFinal, listaCuriosidades };
function listaCuriosidades(r, G) {
  const c = r.curiosidades || {}, bat = porId(r.batallas), nom = (id) => esc(G[id].nombre);
  const marcador = (id) => { const b = bat[id]; return b ? `${nom(b.a)} ${b.va}–${b.vb} ${nom(b.b)}` : ''; };
  return [
    c.renida && bat[c.renida.batalla] ? `<strong>La más reñida:</strong> ${marcador(c.renida.batalla)}${c.renida.otras ? `, y otras ${c.renida.otras} con el mismo margen` : ''}.` : '',
    c.paliza && bat[c.paliza.batalla] ? `<strong>Mayor paliza:</strong> ${marcador(c.paliza.batalla)}, ofensiva ${bat[c.paliza.batalla].of}.` : '',
    c.primero ? `<strong>Votó antes que nadie:</strong> ${nom(c.primero.id)}, que terminó en ${duracion(c.primero.ms)}.` : '',
    c.ultimo ? `<strong>Última papeleta:</strong> ${nom(c.ultimo.id)}, ${tras(c.ultimo.ms)}.` : '',
    c.espiada && bat[c.espiada.batalla] ? `<strong>La batalla más espiada:</strong> ${marcador(c.espiada.batalla)} (${plural(c.espiada.n, 'espía', 'espías')}).` : ''
  ].filter(Boolean);
}
function pantallaPublicada() {
  const e = S.est, r = e.resultado, G = gente(), campeon = r.tabla[0];
  const duelo = e.duelo && !e.duelo.cerrado;
  if (duelo && e.duelo.cierra) setTimeout(latidoDuelo, 0);
  const mia = e.mia && e.mia.afinidad;
  const gana = r.porra.gana.map((id) => nombreDe(G[id]));
  const premios = ['rebelde', 'borrego', 'tardon', 'adivino'].filter((k) => r.premios[k]).map((k) => Object.assign({ cual: k }, r.premios[k]));
  return marco(`${cabecera(duelo ? 'Duelo final' : 'Parte de guerra')}
    ${duelo ? `<p class="med t3">El resto del parte de guerra ya es oficial: sólo falta decidir quién se lleva la guerra.</p>${bloqueDuelo(e.duelo, false)}`
      : `<div class="cols-pc">${carta(G[campeon.id], { clase: 'sola', pie: `<div class="fila bc" style="padding:0 10px 12px;gap:10px;font-weight:700;font-size:16px;white-space:nowrap">${textoPuntos(campeon)}<span class="t2">${textoBatallas(campeon)}</span><span class="t2">${signo(campeon.dif)}</span></div>` })}
        <div class="col g12"><div class="enorme oro">1.er puesto</div>${e.guerra.premio ? `<div class="caja oro"><span class="sobre oro">Premio</span><strong>${esc(e.guerra.premio)}</strong></div>` : ''}
        ${gana.length ? `<div class="caja"><span class="sobre">La porra</span><span>${gana.length > 1 ? 'Ganan' : 'Gana'} <strong>${esc(enumerar(gana))}</strong>, a ${plural(r.porra.lista[0].suma, 'puesto', 'puestos')} del parte final.</span></div>` : ''}
        <div class="fila" style="flex-wrap:wrap">${botonCartel('podio', ico('wasap') + 'Cartel de la victoria', 'btn oro medio crece')}${campeon.id === yo().id || S.mando ? botonCartel('diploma', 'Descargar la cruz al mérito', 'btn linea medio crece') : ''}${botonAlbum()}</div></div></div>`}
    <section class="caja"><h2 class="h2">Parte de guerra</h2>${tablaFinal(r)}${e.guerra.cuadro ? '<button class="btn linea medio" data-a="ir" data-v="/cuadro">Ver el cuadro del torneo</button>' : ''}</section>
    ${mia ? `<section class="caja"><h2 class="h2">Tu guerra</h2>
      <div class="fila g12">${avatar(G[mia.companero.id], 'grande')}<span class="col g4"><strong>Compañero de trinchera: ${esc(G[mia.companero.id].nombre)}</strong><span class="med t2">Coincidisteis en ${mia.companero.n} de ${mia.companero.de} batallas</span></span></div>
      <div class="fila g12">${avatar(G[mia.enemigo.id], 'grande rosa')}<span class="col g4"><strong>Enemigo íntimo: ${esc(G[mia.enemigo.id].nombre)}</strong><span class="med t2">Sólo coincidisteis en ${mia.enemigo.n} de ${mia.enemigo.de}</span></span></div></section>` : ''}
    ${premios.length ? `<section class="col"><h2 class="h2">Condecoraciones</h2>${listaPremios(premios)}</section>` : ''}
    ${campeonesPregunta(r, G)}
    ${listaCuriosidades(r, G).length ? `<section class="caja"><h2 class="h2">Curiosidades</h2>${listaCuriosidades(r, G).map((x) => `<p class="med">${x}</p>`).join('')}</section>` : ''}
    ${r.proclamas.length ? `<section class="caja"><h2 class="h2">Proclamas anónimas</h2>${r.proclamas.map((p) => `<p class="med"><span class="t2">${esc(G[p.a].nombre)} contra ${esc(G[p.b].nombre)} · a ${esc(G[p.elegido].nombre)}</span><br><em>«${esc(p.texto)}»</em></p>`).join('')}</section>` : ''}`,
    { fondo: 'a', ancha: true });
}

registrar('/batallas', () => {
  if (!S.est) return marco(cargando('Entrando en combate'), { sinNav: true });
  const fase = S.est.guerra.fase;
  if (fase === 'abierta') return pantallaBienvenida() || pantallaAbierta();
  if (fase === 'terminada') return pantallaTerminada();
  if (fase === 'desfile') return pantallaDesfile();
  if (fase === 'publicada') return pantallaPublicada();
  return marco(`${cabecera('Guerra en preparación')}<div class="caja"><p>El alto mando aún no ha declarado la guerra. Cuando lo haga, te llegará tu orden de movilización por correo.</p></div>`, { sinNav: true });
});

// Bienvenida de cada ofensiva (ritmo diario o torneo): la primera vez que entras tras abrirse una nueva,
// una pantalla de un vistazo con lo que te toca hoy y un solo botón. Se ve una vez por ofensiva en cada dispositivo.
function pantallaBienvenida() {
  const e = S.est, g = e.guerra, ab = g.abiertas;
  if (!(g.ritmo === 'diaria' || g.cuadro) || !ab || S.ui.repaso) return '';
  const vistas = preferencia.leer('bienvenida', {});
  if (vistas[g.id] === ab) return '';
  const hoy = votables().filter((b) => b.of === ab), faltan = hoy.filter((b) => !b.voto).length;
  if (!faltan) return '';
  const total = votables().length, hechas = votables().filter((b) => b.voto).length;
  const titulo = g.cuadro ? nombreRonda(ab, g.ofensivas) : `Ofensiva ${ab} de ${g.ofensivas}`;
  return marco(`${campoBatalla()}<main class="col" style="gap:14px"><section class="caja teal bienvenida col">
      <span class="sobre teal">${esc(tituloGuerra(g))}</span>
      ${escena('asalto', 'Los dos soldados saltan fuera de la trinchera al amanecer', 150)}
      <h1 class="h1" style="margin:0">¡${esc(titulo)}!</h1>
      <p class="t3" style="margin:0">${g.cuadro ? 'Se abre la ronda: a votar quién pasa.' : 'Se ha abierto la ofensiva de hoy.'}</p>
      <div class="cifras"><div><b>${hoy.length}</b><span class="peq t2">${hoy.length === 1 ? 'batalla hoy' : 'batallas hoy'}</span></div>
        <div><b class="teal">${faltan}</b><span class="peq t2">${faltan === 1 ? 'te falta' : 'te faltan'}</span></div>
        <div><b>${hechas}<small class="t2" style="font-size:20px">/${total}</small></b><span class="peq t2">en toda la guerra</span></div></div>
      ${e.guerra.extras.apuestas ? `<p class="peq oro" style="margin:0">★ Y al final, una carta extra: la ${nombreDelDia().toLowerCase()}, para apostar quién gana.</p>` : ''}
      <button class="btn ancho" data-a="alCombate">¡Al combate!</button></section></main>`, { lateral: lateral() });
}
accion('alCombate', () => {
  const g = S.est.guerra, vistas = preferencia.leer('bienvenida', {});
  vistas[g.id] = g.abiertas; preferencia.poner('bienvenida', vistas);
  S.ui.dir = 1; pintar(); window.scrollTo(0, 0);
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
  let cuerpo, final = '';
  const r = e.resultado;
  if (r && !(e.duelo && !e.duelo.cerrado)) {
    const gana = r.porra.gana.map((id) => nombreDe(G[id])), mia = r.porra.lista.find((x) => x.id === yo().id);
    final = r.porra.lista.length ? `<section class="caja oro centro" style="align-items:center;padding:18px 14px">
        <div class="fila" style="justify-content:center;flex-wrap:wrap;gap:18px">${r.porra.gana.map((id) => `<span class="col g4" style="align-items:center">${avatar(G[id], 'gigante oro')}
          <strong class="bc" style="font-size:30px;line-height:1;color:#fff">${esc(nombreDe(G[id]))}</strong><span class="sobre oro">Ganador de la porra</span></span>`).join('')}</div>
        <span class="med t3">A ${plural(r.porra.lista[0].suma, 'puesto', 'puestos')} del parte final${e.guerra.botin ? ' · Botín: ' + esc(e.guerra.botin) : ''}</span>
        ${mia ? `<span class="med">Tú quedaste ${ordinal(mia.pos)}, a ${plural(mia.suma, 'puesto', 'puestos')}.</span>` : ''}</section>
      <section class="caja"><h2 class="h2">Clasificación de la porra</h2><p class="peq t2">Puestos de diferencia con el parte final. Gana la suma más baja.</p>
        <ol class="lista-puestos">${r.porra.lista.map((x) => `<li class="${x.id === yo().id ? 'teal' : ''}"><b>${x.pos}</b>${avatar(G[x.id])}<span>${esc(nombreDe(G[x.id]))}</span><em>${x.suma}</em></li>`).join('')}</ol></section>
      ${p.mia ? '<h2 class="h2">Tu porra</h2>' : ''}` : '<div class="caja"><p>Nadie hizo la porra en esta guerra.</p></div>';
  }
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
  return marco(`${cabecera('La porra')}${final}${cuerpo}<p class="peq t2 centro">Porras recibidas: ${p.recibidas} de ${p.de}</p>`, { fondo: 'a' });
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

// Ordenanzas como manual de campaña: cada regla con su icono y una frase corta; el detalle, al desplegar.
// Las reglas vienen del motor (o del alto mando, si las personalizó); aquí sólo se visten.
const MANUAL = {
  'El combate': ['casco', 'Dos cartas, una pregunta: tú decides', '#5ef0d0', 'vs'],
  'Secreto y sin vuelta atrás': ['candado', 'Votas tú, en secreto', '#8f7bff'],
  'Todas las ofensivas, de golpe': ['rayo', 'Todas las batallas, desde ya', '#ffd36a', 'golpe'],
  'Una ofensiva al día': ['sol', 'Una ofensiva cada mañana', '#ffd36a', 'dia'],
  'Torneo por eliminatorias': ['cuadro', 'Sólo pasa uno', '#ffd36a', 'torneo'],
  'Los puntos': ['medalla', '3 puntos por victoria', '#5ef0d0', 'p310'],
  'La porra': ['porra', 'Adivina el parte final', '#ff6ad5'],
  'El termómetro': ['termo', '¿Vas con la mayoría?', '#5ef0d0'],
  'La batalla del día': ['apuesta', 'Apuesta por el plato fuerte', '#ffd36a'],
  'La batalla estrella': ['apuesta', 'Apuesta por el plato fuerte', '#ffd36a'],
  'Tu espía': ['espia', 'Un chivatazo. Sólo uno', '#8f7bff'],
  'El narrador': ['micro', 'Un locutor con retranca', '#8f7bff'],
  'El desfile de la victoria': ['desfile', 'El parte, en directo', '#ffd36a'],
  'Desertores e indultos': ['diana', 'Quien no vota, deserta', '#ff6ad5'],
  'Rezagados': ['diana', 'Quien se duerme, pierde sus votos', '#ff6ad5'],
  'Grados': ['grados', 'De soldado a general', '#5ef0d0'],
  'Radio Macuto': ['radio', 'Pullas sin firma', '#ff6ad5'],
  'Varias preguntas': ['preguntas', 'Cada ofensiva, su pregunta', '#ffd36a']
};
function vestir(r) {
  const m = MANUAL[r.t] || ['pergamino', r.t, '#5ef0d0'];
  const [ic, frase, color, ilu] = m;
  if (r.t === 'Los puntos' && S.est.guerra.puntuacion === 'votos') return { ic, frase: 'Cada voto recibido suma', color, ilu: 'votos' };
  return { ic, frase, color, ilu };
}
const frases = (x) => String(x || '').split(/(?<=[.!?»])\s+(?=[A-ZÁÉÍÓÚÑ¿¡«])/).filter((f) => f.trim());
function dibujo(v, alto) { return v.ilu === 'vs' ? ILU.vs('#5ef0d0', '#ff6ad5', alto) : v.ilu ? ILU[v.ilu](v.color, alto) : `<span style="color:${v.color};display:flex;justify-content:center">${icono(v.ic, Math.round(alto * 0.6), 1.6)}</span>`; }

registrar('/ordenanzas', () => {
  if (!S.est) return marco(cargando(), { sinNav: true });
  const o = S.est.guerra.ordenanzas;
  const tarjetas = o.slice(0, 5).map((r, k) => {
    const v = vestir(r), primera = frases(r.x)[0] || '';
    return `<article class="tarjeta-manual" style="--c:${v.color}"><span class="sobre" style="color:${v.color}">Ordenanza ${k + 1} · ${esc(r.t)}</span>
      <div class="tarjeta-dibujo">${dibujo(v, 130)}</div>
      <h2 class="bc">${esc(v.frase)}</h2><p class="med t2">${esc(primera)}</p></article>`;
  }).join('');
  const lista = o.map((r, k) => {
    const v = vestir(r), partes = frases(r.x);
    return `<li class="regla" style="--c:${v.color}">
      <div class="regla-cab"><span class="regla-ico">${icono(v.ic, 26, 1.8)}</span>
        <span class="col crece" style="gap:3px;min-width:0"><span class="regla-num">${k + 1} · ${esc(r.t)}</span><span class="bc regla-frase">${esc(v.frase)}</span></span></div>
      <div class="regla-cuerpo">${r.puntos ? '<div class="puntos310"><div><b>3</b>Ganar</div><div><b>1</b>Empatar</div><div><b>0</b>Perder</div></div>' : ''}
        ${partes.length > 1 ? `<ul>${partes.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : `<p class="med t3" style="white-space:pre-line">${esc(r.x)}</p>`}</div>
    </li>`;
  }).join('');
  return marco(`${cabecera('Manual de campaña')}
    ${S.est.guerra.desfileTs ? `<section class="caja"><h2 class="h2">${S.est.guerra.extras.desfile ? 'El desfile de la victoria' : 'El parte de guerra'}</h2><p class="med t3">${esc(S.est.guerra.desfileInfo)}</p>${botonesCalendario(S.est.guerra)}</section>` : ''}
    <section aria-label="Lo esencial, en tarjetas" class="col g8"><div class="carrusel">${tarjetas}</div>
      <p class="peq t2" style="text-align:right">Desliza para ver lo esencial →</p></section>
    <h2 class="h2">Todas las ordenanzas</h2>
    <ol class="reglas">${lista}</ol>
    <p class="bc centro" style="font-weight:800;font-size:22px;color:var(--oro)">¡Sólo puede quedar uno!</p>`, { fondo: 'a' });
});

// ---------------------------------------------------------------- Radio Macuto

registrar('/radio', () => {
  if (!S.est) return marco(cargando(), { sinNav: true });
  const r = S.est.radio;
  if (!r) return marco(`${cabecera('Radio Macuto')}<div class="caja"><p>En esta guerra no hay Radio Macuto.</p></div>`, { fondo: 'a' });
  const abierta = S.est.guerra.fase === 'abierta' || S.est.guerra.fase === 'terminada';
  return marco(`<button class="btn linea chico" style="align-self:flex-start" data-a="ir" data-v="/batallas">${ico('izq', 14)}Batallas</button>
    <section class="radio-vieja" aria-label="Radio Macuto, en antena">
      <div class="radio-cab"><span class="piloto" aria-hidden="true"></span><span class="bc">Radio Macuto</span><span class="peq">En antena</span></div>
      <div class="radio-cuerpo"><div class="rejilla-altavoz" aria-hidden="true"></div>
        <div class="col g8" style="flex:1;min-width:0"><div class="dial" aria-hidden="true"><span>88</span><span>92</span><span>96</span><span>100</span><span>104</span><i class="aguja"></i></div>
          <p class="peq radio-lema">Pullas anónimas desde las trincheras</p></div></div>
      <div class="radio-pie" aria-hidden="true"><i></i><i></i></div></section>
    ${escena('altavoz', 'Un soldado lanza una pulla con un megáfono', 110)}
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
      ${piezas(c.explicacion || [])}
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

// ---------------------------------------------------------------- último parte de reclutamiento

alEntrar('/parte', async () => { S.ui.conv = await llamar('convocatoria', {}, 1); S.desfase = S.ui.conv.ahora - Date.now(); pintar(); relojParte(); });
let relojP = null;
function relojParte() {
  clearInterval(relojP);
  relojP = setInterval(() => {
    const el = document.getElementById('cuenta-parte');
    if (!el || !S.ui.conv || !S.ui.conv.cierreTs) { clearInterval(relojP); return; }
    el.innerHTML = cuentaCierre(S.ui.conv.cierreTs);
  }, 15000);
}
function cuentaCierre(ts) {
  const ms = Math.max(0, ts - ahoraServidor()), d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60;
  const celda = (n, t) => `<div class="caja centro" style="gap:2px;padding:10px 4px;border-color:#ff6ad5"><b class="bc" style="font-size:40px;color:#fff;line-height:1">${String(n).padStart(2, '0')}</b><span class="peq t2">${t}</span></div>`;
  return celda(d, d === 1 ? 'día' : 'días') + celda(h, h === 1 ? 'hora' : 'horas') + celda(m, m === 1 ? 'minuto' : 'minutos');
}
registrar('/parte', () => {
  const c = S.ui.conv;
  if (!c) return marco(cargando('Recibiendo transmisión'), { sinNav: true });
  if (c.guerra.fase !== 'llamamiento') { setTimeout(() => ir('/entrada', true), 0); return marco(cargando(), { sinNav: true }); }
  const votan = c.gente.filter((g) => g.vota), yoG = votan.find((g) => g.id === S.ui.carta);
  const si = votan.filter((g) => g.alistado === true), no = votan.filter((g) => g.alistado === false), nada = votan.filter((g) => g.alistado == null);
  const quien = (g) => (yoG && g.id === yoG.id ? 'tú' : g.nombre);
  const linea = (t) => `<p style="margin:0">${esc(t)}</p>`;
  const cierre = c.cierre ? `La guerra se declara el ${c.cierre}. Stop.` : 'La guerra se declarará muy pronto. Stop.';
  const respondida = yoG && yoG.alistado != null;
  return marco(`<header class="col g4" style="position:relative">
      <span class="bc rosa" style="position:absolute;top:0;right:0;transform:rotate(6deg);padding:2px 10px 4px;border:3px solid #ff6ad5;border-radius:8px;font-weight:800;font-size:20px;letter-spacing:.08em">Urgente</span>
      <div class="sobre rosa">Prioridad máxima</div><h1 class="h1" style="max-width:80%">Último parte de reclutamiento</h1></header>
    <section style="padding:3px;border-radius:16px;background:var(--holo)"><div style="border-radius:13px;background:#0b0a16;padding:16px;display:flex;flex-direction:column;gap:12px;font-family:'Courier Prime','Courier New',monospace">
      <div class="peq t2" style="font-family:inherit;line-height:1.6;border-bottom:1px dashed #3a3566;padding-bottom:10px">DE: ALTO MANDO<br>PARA: ${esc(may(yoG ? 'Recluta ' + yoG.nombre : 'Reclutas rezagados'))}<br>ASUNTO: ÚLTIMO PARTE</div>
      <div class="teal" style="font-family:inherit;font-size:16px;line-height:1.5;text-transform:uppercase;display:flex;flex-direction:column;gap:8px">
        ${linea((yoG ? 'Recluta ' + yoG.nombre : 'Reclutas') + '. Stop.')}${linea('El alto mando sigue sin noticias ' + (yoG ? 'suyas' : 'vuestras') + '. Stop.')}${linea(cierre)}
        ${linea('Quien no se aliste se quedará en la retaguardia viendo a otros cubrirse de gloria. Stop.')}
        <p style="margin:0;color:#8d88ab">Fin del mensaje <span aria-hidden="true" style="display:inline-block;width:10px;height:16px;background:#5ef0d0;vertical-align:-2px"></span></p></div></div></section>
    ${c.cierreTs && c.cierreTs > ahoraServidor() ? `<section class="col"><span class="etiqueta">Cierre del alistamiento</span><div class="rejilla3" id="cuenta-parte">${cuentaCierre(c.cierreTs)}</div></section>` : ''}
    <section class="caja"><div class="fila entre"><h2 class="h2">Ya en filas</h2><span class="med teal">${si.length} de ${votan.length}</span></div>
      ${si.length ? `<div class="fila" style="flex-wrap:wrap;gap:6px">${si.map((g) => `<span class="fila" style="gap:6px">${avatarSuelto(g)}<span class="med">${esc(quien(g))}</span></span>`).join('')}</div>` : '<p class="med t2">Nadie todavía. ¿Serás el primero?</p>'}
      ${no.length ? `<p class="med"><span class="rosa">Objetor:</span> ${esc(enumerar(no.map(quien)))}</p>` : ''}
      ${nada.length ? `<p class="med t2">Sin responder: ${esc(enumerar(nada.map(quien)))}</p>` : ''}</section>
    ${respondida ? `<div class="caja teal"><strong>${yoG.alistado ? '¡Ya estás en filas!' : 'Constas como objetor.'}</strong><p class="med t2">Para cambiarlo, usa el enlace del correo del llamamiento o avisa al alto mando.</p></div>`
      : yoG ? `<div class="fila" style="gap:10px"><button class="btn crece" data-a="alistar" data-v="1">¡Me alisto!</button><button class="btn linea crece" data-a="alistar" data-v="0">No me alisto</button></div>` : ''}
    <button class="btn linea medio" data-a="ir" data-v="/entrada">Leer el llamamiento completo</button>
    <p class="peq t4 centro" style="font-family:'Courier Prime','Courier New',monospace">Este parte se autodestruirá cuando empiece la guerra</p>`, { sinNav: true, fondo: 'b', marca: c.guerra.nombre });
});
const may = (s) => String(s).toLocaleUpperCase('es');
