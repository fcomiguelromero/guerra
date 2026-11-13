// Crónicas: guerras jugadas, escalafón acumulado por guerra y medallero personal con el grado.
import { S, llamar, esc, plural, signo, ordinal, enumerar, porId, fecha, insignia, GRADOS, marco, cargando, pintar,
  registrar, accion, alEntrar, pedirFotos } from './base.js';

const PREMIOS = { rebelde: 'Medalla al más rebelde', borrego: 'Medalla al más borrego', tardon: 'Medalla al más tardón' };
const CORTO = { rebelde: 'El más rebelde', borrego: 'El más borrego', tardon: 'El más tardón' };
function detalle(p) {
  if (p.cual === 'rebelde') return `Contra la mayoría en ${p.n} de ${p.de}`;
  if (p.cual === 'borrego') return `Con la mayoría en ${p.n} de ${p.de}`;
  return p.motivo === 'indulto' ? `Indulto con ${plural(p.n, 'voto', 'votos')} sin emitir` : 'La última papeleta';
}

alEntrar('/cronicas', async () => {
  S.ui.cronicas = await llamar('cronicas', {}, 1);
  const fotos = [];
  S.ui.cronicas.guerras.forEach((c) => c.gente.forEach((g) => fotos.push(g.foto)));
  pedirFotos(fotos);
  pintar();
});

const yoEn = (c) => (S.ui.cronicas.persona ? c.gente.find((g) => g.persona === S.ui.cronicas.persona) : null);
const nombre = (g) => (g.persona && g.persona === S.ui.cronicas.persona ? 'Tú' : g.nombre);
function circulo(g, clase = '') {
  const foto = g.foto && S.fotos[g.foto];
  return `<span class="avatar ${clase}" aria-hidden="true">${foto ? `<img src="${foto}" alt="">` : esc(nombre(g).charAt(0).toUpperCase())}</span>`;
}
function gradoDe(persona) {
  const n = persona ? S.ui.cronicas.grados[persona] || 0 : 0;
  return Math.min(n, GRADOS.length - 1);
}

// ---------------------------------------------------------------- pestaña «Guerras»

