// Pantallas del alto mando: guerras, plan de guerra, cuartel general, armisticio, informe clasificado y mando del desfile.
import { S, llamar, refrescar, esc, tituloGuerra, plural, signo, ordinal, enumerar, porId, hace, fecha, diaHora, duracion, poner, preferencia,
  ico, avatar, marco, cargando, pintar, ir, aviso, registrar, accion, alEntrar, recordar, pedirFotos } from './base.js';
import { etiquetaSiguiente, listaPremios, tablaFinal, listaCuriosidades, TITULOS, pantallaDesfile } from './combate.js';
import { botonCartel } from './carteles.js';

const NOMBRE_FASE = { borrador: 'Borrador', llamamiento: 'Llamamiento a filas', abierta: 'En guerra', terminada: 'Alto el fuego', desfile: 'De desfile', publicada: 'Terminada' };
const EXTRAS = [
  ['porra', 'La porra', 'Quién acierta el parte final'], ['espia', 'El espía', 'Descubrir un combate antes del desfile'],
  ['desfile', 'Desfile de la victoria', 'Revelación en directo, puesto a puesto'], ['proclamas', 'Proclamas anónimas', 'Motivos al votar, leídos sin firma'],
  ['condecoraciones', 'Condecoraciones', 'El más rebelde (vota contra la mayoría), el más borrego (vota con ella) y el más tardón'], ['radio', 'Radio Macuto', 'Pullas anónimas con censura'],
  ['parte', 'Parte a mitad de contienda', 'Aviso con los rezagados, sin resultados'], ['corneta', 'Toque de corneta en el desfile', 'Suena en tu móvil']
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
  S.guerra = id; S.est = null; S.ui.plan = null; S.ui.informe = null; S.ui.cursor = null; S.ui.porra = null;
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
  S.ui.plan = d.plan; S.ui.planMando = d.mando;
  S.ui.frases = (d.plan.diana.frases || []).join('\n');
  pedirFotos(d.plan.gente.map((g) => g.foto));
}
alEntrar('/plan', async () => { await cargarPlan(); pintar(); });

