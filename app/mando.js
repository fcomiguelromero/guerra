// Pantallas del alto mando: guerras, plan de guerra, cuartel general, armisticio, informe clasificado y mando del desfile.
import { S, llamar, refrescar, esc, tituloGuerra, nombreRonda, plural, signo, ordinal, enumerar, porId, hace, fecha, diaHora, duracion, poner, preferencia,
  ico, avatar, marco, cargando, pintar, ir, aviso, registrar, accion, alEntrar, recordar, pedirFotos } from './base.js?v=39';
import { escena } from './monigotes.js?v=39';
import { etiquetaSiguiente, listaPremios, tablaFinal, listaCuriosidades, TITULOS, pantallaDesfile, campeonesPregunta, bloqueParejas } from './combate.js?v=39';
import { botonCartel, imagenTropa } from './carteles.js?v=39';
import { recortarFoto } from './recorte.js?v=39';
import { icono, ILU } from './dibujos.js?v=39';
import { frente, filaRezagados } from './graficos.js?v=39';

const NOMBRE_FASE = { borrador: 'Borrador', llamamiento: 'Llamamiento a filas', abierta: 'En guerra', terminada: 'Alto el fuego', desfile: 'De desfile', publicada: 'Terminada' };
const EXTRAS = [
  ['porra', 'La porra', 'Quién acierta el parte final'], ['espia', 'El espía', 'Descubrir un combate antes del desfile'],
  ['desfile', 'Desfile de la victoria', 'Revelación en directo, puesto a puesto'], ['proclamas', 'Proclamas anónimas', 'Motivos al votar, leídos sin firma'],
  ['condecoraciones', 'Condecoraciones', 'El más rebelde (vota contra la mayoría), el más borrego (vota con ella) y el más tardón'], ['radio', 'Radio Macuto', 'Pullas anónimas con censura'],
  ['parte', 'Parte a mitad de contienda', 'Aviso con los rezagados, sin resultados'], ['corneta', 'Toque de corneta en el desfile', 'Suena en tu móvil'],
  ['termometro', 'Termómetro de la guerra', 'Tras votar, cada uno ve si va con la mayoría o contra ella, sin cifras'],
  ['narrador', 'Narrador del desfile', 'Una frase con retranca para cada puesto, según sus resultados'],
  ['apuestas', 'Apuesta de la batalla del día', 'Adivinar quién gana una batalla de cada ofensiva; título de «El adivino»']
];
// Extras de parejas: sólo cuentan si hay parejas marcadas (en la ficha de cada uno). Se pueden cambiar hasta el desfile.
const EXTRAS_PAREJA = [
  ['duelo', 'Duelo doméstico', 'Cuando una pareja se enfrenta, su batalla sale con corazón partido y, si hay apuestas, es la batalla del día de esa ofensiva'],
  ['sincronia', 'Almas gemelas', 'Al final, en qué porcentaje de batallas votó igual cada pareja (sólo eso), con medallas de «Almas gemelas» y «Guerra fría en casa»'],
  ['lealtad', '¿Lealtad o traición?', 'Al final, cuántas veces votó cada uno a su pareja cuando ésta combatía contra otro. Revela votos: actívalo sólo si las parejas están de acuerdo'],
  ['porraPareja', 'Porra cruzada', 'En la porra, cada uno adivina además el puesto de su pareja'],
  ['guinos', 'Guiños del narrador', 'En el desfile, el narrador comenta cuando una pareja queda cerca o lejos']
];
const enlaceApp = () => location.origin + location.pathname;
const cab = (sobre, titulo, extra = '') => `<header class="fila entre" style="align-items:flex-start"><div class="col g4 crece"><div class="sobre">${esc(sobre)}</div><h1 class="h1">${esc(titulo)}</h1></div>${extra}</header>`;
const volver = (ruta, texto) => `<button class="btn linea chico" style="align-self:flex-start" data-a="ir" data-v="${ruta}">${ico('izq', 14)}${texto}</button>`;
const interruptor = (ruta, valor, titulo, nota) => `<div class="interruptor"><span class="col" style="gap:2px"><span style="font-weight:600">${titulo}</span>${nota ? `<span class="peq t2">${nota}</span>` : ''}</span>
  <button role="switch" aria-checked="${valor ? 'true' : 'false'}" aria-label="${esc(titulo)}" data-a="conmutar" data-v="${ruta}"></button></div>`;