function parte(c) {
  const vivos = c.gente.filter((g) => g.combate && !g.desertor).sort((a, b) => a.pos - b.pos);
  const des = c.gente.filter((g) => g.desertor);
  const yo = yoEn(c);
  return `<table class="tabla"><thead><tr><th>#</th><th>${c.modo === 'cosas' ? 'Contendiente' : 'Combatiente'}</th><th>Puntos</th><th>Dif.</th></tr></thead><tbody>
    ${vivos.map((g) => `<tr class="${yo && g.id === yo.id ? 'yo' : ''}"><td>${g.pos}</td><td><span class="fila" style="gap:8px">${circulo(g)}${esc(nombre(g))}</span></td><td class="pts">${g.pts}</td><td>${signo(g.dif)}</td></tr>`).join('')}
    ${des.map((g) => `<tr><td>—</td><td><span class="fila" style="gap:8px">${circulo(g, 'gris')}<span class="t2">${esc(nombre(g))}</span></span></td><td colspan="2" class="rosa" style="font-size:12px">Desertor</td></tr>`).join('')}
  </tbody></table>`;
}
function porraTexto(c) {
  if (!c.porraGana.length) return '';
  const G = porId(c.gente);
  return `Porra: ${esc(enumerar(c.porraGana.map((id) => nombre(G[id]))))}, a ${plural(c.porraSuma, 'puesto', 'puestos')} del parte final`;
}
function tuGuerra(c) {
  const yo = yoEn(c);
  if (!yo) return '';
  const G = porId(c.gente), filas = [];
  if (yo.companero) filas.push(`<div class="fila g12">${circulo(G[yo.companero.id], 'grande')}<span class="col g4"><span class="med t2">Compañero de trinchera:</span><strong>${esc(G[yo.companero.id].nombre)}</strong><span class="med t2">Coincidisteis en ${yo.companero.n} de ${yo.companero.de} batallas</span></span></div>`);
  if (yo.enemigo) filas.push(`<div class="fila g12">${circulo(G[yo.enemigo.id], 'grande rosa')}<span class="col g4"><span class="med t2">Enemigo íntimo:</span><strong>${esc(G[yo.enemigo.id].nombre)}</strong><span class="med t2">Sólo coincidisteis en ${yo.enemigo.n} de ${yo.enemigo.de}</span></span></div>`);
  (yo.premios || []).forEach((p) => filas.push(`<div class="caja oro" style="gap:2px"><span class="med t2">Tu condecoración:</span><strong class="oro">${PREMIOS[p.cual]}</strong><span class="med t2">${detalle(p)}</span></div>`));
  return filas.length ? `<section class="caja"><h2 class="h2">Tu guerra</h2>${filas.join('')}</section>` : '';
}
function campeon(c) {
  const G = porId(c.gente), g = c.campeon && G[c.campeon];
  if (!g) return `<div class="caja"><span class="sobre">1.er puesto</span><span class="med t2">Pendiente del duelo final</span></div>`;
  return `<div class="caja" style="flex-direction:row;align-items:center;gap:12px">${circulo(g, 'grande')}
    <span class="col g4"><span class="bc oro" style="font-weight:800;font-size:18px;letter-spacing:.04em">1.er puesto</span><strong class="bc" style="font-size:26px;color:#fff">${esc(nombre(g))}</strong>
    <span class="med t2">${plural(g.pts, 'punto', 'puntos')} · ${g.g} de ${g.g + g.e + g.p} batallas · ${signo(g.dif)}</span></span></div>`;
}
function pestanaGuerras() {
  const lista = S.ui.cronicas.guerras;
  if (!lista.length) return '<div class="caja"><p>Las crónicas se estrenan cuando acabe la primera guerra.</p></div>';
  const abierta = S.ui.cronicaAbierta || lista[0].id;
  return lista.map((c) => {
    const G = porId(c.gente), g = c.campeon && G[c.campeon], des = c.gente.filter((x) => x.desertor).length;
    if (c.id !== abierta) {
      return `<div class="caja"><div class="fila entre"><h2 class="h2">${esc(c.nombre)}</h2><span class="peq t2">${fecha(c.fecha)}</span></div>
        <p class="med"><span class="oro">1.er puesto:</span> ${g ? esc(nombre(g)) : 'pendiente del duelo final'}</p>
        <p class="peq t2">${c.porraGana.length ? 'Porra: ' + esc(enumerar(c.porraGana.map((id) => nombre(G[id])))) + ' · ' : ''}${des ? plural(des, 'desertor', 'desertores') : 'Sin desertores'}</p>
        <button class="btn linea chico" style="align-self:flex-start" data-a="abrirCronica" data-v="${c.id}">Ver el parte</button></div>`;
    }
    return `<section class="col g12"><div class="fila entre" style="align-items:baseline"><h2 class="bc" style="font-weight:800;font-size:26px;color:#fff">${esc(c.nombre)}</h2><span class="peq t2">${fecha(c.fecha)}</span></div>
      <p class="med t2" style="margin-top:-6px">${esc(c.pregunta)}</p>
      ${campeon(c)}<section class="caja">${parte(c)}${porraTexto(c) ? `<p class="med t2">${porraTexto(c)}</p>` : ''}</section>${tuGuerra(c)}</section>`;
  }).join('');
}

// ---------------------------------------------------------------- pestaña «Escalafón»

function pestanaEscalafon() {
  const series = S.ui.cronicas.series;
  if (!series.length) return '<div class="caja"><p>El escalafón se estrena cuando acabe la primera guerra.</p></div>';
  const elegida = series.find((x) => x.serie === S.ui.serie) || series[0];
  const chips = series.length > 1 ? `<div class="col g4"><span class="etiqueta">Guerra</span><div class="fila" style="flex-wrap:wrap;gap:6px">${series.map((x) => `<button class="btn chico ${x.serie === elegida.serie ? '' : 'linea'}" data-a="serie" data-v="${esc(x.serie)}" aria-pressed="${x.serie === elegida.serie}">${esc(x.nombre)} · ${plural(x.ediciones, 'edición', 'ediciones')}</button>`).join('')}</div></div>`
    : `<p class="med t2">${esc(elegida.nombre)} · ${plural(elegida.ediciones, 'edición', 'ediciones')}</p>`;
  const yo = S.ui.cronicas.persona;
  const filas = elegida.filas.map((f, k) => {
    const gr = gradoDe(f.persona);
    return `<tr class="${f.persona && f.persona === yo ? 'yo' : ''}"><td>${k + 1}</td>
      <td><span class="fila" style="gap:6px">${f.persona ? `<span class="oro" title="${GRADOS[gr]}" style="display:inline-flex">${insignia(gr, 16)}</span>` : ''}${esc(f.persona && f.persona === yo ? 'Tú' : f.nombre)}</span></td>
      <td>${f.gj}</td><td>${f.tit}</td><td class="pts">${f.pts}</td><td>${signo(f.dif)}</td><td class="${f.des ? 'rosa' : ''}">${f.des}</td></tr>`;
  }).join('');
  return `${chips}<section class="caja"><h2 class="h2">Escalafón</h2>
    <table class="tabla"><thead><tr><th>#</th><th>Combatiente</th><th title="Guerras jugadas">GJ</th><th title="Títulos">Tít.</th><th>Pts</th><th>Dif.</th><th title="Deserciones">Des.</th></tr></thead><tbody>${filas}</tbody></table>
    <p class="peq t2">Suma todas las ediciones de esta guerra. Los puntos se cuentan siempre a 3-1-0, aunque alguna edición se jugara por votos. El grado, con galones y estrellas, cuenta todas las guerras que cada uno ha terminado, se llamen como se llamen.</p></section>`;
}