function filaGente(g, i, cosa) {
  const foto = g.foto && S.fotos[g.foto], p = S.ui.plan;
  const estado = p.llamamiento.activo && g.vota ? `<span class="peq ${g.alistado === true ? 'teal' : g.alistado === false ? 'rosa' : 't2'}">${g.alistado === true ? 'En filas' : g.alistado === false ? 'Objetor' : 'Sin respuesta'}</span>` : '';
  return `<div class="gente-plan">
    ${cosa || p.modo !== 'cosas' ? `<label class="retrato" title="Elegir foto"><input type="file" accept="image/*" hidden data-c="foto" data-v="${i}">${foto ? `<img src="${foto}" alt="Foto de ${esc(g.nombre)}">` : 'Elegir foto'}</label>` : ''}
    <div class="col crece" style="gap:6px">
      <input class="entrada" aria-label="Nombre" maxlength="40" placeholder="Nombre" data-m="plan.gente.${i}.nombre" id="gn-${i}" value="${esc(g.nombre)}">
      ${cosa ? '' : `<input class="entrada" type="email" aria-label="Correo" maxlength="120" placeholder="Correo, para su orden de movilización" data-m="plan.gente.${i}.correo" id="gc-${i}" value="${esc(g.correo)}">`}
      ${cosa || p.modo !== 'cosas' ? `<input class="entrada" aria-label="Frase para su carta" maxlength="100" placeholder="Frase para su carta (hasta 100 caracteres)" data-m="plan.gente.${i}.frase" id="gf-${i}" value="${esc(g.frase)}">` : ''}
      <div class="fila entre">${cosa ? '<span></span>' : `<button class="btn chico ${g.mando ? '' : 'linea'}" data-a="soyYo" data-v="${i}" aria-pressed="${g.mando ? 'true' : 'false'}">${g.mando ? 'Esta carta soy yo' : 'Soy yo'}</button>`}
        ${estado}${p.fase === 'borrador' || p.fase === 'llamamiento' ? `<button class="btn chico peligro" data-a="quitarGente" data-v="${i}">Quitar</button>` : ''}</div>
    </div></div>`;
}
// Presentación: una página sólo explicativa, para animar a la gente antes de meterla en la guerra.
function seccionPresentacion() {
  const p = S.ui.plan;
  if (!p.presenta) return `<section class="caja"><h2 class="h2">Presentación de la guerra</h2><p class="med t2">Una página que explica el juego para animar a la gente a participar. Guarda el plan para obtener su enlace.</p></section>`;
  const url = enlaceApp() + '#p=' + p.presenta, nombre = tituloGuerra(p) || 'una guerra';
  const texto = `Se avecina la ${nombre}${p.pregunta ? ': «' + p.pregunta + '»' : ''}. Mira de qué va y, si te alistas, avísame y te meto en la guerra: ${url}`;
  const correo = 'mailto:?subject=' + encodeURIComponent('Se avecina la ' + nombre) + '&body=' + encodeURIComponent(texto + '\n\n' + (p.firma || ''));
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
      <details><summary class="med teal" style="cursor:pointer">Ver cómo quedan</summary><ol class="col" style="margin-top:10px;gap:10px">${p.ordenanzasAuto.map((r, k) => `<li class="col g4"><strong class="bc" style="font-size:18px;color:#fff">${k + 1}. ${esc(r.t)}</strong><span class="med t3">${esc(r.x)}</span></li>`).join('')}</ol></details>
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

registrar('/plan', () => {
  const p = S.ui.plan;
  if (!p) return marco(cargando('Desplegando el plan'), { sinNav: true, fondo: 'a', marca: 'Alto mando' });
  const previa = p.fase === 'borrador' || p.fase === 'llamamiento', cosas = p.modo === 'cosas';
  const indices = p.gente.map((g, i) => i);
  const combaten = indices.filter((i) => p.gente[i].combate), votan = indices.filter((i) => p.gente[i].vota);
  const nc = combaten.length, nb = nc * (nc - 1) / 2;
  return marco(`${volver('/guerras', 'Tus guerras')}${cab('Alto mando', 'Plan de guerra')}
    <p class="t3">Una guerra nueva con su tema, su gente y sus reglas. Los nombres del juego (batallas, ofensivas, desfile) se quedan igual.</p>
    <section class="caja"><h2 class="h2">La guerra</h2>
      <label class="campo"><span>Nombre</span><input id="p-nombre" maxlength="80" data-m="plan.nombre" value="${esc(p.nombre)}" placeholder="Guerra de la Normalidad" ${previa ? '' : 'disabled'}></label>
      <label class="campo"><span>La pregunta</span><input id="p-pregunta" maxlength="160" data-m="plan.pregunta" value="${esc(p.pregunta)}" placeholder="¿Quién es más normal?" ${previa ? '' : 'disabled'}></label>
      <label class="campo"><span>Campo de batalla</span><input id="p-campo" maxlength="60" data-m="plan.campo" value="${esc(p.campo || '')}" placeholder="Familia, compañeros de trabajo, amigos…"></label>
      <p class="peq t2" style="margin-top:-6px">El grupo que combate. Distingue guerras con el mismo nombre: cada campo de batalla lleva su propio escalafón.</p>
      <label class="campo"><span>Premio</span><input id="p-premio" maxlength="160" data-m="plan.premio" value="${esc(p.premio)}" placeholder="Una cena pagada por los demás"></label>
      <label class="campo"><span>Botín de la porra</span><input id="p-botin" maxlength="160" data-m="plan.botin" value="${esc(p.botin)}" placeholder="2 € por cabeza"></label>
      <label class="campo"><span>Tu firma como alto mando</span><input id="p-firma" maxlength="60" data-m="plan.firma" value="${esc(p.firma || '')}" placeholder="Francisco M. Romero"></label>
      <p class="peq t2" style="margin-top:-6px">Así firmas los correos y el diploma. Si lo dejas vacío, se usa el nombre de tu carta.</p>
      <label class="campo"><span>Día, hora y lugar del desfile</span><input id="p-desfile" maxlength="200" data-m="plan.desfileInfo" value="${esc(p.desfileInfo)}" placeholder="Se anunciará cuando acabe la guerra"></label></section>
    ${previa ? `<section class="caja"><h2 class="h2">Quién compite</h2>
      <div class="opciones"><button aria-pressed="${!cosas}" data-a="modo" data-v="combatientes">Los combatientes</button><button aria-pressed="${cosas}" data-a="modo" data-v="cosas">Otra cosa</button></div>
      <p class="med t2">${cosas ? 'Compiten otras cosas (bodas, películas, tortillas) y los combatientes sólo votan: todos votan todas las batallas.' : 'Cada combatiente también es contendiente: no vota en sus propios combates.'}</p></section>
    ${seccionLlamamiento()}` : ''}
    ${cosas ? `<section class="caja"><div class="fila entre"><h2 class="h2">Contendientes</h2><span class="med t2">${nc}</span></div>
      ${combaten.map((i) => filaGente(p.gente[i], i, true)).join('')}${previa ? `<button class="btn linea medio" data-a="masGente" data-v="cosa">${ico('mas')}Añadir contendiente</button>` : ''}</section>` : ''}
    <section class="caja"><div class="fila entre"><h2 class="h2">Combatientes</h2><span class="med t2">${votan.length}</span></div>
      ${votan.map((i) => filaGente(p.gente[i], i, false)).join('')}
      ${previa ? `<button class="btn linea medio" data-a="masGente" data-v="persona">${ico('mas')}Reclutar combatiente</button>` : ''}
      <p class="peq t2">${nc >= 3 ? `Con ${nc} contendientes habrá ${nb} batallas en ${nc % 2 ? nc : nc - 1} ofensivas.` : 'Hacen falta al menos 3 contendientes.'} Marca «Soy yo» en tu propia carta.</p></section>
    <section class="caja"><h2 class="h2">La orden de movilización</h2><p class="med t2">Tu frase de apertura y tu remate; el enlace personal de cada uno va en medio.</p>
      <label class="campo"><span>Asunto</span><input id="p-asunto" maxlength="150" data-m="plan.correo.asunto" value="${esc(p.correo.asunto)}" placeholder="¡Comienza la ${esc(p.nombre || 'guerra')}!"></label>
      <label class="campo"><span>Apertura</span><textarea id="p-apertura" maxlength="1500" data-m="plan.correo.apertura">${esc(p.correo.apertura)}</textarea></label>
      <label class="campo"><span>Remate</span><textarea id="p-remate" maxlength="1500" data-m="plan.correo.remate">${esc(p.correo.remate)}</textarea></label>
      <button class="btn linea medio" data-a="previa" data-v="orden">Ver cómo queda el correo</button></section>
    ${previa ? `<section class="caja"><h2 class="h2">Puntuación</h2>
      <div class="opciones"><button aria-pressed="${p.puntuacion !== 'votos'}" data-a="opcion" data-v="plan.puntuacion=liga">Liga: 3, 1, 0</button><button aria-pressed="${p.puntuacion === 'votos'}" data-a="opcion" data-v="plan.puntuacion=votos">Por votos</button></div>
      <p class="med t2">${p.puntuacion === 'votos' ? 'Cada voto recibido vale 3 puntos, como en el cambio de 2012.' : 'Ganar un combate, 3 puntos; empatarlo, 1; perderlo, 0. Desempata la diferencia de votos.'}</p></section>
    <section class="caja"><h2 class="h2">Ritmo de la guerra</h2>
      <div class="opciones"><button aria-pressed="${p.ritmo !== 'diaria'}" data-a="opcion" data-v="plan.ritmo=golpe">Todas de golpe</button><button aria-pressed="${p.ritmo === 'diaria'}" data-a="opcion" data-v="plan.ritmo=diaria">Una ofensiva al día</button></div>
      <p class="med t2">${p.ritmo === 'diaria' ? `La primera ofensiva se abre al declarar la guerra y, después, una nueva cada mañana a las 9:00${nc >= 3 ? `: la guerra durará al menos ${nc % 2 ? nc : nc - 1} días` : ''}. Cada día sale un correo avisando de las batallas nuevas a quien tenga algo por votar. Las ofensivas abiertas no caducan: el que se retrase puede ponerse al día cuando quiera.` : 'Todas las ofensivas se abren a la vez y cada uno vota a su ritmo.'}</p></section>
    <section class="caja"><h2 class="h2">Extras</h2>${EXTRAS.map(([k, t, n]) => interruptor('plan.extras.' + k, p.extras[k], t, n)).join('')}</section>` : ''}
    ${seccionPresentacion()}
    ${seccionOrdenanzas()}
    <section class="caja"><h2 class="h2">Toque de diana</h2>
      ${interruptor('plan.diana.activa', p.diana.activa, 'Recordar a los rezagados', 'Un correo automático, sólo de día')}
      <div class="opciones">${[1, 2, 3].map((n) => `<button aria-pressed="${p.diana.cadaDias === n}" data-a="opcion" data-v="plan.diana.cadaDias=${n}">Cada ${plural(n, 'día', 'días')}</button>`).join('')}</div>
      <label class="campo"><span>Tus frases, una por línea. Usa {nombre} y {faltan}</span><textarea id="p-frases" data-m="frases" placeholder="Si lo dejas vacío: «{nombre}, el enemigo sigue esperando: te quedan {faltan} batallas.»">${esc(S.ui.frases || '')}</textarea></label></section>
    <div class="col">${previa ? `<button class="btn" data-a="declarar">¡Declarar la guerra!</button>` : ''}
      <button class="btn linea" data-a="guardarPlan">${previa ? 'Guardar borrador' : 'Guardar cambios'}</button>
      <button class="btn chico peligro" style="align-self:center" data-a="borrarGuerra">Borrar esta guerra</button></div>`, { sinNav: true, fondo: 'a', marca: 'Alto mando' });
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
  pintar();
  const el = document.getElementById('gn-' + (p.gente.length - 1));
  if (el) el.focus();
});
accion('quitarGente', (i) => { S.ui.plan.gente.splice(Number(i), 1); pintar(); });
accion('soyYo', (i) => { S.ui.plan.gente.forEach((g, k) => { g.mando = k === Number(i) ? !g.mando : false; }); pintar(); });

function reducirFoto(archivo) {
  return new Promise((resolver, fallar) => {
    const img = new Image(), url = URL.createObjectURL(archivo);
    img.onload = () => {
      const an = 400, al = 480, lienzo = document.createElement('canvas');
      lienzo.width = an; lienzo.height = al;
      const escala = Math.max(an / img.width, al / img.height), w = img.width * escala, h = img.height * escala;
      lienzo.getContext('2d').drawImage(img, (an - w) / 2, (al - h) / 3, w, h);
      URL.revokeObjectURL(url);
      let q = 0.82, datos = lienzo.toDataURL('image/jpeg', q);
      while (datos.length > 110000 && q > 0.3) { q -= 0.1; datos = lienzo.toDataURL('image/jpeg', q); }
      resolver(datos);
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallar(new Error('No se ha podido leer esa foto.')); };
    img.src = url;
  });
}
accion('foto', async (i, el) => {
  const archivo = el.files && el.files[0];
  if (!archivo) return;
  aviso('Subiendo la foto…', true);
  const datos = await reducirFoto(archivo);
  const r = await llamar('subirFoto', { datos });
  S.fotos[r.id] = datos;
  S.ui.plan.gente[Number(i)].foto = r.id;
  aviso('Foto lista. Acuérdate de guardar.', true);
});

async function guardarPlan() {
  const p = S.ui.plan;
  const plan = {
    nombre: p.nombre, pregunta: p.pregunta, premio: p.premio, botin: p.botin, firma: p.firma || '', campo: p.campo || '', ritmo: p.ritmo || 'golpe', pitch: p.pitch || '', desfileInfo: p.desfileInfo, modo: p.modo, puntuacion: p.puntuacion,
    extras: p.extras, correo: p.correo, llamamiento: { cierre: p.llamamiento.cierre, cierreTs: p.llamamiento.cierreTs || 0, soloAlistados: p.llamamiento.soloAlistados, nota: p.llamamiento.nota || '' },
    diana: { activa: p.diana.activa, cadaDias: p.diana.cadaDias, frases: (S.ui.frases || '').split('\n') },
    ordenanzas: p.ordenanzas ? p.ordenanzas.filter((o) => (o.t || '').trim() || (o.x || '').trim()) : null,
    gente: p.gente.map((g) => ({ id: g.id, nombre: g.nombre, correo: g.correo, frase: g.frase, foto: g.foto, combate: g.combate, mando: g.mando }))
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
  const r = await llamar('declarar');
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
  const G = porId(e.gente), m = e.mando, pr = e.progreso, fase = e.guerra.fase, abierta = fase === 'abierta';
  const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);
  const general = enlaceApp() + '#g=' + m.general;
  const errores = m.correos.filter((c) => c.error || !c.correo);
  return marco(`${volver('/guerras', 'Tus guerras')}${cab(tituloGuerra(e.guerra), 'Cuartel general')}
    <section class="caja ${abierta ? '' : 'teal'}"><div class="fila entre"><h2 class="h2">${abierta ? 'Conflicto en curso' : NOMBRE_FASE[fase]}</h2><span class="peq t2">Abierta el ${fecha(e.guerra.declarada)}</span></div>
      <div class="fila entre med"><span>Votos emitidos</span><strong>${pr.emitidos} de ${pr.total}</strong></div><div class="medidor"><i style="width:${pct(pr.emitidos, pr.total)}%"></i></div>
      ${e.porra ? `<div class="fila entre med"><span>Porras recibidas</span><strong>${e.porra.recibidas} de ${e.porra.de}</strong></div><div class="medidor"><i style="width:${pct(e.porra.recibidas, e.porra.de)}%"></i></div>` : ''}</section>
    ${abierta && e.parte ? `<section class="caja oro"><h2 class="h2 oro">Parte de mitad de contienda</h2><p class="med t3">Listo desde que se libraron ${Math.ceil(pr.total / 2)} de las ${pr.total} batallas. Enseña quién va en vanguardia y quién en retaguardia, sin desvelar resultados.</p>
      ${botonCartel('parte', ico('wasap') + 'Compartir el parte', 'btn oro medio')}</section>` : ''}
    ${m.pullas.length || m.emitidas ? `<section class="caja rosa"><div class="fila entre"><h2 class="h2">Censura de Radio Macuto</h2><span class="peq rosa" style="font-weight:600">${m.pullas.length} esperando · ${m.emitidas} emitidas</span></div>
      <p class="peq t2">Sólo tú ves quién escribe cada pulla. En antena salen sin firma. «Emitir y avisar» manda además la pulla por correo a los combatientes, sin firma y con un botón para responder.</p>
      ${m.pullas.map((p) => `<div class="col" style="padding-top:8px;border-top:1px solid #2a2648"><p style="font-style:italic">«${esc(p.texto)}»</p>
        <div class="fila entre"><span class="peq t2">De ${esc(G[p.de].nombre)} · ${hace(p.ts).toLowerCase()}</span></div>
        <div class="fila" style="flex-wrap:wrap;justify-content:flex-end"><button class="btn chico linea" data-a="moderar" data-v="${p.id}:0">Censurar</button><button class="btn chico linea" data-a="moderar" data-v="${p.id}:1">Emitir</button><button class="btn chico rosa" data-a="moderar" data-v="${p.id}:2">Emitir y avisar</button></div></div>`).join('')}</section>` : ''}
    ${abierta ? `<section class="caja"><div class="fila entre"><h2 class="h2">Rezagados</h2><span class="peq t2">${plural(pr.rezagados.length, 'persona', 'personas')}</span></div>
      ${pr.rezagados.length ? `<ul class="col g12">${pr.rezagados.map((r) => `<li class="col g4"><div class="fila">${avatar(G[r.id])}<strong class="crece">${esc(G[r.id].nombre)}</strong><span class="med t2">${plural(r.faltan, 'batalla', 'batallas')}</span></div>
        <div class="medidor"><i style="width:${pct(r.de - r.faltan, r.de)}%"></i></div></li>`).join('')}</ul>
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
      ${abierta && pr.rezagados.length ? '<button class="btn peligro" data-a="ir" data-v="/armisticio">Firmar el armisticio</button>' : ''}
      <button class="btn ${abierta ? 'linea' : ''}" data-a="ir" data-v="/informe" ${abierta ? 'disabled' : ''}>Informe clasificado${e.guerra.extras.desfile ? ' y desfile' : ''}</button>
      ${abierta ? '<p class="peq t2 centro">El informe clasificado y el desfile se abren cuando acabe la guerra. Hasta entonces nadie ve los votos, tú tampoco.</p>' : ''}
      <button class="btn linea medio" data-a="ir" data-v="/plan">Ajustes de la guerra</button>
      ${fase === 'publicada' ? '<button class="btn linea medio" data-a="contraofensiva">Contraofensiva: otra guerra con la misma gente</button>' : ''}
      <button class="btn chico peligro" style="align-self:center;margin-top:8px" data-a="borrarGuerra">Borrar esta guerra</button>
    </div>`, { fondo: 'a' });
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
  const premios = ['rebelde', 'borrego', 'tardon'].filter((k) => r.premios[k]).map((k) => Object.assign({ cual: k }, r.premios[k]));
  const bat = porId(r.batallas), curios = listaCuriosidades(r, G);
  let orden;
  if (fase === 'terminada') {
    orden = inf.guerra.extras.desfile
      ? `<button class="btn" data-a="desfile" data-v="empezar">¡Que empiece el desfile!</button><p class="peq t2 centro">${r.empate ? 'Hay empate en el primer puesto: el duelo final se librará en directo. ' : ''}La corneta suena en tu móvil, desde el mando del desfile.</p>
        <button class="btn linea medio" data-a="ir" data-v="/ensayo">Ensayar el desfile en privado</button>`
      : `<button class="btn" data-a="publicar">Publicar el parte de guerra</button><p class="peq t2 centro">Sale todo de golpe para todos.${r.empate ? ' Hay empate en el primer puesto: después se votará el duelo final.' : ''}</p>`;
  } else orden = `<p class="med teal centro">${fase === 'desfile' ? 'El desfile está en marcha.' : 'Parte de guerra publicado.'}</p>${fase === 'desfile' ? '<button class="btn" data-a="ir" data-v="/cuartel">Ir al mando del desfile</button>' : ''}`;
  return marco(`${volver('/cuartel', 'Cuartel general')}
    ${cab(tituloGuerra(inf.guerra), 'Informe clasificado', '<span class="bc rosa" style="transform:rotate(4deg);padding:2px 8px 4px;border:3px solid #ff6ad5;border-radius:8px;font-weight:800;font-size:18px;letter-spacing:.06em">Alto secreto</span>')}
    <p class="t3">Sólo para tus ojos: los combatientes nunca verán quién votó a quién.</p>${orden}
    <div class="cols-pc"><div class="col g12">
      <section class="caja"><h2 class="h2">Parte de guerra</h2>${tablaFinal(r)}
        ${r.empate ? `<p class="med oro">Empate a puntos en el primer puesto entre ${enumerar(r.empate.map((id) => G[id].nombre))}: lo decide el duelo final. El orden de arriba es provisional.</p>` : ''}</section>
      ${r.porra.lista.length ? `<section class="caja"><h2 class="h2">La porra</h2><p class="peq t2">Puestos de diferencia con el parte final. Gana la suma más baja.</p>
        <ol class="lista-puestos">${r.porra.lista.map((p) => `<li><b>${p.pos}</b><span>${nom(p.id)}</span><em>${p.suma}</em></li>`).join('')}</ol>${inf.guerra.botin ? `<p class="med t2">Botín: ${esc(inf.guerra.botin)}</p>` : ''}</section>` : ''}
      ${premios.length ? `<section class="col"><h2 class="h2">Condecoraciones</h2>${listaPremios(premios)}</section>` : ''}
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
    else if (siguiente.t === 'puesto' || siguiente.t === 'condecoracion') redoble();
  } catch (e) { /* sin sonido no se para el desfile */ }
}
accion('probarRedoble', () => { try { redoble(); } catch (e) { aviso('Este móvil no deja sonar al navegador.'); } });
accion('corneta', () => { preferencia.poner('corneta', !preferencia.leer('corneta', true)); pintar(); });

function resumenPaso(a, G) {
  if (a.t === 'consejo') return ['Consejo de guerra', G[a.id].nombre, 'Desertor'];
  if (a.t === 'puesto') return [ordinal(a.pos) + ' puesto', G[a.fila.id].nombre, plural(a.fila.pts, 'punto', 'puntos')];
  if (a.t === 'proclama') return ['Proclama anónima', a.n + ' de ' + a.de, ''];
  if (a.t === 'condecoracion') return [TITULOS[a.cual], G[a.id].nombre, ''];
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