const wasap = (texto) => 'https://wa.me/?text=' + encodeURIComponent(texto);
// Fecha para un campo datetime-local, en la hora del dispositivo.
const localISO = (ts) => { const d = new Date(ts); return new Date(ts - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
export function textoCierre(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) + ' a las ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
accion('desfileFecha', (v, el) => {
  const ts = el.value ? new Date(el.value).getTime() : 0;
  S.ui.plan.desfileTs = ts || null;
  S.ui.plan.desfileFecha = ts ? textoCierre(ts) : '';
  pintar();
});
accion('cierre', (v, el) => {
  const ts = el.value ? new Date(el.value).getTime() : 0;
  S.ui.plan.llamamiento.cierreTs = ts || null;
  S.ui.plan.llamamiento.cierre = ts ? textoCierre(ts) : '';
  pintar();
});

accion('conmutar', (ruta) => {
  const partes = ruta.split('.');
  let o = S.ui;
  partes.slice(0, -1).forEach((p) => { o = o[p]; });
  o[partes[partes.length - 1]] = !o[partes[partes.length - 1]];
  pintar();
});
accion('opcion', (v) => { const [ruta, valor] = v.split('='); poner(S.ui, ruta, /^\d+$/.test(valor) ? Number(valor) : valor); pintar(); });
accion('copiar', async (texto) => {
  try { await navigator.clipboard.writeText(texto); aviso('Copiado.', true); } catch (e) { aviso('No se ha podido copiar. Mantén pulsado el enlace para copiarlo.'); }
});

// ---------------------------------------------------------------- lista de guerras

alEntrar('/guerras', async () => { S.ui.guerras = (await llamar('cuartel', {}, 1)).guerras; pintar(); });
registrar('/guerras', () => {
  const lista = S.ui.guerras;
  if (!lista) return marco(cargando('Abriendo el cuartel general'), { sinNav: true, fondo: 'a', marca: 'Alto mando' });
  return marco(`${cab('Alto mando', 'Tus guerras')}
    <button class="btn" data-a="guerraNueva">${ico('mas')}Plan de guerra nuevo</button>
    ${lista.length ? lista.map((g) => `<div class="caja" style="flex-direction:row;align-items:center;gap:12px">
      <span class="col g4 crece"><strong class="bc" style="font-size:22px;color:#fff">${esc(tituloGuerra(g) || 'Guerra sin nombre')}</strong>
        <span class="peq t2">${NOMBRE_FASE[g.fase]} · creada el ${fecha(g.creada)}</span></span>
      <button class="btn medio ${g.fase === 'publicada' ? 'linea' : ''}" data-a="abrirGuerra" data-v="${g.id}">Abrir</button></div>`).join('')
      : '<div class="caja"><p>Aún no hay ninguna guerra. Empieza por el plan de guerra.</p></div>'}`, { sinNav: true, fondo: 'a', marca: 'Alto mando' });
});
async function abrir(id) {
  const g = (S.ui.guerras || []).find((x) => x.id === id);
  S.guerra = id; S.est = null; S.ui.plan = null; S.ui.pasoPlan = 1; S.ui.ficha = null; S.ui.pliegues = {}; S.ui.extraInfo = null; S.ui.informe = null; S.ui.cursor = null; S.ui.porra = null;
  if (g && g.token) S.sesiones[id] = g.token;
  recordar();
  await refrescar(true);
  ir(['borrador', 'llamamiento'].indexOf(S.est.guerra.fase) >= 0 ? '/plan' : '/cuartel');
}
accion('abrirGuerra', (id) => abrir(id));
accion('guerraNueva', async () => {
  const r = await llamar('crearGuerra', { plan: {} });
  S.ui.guerras = null;
  await abrir(r.id);
});

// ---------------------------------------------------------------- plan de guerra

async function cargarPlan() {
  const d = await llamar('plan', {}, 1);
  S.ui.plan = d.plan; S.ui.planMando = d.mando; S.ui.otrasLista = (d.plan.otras || []).slice();
  const pos = {}; d.plan.gente.forEach((g, k) => { pos[g.id] = k; });
  d.plan.gente.forEach((g) => { g.parejaK = g.pareja && pos[g.pareja] != null ? pos[g.pareja] : null; });
  S.ui.frases = (d.plan.diana.frases || []).join('\n');
  pedirFotos(d.plan.gente.map((g) => g.foto));
}
alEntrar('/plan', async () => { await cargarPlan(); pintar(); });

function filaGente(g, i, cosa) {
  const foto = g.foto && S.fotos[g.foto], p = S.ui.plan;
  const estado = p.llamamiento.activo && g.vota ? `<span class="peq ${g.alistado === true ? 'teal' : g.alistado === false ? 'rosa' : 't2'}">${g.alistado === true ? 'En filas' : g.alistado === false ? 'Objetor' : 'Sin respuesta'}</span>` : '';
  return `<div class="gente-plan">
    ${cosa || p.modo !== 'cosas' ? `<div class="col" style="gap:6px;flex:none;align-items:center"><label class="retrato" title="${foto ? 'Cambiar la foto' : 'Elegir foto'}"><input type="file" accept="image/*" hidden data-c="foto" data-v="${i}">${foto ? `<img src="${foto}" alt="Foto de ${esc(g.nombre)}">` : 'Elegir foto'}</label>
      ${foto ? `<button class="btn chico linea" data-a="reencuadrar" data-v="${i}">Encuadrar</button>` : ''}</div>` : ''}
    <div class="col crece" style="gap:6px">
      <input class="entrada" aria-label="Nombre" maxlength="40" placeholder="Nombre" data-m="plan.gente.${i}.nombre" id="gn-${i}" value="${esc(g.nombre)}">
      ${cosa ? '' : `<input class="entrada" type="email" aria-label="Correo" maxlength="120" placeholder="Correo, para su orden de movilización" data-m="plan.gente.${i}.correo" id="gc-${i}" value="${esc(g.correo)}">`}
      ${cosa || p.modo !== 'cosas' ? `<input class="entrada" aria-label="Frase para su carta" maxlength="100" placeholder="Frase para su carta (hasta 100 caracteres)" data-m="plan.gente.${i}.frase" id="gf-${i}" value="${esc(g.frase)}">` : ''}
      ${cosa || p.gente.length < 2 ? '' : `<label class="campo" style="margin:0"><span>${icono('corazon', 14)} Su pareja en la guerra</span><select id="gp-${i}" data-c="pareja" data-v="${i}">
        <option value="">Sin pareja</option>${p.gente.map((o, k) => k === i || !o.nombre || !o.vota ? '' : `<option value="${k}" ${g.parejaK === k ? 'selected' : ''}>${esc(o.nombre)}${o.parejaK != null && o.parejaK !== i ? ' (ahora con ' + esc((p.gente[o.parejaK] || {}).nombre || '') + ')' : ''}</option>`).join('')}</select></label>`}
      <div class="fila entre">${cosa ? '<span></span>' : `<button class="btn chico ${g.mando ? '' : 'linea'}" data-a="soyYo" data-v="${i}" aria-pressed="${g.mando ? 'true' : 'false'}">${g.mando ? 'Esta carta soy yo' : 'Soy yo'}</button>`}
        ${estado}${p.fase === 'borrador' || p.fase === 'llamamiento' ? `<button class="btn chico peligro" data-a="quitarGente" data-v="${i}">Quitar</button>` : ''}</div>
    </div></div>`;
}
// Frases propias del narrador del desfile: se guardan para todas las guerras del alto mando.
const GRUPOS_FRASE = [['campeon', 'Campeón'], ['segundo', '2.º puesto'], ['tercero', '3.er puesto'], ['ultimo', 'Último puesto'], ['mitad', 'Mitad de tabla']];
// Cuántas rondas y exentos tendrá un torneo con nc contendientes.
function textoTorneo(nc) {
  let R = 1; while (2 ** R < nc) R++;
  const libres = 2 ** R - nc, cruces = nc - 1 + (nc >= 4 ? 1 : 0);
  return `Con ${nc} contendientes habrá ${R} rondas y ${cruces} cruces${nc >= 4 ? ', 3.er puesto incluido' : ''}${libres ? `; ${libres} ${libres === 1 ? 'pasa' : 'pasan'} la primera ronda sin combatir, por sorteo` : ''}.`;
}
function seccionNarrador() {
  const p = S.ui.plan, rep = S.ui.repertorio;
  if (rep === undefined) {
    S.ui.repertorio = null;
    llamar('narrador', {}).then((r) => { S.ui.repertorio = r; pintar(); }).catch(() => { S.ui.repertorio = { frases: [], error: true }; pintar(); });
  }
  const frases = rep ? rep.frases : [];
  const ejemplo = (t) => t.replace(/\{n\}/g, 'María').replace(/\{pos\}/g, '4.º').replace(/\{puntos\}/g, '9 puntos').replace(/\{victorias\}/g, '3 victorias')
    .replace(/\{derrotas\}/g, '2 derrotas').replace(/\{empates\}/g, '1 empate');
  return `<section class="caja"><h2 class="h2">Frases del narrador</h2>
    <p class="med t2">Tus propias frases para el desfile. Se guardan para todas tus guerras y salen antes que las de serie: si escribes dos para el campeón, el campeón se llevará una de las tuyas.${p.extras && p.extras.narrador === false ? ' <strong class="rosa">En esta guerra el narrador está apagado</strong> (en Extras).' : ''}</p>
    <p class="peq t2">Pon <strong>{n}</strong> donde va el nombre. También puedes usar {pos} (4.º), {puntos}, {victorias}, {derrotas} y {empates}.</p>
    ${!rep ? '<p class="peq t2">Cargando tus frases…</p>' : GRUPOS_FRASE.map(([c, t]) => {
      const mias = frases.filter((f) => f.cat === c);
      return mias.length ? `<div class="col g4"><span class="etiqueta">${t}</span>${mias.map((f) => `<div class="fila entre" style="gap:8px;align-items:flex-start"><span class="med" style="font-style:italic">«${esc(f.texto)}»<br><span class="peq t2" style="font-style:normal">${esc(ejemplo(f.texto))}</span></span>
        <button class="btn chico linea" data-a="borrarFrase" data-v="${f.id}" aria-label="Borrar la frase">Borrar</button></div>`).join('')}</div>` : '';
    }).join('')}
    ${rep && !frases.length ? '<p class="peq t2">Aún no tienes frases propias.</p>' : ''}
    <div class="col g4"><label class="campo" style="margin:0"><span>Para</span><select id="nf-cat">${GRUPOS_FRASE.map(([c, t]) => `<option value="${c}">${t}</option>`).join('')}</select></label>
      <label class="campo" style="margin:0"><span>Frase nueva</span><input id="nf-texto" maxlength="220" placeholder="{n} acaba {pos}: lo normal, vaya."></label>
      <button class="btn linea medio" data-a="anadirFrase">Guardar la frase</button></div></section>`;
}
accion('anadirFrase', async () => {
  const cat = document.getElementById('nf-cat').value, texto = document.getElementById('nf-texto').value.trim();
  if (!texto) return aviso('Escribe la frase.');
  S.ui.repertorio = await llamar('guardarFrase', { cat, texto });
  aviso('Frase guardada para todas tus guerras.', true);
  pintar();
});
accion('borrarFrase', async (id) => { S.ui.repertorio = await llamar('guardarFrase', { borrar: id }); pintar(); });

// Presentación: una página sólo explicativa, para animar a la gente antes de meterla en la guerra.
function seccionPresentacion() {
  const p = S.ui.plan;
  if (!p.presenta) return `<section class="caja"><h2 class="h2">Presentación de la guerra</h2><p class="med t2">Una página que explica el juego para animar a la gente a participar. Guarda el plan para obtener su enlace.</p></section>`;
  const url = enlaceApp() + '#p=' + p.presenta, nombre = tituloGuerra(p) || 'una guerra';
  // El correo y el WhatsApp van en texto plano: lo esencial en líneas cortas con emoji, y el resto en la página.
  const lineas = [
    p.modo === 'cosas' ? '⚔️ Dos contendientes, una pregunta: eliges cuál gana.' : '⚔️ Todos contra todos: dos de nosotros, una pregunta, y eliges a uno.',
    p.ritmo === 'diaria' ? '📱 Unas pocas batallas cada mañana, desde el móvil y sin instalar nada.' : '📱 Votas desde el móvil, a tu ritmo y sin instalar nada.',
    '🤫 En secreto: nadie sabrá a quién has votado.',
    p.extras && p.extras.desfile ? '🥁 Y al final, el desfile de la victoria: la clasificación, en directo.' : '📜 Al final, el parte de guerra con la clasificación.'
  ].concat(p.premio ? ['🏆 Premio: ' + p.premio] : []);
  const texto = `Se avecina la ${nombre}${p.pregunta ? ': «' + p.pregunta + '»' : ''}\n\n${lineas.join('\n')}\n\n👉 Mira de qué va: ${url}\n\nSi te alistas, avísame y te meto en la guerra.`;
  const correo = 'mailto:?subject=' + encodeURIComponent('Se avecina la ' + nombre) + '&body=' + encodeURIComponent(texto + (p.firma ? '\n\n' + p.firma : ''));
  return `<section class="caja oro"><h2 class="h2">Presentación de la guerra</h2>
    <p class="med t2">Una página que explica de qué va el juego, para animar a la gente. Es sólo para leer: no tiene botones, ni cartas, ni nombres. Quien quiera participar te avisa a ti y tú lo reclutas aquí.</p>
    <label class="campo"><span>Tu mensaje (opcional)</span><textarea id="p-pitch" maxlength="600" data-m="plan.pitch" placeholder="Compañeros: ha llegado la hora de saber quién es quién.">${esc(p.pitch || '')}</textarea></label>
    <p class="peq t2" style="margin-top:-6px">Sale firmado por ti. La página usa el nombre, la pregunta, el premio y los extras de este plan: guarda antes de compartirla.</p>
    <a class="btn oro medio" href="${esc(url)}" target="_blank" rel="noopener">Ver la presentación</a>
    <div class="fila" style="flex-wrap:wrap"><a class="btn medio linea crece" href="${wasap(texto)}" target="_blank" rel="noopener">${ico('wasap')}Por WhatsApp</a>
      <a class="btn medio linea crece" href="${esc(correo)}">Por correo</a>
      <button class="btn linea medio" data-a="copiar" data-v="${esc(url)}">${ico('copiar')}Copiar enlace</button></div></section>`;
}

function seccionLlamamiento() {
  const p = S.ui.plan, m = S.ui.planMando || {};
  if (!p.llamamiento.activo) {
    return `<section class="caja"><h2 class="h2">Llamamiento a filas</h2>
      <p class="med t2">Opcional, pero recomendable. Antes de declarar la guerra, avisa de que se avecina: cada uno recibe por correo una explicación del juego y responde si se alista. También puedes mandarlo por WhatsApp. Todos ven quién responde.</p>
      <button class="btn linea medio" data-a="abrirLlamamiento">Abrir el llamamiento</button></section>`;
  }
  const votan = p.gente.filter((g) => g.vota), si = votan.filter((g) => g.alistado === true), no = votan.filter((g) => g.alistado === false);
  const nada = votan.filter((g) => g.alistado == null), url = enlaceApp() + '#g=' + m.general;
  const texto = `¡Se avecina una guerra! El alto mando prepara la ${p.nombre}: «${p.pregunta}». Entra, mira de qué va, busca tu carta y di si te alistas: ${url}`;
  const conCorreo = nada.filter((g) => !g.mando && g.correo), sinEnviar = conCorreo.filter((g) => !g.llamada);
  const enviados = votan.filter((g) => g.llamada), fallidos = votan.filter((g) => g.llamadaError);
  const hora = (ts) => new Date(ts).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<section class="caja teal"><h2 class="h2">Llamamiento a filas</h2>
    <div class="rejilla3 centro"><div><b class="bc teal" style="font-size:28px">${si.length}</b><div class="peq t2">En filas</div></div>
      <div><b class="bc" style="font-size:28px">${nada.length}</b><div class="peq t2">Sin respuesta</div></div><div><b class="bc rosa" style="font-size:28px">${no.length}</b><div class="peq t2">Objetores</div></div></div>
    ${nada.length ? `<p class="med t2">Sin respuesta: ${esc(enumerar(nada.map((g) => g.nombre)))}.</p>` : ''}${no.length ? `<p class="med t2">Objetor: ${esc(enumerar(no.map((g) => g.nombre)))}.</p>` : ''}
    <label class="campo"><span>Tu mensaje para el correo (opcional, va antes de la explicación del juego)</span><textarea id="nota" maxlength="1500" data-m="plan.llamamiento.nota" placeholder="Reclutas: ha llegado la hora.">${esc(p.llamamiento.nota || '')}</textarea></label>
    <button class="btn linea chico" style="align-self:flex-start" data-a="previa" data-v="llamamiento">Ver cómo queda el correo</button>
    ${sinEnviar.length ? `<button class="btn medio" data-a="llamarCorreo" data-v="0">Llamamiento por correo (${sinEnviar.length})</button>`
      : conCorreo.length ? `<button class="btn linea medio" data-a="llamarCorreo" data-v="1">Reenviar a quien no contesta (${conCorreo.length})</button>` : ''}
    ${enviados.length ? `<p class="peq t2">Correo enviado a ${esc(enumerar(enviados.map((g) => g.nombre + ' (' + hora(g.llamada) + ')')))}. Cada uno llega directo a su carta.</p>` : '<p class="peq t2">El correo sale desde tu Gmail, explica el juego y lleva a cada uno directo a su carta con un enlace sólo suyo.</p>'}
    ${fallidos.length ? `<p class="peq rosa">No se pudo enviar a ${esc(enumerar(fallidos.map((g) => g.nombre)))}: revisa su correo.</p>` : ''}
    <div class="fila" style="flex-wrap:wrap"><a class="btn medio linea crece" href="${wasap(texto)}" target="_blank" rel="noopener">${ico('wasap')}Por WhatsApp</a>
      <button class="btn linea medio" data-a="copiar" data-v="${esc(url)}">${ico('copiar')}Copiar enlace</button></div>
    <label class="campo"><span>Cierre del alistamiento</span><input id="cierre" type="datetime-local" data-c="cierre" value="${p.llamamiento.cierreTs ? localISO(p.llamamiento.cierreTs) : ''}"></label>
    ${p.llamamiento.cierre ? `<p class="peq t2">Se anunciará así: «${esc(p.llamamiento.cierre)}». La guerra no se declara sola: a esa hora, pulsa tú «¡Declarar la guerra!».</p>` : ''}
    ${interruptor('plan.llamamiento.soloAlistados', p.llamamiento.soloAlistados, 'Al declarar la guerra, sólo entran los alistados', 'Quien no conteste se queda fuera')}
    ${(m.voluntarios || []).map((v) => `<div class="fila entre"><span><strong>${esc(v.nombre)}</strong> se presenta voluntario</span>
      <span class="fila"><button class="btn chico" data-a="reclutar" data-v="${v.id}:1">Reclutar</button><button class="btn chico linea" data-a="reclutar" data-v="${v.id}:0">Descartar</button></span></div>`).join('')}
    ${nada.length ? `<div class="col"><span class="etiqueta">Último parte a los ${nada.length} rezagados: se abre WhatsApp con el parte de cada uno ya escrito, eliges a quién y pulsas enviar.</span>
      <div class="fila" style="flex-wrap:wrap">${nada.map((g) => `<a class="btn chico rosa" target="_blank" rel="noopener" href="${wasap(`ÚLTIMO PARTE DE RECLUTAMIENTO. Recluta ${g.nombre}: el alto mando sigue sin noticias suyas. Stop. ${p.llamamiento.cierre ? 'La guerra se declara el ' + p.llamamiento.cierre + '. Stop. ' : ''}Lea el parte y responda aquí: ${url}&r=${g.id}&parte=1`)}">${esc(g.nombre)}</a>`).join('')}</div></div>` : ''}
  </section>`;
}

function seccionOrdenanzas() {
  const p = S.ui.plan, propias = p.ordenanzas;
  if (!propias) {
    return `<section class="caja"><h2 class="h2">Ordenanzas</h2>
      <p class="med t2">Se escriben solas con la puntuación y los extras que elijas. Son las reglas que leerán los combatientes.</p>
      <ol class="col" style="margin:0;padding:0;list-style:none;gap:12px">${p.ordenanzasAuto.map((r, k) => `<li class="col g4" style="padding-left:12px;border-left:3px solid #2a2648"><strong class="bc" style="font-size:18px;color:#fff">${k + 1}. ${esc(r.t)}</strong><span class="med t3" style="white-space:pre-line">${esc(r.x)}</span></li>`).join('')}</ol>
      <button class="btn linea medio" data-a="ordPersonalizar">Personalizar las ordenanzas</button></section>`;
  }
  return `<section class="caja"><h2 class="h2">Ordenanzas</h2>
    <p class="med t2">Personalizadas. Si cambias la puntuación o los extras, ya no se actualizan solas: revísalas.</p>
    ${propias.map((r, k) => `<div class="col" style="gap:6px;padding:10px;border:1px solid #2a2648;border-radius:12px;background:#1c1836">
      <div class="fila"><b class="bc teal" style="font-size:24px;width:24px">${k + 1}</b><input class="entrada" id="ot-${k}" aria-label="Título de la ordenanza ${k + 1}" maxlength="80" data-m="plan.ordenanzas.${k}.t" value="${esc(r.t)}"></div>
      <textarea class="entrada" id="ox-${k}" aria-label="Texto de la ordenanza ${k + 1}" maxlength="1200" rows="7" style="resize:vertical;line-height:1.4" data-m="plan.ordenanzas.${k}.x">${esc(r.x)}</textarea>
      <div class="fila" style="justify-content:flex-end">
        <button class="cuadro" data-a="ordMover" data-v="${k}:-1" aria-label="Subir la ordenanza ${k + 1}" ${k === 0 ? 'disabled' : ''}>${ico('arriba')}</button>
        <button class="cuadro" data-a="ordMover" data-v="${k}:1" aria-label="Bajar la ordenanza ${k + 1}" ${k === propias.length - 1 ? 'disabled' : ''}>${ico('abajo')}</button>
        <button class="btn chico peligro" data-a="ordQuitar" data-v="${k}">Quitar</button></div></div>`).join('')}
    <button class="btn linea medio" data-a="ordAnadir">${ico('mas')}Añadir ordenanza</button>
    <button class="btn chico linea" style="align-self:center" data-a="ordAuto">Volver a las automáticas</button></section>`;
}
accion('ordPersonalizar', () => { S.ui.plan.ordenanzas = JSON.parse(JSON.stringify(S.ui.plan.ordenanzasAuto)); pintar(); });
accion('ordAuto', () => { S.ui.plan.ordenanzas = null; pintar(); });
accion('ordQuitar', (k) => { S.ui.plan.ordenanzas.splice(Number(k), 1); if (!S.ui.plan.ordenanzas.length) S.ui.plan.ordenanzas = null; pintar(); });
accion('ordAnadir', () => {
  S.ui.plan.ordenanzas.push({ t: '', x: '', puntos: false });
  pintar();
  const el = document.getElementById('ot-' + (S.ui.plan.ordenanzas.length - 1));
  if (el) el.focus();
});
accion('ordMover', (v) => {
  const [k, d] = v.split(':').map(Number), o = S.ui.plan.ordenanzas, j = k + d;
  if (j < 0 || j >= o.length) return;
  const t = o[k]; o[k] = o[j]; o[j] = t;
  pintar();
});

// ---------------------------------------------------------------- el plan, por pasos
const PASOS = [['casco', 'Guerra', 'La guerra'], ['tropa', 'Tropa', 'Combatientes'], ['reglas', 'Reglas', 'Reglas'], ['extras', 'Extras', 'Extras'],
  ['correo', 'Correo', 'Correo y presentación'], ['bandera', 'Revisar', 'Revisar y declarar']];
const ICONO_EXTRA = { porra: 'porra', espia: 'espia', desfile: 'desfile', proclamas: 'proclama', condecoraciones: 'medalla', radio: 'radio', parte: 'parte',
  corneta: 'corneta', termometro: 'termo', narrador: 'micro', apuestas: 'apuesta', duelo: 'roto', sincronia: 'sincro', lealtad: 'corazon', porraPareja: 'diana2', guinos: 'micro' };
const CORTO_EXTRA = { porra: ['La porra', 'Adivinar el parte'], espia: ['El espía', 'Un chivatazo'], desfile: ['Desfile', 'El parte, en directo'],
  proclamas: ['Proclamas', 'Razones sin firma'], condecoraciones: ['Medallas', 'Rebelde, borrego…'], radio: ['Radio Macuto', 'Pullas anónimas'],
  parte: ['Parte', 'A mitad de guerra'], corneta: ['Corneta', 'Suena en tu móvil'], termometro: ['Termómetro', '¿Con la mayoría?'],
  narrador: ['Narrador', 'Frases en el desfile'], apuestas: ['Batalla del día', 'Apuesta y adivino'],
  duelo: ['Duelo doméstico', 'Pareja contra pareja'], sincronia: ['Almas gemelas', '¿Votan igual?'], lealtad: ['¿Lealtad?', '¿Vota a su pareja?'],
  porraPareja: ['Porra cruzada', 'El puesto de tu pareja'], guinos: ['Guiños', 'El narrador, cotilla'] };

function numeros(p) {
  const combaten = p.gente.filter((g) => g.combate), nc = combaten.length;
  const torneo = p.formato === 'torneo', ofensivas = nc % 2 ? nc : nc - 1;
  let rondas = 1; while (2 ** rondas < nc) rondas++;
  return { nc, votan: p.gente.filter((g) => g.vota).length, torneo, ofensivas, rondas, batallas: torneo ? nc - 1 + (nc >= 4 ? 1 : 0) : nc * (nc - 1) / 2 };
}
function cabeceraPlan(n) {
  return `<header class="plan-cab"><div class="fila entre" style="align-items:flex-start">
      <div class="col g4"><span class="sobre">Plan de guerra · paso ${n} de 6</span><h1 class="h1">${PASOS[n - 1][2]}</h1></div>
      ${S.ui.planGuardado ? `<span class="peq teal fila" style="gap:4px;white-space:nowrap">${icono('visto', 14, 3)}Guardado</span>` : ''}</div>
    <ol class="pasos" aria-label="Pasos del plan">${PASOS.map(([ic, t], i) => {
      const k = i + 1, est = k < n ? 'hecho' : k === n ? 'actual' : '';
      return `<li class="${est}"><button data-a="pasoPlan" data-v="${k}" ${k === n ? 'aria-current="step"' : ''} aria-label="Paso ${k}: ${PASOS[i][2]}"><span class="punto">${icono(k < n ? 'visto' : ic, 16, k < n ? 3 : 2)}</span><span class="nombre">${t}</span></button></li>`;
    }).join('')}</ol></header>`;
}
function piePlan(n, previa) {
  const sig = n < 6 ? `<button class="btn crece" data-a="pasoPlan" data-v="${n + 1}">Siguiente: ${['', 'combatientes', 'reglas', 'extras', 'correo', 'revisar'][n]}${icono('flecha', 20, 2.6)}</button>`
    : previa ? `<button class="btn rosa crece" data-a="declarar">¡Declarar la guerra!</button>` : `<button class="btn crece" data-a="guardarPlan">Guardar cambios</button>`;
  return `<footer class="plan-pie">${n > 1 ? `<button class="btn linea cuadro-grande" data-a="pasoPlan" data-v="${n - 1}" aria-label="Paso anterior">${icono('atras', 20, 2.6)}</button>` : ''}${sig}</footer>`;
}
// Bloque plegable: una fila con icono y resumen que se abre al tocarla.
function pliegue(clave, ic, titulo, resumen, contenido, abiertoPorDefecto) {
  const pl = S.ui.pliegues || (S.ui.pliegues = {});
  const abierto = pl[clave] != null ? pl[clave] : !!abiertoPorDefecto;
  return `<section class="pliegue ${abierto ? 'abierto' : ''}"><button class="pliegue-cab" data-a="plegar" data-v="${clave}" aria-expanded="${abierto}">
    <span class="pliegue-ico">${icono(ic, 22)}</span><span class="col crece" style="gap:2px;text-align:left"><strong>${titulo}</strong>${resumen ? `<span class="peq t2">${resumen}</span>` : ''}</span>${icono(abierto ? 'arriba' : 'abajo', 18)}</button>
    ${abierto ? `<div class="pliegue-cuerpo">${contenido}</div>` : ''}</section>`;
}
accion('plegar', (k) => { const pl = S.ui.pliegues || (S.ui.pliegues = {}); const el = document.querySelector(`[data-a="plegar"][data-v="${k}"]`); pl[k] = !(el && el.getAttribute('aria-expanded') === 'true'); pintar(); });
function eleccion(titulo, pregunta, opciones, ruta, actual, color) {
  return `<section class="col g8"><div class="fila entre" style="align-items:baseline"><h2 class="h2">${titulo}</h2><span class="peq t2">${pregunta}</span></div>
    <div class="elecciones">${opciones.map(([valor, nombre, desc, ilu]) => {
      const sel = actual === valor;
      return `<button class="eleccion ${sel ? 'sel' : ''}" style="--c:${color}" aria-pressed="${sel}" data-a="opcion" data-v="${ruta}=${valor}">
        ${sel ? `<span class="marca-sel" aria-hidden="true">${icono('visto', 13, 3.4)}</span>` : ''}${ILU[ilu](sel ? color : '#8f7bff')}
        <span class="bc nombre">${nombre}</span><span class="peq t2">${desc}</span></button>`;
    }).join('')}</div></section>`;
}
function estadoFicha(g, p, cosa) {
  if (g.mando) return ['oro', 'Tú · alto mando'];
  if (!cosa && !g.nombre) return ['rosa', 'Falta el nombre'];
  if (!cosa && !g.correo) return ['naranja', 'Falta el correo'];
  if (p.llamamiento.activo && g.vota) return g.alistado === true ? ['teal', 'En filas'] : g.alistado === false ? ['rosa', 'Objetor'] : ['t2', 'Sin respuesta'];
  return ['teal', 'Listo'];
}
function rejillaGente(indices, cosa, previa) {
  const p = S.ui.plan;
  return `<ul class="fichas">${indices.map((i) => {
    const g = p.gente[i], [color, estado] = estadoFicha(g, p, cosa);
    return `<li><button class="ficha ${g.mando ? 'yo' : ''}" data-a="abrirFicha" data-v="${i}" aria-label="Editar a ${esc(g.nombre || 'sin nombre')}">
      ${avatar(Object.assign({ id: 'p' + i }, g), 'ficha-foto')}<strong>${esc(g.nombre || 'Sin nombre')}</strong><span class="peq ${color}">${estado}</span>${g.parejaK != null && p.gente[g.parejaK] ? `<span class="peq rosa">${icono('corazon', 12)} ${esc(p.gente[g.parejaK].nombre)}</span>` : ''}</button></li>`;
  }).join('')}${previa ? `<li><button class="ficha nueva" data-a="masGente" data-v="${cosa ? 'cosa' : 'persona'}">${icono('mas', 26)}${cosa ? 'Añadir' : 'Reclutar'}</button></li>` : ''}</ul>`;
}
function hojaFicha() {
  const p = S.ui.plan, i = S.ui.ficha;
  if (i == null || !p.gente[i]) return '';
  const g = p.gente[i], cosa = !g.vota;
  return `<div class="hoja-fondo" data-a="cerrarFicha" aria-hidden="true"></div>
    <section class="hoja" role="dialog" aria-modal="true" aria-label="Editar a ${esc(g.nombre || 'un combatiente')}"><span class="hoja-asa" aria-hidden="true"></span>
      ${filaGente(g, i, cosa)}
      <button class="btn medio" data-a="cerrarFicha">Hecho</button></section>`;
}
accion('abrirFicha', (i) => { S.ui.ficha = Number(i); pintar(); const el = document.getElementById('gn-' + i); if (el && !el.value) el.focus(); });
accion('cerrarFicha', () => { S.ui.ficha = null; pintar(); });

function paso1(p, previa) {
  const otras = S.ui.otrasLista || (S.ui.otrasLista = (p.otras || []).slice());
  return `<p class="t3">Lo esencial: cómo se llama la guerra y qué se dirime. <strong style="color:#fff">Todo lo demás es opcional.</strong></p>
    <section class="caja"><label class="campo"><span>Nombre</span><input id="p-nombre" maxlength="80" data-m="plan.nombre" value="${esc(p.nombre)}" placeholder="Guerra de la Normalidad" ${previa ? '' : 'disabled'}></label>
      <label class="campo"><span>Campo de batalla</span><input id="p-campo" maxlength="60" data-m="plan.campo" value="${esc(p.campo || '')}" placeholder="Familia, compañeros de trabajo, amigos…"></label>
      <p class="peq t2" style="margin-top:-6px">El grupo que combate. Cada campo de batalla lleva su propio escalafón.</p></section>
    <section class="caja oro"><div class="fila" style="gap:8px"><span class="oro">${icono('vs', 22)}</span><h2 class="h2">La pregunta</h2></div>
      <input id="p-pregunta" class="pregunta-grande" aria-label="La pregunta" maxlength="160" data-m="plan.pregunta" value="${esc(p.pregunta)}" placeholder="¿Quién es más normal?" ${previa ? '' : 'disabled'}>
      ${otras.map((q, k) => `<div class="fila" style="gap:8px"><b class="bc t2" style="width:22px;font-size:18px">${k + 2}</b><input class="crece" id="p-otra-${k}" aria-label="Pregunta ${k + 2}" maxlength="160" data-m="otrasLista.${k}" value="${esc(q)}" ${previa ? '' : 'disabled'}>
        ${previa ? `<button class="cuadro" data-a="quitarPregunta" data-v="${k}" aria-label="Quitar la pregunta ${k + 2}">${ico('equis', 16)}</button>` : ''}</div>`).join('')}
      ${previa && otras.length < 4 ? `<button class="btn linea medio discontinuo" data-a="otraPregunta">${ico('mas')}Otra pregunta (hasta 5)</button>` : ''}
      <p class="peq t2">${otras.length ? 'Cada ofensiva usa una, por turnos, y cada pregunta tiene su campeón, que se revela en el desfile.' : 'Puedes añadir más: cada ofensiva usaría una, por turnos.'}</p></section>
    ${pliegue('premio', 'medalla', 'Premio, botín y firma', [p.premio, p.botin, p.firma].filter(Boolean).map(esc).join(' · ') || 'Opcional', `
      <label class="campo"><span>Premio</span><input id="p-premio" maxlength="160" data-m="plan.premio" value="${esc(p.premio)}" placeholder="Una cena pagada por los demás"></label>
      <label class="campo"><span>Botín de la porra</span><input id="p-botin" maxlength="160" data-m="plan.botin" value="${esc(p.botin)}" placeholder="2 € por cabeza"></label>
      <label class="campo"><span>Tu firma como alto mando</span><input id="p-firma" maxlength="60" data-m="plan.firma" value="${esc(p.firma || '')}" placeholder="Francisco M. Romero"></label>
      <p class="peq t2" style="margin-top:-6px">Así firmas los correos y el diploma. Si lo dejas vacío, se usa el nombre de tu carta.</p>`)}
    ${pliegue('desfile', 'desfile', 'Día y lugar del desfile', esc([p.desfileFecha, p.desfileInfo].filter(Boolean).join(', ')) || 'Opcional', `
      <label class="campo"><span>Día y hora</span><input id="p-desfile-ts" type="datetime-local" data-c="desfileFecha" value="${p.desfileTs ? localISO(p.desfileTs) : ''}"></label>
      <p class="peq t2" style="margin-top:-6px">Con fecha y hora, cada combatiente podrá apuntárselo en su calendario.</p>
      <label class="campo"><span>Lugar y detalles</span><input id="p-desfile" maxlength="200" data-m="plan.desfileInfo" value="${esc(p.desfileInfo)}" placeholder="En el bar de siempre"></label>`)}`;
}
accion('otraPregunta', () => { S.ui.otrasLista.push(''); pintar(); const el = document.getElementById('p-otra-' + (S.ui.otrasLista.length - 1)); if (el) el.focus(); });
accion('quitarPregunta', (k) => { S.ui.otrasLista.splice(Number(k), 1); pintar(); });

function paso2(p, previa) {
  const cosas = p.modo === 'cosas', idx = p.gente.map((g, i) => i);
  const combaten = idx.filter((i) => p.gente[i].combate), votan = idx.filter((i) => p.gente[i].vota), n = numeros(p);
  const ll = p.llamamiento;
  const resLl = ll.activo ? `${p.gente.filter((g) => g.vota && g.alistado === true).length} en filas · ${p.gente.filter((g) => g.vota && g.alistado == null).length} sin responder` : 'Pregunta antes quién se apunta';
  return `<div class="fila entre" style="align-items:baseline"><p style="margin:0"><b class="bc" style="font-size:32px;color:#fff">${n.votan}</b> <span class="t3">combatientes</span></p>
      <span class="peq t2">${n.nc >= 3 ? (n.torneo ? `${n.rondas} rondas · ${n.batallas} cruces` : `${n.ofensivas} ofensivas · ${n.batallas} batallas`) : 'Hacen falta al menos 3'}</span></div>
    ${cosas ? `<h2 class="h2">Contendientes</h2>${rejillaGente(combaten, true, previa)}<h2 class="h2">Quién vota</h2>` : ''}
    ${rejillaGente(votan, false, previa)}
    <p class="peq t2 centro">Toca una ficha para editar su nombre, correo, foto y grito de guerra. Marca «Soy yo» en la tuya.</p>
    ${previa ? pliegue('llamamiento', 'corneta', 'Llamamiento a filas', resLl, seccionLlamamiento().replace(/^<section class="caja[^"]*">/, '<div class="col g12">').replace(/<\/section>\s*$/, '</div>')) : ''}
    ${previa ? pliegue('modo', 'tropa', '¿Compiten personas u otra cosa?', cosas ? 'Ahora: otras cosas (bodas, películas…)' : 'Ahora: los propios combatientes', `
      <div class="elecciones">${[['combatientes', 'Los combatientes', 'Cada uno es contendiente y no vota en sus combates.', 'personas'], ['cosas', 'Otra cosa', 'Bodas, películas, tortillas… y todos votan todo.', 'cosas']].map(([v, t, d, il]) => {
        const sel = (v === 'cosas') === cosas;
        return `<button class="eleccion ${sel ? 'sel' : ''}" style="--c:#5ef0d0" aria-pressed="${sel}" data-a="modo" data-v="${v}">${sel ? `<span class="marca-sel" aria-hidden="true">${icono('visto', 13, 3.4)}</span>` : ''}${ILU[il](sel ? '#5ef0d0' : '#8f7bff')}<span class="bc nombre">${t}</span><span class="peq t2">${d}</span></button>`;
      }).join('')}</div>`) : ''}
    ${hojaFicha()}`;
}

function paso3(p, previa) {
  const n = numeros(p);
  if (!previa) return `<div class="caja"><p>La guerra ya está declarada: las reglas no se pueden cambiar.</p><p class="med t2">${n.torneo ? 'Torneo por eliminatorias' : 'Liga'} · ${p.ritmo === 'diaria' ? 'una ofensiva al día' : 'todas de golpe'} · ${p.puntuacion === 'votos' ? 'por votos' : '3-1-0'}</p></div>`;
  const resumen = n.nc < 3 ? 'Recluta al menos 3 contendientes para ver cuánto durará.'
    : n.torneo ? `${textoTorneo(n.nc)} Cada ronda se abre cuando se cierra la anterior.`
    : p.ritmo === 'diaria' ? `La guerra dura <strong style="color:#fff">al menos ${n.ofensivas} días</strong>, ${n.batallas} batallas, y cada mañana llega un correo con las nuevas.`
    : `${n.batallas} batallas en ${n.ofensivas} ofensivas, todas abiertas desde el primer momento.`;
  return eleccion('Formato', '¿Cómo se enfrentan?', [['liga', 'Liga', 'Todos contra todos. Gana quien más puntos suma.', 'liga'], ['torneo', 'Torneo', 'Cruces de uno contra uno. Sólo pasa uno.', 'torneo']], 'plan.formato', n.torneo ? 'torneo' : 'liga', '#5ef0d0') +
    (n.torneo ? '' : eleccion('Ritmo', '¿Cuándo se vota?', [['golpe', 'De golpe', `Las ${n.nc >= 3 ? n.ofensivas + ' ' : ''}ofensivas a la vez. Cada uno, a su ritmo.`, 'golpe'], ['diaria', 'Una al día', 'Una ofensiva nueva cada mañana a las 9:00.', 'dia']], 'plan.ritmo', p.ritmo === 'diaria' ? 'diaria' : 'golpe', '#ffd36a') +
      eleccion('Puntos', '¿Cómo se gana?', [['liga', 'Como en la liga', 'Ganar, empatar o perder cada batalla.', 'p310'], ['votos', 'Por votos', 'Cada voto recibido suma 3 puntos.', 'votos']], 'plan.puntuacion', p.puntuacion === 'votos' ? 'votos' : 'liga', '#5ef0d0')) +
    `<section class="caja fila" style="gap:10px;align-items:center;padding:12px"><span class="oro">${icono(n.torneo ? 'cuadro' : p.ritmo === 'diaria' ? 'sol' : 'rayo', 26)}</span><p class="med" style="margin:0;color:#cdc8e6">${resumen}</p></section>`;
}

function paso4(p, previa) {
  const claves = EXTRAS.map((e) => e[0]), on = claves.filter((k) => p.extras[k]).length, info = S.ui.extraInfo && EXTRAS.concat(EXTRAS_PAREJA).find((e) => e[0] === S.ui.extraInfo);
  return `<div class="fila entre"><p style="margin:0"><b class="bc teal" style="font-size:32px">${on}</b> <span class="t3">de ${claves.length} encendidos</span></p>
      <button class="btn linea chico" data-a="todosExtras">${on === claves.length ? 'Apagar todos' : 'Encender todos'}</button></div>
    <div class="extras-rejilla">${EXTRAS.map(([k]) => {
      const si = !!p.extras[k], [t, d] = CORTO_EXTRA[k];
      return `<button class="extra ${si ? 'on' : ''}" aria-pressed="${si}" data-a="extra" data-v="${k}"><span class="luz" aria-hidden="true"></span>${icono(ICONO_EXTRA[k], 32, 1.8)}<span class="bc">${t}</span><span class="peq">${d}</span></button>`;
    }).join('')}</div>
    <section class="col g8 amor-plan">${escena('beso', 'El americano y el prusiano se besan sobre la trinchera', 96)}
      <div class="fila entre" style="align-items:baseline"><h2 class="h2">En el amor y en la guerra</h2>
        <span class="peq ${parejasPlan(p).length ? 'rosa' : 't2'}" style="white-space:nowrap">${parejasPlan(p).length ? plural(parejasPlan(p).length, 'pareja', 'parejas') : 'Sin parejas'}</span></div>
      <p class="peq t2" style="margin:0">${parejasPlan(p).length ? 'Sólo cuentan entre las parejas que marcaste. Se pueden cambiar hasta el desfile.' : 'Para que cuenten, marca quién es pareja de quién en la ficha de cada uno (paso 2).'}</p>
      <div class="extras-rejilla">${EXTRAS_PAREJA.map(([k]) => {
        const si = !!p.extras[k], [t, d] = CORTO_EXTRA[k];
        return `<button class="extra rosa-extra ${si ? 'on' : ''}" aria-pressed="${si}" data-a="extra" data-v="${k}"><span class="luz" aria-hidden="true"></span>${icono(ICONO_EXTRA[k], 32, 1.8)}<span class="bc">${t}</span><span class="peq">${d}</span></button>`;
      }).join('')}</div></section>
    ${info ? `<section class="caja ${p.extras[info[0]] ? 'teal' : ''}" style="padding:12px;gap:6px"><div class="fila" style="gap:8px"><span class="${p.extras[info[0]] ? 'teal' : 't2'}">${icono(ICONO_EXTRA[info[0]], 22)}</span><strong class="bc" style="font-size:18px">${info[1]}</strong><span class="peq ${p.extras[info[0]] ? 'teal' : 't2'}">${p.extras[info[0]] ? 'Encendido' : 'Apagado'}</span></div><p class="med" style="margin:0;color:#cdc8e6">${info[2]}.</p></section>`
      : '<p class="peq t2 centro">Toca una ficha para encenderla o apagarla; aquí verás qué hace.</p>'}
    ${pliegue('diana', 'diana', 'Toque de diana', p.diana.activa ? `Recordatorio cada ${plural(p.diana.cadaDias, 'día', 'días')}` : 'Apagado', `
      ${interruptor('plan.diana.activa', p.diana.activa, 'Recordar a los rezagados', 'Un correo automático, sólo de día')}
      <div class="opciones">${[1, 2, 3].map((d) => `<button aria-pressed="${p.diana.cadaDias === d}" data-a="opcion" data-v="plan.diana.cadaDias=${d}">Cada ${plural(d, 'día', 'días')}</button>`).join('')}</div>
      <label class="campo"><span>Tus frases, una por línea. Usa {nombre} y {faltan}</span><textarea id="p-frases" data-m="frases" placeholder="Si lo dejas vacío: «{nombre}, el enemigo sigue esperando: te quedan {faltan} batallas.»">${esc(S.ui.frases || '')}</textarea></label>`)}`;
}
accion('extra', (k) => { S.ui.plan.extras[k] = !S.ui.plan.extras[k]; S.ui.extraInfo = k; pintar(); });
accion('todosExtras', () => { const p = S.ui.plan, todos = EXTRAS.every(([k]) => p.extras[k]); EXTRAS.forEach(([k]) => { p.extras[k] = !todos; }); pintar(); });

function paso5(p) {
  const orden = `<label class="campo"><span>Asunto</span><input id="p-asunto" maxlength="150" data-m="plan.correo.asunto" value="${esc(p.correo.asunto)}" placeholder="¡Comienza la ${esc(p.nombre || 'guerra')}!"></label>
    <label class="campo"><span>Apertura</span><textarea id="p-apertura" maxlength="1500" data-m="plan.correo.apertura">${esc(p.correo.apertura)}</textarea></label>
    <label class="campo"><span>Remate</span><textarea id="p-remate" maxlength="1500" data-m="plan.correo.remate">${esc(p.correo.remate)}</textarea></label>
    <p class="peq t2">El enlace personal de cada uno va en medio.</p>`;
  const sinCaja = (h) => h.replace(/^<section class="caja[^"]*">\s*<h2 class="h2">[^<]*<\/h2>/, '<div class="col g12">').replace(/<\/section>\s*$/, '</div>');
  const ej = p.gente.find((g) => g.vota && !g.mando) || { nombre: 'Recluta' };
  return `<section class="col g8"><div class="fila entre" style="align-items:baseline"><h2 class="h2">Orden de movilización</h2><span class="peq t2">Correo a cada uno</span></div>
      <div class="correo-mini"><div class="correo-mini-cab bc">${esc(p.nombre || 'La guerra')}</div><div class="col g4" style="padding:12px 14px">
        <strong>${esc(ej.nombre || 'Recluta')}, la patria te reclama.</strong><span class="med t2" style="white-space:pre-line">${esc((p.correo.apertura || '').slice(0, 140))}${(p.correo.apertura || '').length > 140 ? '…' : ''}</span>
        <span class="correo-mini-boton bc">A las trincheras</span></div></div>
      <div class="fila" style="gap:8px"><button class="btn linea medio crece" data-a="plegar" data-v="orden">${icono('lapiz', 16)}Editar el texto</button><button class="btn linea medio crece" data-a="previa" data-v="orden">${icono('ojo', 16)}Ver entero</button></div>
      ${(S.ui.pliegues || {}).orden ? `<div class="caja">${orden}</div>` : ''}</section>
    ${pliegue('presentacion', 'bandera', 'Presentación de la guerra', 'Página para animar al grupo', sinCaja(seccionPresentacion()), true)}
    ${pliegue('ordenanzas', 'reglas', 'Ordenanzas', p.ordenanzas ? 'Personalizadas' : 'Se escriben solas con tus reglas', sinCaja(seccionOrdenanzas()))}
    ${pliegue('narrador', 'micro', 'Frases del narrador', S.ui.repertorio ? plural(S.ui.repertorio.frases.length, 'frase propia', 'frases propias') : 'Tus frases para el desfile', sinCaja(seccionNarrador()))}`;
}

function paso6(p, previa) {
  const n = numeros(p), extrasOn = EXTRAS.filter(([k]) => p.extras[k]);
  const preguntas = [p.pregunta].concat(S.ui.otrasLista || p.otras || []).filter(Boolean);
  const votan = p.gente.filter((g) => g.vota), sinCorreo = votan.filter((g) => !g.correo && !g.mando), avisos = [];
  if (!p.nombre) avisos.push(['1', 'Falta el nombre de la guerra.']);
  if (!p.pregunta) avisos.push(['1', 'Falta la pregunta.']);
  if (n.nc < 3) avisos.push(['2', 'Hacen falta al menos 3 contendientes.']);
  if (sinCorreo.length) avisos.push(['2', `${enumerar(sinCorreo.map((g) => g.nombre || 'alguien sin nombre'))} sin correo: no recibirá${sinCorreo.length > 1 ? 'n' : ''} su enlace.`]);
  if (!p.gente.some((g) => g.mando)) avisos.push(['2', 'No has marcado «Soy yo» en ninguna ficha: dirigirás sin combatir.']);
  const fila = (k, ic, t, v, color = 'teal') => `<li><span class="fila-ico ${color}">${icono(ic, 20)}</span><span class="col crece" style="gap:2px;min-width:0"><span class="etiqueta">${t}</span><span style="font-weight:600">${v}</span></span>
    <button class="cuadro" data-a="pasoPlan" data-v="${k}" aria-label="Cambiar: ${t}">${icono('lapiz', 16)}</button></li>`;
  return `<section class="orden-batalla"><span class="sello-orden" aria-hidden="true">Orden de batalla</span>
      ${p.campo ? `<span class="sobre oro">${esc(p.campo)}</span>` : ''}<h2 class="bc" style="font-size:34px;line-height:.95;color:#fff;max-width:80%">${esc(p.nombre || 'Guerra sin nombre')}</h2>
      ${preguntas.length ? `<p class="bc oro" style="font-size:20px;line-height:1.15;margin:0">${preguntas.map(esc).join('<br>')}</p>` : ''}
      <div class="fila" style="gap:10px"><span class="caras">${votan.slice(0, 9).map((g, i) => avatar(Object.assign({ id: 'p' + i }, g), 'chico')).join('')}</span><span class="peq t2">${plural(votan.length, 'combatiente', 'combatientes')}</span></div>
      <div class="rejilla3 centro">
        <div class="dato"><b class="bc">${n.batallas}</b><span class="peq t2">${n.torneo ? 'cruces' : 'batallas'}</span></div>
        <div class="dato"><b class="bc">${n.torneo ? n.rondas : n.ofensivas}</b><span class="peq t2">${n.torneo ? 'rondas' : p.ritmo === 'diaria' ? 'días, uno por ofensiva' : 'ofensivas'}</span></div>
        <div class="dato"><b class="bc">${extrasOn.length}</b><span class="peq t2">extras</span></div></div></section>
    ${avisos.length ? `<section class="caja rosa" style="gap:6px">${avisos.map(([k, t]) => `<button class="aviso-plan" data-a="pasoPlan" data-v="${k}">${esc(t)}<span class="peq">Ir al paso ${k}</span></button>`).join('')}</section>` : ''}
    <ul class="lista-orden">
      ${fila(3, 'reglas', 'Reglas', n.torneo ? 'Torneo por eliminatorias' : `Liga · ${p.ritmo === 'diaria' ? 'una ofensiva al día' : 'todas de golpe'} · ${p.puntuacion === 'votos' ? 'por votos' : '3-1-0'}`)}
      ${fila(4, 'extras', 'Extras', extrasOn.length ? `<span class="fila" style="flex-wrap:wrap;gap:6px;padding-top:2px">${extrasOn.map(([k, t]) => `<span class="teal" title="${t}">${icono(ICONO_EXTRA[k], 20, 1.8)}</span>`).join('')}</span>` : 'Ninguno')}
      ${fila(1, 'desfile', 'Desfile', esc([p.desfileFecha, p.desfileInfo].filter(Boolean).join(', ')) || 'Sin fecha', 'oro')}
      ${fila(2, 'tropa', 'Combatientes', `${votan.length - sinCorreo.length} con su enlace${sinCorreo.length ? `, ${sinCorreo.length} sin correo` : ''}`, sinCorreo.length ? 'naranja' : 'teal')}
      ${fila(5, 'correo', 'Orden de movilización', esc(p.correo.asunto || '¡Comienza la ' + (p.nombre || 'guerra') + '!'))}
    </ul>
    ${previa ? `<p class="med t2 centro">Al declarar, cada combatiente recibe su enlace por correo. <strong style="color:#fff">No hay vuelta atrás.</strong></p>` : ''}
    <div class="fila" style="justify-content:center;gap:8px"><button class="btn linea chico" data-a="guardarPlan">${previa ? 'Guardar borrador' : 'Guardar cambios'}</button><button class="btn chico peligro" data-a="borrarGuerra">Borrar esta guerra</button></div>`;
}

// Resumen vivo, a la derecha, en pantallas anchas.
function resumenPlan(p) {
  const n = numeros(p);
  return `<aside class="plan-resumen"><span class="sobre oro">Orden de batalla, en vivo</span><h2 class="bc" style="font-size:26px;color:#fff;line-height:1">${esc(p.nombre || 'Guerra sin nombre')}</h2>
    ${p.pregunta ? `<p class="oro" style="margin:0;font-weight:600">${esc(p.pregunta)}</p>` : ''}
    <span class="caras">${p.gente.filter((g) => g.vota).slice(0, 9).map((g, i) => avatar(Object.assign({ id: 'p' + i }, g), 'chico')).join('')}</span>
    <ul class="col g8 med" style="color:#cdc8e6">
      <li class="fila" style="gap:8px"><span class="teal">${icono('reglas', 18)}</span>${n.torneo ? `Torneo · ${n.batallas} cruces` : `Liga · ${n.batallas} batallas`}</li>
      ${n.torneo ? '' : `<li class="fila" style="gap:8px"><span class="oro">${icono(p.ritmo === 'diaria' ? 'sol' : 'rayo', 18)}</span>${p.ritmo === 'diaria' ? `Una ofensiva al día · ${n.ofensivas} días` : 'Todas de golpe'}</li>`}
      <li class="fila" style="gap:8px"><span class="teal">${icono('extras', 18)}</span>${EXTRAS.filter(([k]) => p.extras[k]).length} extras</li></ul>
    <p class="peq t2">Se va completando mientras rellenas el plan.</p></aside>`;
}

registrar('/plan', () => {
  const p = S.ui.plan;
  if (!p) return marco(cargando('Desplegando el plan'), { sinNav: true, fondo: 'a', marca: 'Alto mando' });
  const previa = p.fase === 'borrador' || p.fase === 'llamamiento', n = Math.min(6, Math.max(1, S.ui.pasoPlan || 1));
  const cuerpo = [paso1, paso2, paso3, paso4, paso5, paso6][n - 1](p, previa);
  return marco(`${volver('/guerras', 'Tus guerras')}${cabeceraPlan(n)}
    <div class="plan-rejilla"><div class="col g12 plan-principal">${cuerpo}</div>${resumenPlan(p)}</div>
    ${piePlan(n, previa)}`, { sinNav: true, fondo: 'a', marca: 'Alto mando', ancha: true });
});
accion('pasoPlan', async (v) => {
  const n = Number(v);
  S.ui.ficha = null;
  try { await guardarPlan(); S.ui.planGuardado = Date.now(); } catch (e) { aviso(e.message || 'No se ha podido guardar.'); }
  S.ui.pasoPlan = n;
  pintar();
  window.scrollTo(0, 0);
});

accion('modo', (m) => {
  const p = S.ui.plan;
  p.modo = m;
  p.gente.forEach((g) => { if (m === 'combatientes') { g.combate = true; g.vota = true; } else { g.combate = false; g.vota = true; } });
  if (m === 'combatientes') p.gente = p.gente.filter((g) => g.correo || g.mando || !g.eraCosa);
  pintar();
});
accion('masGente', (tipo) => {
  const p = S.ui.plan, cosa = tipo === 'cosa';
  p.gente.push({ nombre: '', correo: '', frase: '', foto: null, combate: cosa || p.modo !== 'cosas', vota: !cosa, mando: false, alistado: null, eraCosa: cosa });
  S.ui.ficha = p.gente.length - 1;
  pintar();
  const el = document.getElementById('gn-' + (p.gente.length - 1));
  if (el) el.focus();
});
accion('quitarGente', (i) => {
  const n = Number(i), lista = S.ui.plan.gente;
  lista.splice(n, 1);
  // Las parejas apuntan por posición: se corrigen al quitar a alguien.
  lista.forEach((g) => { if (g.parejaK === n) g.parejaK = null; else if (g.parejaK > n) g.parejaK--; });
  S.ui.ficha = null; pintar();
});
// Marcar pareja: siempre en los dos sentidos; quien tenía otra pareja la pierde.
accion('pareja', (i, el) => {
  const lista = S.ui.plan.gente, a = Number(i), b = el.value === '' ? null : Number(el.value);
  const suelta = (k) => { if (k == null || !lista[k]) return; const o = lista[k].parejaK; lista[k].parejaK = null; if (o != null && lista[o] && lista[o].parejaK === k) lista[o].parejaK = null; };
  suelta(a); if (b != null) { suelta(b); lista[a].parejaK = b; lista[b].parejaK = a; }
  pintar();
});
function parejasPlan(p) { return p.gente.map((g, k) => (g.parejaK != null && g.parejaK > k ? [k, g.parejaK] : null)).filter(Boolean); }
accion('soyYo', (i) => { S.ui.plan.gente.forEach((g, k) => { g.mando = k === Number(i) ? !g.mando : false; }); pintar(); });

// Al elegir una foto se abre el encuadre; sólo se sube lo que queda dentro del marco.
async function subirEncuadre(i, fuente) {
  const datos = await recortarFoto(fuente);
  if (!datos) return;
  aviso('Subiendo la foto…', true);
  const r = await llamar('subirFoto', { datos });
  S.fotos[r.id] = datos;
  S.ui.plan.gente[Number(i)].foto = r.id;
  pintar();
  aviso('Foto lista. Acuérdate de guardar.', true);
}
accion('foto', async (i, el) => {
  const archivo = el.files && el.files[0];
  el.value = '';
  if (archivo) await subirEncuadre(i, archivo);
});
accion('reencuadrar', async (i) => {
  const g = S.ui.plan.gente[Number(i)], foto = g && g.foto && S.fotos[g.foto];
  if (foto) await subirEncuadre(i, foto);
});

async function guardarPlan() {
  const p = S.ui.plan;
  const plan = {
    nombre: p.nombre, pregunta: p.pregunta, premio: p.premio, botin: p.botin, firma: p.firma || '', campo: p.campo || '', ritmo: p.ritmo || 'golpe', pitch: p.pitch || '',
    otras: (S.ui.otrasLista || p.otras || []).map((q) => (q || '').trim()).filter(Boolean).slice(0, 4), desfileInfo: p.desfileInfo, desfileTs: p.desfileTs || null, desfileFecha: p.desfileFecha || '', modo: p.modo, formato: p.formato || 'liga', puntuacion: p.puntuacion,
    extras: p.extras, correo: p.correo, llamamiento: { cierre: p.llamamiento.cierre, cierreTs: p.llamamiento.cierreTs || 0, soloAlistados: p.llamamiento.soloAlistados, nota: p.llamamiento.nota || '' },
    diana: { activa: p.diana.activa, cadaDias: p.diana.cadaDias, frases: (S.ui.frases || '').split('\n') },
    ordenanzas: p.ordenanzas ? p.ordenanzas.filter((o) => (o.t || '').trim() || (o.x || '').trim()) : null,
    gente: p.gente.map((g) => ({ id: g.id, nombre: g.nombre, correo: g.correo, frase: g.frase, foto: g.foto, combate: g.combate, mando: g.mando, parejaK: g.parejaK != null ? g.parejaK : null }))
  };
  await llamar('guardarPlan', { plan });
  await cargarPlan();
}
accion('guardarPlan', async () => { await guardarPlan(); aviso('Plan guardado.', true); });
accion('abrirLlamamiento', async () => { await guardarPlan(); await llamar('abrirLlamamiento'); await cargarPlan(); aviso('Llamamiento abierto: manda el enlace por WhatsApp.', true); });
accion('llamarCorreo', async (todos) => {
  await guardarPlan();
  const r = await llamar('enviarLlamamiento', { todos: todos === '1' });
  await cargarPlan();
  aviso(`Llamamiento enviado: ${plural(r.enviados, 'correo', 'correos')}.${r.fallos.length ? ' Falló con ' + enumerar(r.fallos) + '.' : ''}`, !r.fallos.length);
});
accion('reclutar', async (v) => { const [id, si] = v.split(':'); await guardarPlan(); await llamar('reclutar', { id, si: si === '1' }); await cargarPlan(); pintar(); });
accion('borrarGuerra', () => {
  const fase = (S.ui.plan && S.ui.plan.fase) || (S.est && S.est.guerra.fase) || 'borrador';
  const nombre = (S.ui.plan && S.ui.plan.nombre) || (S.est && S.est.guerra.nombre) || 'esta guerra';
  const declarada = ['borrador', 'llamamiento'].indexOf(fase) < 0;
  S.velo = `<div class="velo" role="dialog" aria-modal="true" aria-labelledby="velo-t"><div class="caja rosa"><h2 class="h2" id="velo-t">¿Borrar «${esc(nombre)}»?</h2>
    <p>${declarada ? 'Se borra todo: batallas, votos, porras, proclamas y Radio Macuto. Desaparece de las crónicas y del escalafón, y no cuenta para los grados.' : 'Se borra el plan con su gente y las respuestas al llamamiento.'}</p>
    <p class="med t2">${declarada ? 'Quien entre con su enlace verá que la guerra ya no existe. ' : ''}No se puede deshacer. Úsalo para las guerras de prueba.</p>
    <button class="btn rosa" data-a="borrarYa">Borrar para siempre</button><button class="btn linea medio" data-a="cerrarVelo">Cancelar</button></div></div>`;
  pintar();
});
accion('borrarYa', async () => {
  S.velo = '';
  await llamar('borrarGuerra');
  delete S.sesiones[S.guerra];
  S.guerra = null; S.est = null; S.ui.plan = null; S.ui.guerras = null; recordar();
  ir('/guerras');
  aviso('Guerra borrada.', true);
});

// Vista previa de un correo, tal cual lo recibirá un combatiente. No se envía nada.
accion('previa', async (tipo) => {
  if (S.ui.plan && ['borrador', 'llamamiento'].indexOf(S.ui.plan.fase) >= 0) await guardarPlan();
  const v = await llamar('previaCorreo', { tipo });
  const doc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#0d0b1a}</style></head><body>' + v.html + '</body></html>';
  S.velo = `<div class="velo" role="dialog" aria-modal="true" aria-labelledby="velo-t"><div class="caja" style="max-width:560px;max-height:94vh;overflow:hidden;gap:8px">
    <div class="fila entre"><h2 class="h2" id="velo-t">Vista previa</h2><button class="cuadro" data-a="cerrarVelo" aria-label="Cerrar">${ico('equis')}</button></div>
    <p class="peq t2" style="line-height:1.5">De: ${esc(v.de)}<br>Para: ${esc(v.para)}<br>Asunto: <strong style="color:#f2f0ff">${esc(v.asunto)}</strong></p>
    <iframe title="Vista previa del correo" sandbox="" srcdoc="${esc(doc)}" style="width:100%;height:62vh;border:1px solid #3a3566;border-radius:10px;background:#0d0b1a"></iframe>
    <p class="peq t2">Así lo verá ${esc(v.para.split(' <')[0])}. Cada uno recibe su propio enlace. No se ha enviado nada.</p></div></div>`;
  pintar();
});
accion('declarar', async () => {
  await guardarPlan();
  const p = S.ui.plan, entra = (g) => !p.llamamiento.activo || !p.llamamiento.soloAlistados || !g.vota || g.alistado === true;
  const dentro = p.gente.filter(entra), nc = dentro.filter((g) => g.combate).length, votan = dentro.filter((g) => g.vota);
  const sinCorreo = votan.filter((g) => !g.correo).map((g) => g.nombre), fuera = p.gente.filter((g) => !entra(g)).map((g) => g.nombre);
  S.velo = `<div class="velo"><div class="caja oro"><h2 class="h2">¿Declaramos la guerra?</h2>
    <p>${nc} contendientes, ${nc * (nc - 1) / 2} batallas y ${plural(votan.length - sinCorreo.length, 'orden de movilización', 'órdenes de movilización')} por correo, desde tu Gmail.</p>
    ${fuera.length ? `<p class="med t2">Se quedan fuera por no alistarse: ${esc(enumerar(fuera))}.</p>` : ''}
    ${sinCorreo.length ? `<p class="med rosa">Sin correo: ${esc(enumerar(sinCorreo))}. Tendrán que entrar con el enlace general.</p>` : ''}
    ${p.gente.some((g) => g.mando) ? '' : '<p class="med rosa">No has marcado «Soy yo» en ninguna carta: dirigirás la guerra sin combatir.</p>'}
    <p class="med t2">Una vez declarada, ya no entra ni sale nadie.</p>
    <button class="btn" data-a="declararYa">¡Declarar la guerra!</button><button class="btn linea medio" data-a="cerrarVelo">Todavía no</button></div></div>`;
  pintar();
});
accion('declararYa', async () => {
  S.velo = '';
  // La tropa, dibujada aquí con las fotos, para lucirla en la orden de movilización.
  let tropa = null;
  try {
    const p = S.ui.plan, entra = (g) => !p.llamamiento.activo || !p.llamamiento.soloAlistados || !g.vota || g.alistado === true;
    tropa = await imagenTropa({ gente: p.gente.filter(entra), guerra: { nombre: p.nombre } });
    if (tropa.length > 700000) tropa = null;
  } catch (err) { tropa = null; }
  const r = await llamar('declarar', tropa ? { tropa } : {});
  const lista = (await llamar('cuartel', {}, 1)).guerras, g = lista.find((x) => x.id === S.guerra);
  if (g && g.token) S.sesiones[S.guerra] = g.token;
  recordar();
  S.ui.plan = null; S.ui.guerras = lista;
  await refrescar(true);
  ir('/cuartel');
  aviso(`¡Guerra declarada! ${plural(r.batallas, 'batalla', 'batallas')} y ${plural(r.enviados, 'correo enviado', 'correos enviados')}.`, true);
});

// ---------------------------------------------------------------- cuartel general

alEntrar('/cuartel', async () => {
  if (!S.est) await refrescar(true);
  if (['borrador', 'llamamiento'].indexOf(S.est.guerra.fase) >= 0) ir('/plan', true); else pintar();
});
registrar('/cuartel', () => {
  const e = S.est;
  if (!e || !e.mando) return marco(cargando('Abriendo el cuartel general'), { fondo: 'a' });
  if (e.guerra.fase === 'desfile') return mandoDesfile();
  const G = porId(e.gente), m = e.mando, pr = e.progreso || { emitidos: 0, total: 0, rezagados: [] }, fase = e.guerra.fase, abierta = fase === 'abierta';
  const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);
  const general = enlaceApp() + '#g=' + m.general;
  const errores = m.correos.filter((c) => c.error || !c.correo);
  return marco(`${volver('/guerras', 'Tus guerras')}${cab(tituloGuerra(e.guerra), 'Cuartel general')}
    <section class="caja ${abierta ? '' : 'teal'}"><div class="fila entre"><h2 class="h2">${abierta ? 'Conflicto en curso' : NOMBRE_FASE[fase]}</h2><span class="peq t2">Abierta el ${fecha(e.guerra.declarada)}</span></div>
      <span class="sobre">La línea del frente</span>${frente(pr.emitidos, pr.total, 'votos emitidos')}
      ${e.porra ? `<div class="fila entre med"><span>Porras recibidas</span><strong>${e.porra.recibidas} de ${e.porra.de}</strong></div><div class="medidor"><i style="width:${pct(e.porra.recibidas, e.porra.de)}%"></i></div>
        ${(m.porraPendiente || []).length ? `<div class="col g4"><span class="peq t2">Faltan por hacer la porra:</span>
          <ul class="fila-porra">${m.porraPendiente.map((x) => `<li title="${x.puede ? 'Ya puede hacerla' : 'Aún le quedan batallas por votar'}">${avatar(G[x.id])}<span class="peq">${esc(G[x.id].nombre)}</span>${x.puede ? '' : '<span class="peq t2">votando</span>'}</li>`).join('')}</ul>
          ${m.porraPendiente.some((x) => !x.puede) ? '<p class="peq t2">«Votando»: aún le quedan batallas; la porra se abre al votarlas todas.</p>' : ''}</div>`
          : m.porraPendiente ? '<p class="peq teal">Ya ha hecho la porra todo el mundo.</p>' : ''}` : ''}</section>
    ${abierta && e.parte ? `<section class="caja oro"><h2 class="h2 oro">Parte de mitad de contienda</h2><p class="med t3">Listo desde que se libraron ${Math.ceil(pr.total / 2)} de las ${pr.total} batallas. Enseña quién va en vanguardia y quién en retaguardia, sin desvelar resultados.</p>
      ${botonCartel('parte', ico('wasap') + 'Compartir el parte', 'btn oro medio')}</section>` : ''}
    ${m.pullas.length || m.emitidas ? `<section class="caja rosa"><div class="fila entre"><h2 class="h2">Censura de Radio Macuto</h2><span class="peq rosa" style="font-weight:600">${m.pullas.length} esperando · ${m.emitidas} emitidas</span></div>
      <p class="peq t2">Sólo tú ves quién escribe cada pulla. En antena salen sin firma. «Emitir y avisar» manda además la pulla por correo a los combatientes, sin firma y con un botón para responder.</p>
      ${m.pullas.map((p) => `<div class="col" style="padding-top:8px;border-top:1px solid #2a2648"><p style="font-style:italic">«${esc(p.texto)}»</p>
        <div class="fila entre"><span class="peq t2">De ${esc(G[p.de].nombre)} · ${hace(p.ts).toLowerCase()}</span></div>
        <div class="fila" style="flex-wrap:wrap;justify-content:flex-end"><button class="btn chico linea" data-a="moderar" data-v="${p.id}:0">Censurar</button><button class="btn chico linea" data-a="moderar" data-v="${p.id}:1">Emitir</button><button class="btn chico rosa" data-a="moderar" data-v="${p.id}:2">Emitir y avisar</button></div></div>`).join('')}</section>` : ''}
    ${abierta && e.guerra.cuadro ? `<section class="caja teal"><div class="fila entre"><h2 class="h2">${nombreRonda(e.guerra.cuadro.actual, e.guerra.cuadro.R)}</h2><span class="peq t2">Ronda ${e.guerra.cuadro.actual} de ${e.guerra.cuadro.R}</span></div>
      <p class="med t2">La ronda se cierra sola cuando vota todo el mundo. Si alguien se retrasa, puedes cerrarla ya: los votos que falten no cuentan.</p>
      <div class="fila" style="flex-wrap:wrap"><button class="btn linea medio crece" data-a="ir" data-v="/cuadro">Ver el cuadro</button><button class="btn medio crece ${S.ui.confirmaRonda ? 'peligro' : 'linea'}" data-a="cerrarRonda">${S.ui.confirmaRonda ? 'Confirmar: cerrar la ronda' : 'Cerrar la ronda ya'}</button></div></section>` : ''}
    ${abierta ? `<section class="caja"><div class="fila entre"><h2 class="h2">Rezagados</h2><span class="peq t2">${plural(pr.rezagados.length, 'persona', 'personas')}</span></div>
      ${pr.rezagados.length ? `${filaRezagados(pr.rezagados.map((r) => Object.assign({ nombre: G[r.id].nombre }, r)), (r) => avatar(G[r.id]))}
      <p class="peq t2">Encima de cada uno, las batallas que le faltan.</p>
      <div class="fila entre"><span class="med t2">${m.proximaDiana ? 'Próximo toque de diana: ' + diaHora(m.proximaDiana) : 'Toque de diana automático desactivado'}</span><button class="btn chico" data-a="tocarDiana">Tocar diana</button></div>`
        : '<p class="med t2">Ya ha votado todo el mundo. La guerra se cierra sola en unos segundos.</p>'}</section>` : ''}
    ${abierta ? `<section class="caja"><h2 class="h2">Cartel de la guerra</h2><p class="med t2">Para el grupo de WhatsApp: todos los combatientes, el nombre de la guerra y la pregunta.</p>${botonCartel('guerra', ico('wasap') + 'Compartir el cartel')}</section>` : ''}
    ${fase === 'publicada' && !(e.duelo && !e.duelo.cerrado) ? `<section class="caja oro"><h2 class="h2">La victoria</h2><div class="fila" style="flex-wrap:wrap">${botonCartel('podio', ico('wasap') + 'Cartel de la victoria', 'btn oro medio crece')}${botonCartel('diploma', 'Cruz al mérito', 'btn linea medio crece')}</div></section>` : ''}
    <section class="caja"><h2 class="h2">Enlaces y cartas</h2>
      <p class="med t2">Enlace general: quien lo abra elige su carta. Sirve para quien no encuentre su correo.</p>
      <div class="fila" style="flex-wrap:wrap"><a class="btn medio linea crece" target="_blank" rel="noopener" href="${wasap(`${e.guerra.nombre}: entra, toca tu carta y a votar. ${general}`)}">${ico('wasap')}Enviar por WhatsApp</a><button class="btn linea medio" data-a="copiar" data-v="${esc(general)}">${ico('copiar')}Copiar</button></div>
      ${errores.length ? `<p class="med rosa">Sin orden de movilización: ${esc(enumerar(errores.map((c) => G[c.id].nombre + (c.correo ? ' (correo rechazado)' : ' (sin correo)'))))}.</p>` : ''}
      <details><summary class="med teal" style="cursor:pointer">Cartas, una a una</summary><ul class="col" style="margin-top:8px">${m.correos.map((c) => `<li class="fila entre" style="flex-wrap:wrap"><span class="med"><strong>${esc(G[c.id].nombre)}</strong> <span class="t2">· ${c.enviado ? 'orden enviada el ' + new Date(c.enviado).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : c.correo ? 'orden sin enviar' : 'sin correo'} · ${c.reclamada ? 'en su puesto' : 'sin entrar'}</span></span>
        <span class="fila">${abierta && c.correo ? `<button class="btn chico linea" data-a="reenviar" data-v="${c.id}">Reenviar orden</button>` : ''}<button class="btn chico linea" data-a="liberar" data-v="${c.id}">Enlace nuevo</button></span></li>`).join('')}</ul>
        <p class="peq t2">«Enlace nuevo» invalida el enlace anterior de esa carta: úsalo si alguien entró con la carta de otro.</p></details></section>
    <div class="col">
      ${abierta && pr.rezagados.length && e.guerra.formato !== 'torneo' ? '<button class="btn peligro" data-a="ir" data-v="/armisticio">Firmar el armisticio</button>' : ''}
      <button class="btn ${abierta ? 'linea' : ''}" data-a="ir" data-v="/informe" ${abierta ? 'disabled' : ''}>Informe clasificado${e.guerra.extras.desfile ? ' y desfile' : ''}</button>
      ${abierta ? '<p class="peq t2 centro">El informe clasificado y el desfile se abren cuando acabe la guerra. Hasta entonces nadie ve los votos, tú tampoco.</p>' : ''}
      <button class="btn linea medio" data-a="ir" data-v="/plan">Ajustes de la guerra</button>
      ${fase === 'publicada' ? '<button class="btn linea medio" data-a="contraofensiva">Contraofensiva: otra guerra con la misma gente</button>' : ''}
      <button class="btn chico peligro" style="align-self:center;margin-top:8px" data-a="borrarGuerra">Borrar esta guerra</button>
    </div>`, { fondo: 'a' });
});
accion('cerrarRonda', async () => {
  if (!S.ui.confirmaRonda) { S.ui.confirmaRonda = true; aviso('Pulsa otra vez para confirmar: los votos que falten no contarán.'); pintar(); return; }
  S.ui.confirmaRonda = false;
  const r = await llamar('cerrarRonda', {});
  await refrescar(true);
  aviso(r.fase === 'terminada' ? 'Torneo terminado: ya puedes preparar el desfile.' : 'Ronda cerrada: ya se sabe quién pasa.', true);
  pintar();
});
accion('moderar', async (v) => {
  const [id, si] = v.split(':');
  const r = await llamar('moderar', { id, emitir: si !== '0', avisar: si === '2' });
  await refrescar(true);
  if (si === '2') aviso(`Pulla en antena y ${plural(r.avisados, 'correo enviado', 'correos enviados')}.`, true); else pintar();
});
accion('tocarDiana', async () => { const r = await llamar('tocarDiana'); await refrescar(true); aviso(`Diana tocada: ${plural(r.enviados, 'correo', 'correos')}.`, true); });
accion('reenviar', async (id) => { await llamar('reenviarOrden', { id }); aviso('Orden de movilización reenviada.', true); });
accion('liberar', async (id) => {
  if (S.ui.confirmaLiberar !== id) { S.ui.confirmaLiberar = id; aviso('Su enlace actual dejará de valer. Pulsa otra vez para confirmarlo.'); return; }
  S.ui.confirmaLiberar = null;
  await llamar('liberarCarta', { id });
  const lista = (await llamar('cuartel', {}, 1)).guerras, g = lista.find((x) => x.id === S.guerra);
  if (g && g.token) { S.sesiones[S.guerra] = g.token; recordar(); }
  await refrescar(true);
  aviso('Carta liberada. Reenvíale la orden o pásale el enlace general.', true);
});
accion('contraofensiva', async () => { const r = await llamar('contraofensiva'); S.ui.guerras = null; await abrir(r.id); });

// ---------------------------------------------------------------- armisticio

registrar('/armisticio', () => {
  const e = S.est;
  if (!e) return marco(cargando(), { fondo: 'a' });
  const G = porId(e.gente), rez = e.progreso.rezagados, dec = S.ui.armisticio || (S.ui.armisticio = {});
  const expulsados = rez.filter((r) => dec[r.id] && dec[r.id].accion === 'expulsar');
  const nc = e.gente.filter((g) => g.combate).length - expulsados.filter((r) => G[r.id].combate).length;
  const listo = rez.length && rez.every((r) => dec[r.id] && dec[r.id].accion);
  return marco(`${volver('/cuartel', 'Cuartel general')}${cab(e.guerra.nombre, 'Firmar el armisticio')}
    <p class="t3">Faltan por votar ${plural(rez.length, 'persona', 'personas')}. Decide qué hacer con cada una y la guerra se cerrará sin esperar más.</p>
    ${rez.map((r) => { const d = dec[r.id] || {}; return `<section class="caja"><div class="fila">${avatar(G[r.id], 'grande')}<span class="col g4 crece"><strong>${esc(G[r.id].nombre)}</strong><span class="med t2">${plural(r.faltan, 'batalla', 'batallas')} sin votar</span></span></div>
      <div class="opciones"><button aria-pressed="${d.accion === 'expulsar'}" data-a="decidir" data-v="${r.id}:expulsar">Expulsar</button><button aria-pressed="${d.accion === 'indultar'}" data-a="decidir" data-v="${r.id}:indultar">Indultar</button></div>
      ${d.accion === 'expulsar' ? `<p class="med t2">Expulsión con deshonor: desaparecen sus combates y sus votos, como si nunca hubiera combatido. En las crónicas quedará como desertor.</p>
        <label class="campo"><span>Sentencia del consejo de guerra${e.guerra.extras.desfile ? ' · se leerá en el desfile' : ''}</span><textarea id="sent-${r.id}" maxlength="300" data-m="armisticio.${r.id}.sentencia" placeholder="Condenado a pelar patatas hasta la próxima guerra.">${esc(d.sentencia || '')}</textarea></label>` : ''}
      ${d.accion === 'indultar' ? `<p class="med t2">Indulto: sigue en la guerra y sólo se pierden sus ${plural(r.faltan, 'voto pendiente', 'votos pendientes')}.</p>` : ''}</section>`; }).join('')}
    ${listo ? `<p class="med t3">La guerra acabará con ${nc} contendientes y ${nc * (nc - 1) / 2} batallas. Esto no se puede deshacer.</p>` : ''}
    <button class="btn peligro" data-a="firmar" ${listo && nc >= 2 ? '' : 'disabled'}>Firmar el armisticio</button>
    <button class="btn linea medio" data-a="ir" data-v="/cuartel">Cancelar</button>`, { fondo: 'a' });
});
accion('decidir', (v) => { const [id, que] = v.split(':'); const d = S.ui.armisticio; d[id] = Object.assign(d[id] || {}, { accion: que }); pintar(); });
accion('firmar', async () => {
  if (!S.ui.confirmaFirma) { S.ui.confirmaFirma = true; aviso('No hay vuelta atrás. Pulsa otra vez «Firmar el armisticio» para confirmarlo.'); return; }
  S.ui.confirmaFirma = false;
  await llamar('armisticio', { decisiones: S.ui.armisticio });
  S.ui.armisticio = null;
  await refrescar(true);
  ir('/informe');
});

// ---------------------------------------------------------------- informe clasificado

alEntrar('/informe', async () => { S.ui.informe = null; S.ui.informe = await llamar('informe', {}, 1); pintar(); });
registrar('/informe', () => {
  const inf = S.ui.informe, e = S.est;
  if (!inf || !e) return marco(cargando('Descifrando el informe'), { fondo: 'a' });
  const G = porId(inf.gente), r = inf.resultado, fase = inf.guerra.fase, nom = (id) => esc(G[id].nombre);
  const ofs = inf.guerra.ofensivas, of = Math.min(ofs, Math.max(1, S.ui.ofInforme || 1));
  const votos = porId(inf.votos);
  const batallas = r.batallas.filter((b) => b.of === of).map((b) => `<div class="col g4" style="padding:8px 0;border-top:1px solid #2a2648">
    <strong class="bc" style="font-size:20px;color:#fff">${nom(b.a)} <span class="teal">${b.va}–${b.vb}</span> ${nom(b.b)}</strong>
    <span class="med t2">A ${nom(b.a)} (${b.va}): ${votos[b.id].a.map(nom).join(', ') || 'nadie'}</span><span class="med t2">A ${nom(b.b)} (${b.vb}): ${votos[b.id].b.map(nom).join(', ') || 'nadie'}</span></div>`).join('');
  const descansan = inf.gente.filter((g) => g.combate && g.estado !== 'expulsado' && !r.batallas.some((b) => b.of === of && (b.a === g.id || b.b === g.id))).map((g) => g.nombre);
  const premios = ['rebelde', 'borrego', 'tardon', 'adivino'].filter((k) => r.premios[k]).map((k) => Object.assign({ cual: k }, r.premios[k]));
  const bat = porId(r.batallas), curios = listaCuriosidades(r, G);
  let orden;
  if (fase === 'terminada') {
    orden = inf.guerra.extras.desfile
      ? `<button class="btn" data-a="desfile" data-v="empezar">¡Que empiece el desfile!</button><p class="peq t2 centro">${r.empate ? 'Hay empate en el primer puesto: el duelo final se librará en directo. ' : ''}La corneta suena en tu móvil, desde el mando del desfile.</p>
        <button class="btn linea medio" data-a="ir" data-v="/ensayo">Ensayar el desfile en privado</button>`
      : `<button class="btn" data-a="publicar">Publicar el parte de guerra</button><p class="peq t2 centro">Sale todo de golpe para todos.${r.empate ? ' Hay empate en el primer puesto: después se votará el duelo final.' : ''}</p>`;
  } else orden = `<p class="med teal centro">${fase === 'desfile' ? 'El desfile está en marcha.' : 'Parte de guerra publicado.'}</p>${fase === 'desfile' ? '<button class="btn" data-a="ir" data-v="/cuartel">Ir al mando del desfile</button>' : ''}`;
  return marco(`${volver('/cuartel', 'Cuartel general')}
    <div class="carpeta"><span class="pestana-carpeta">Expediente ${esc(String(inf.guerra.id || '').slice(-4).toUpperCase())}</span>
      <div class="col g4"><span class="maquina peq">MINISTERIO DE LA NORMALIDAD · ARCHIVO DEL ALTO MANDO</span><h1 class="h1 maquina-t">Informe clasificado</h1><span class="maquina med">${esc(tituloGuerra(inf.guerra))}</span></div>
      <span class="sello-conf" aria-hidden="true">Confidencial</span>
      <p class="maquina med">Sólo para tus ojos: los combatientes nunca verán quién votó a quién.</p></div>${orden}
    <div class="cols-pc dossier"><div class="col g12">
      <section class="caja"><h2 class="h2">Parte de guerra</h2>${tablaFinal(r)}
        ${r.empate ? `<p class="med oro">Empate a puntos en el primer puesto entre ${enumerar(r.empate.map((id) => G[id].nombre))}: lo decide el duelo final. El orden de arriba es provisional.</p>` : ''}</section>
      ${r.porra.lista.length ? `<section class="caja"><h2 class="h2">La porra</h2><p class="peq t2">Puestos de diferencia con el parte final. Gana la suma más baja.</p>
        <ol class="lista-puestos">${r.porra.lista.map((p) => `<li><b>${p.pos}</b><span>${nom(p.id)}</span><em>${p.suma}</em></li>`).join('')}</ol>${inf.guerra.botin ? `<p class="med t2">Botín: ${esc(inf.guerra.botin)}</p>` : ''}</section>` : ''}
      ${premios.length ? `<section class="col"><h2 class="h2">Condecoraciones</h2>${listaPremios(premios)}</section>` : ''}
      ${r.parejas ? `<section class="col g8"><div class="amor-cab">${escena('beso', 'El americano y el prusiano se besan sobre la trinchera', 110)}<h2 class="h2">En el amor y en la guerra</h2></div>${bloqueParejas(r.parejas, G)}</section>` : ''}
      ${(r.apuestas || []).length ? `<section class="caja"><h2 class="h2">Apuestas</h2><p class="peq t2">Aciertos en la batalla ${inf.guerra.ritmo === 'diaria' ? 'del día' : 'estrella'} de cada ofensiva. Sólo los ves tú.</p>
        ${r.apuestas.map((a) => `<div class="fila entre"><span>${nom(a.id)}</span><span class="med"><strong class="teal">${a.n}</strong> de ${a.de}</span></div>`).join('')}</section>` : ''}
      ${campeonesPregunta(r, G)}
      ${curios.length ? `<section class="caja"><h2 class="h2">Curiosidades</h2>${curios.map((x) => `<p class="med">${x}</p>`).join('')}</section>` : ''}
      ${r.desertores.length || r.indultados.length ? `<section class="caja"><h2 class="h2">Bajas</h2>
        ${r.desertores.map((x) => `<p class="med"><strong>${nom(x.id)}:</strong> expulsado con deshonor, con ${plural(x.faltaban, 'batalla', 'batallas')} sin votar. ${x.sentencia ? '<em>«' + esc(x.sentencia) + '»</em>' : ''}</p>`).join('')}
        ${r.indultados.map((x) => `<p class="med"><strong>${nom(x.id)}:</strong> indulto con ${plural(x.faltaban, 'voto', 'votos')} sin emitir.</p>`).join('')}</section>` : ''}
    </div><div class="col g12">
      <section class="caja"><h2 class="h2">Batallas</h2><p class="peq t2">Quién votó a quién</p>
        <div class="fila entre"><button class="cuadro" data-a="ofInforme" data-v="${of - 1}" aria-label="Ofensiva anterior" ${of <= 1 ? 'disabled' : ''}>${ico('izq')}</button>
          <strong class="bc" style="font-size:20px;color:#fff">Ofensiva ${of} de ${ofs}</strong><button class="cuadro" data-a="ofInforme" data-v="${of + 1}" aria-label="Ofensiva siguiente" ${of >= ofs ? 'disabled' : ''}>${ico('der')}</button></div>
        ${batallas}${descansan.length ? `<p class="med t2">Descansa: ${esc(enumerar(descansan))}.</p>` : ''}</section>
      ${inf.proclamas.length ? `<section class="caja"><h2 class="h2">Proclamas anónimas</h2><p class="peq t2">${fase === 'terminada' ? 'Marca con la estrella las que se leerán ' + (inf.guerra.extras.desfile ? 'en el desfile' : 'al publicar') + '. ' : ''}Nadie verá de quién son.</p>
        ${inf.proclamas.map((p) => `<div class="fila" style="align-items:flex-start;padding-top:8px;border-top:1px solid #2a2648">
          <button class="cuadro" style="${p.estrella ? 'color:#ffd36a;border-color:#ffd36a' : ''}" data-a="estrella" data-v="${p.batalla}:${p.de}:${p.estrella ? 0 : 1}" aria-pressed="${p.estrella}" aria-label="Leer esta proclama" ${fase === 'terminada' ? '' : 'disabled'}>${ico('estrella', 18, p.estrella ? 'style="fill:#ffd36a"' : '')}</button>
          <span class="col g4 crece"><em>«${esc(p.texto)}»</em><span class="peq t2">${nom(p.de)} · ${nom(bat[p.batalla].a)} contra ${nom(bat[p.batalla].b)} · a ${nom(p.elegido)}</span></span></div>`).join('')}</section>` : ''}
      ${(inf.pullas || []).length ? `<section class="caja rosa"><h2 class="h2">Radio Macuto</h2><p class="peq t2">Todas las pullas, con su autor. Los combatientes nunca verán de quién son.</p>
        ${inf.pullas.map((p) => `<div class="col g4" style="padding-top:8px;border-top:1px solid #2a2648"><em>«${esc(p.texto)}»</em>
          <span class="peq t2">${G[p.de] ? nom(p.de) : 'Autor desconocido'} · ${new Date(p.ts).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · <span class="${p.estado === 'censurada' ? 'rosa' : p.estado === 'emitida' ? 'teal' : ''}">${{ emitida: 'En antena', censurada: 'Censurada', pendiente: 'Sin revisar' }[p.estado] || ''}</span></span></div>`).join('')}</section>` : ''}
    </div></div>`, { fondo: 'a', ancha: true });
});
accion('ofInforme', (n) => { S.ui.ofInforme = Number(n); pintar(); });
accion('estrella', async (v) => {
  const [batalla, de, si] = v.split(':');
  await llamar('estrella', { batalla: Number(batalla), de, si: si === '1' });
  const p = S.ui.informe.proclamas.find((x) => String(x.batalla) === batalla && x.de === de);
  if (p) p.estrella = si === '1';
  pintar();
});
accion('publicar', async () => {
  if (!S.ui.confirmaPublicar) { S.ui.confirmaPublicar = true; aviso('Todos verán el parte de guerra. Pulsa otra vez para confirmarlo.'); return; }
  S.ui.confirmaPublicar = false;
  await llamar('publicar');
  await refrescar(true);
  ir('/batallas');
});

// ---------------------------------------------------------------- mando del desfile, con corneta y redoble

let audio = null;
function tono() {
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') audio.resume();
  return audio;
}
function redoble(seg = 1.3) {
  const ctx = tono(), t0 = ctx.currentTime, n = Math.floor(ctx.sampleRate * 0.05), bufer = ctx.createBuffer(1, n, ctx.sampleRate), datos = bufer.getChannelData(0);
  for (let i = 0; i < n; i++) datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  for (let t = 0; t < seg; t += 0.045) {
    const golpe = ctx.createBufferSource(), g = ctx.createGain();
    golpe.buffer = bufer;
    g.gain.value = 0.12 + 0.5 * (t / seg);
    golpe.connect(g).connect(ctx.destination);
    golpe.start(t0 + t);
  }
  const fin = ctx.createBufferSource(), gf = ctx.createGain();
  fin.buffer = bufer; gf.gain.value = 1;
  fin.connect(gf).connect(ctx.destination);
  fin.start(t0 + seg + 0.05);
  return seg + 0.15;
}
function corneta(desde = 0) {
  const ctx = tono(), t0 = ctx.currentTime + desde, filtro = ctx.createBiquadFilter();
  filtro.type = 'lowpass'; filtro.frequency.value = 2200;
  filtro.connect(ctx.destination);
  [[392, 0.16], [523, 0.16], [659, 0.16], [784, 0.42], [659, 0.16], [784, 0.9]].reduce((t, [f, d]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.02); g.gain.setValueAtTime(0.22, t + d - 0.04); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(g).connect(filtro);
    o.start(t); o.stop(t + d + 0.02);
    return t + d + 0.02;
  }, t0);
}
const suena = () => S.est && S.est.guerra.extras.corneta && preferencia.leer('corneta', true);
function sonar(siguiente) {
  if (!suena() || !siguiente) return;
  try {
    if (siguiente.t === 'campeon') corneta(redoble(1.6));
    else if (siguiente.t === 'finalistas') redoble(0.9);
    else if (siguiente.t === 'puesto' || siguiente.t === 'condecoracion' || siguiente.t === 'pregunta') redoble();
  } catch (e) { /* sin sonido no se para el desfile */ }
}
accion('probarRedoble', () => { try { redoble(); } catch (e) { aviso('Este móvil no deja sonar al navegador.'); } });
accion('corneta', () => { preferencia.poner('corneta', !preferencia.leer('corneta', true)); pintar(); });

function resumenPaso(a, G) {
  if (a.t === 'consejo') return ['Consejo de guerra', G[a.id].nombre, 'Desertor'];
  if (a.t === 'puesto') return [ordinal(a.pos) + ' puesto', G[a.fila.id].nombre, plural(a.fila.pts, 'punto', 'puntos')];
  if (a.t === 'proclama') return ['Proclama anónima', a.n + ' de ' + a.de, ''];
  if (a.t === 'parejas') return ['En el amor y en la guerra', plural((a.parejas && a.parejas.lista || []).length, 'pareja', 'parejas'), ''];
  if (a.t === 'condecoracion') return [TITULOS[a.cual], G[a.id].nombre, ''];
  if (a.t === 'pregunta') return ['Pregunta ' + a.k + ' de ' + a.de, G[a.id].nombre, plural(a.pts, 'punto', 'puntos')];
  if (a.t === 'duelo') return ['Duelo final', enumerar(a.duelo.entre.map((id) => G[id].nombre)), `${a.duelo.votaron} de ${a.duelo.deben} votos`];
  if (a.t === 'finalistas') return ['La gran final', a.entre.map((id) => G[id].nombre).join(' o '), ''];
  return ['Campeón', G[a.fila.id].nombre, plural(a.fila.pts, 'punto', 'puntos')];
}
function mandoDesfile() {
  const e = S.est, d = e.desfile, G = porId(e.gente), [uno, dos, tres] = resumenPaso(d.actual, G);
  const dueloAbierto = d.actual.t === 'duelo' && !d.actual.duelo.cerrado;
  return marco(`${cab(e.guerra.nombre, 'Mando del desfile', '<span class="chapa">En directo</span>')}
    <section class="caja"><h2 class="sobre" style="font-size:11px;letter-spacing:.14em">Ahora en todas las pantallas</h2>
      <div class="fila g12"><span class="col g4 crece"><span class="bc oro" style="font-weight:800;font-size:20px;letter-spacing:.04em">${esc(uno)}</span>
        <span class="bc" style="font-weight:800;font-size:26px;color:#fff">${esc(dos)}</span></span><span class="bc t2" style="font-weight:700;font-size:20px">${esc(tres)}</span></div>
      ${d.actual.frase ? `<div class="caja oro" style="gap:6px;padding:10px 12px"><span class="sobre oro" style="font-size:11px">Para leer en voz alta</span><span style="font-size:18px;font-style:italic;color:#fff">«${esc(d.actual.frase)}»</span>${d.actual.fraseSegundo ? `<span class="med t3" style="font-style:italic">Y del 2.º: «${esc(d.actual.fraseSegundo)}»</span>` : ''}</div>` : ''}
      <p class="med t2">Paso ${d.paso + 1}${d.pendienteDuelo ? '' : ' de ' + d.pasos}${dueloAbierto ? ' · al pasar, el duelo se cierra con los votos que haya' : ''}</p></section>
    <button class="btn claro" style="height:72px;font-size:26px;font-weight:800;border-radius:16px" data-a="desfile" data-v="${d.ultimo ? 'terminar' : 'siguiente'}">${esc(etiquetaSiguiente(d.siguiente))}${d.ultimo ? '' : ico('flecha', 24)}</button>
    <button class="btn linea medio" data-a="desfile" data-v="anterior" ${d.paso === 0 ? 'disabled' : ''}>Anterior</button>
    <p class="peq t2">Al pasar, avanza en todos los móviles y en la pantalla grande, si la pones.</p>
    ${e.guerra.extras.corneta ? `<section class="caja oro"><div class="interruptor"><span class="fila oro">${ico('sonido', 22)}<span class="bc" style="font-weight:800;font-size:20px">Corneta y redoble</span></span>
      <button role="switch" aria-checked="${preferencia.leer('corneta', true)}" aria-label="Corneta y redoble" data-a="corneta"></button></div>
      <p class="med">Suenan sólo en este móvil: redoble antes de cada puesto y corneta para el campeón.</p>
      <p class="med t2">Si estáis juntos, sube el volumen y que lo oiga la tropa. Los móviles de los combatientes y la pantalla grande van en silencio.</p>
      <button class="btn linea medio oro" data-a="probarRedoble">Probar el redoble</button></section>` : ''}
    <button class="btn linea chico" style="align-self:center" data-a="ir" data-v="/batallas">Ver el desfile como lo ven todos</button>`, { fondo: 'b' });
}
// Ensayo privado: recorre todos los pasos del desfile con su sonido, sin que nadie más vea nada ni cambie nada.
alEntrar('/ensayo', async () => {
  S.ui.ensayo = null;
  try { const r = await llamar('ensayo', {}, 1); S.ui.ensayo = { vistas: r.vistas, conDuelo: r.conDuelo, i: 0 }; pintar(); }
  catch (err) { aviso(err.message); ir('/informe'); }
});
registrar('/ensayo', () => {
  const en = S.ui.ensayo;
  if (!en || !S.est) return marco(cargando('Formando a la tropa'), { fondo: 'b' });
  const d = en.vistas[en.i], fin = en.i === en.vistas.length - 1;
  const barra = `<section class="caja oro" style="gap:8px"><div class="fila entre"><strong class="bc oro" style="font-size:20px;letter-spacing:.04em">Ensayo privado · paso ${en.i + 1} de ${en.vistas.length}</strong>
      <button class="btn chico linea" data-a="ir" data-v="/informe">Salir</button></div>
    <p class="peq t2">Sólo lo ves tú: los combatientes siguen en el alto el fuego y aquí no se cambia nada. Suena igual que sonará el desfile${S.est.guerra.extras.corneta ? '' : ' (en esta guerra, sin corneta ni redoble)'}.${fin && en.conDuelo ? ' El ensayo acaba en el duelo final: lo que venga después lo decidirán los votos en directo.' : ''}</p>
    <div class="fila"><button class="btn linea medio" data-a="ensayoPaso" data-v="-1" ${en.i === 0 ? 'disabled' : ''}>Anterior</button>
      <button class="btn claro medio crece" data-a="ensayoPaso" data-v="1" ${fin ? 'disabled' : ''}>${fin ? 'Fin del ensayo' : esc(etiquetaSiguiente(d.siguiente))}</button></div></section>`;
  return pantallaDesfile(d, barra);
});
function pasoEnsayo(n) {
  const en = S.ui.ensayo;
  if (!en) return;
  const j = Math.min(en.vistas.length - 1, Math.max(0, en.i + n));
  if (j === en.i) return;
  if (n > 0) sonar(en.vistas[en.i].siguiente);
  en.i = j;
  pintar();
}
accion('ensayoPaso', (v) => pasoEnsayo(Number(v)));

accion('desfile', async (orden) => {
  if (orden === 'terminar' && !S.ui.confirmaFin) { S.ui.confirmaFin = true; aviso('El desfile se cierra y el parte queda publicado. Pulsa otra vez para confirmarlo.'); return; }
  S.ui.confirmaFin = false;
  if (orden === 'siguiente' && S.est.desfile) sonar(S.est.desfile.siguiente);
  await llamar('desfile', { orden });
  await refrescar(true);
  if (orden === 'empezar') ir('/cuartel'); else if (orden === 'terminar') ir('/batallas'); else pintar();
});
document.addEventListener('keydown', (ev) => {
  if (S.ruta === '/ensayo' && S.ui.ensayo && (ev.key === ' ' || ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { ev.preventDefault(); pasoEnsayo(ev.key === 'ArrowLeft' ? -1 : 1); return; }
  if (!S.mando || !S.est || S.est.guerra.fase !== 'desfile' || /input|textarea/i.test(ev.target.tagName)) return;
  if (ev.key === ' ' || ev.key === 'ArrowRight') {
    ev.preventDefault();
    const d = S.est.desfile;
    if (d.ultimo) return;
    sonar(d.siguiente);
    llamar('desfile', { orden: 'siguiente' }).then(() => refrescar(true)).then(pintar).catch(() => {});
  }
});