// ---------------------------------------------------------------- pestaña «Medallero»

function pestanaMedallero() {
  const c = S.ui.cronicas, persona = c.persona;
  if (!persona) return '<div class="caja"><p>El medallero es personal: entra con tu enlace de combatiente para ver el tuyo.</p></div>';
  const mias = c.guerras.map((x) => ({ c: x, yo: yoEn(x) })).filter((x) => x.yo);
  const terminadas = c.grados[persona] || 0, gr = Math.min(terminadas, GRADOS.length - 1);
  const est = { tit: 0, podios: 0, porras: 0, cond: 0, mejor: null, des: 0 };
  const condecoraciones = [], companeros = {}, enemigos = {};
  mias.forEach(({ c: x, yo }) => {
    if (yo.desertor) { est.des++; return; }
    if (x.campeon === yo.id) est.tit++;
    if (yo.pos && yo.pos <= 3) est.podios++;
    if (yo.pos && (est.mejor == null || yo.pos < est.mejor)) est.mejor = yo.pos;
    if (x.porraGana.indexOf(yo.id) >= 0) est.porras++;
    (yo.premios || []).forEach((p) => { est.cond++; condecoraciones.push({ p, c: x }); });
    const G = porId(x.gente);
    if (yo.companero) { const q = G[yo.companero.id]; const k = q.persona || q.nombre; companeros[k] = companeros[k] || { g: q, n: 0 }; companeros[k].n++; }
    if (yo.enemigo) { const q = G[yo.enemigo.id]; const k = q.persona || q.nombre; enemigos[k] = enemigos[k] || { g: q, n: 0 }; enemigos[k].n++; }
  });
  const masVeces = (m) => Object.keys(m).map((k) => m[k]).sort((a, b) => b.n - a.n)[0];
  const comp = masVeces(companeros), enem = masVeces(enemigos);
  const escala = GRADOS.map((nombreGrado, k) => {
    const estilo = k < gr ? 'background:rgba(255,211,106,0.14);color:#ffd36a;border-color:rgba(255,211,106,0.5)'
      : k === gr ? 'background:#ffd36a;color:#0d0b1a;border-color:#ffd36a' : 'background:#1c1836;color:#5a5490;border-color:#2a2648';
    return `<li title="${nombreGrado}" aria-label="${nombreGrado}${k === gr ? ', tu grado' : ''}" style="height:30px;border:1px solid;border-radius:6px;display:flex;align-items:center;justify-content:center;${estilo}">${k ? insignia(k, 14) : ''}</li>`;
  }).join('');
  const dato = (n, t) => `<div class="caja centro" style="gap:2px;padding:10px 6px"><b class="bc" style="font-size:28px;color:#fff;line-height:1;text-transform:none">${n}</b><span class="peq t2">${t}</span></div>`;
  const yoMismo = mias.length ? mias[0].yo : null;
  return `<section class="caja" style="flex-direction:row;align-items:center;gap:12px">${yoMismo ? circulo(yoMismo, 'grande') : ''}
      <span class="col g4"><strong class="bc" style="font-size:24px;color:#fff">Tu medallero</strong><span class="med t2">${plural(mias.length, 'guerra jugada', 'guerras jugadas')}</span></span></section>
    <section class="caja oro"><div class="fila g12"><span class="oro" style="display:inline-flex">${insignia(gr, 52)}</span>
      <span class="col g4"><span class="sobre oro">Tu grado</span><strong class="bc" style="font-size:30px;color:#fff">${GRADOS[gr]}</strong>
      <span class="med t2">${plural(terminadas, 'guerra terminada', 'guerras terminadas')}${gr < GRADOS.length - 1 ? ' · ' + GRADOS[gr + 1].toLowerCase() + ' en la próxima' : ' · lo más alto del escalafón'}</span></span></div>
      <ol style="display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px">${escala}</ol>
      <div class="fila entre peq t2"><span>Recluta</span><span>General</span></div></section>
    <div class="rejilla3">${dato(est.tit, est.tit === 1 ? 'Título' : 'Títulos')}${dato(est.podios, est.podios === 1 ? 'Podio' : 'Podios')}${dato(est.porras, 'Porras ganadas')}
      ${dato(est.cond, est.cond === 1 ? 'Condecoración' : 'Condecoraciones')}${dato(est.mejor ? ordinal(est.mejor) : '—', 'Mejor puesto')}${dato(est.des, est.des === 1 ? 'Deserción' : 'Deserciones')}</div>
    ${condecoraciones.length ? `<section class="caja"><h2 class="h2">Condecoraciones</h2>${condecoraciones.map(({ p, c: x }) => `<div class="fila entre"><strong class="oro">${CORTO[p.cual]}</strong><span class="med t2">${esc(x.nombre)}</span></div>`).join('')}</section>` : ''}
    ${comp || enem ? `<section class="caja"><h2 class="h2">De siempre</h2>
      ${comp ? `<div class="fila g12">${circulo(comp.g, 'grande')}<span class="col g4"><span class="med t2">Compañero de trinchera:</span><strong>${esc(comp.g.nombre)}</strong><span class="med t2">En ${comp.n} de tus ${plural(mias.length, 'guerra', 'guerras')}</span></span></div>` : ''}
      ${enem ? `<div class="fila g12">${circulo(enem.g, 'grande rosa')}<span class="col g4"><span class="med t2">Enemigo íntimo:</span><strong>${esc(enem.g.nombre)}</strong><span class="med t2">En ${enem.n} de tus ${plural(mias.length, 'guerra', 'guerras')}</span></span></div>` : ''}</section>` : ''}
    <section class="caja"><h2 class="h2">Tus guerras</h2>${mias.length ? mias.map(({ c: x, yo }) => {
      const logros = [];
      if (yo.desertor) logros.push('<span class="rosa">Desertor</span>');
      else if (x.campeon === yo.id) logros.push('<span class="oro">Campeón</span>');
      else if (yo.pos) logros.push(ordinal(yo.pos) + ' puesto');
      if (x.porraGana.indexOf(yo.id) >= 0) logros.push('<span class="teal">Ganaste la porra</span>');
      return `<div class="fila entre" style="padding:6px 0;border-top:1px solid #2a2648"><span class="col g4"><strong>${esc(x.nombre)}</strong><span class="peq t2">${fecha(x.fecha)}</span></span><span class="med" style="text-align:right;max-width:55%">${logros.join(' · ') || 'Votaste'}</span></div>`;
    }).join('') : '<p class="med t2">Aún no has terminado ninguna guerra.</p>'}</section>`;
}

registrar('/cronicas', () => {
  const c = S.ui.cronicas;
  if (!S.est || !c) return marco(cargando('Abriendo las crónicas'), { fondo: 'a' });
  const pest = S.ui.pestanaCronicas || 'guerras';
  const tabs = [['guerras', 'Guerras'], ['escalafon', 'Escalafón'], ['medallero', 'Medallero']];
  const cuerpo = pest === 'escalafon' ? pestanaEscalafon() : pest === 'medallero' ? pestanaMedallero() : pestanaGuerras();
  return marco(`<header class="col g4"><div class="sobre">Palmarés</div><h1 class="h1">Crónicas</h1></header>
    <div class="opciones" role="tablist">${tabs.map(([k, t]) => `<button role="tab" aria-selected="${pest === k}" aria-pressed="${pest === k}" data-a="pestanaCronicas" data-v="${k}">${t}</button>`).join('')}</div>
    ${cuerpo}
    ${pest === 'guerras' && c.persona ? '<p class="peq t2 centro">Sólo ves las guerras en las que has combatido.</p>' : ''}`, { fondo: 'a' });
});
accion('pestanaCronicas', (k) => { S.ui.pestanaCronicas = k; pintar(); window.scrollTo(0, 0); });
accion('abrirCronica', (id) => { S.ui.cronicaAbierta = id; pintar(); });
accion('serie', (s) => { S.ui.serie = s; pintar(); });
