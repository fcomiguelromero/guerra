// Crónicas: guerras jugadas, escalafón acumulado por guerra y medallero personal con el grado.
import { tiraAfloja, anillo, casillasRacha, vitrina, cuenta } from './graficos.js?v=50';
import { S, llamar, esc, plural, signo, ordinal, enumerar, porId, fecha, insignia, GRADOS, marco, cargando, pintar,
  registrar, accion, alEntrar, pedirFotos, ir, tinte } from './base.js?v=50';
import { portada } from './expediente.js?v=50';
import { gen, tituloPremio, medallaPremio } from './genero.js?v=50';

const CORTO = { rebelde: 'El más rebelde', borrego: 'El más borrego', tardon: 'El más tardón', adivino: 'El adivino' };
function detalle(p) {
  if (p.cual === 'rebelde') return `Contra la mayoría en ${p.n} de ${p.de}`;
  if (p.cual === 'borrego') return `Con la mayoría en ${p.n} de ${p.de}`;
  if (p.cual === 'adivino') return `Acertó ${p.n} de ${plural(p.de, 'apuesta', 'apuestas')}`;
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
    ${des.map((g) => `<tr><td>—</td><td><span class="fila" style="gap:8px">${circulo(g, 'gris')}<span class="t2">${esc(nombre(g))}</span></span></td><td colspan="2" class="rosa" style="font-size:12px">${gen(g, 'Desertor', 'Desertora')}</td></tr>`).join('')}
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
  if (yo.companero) filas.push(`<div class="fila g12">${circulo(G[yo.companero.id], 'grande')}<span class="col g4"><span class="med t2">${gen(G[yo.companero.id], 'Compañero', 'Compañera')} de trinchera:</span><strong>${esc(G[yo.companero.id].nombre)}</strong><span class="med t2">Coincidisteis en ${yo.companero.n} de ${yo.companero.de} batallas</span></span></div>`);
  if (yo.enemigo) filas.push(`<div class="fila g12">${circulo(G[yo.enemigo.id], 'grande rosa')}<span class="col g4"><span class="med t2">${gen(G[yo.enemigo.id], 'Enemigo íntimo', 'Enemiga íntima')}:</span><strong>${esc(G[yo.enemigo.id].nombre)}</strong><span class="med t2">Sólo coincidisteis en ${yo.enemigo.n} de ${yo.enemigo.de}</span></span></div>`);
  (yo.premios || []).forEach((p) => filas.push(`<div class="caja oro" style="gap:2px"><span class="med t2">Tu condecoración:</span><strong class="oro">${medallaPremio(p.cual, yo)}</strong><span class="med t2">${detalle(p)}</span></div>`));
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
  return `<ol class="linea-tiempo">${lista.map((c, k) => {
    const G = porId(c.gente), g = c.campeon && G[c.campeon], des = c.gente.filter((x) => x.desertor).length;
    const hito = `<span class="hito" aria-hidden="true"></span><span class="fecha-hito">${fecha(c.fecha)}</span>`;
    if (c.id !== abierta) {
      return `<li>${hito}<div class="ficha-archivo"><span class="num-ficha">Exp. ${String(lista.length - k).padStart(3, '0')}</span><div class="fila entre"><h2 class="h2">${esc(c.nombre + (c.campo ? ' · ' + c.campo : ''))}</h2></div>
        <p class="med"><span class="oro">1.er puesto:</span> ${g ? esc(nombre(g)) : 'pendiente del duelo final'}</p>
        <p class="peq t2">${c.porraGana.length ? 'Porra: ' + esc(enumerar(c.porraGana.map((id) => nombre(G[id])))) + ' · ' : ''}${des ? (des === 1 ? gen(c.gente.find((x) => x.desertor), '1 desertor', '1 desertora') : plural(des, 'desertor', 'desertores')) : 'Sin desertores'}</p>
        <button class="btn linea chico" style="align-self:flex-start" data-a="abrirCronica" data-v="${c.id}">Ver el parte</button></div></li>`;
    }
    return `<li class="abierta">${hito}<section class="col g12"><div class="fila entre" style="align-items:baseline"><h2 class="bc" style="font-weight:800;font-size:26px;color:#fff">${esc(c.nombre + (c.campo ? ' · ' + c.campo : ''))}</h2><span class="peq t2">Exp. ${String(lista.length - k).padStart(3, '0')}</span></div>
      <p class="med t2" style="margin-top:-6px">${esc(c.pregunta)}</p>
      ${campeon(c)}${(c.preguntas || []).length ? `<section class="caja"><h2 class="h2">Campeones por pregunta</h2>${c.preguntas.map((q) => `<p class="med"><span class="t2">${esc(q.texto)}</span><br><strong class="oro">${esc(nombre(G[q.id]))}</strong> · ${plural(q.pts, 'punto', 'puntos')}</p>`).join('')}</section>` : ''}<section class="caja">${parte(c)}${porraTexto(c) ? `<p class="med t2">${porraTexto(c)}</p>` : ''}</section>${tuGuerra(c)}</section></li>`;
  }).join('')}</ol>`;
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
    <dl class="leyenda-fija">
      <dt>GJ</dt><dd>Guerras jugadas: las que terminó sin desertar.</dd>
      <dt>Tít.</dt><dd>Títulos: guerras que ha ganado.</dd>
      <dt>Pts</dt><dd>Puntos sumados en todas sus guerras: 3 por batalla ganada y 1 por empatada.</dd>
      <dt>Dif.</dt><dd>Diferencia de votos acumulada: los votos que ha recibido en todas sus batallas menos los que han recibido sus rivales. Ganar una batalla 5 a 2 suma +3; perderla 1 a 6 resta 5. Desempata a igualdad de puntos.</dd>
      <dt>Des.</dt><dd>Deserciones: guerras de las que salió con deshonor por no votar.</dd>
    </dl>
    <p class="peq t2">Suma todas las ediciones de esta guerra. Los puntos se cuentan siempre a 3-1-0, aunque alguna edición se jugara por votos. El grado, con galones y estrellas, cuenta todas las guerras que cada uno ha terminado, se llamen como se llamen.</p></section>
    ${bloqueCaraACara(elegida)}`;
}

// ---------------------------------------------------------------- cara a cara

// Pone el par mirado desde «a»: sus victorias, las del otro y los votos de cada uno.
function desde(p, a) { return p.x === a ? { g: p.gx, e: p.e, p: p.gy, vf: p.vx, vc: p.vy, n: p.n } : { g: p.gy, e: p.e, p: p.gx, vf: p.vy, vc: p.vx, n: p.n }; }
function bloqueCaraACara(serie) {
  const caras = serie.caras || [], filas = serie.filas;
  if (!caras.length || filas.length < 2) return '';
  const quien = porId(filas.map((f) => Object.assign({ id: f.clave }, f)));
  const yo = S.ui.cronicas.persona && quien[S.ui.cronicas.persona] ? S.ui.cronicas.persona : null;
  const nom = (k) => (k === yo ? 'Tú' : quien[k] ? quien[k].nombre : '¿?');
  const par = (a, b) => caras.find((p) => (p.x === a && p.y === b) || (p.x === b && p.y === a));
  const mios = yo ? caras.filter((p) => p.x === yo || p.y === yo).map((p) => Object.assign({ rival: p.x === yo ? p.y : p.x }, desde(p, yo))) : [];

  // El par elegido: lo que haya escogido, o yo contra mi rival más visto, o la gran rivalidad.
  const igualada = (p) => Math.abs(p.gx - p.gy) * 100 + Math.abs(p.vx - p.vy);
  const grande = caras.slice().sort((p, q) => q.n - p.n || igualada(p) - igualada(q))[0];
  const elegido = S.ui.cara && S.ui.cara.serie === serie.serie ? S.ui.cara : null;
  let a = elegido ? elegido.a : yo || grande.x;
  let b = elegido ? elegido.b : yo ? mios.slice().sort((p, q) => q.n - p.n)[0].rival : grande.y;
  if (!quien[a]) a = filas[0].clave;
  if (!quien[b] || b === a) b = filas.find((f) => f.clave !== a).clave;
  const p = par(a, b), d = p ? desde(p, a) : null;
  const opciones = (sel, otro) => filas.map((f) => `<option value="${esc(f.clave)}" ${f.clave === sel ? 'selected' : ''} ${f.clave === otro ? 'disabled' : ''}>${esc(nom(f.clave))}</option>`).join('');
  const lado = (k, g, color) => `<div class="col g4" style="align-items:center;flex:1;min-width:0">${circulo(quien[k], 'cara')}
      <b class="bc ${color}" style="font-size:52px;line-height:1;font-weight:800">${g}</b></div>`;
  const marcador = d ? `<div class="fila" style="align-items:center;gap:8px">${lado(a, d.g, d.g > d.p ? 'teal' : d.g < d.p ? 'rosa' : '')}
      <span class="bc t2" style="font-size:22px;font-weight:800">VS</span>${lado(b, d.p, d.p > d.g ? 'teal' : d.p < d.g ? 'rosa' : '')}</div>
    ${tiraAfloja(d.g, d.p, nom(a), nom(b))}
    <p class="med centro">${d.g === d.p ? 'Igualdad absoluta' : (d.g > d.p ? a : b) === yo ? 'Dominas <strong>tú</strong>' : `Domina <strong>${esc(nom(d.g > d.p ? a : b))}</strong>`}: ${plural(d.n, 'batalla', 'batallas')}${d.e ? `, ${plural(d.e, 'empate', 'empates')}` : ''}. En votos, ${d.vf} a ${d.vc}.</p>`
    : '<p class="med t2 centro">Nunca se han enfrentado en esta guerra.</p>';

  const linea = (titulo, txt) => `<p class="med"><strong class="teal">${titulo}.</strong> <span class="t3">${txt}</span></p>`;
  const extra = [];
  if (yo) {
    const negra = mios.filter((m) => m.p > m.g).sort((m, q) => (q.p - q.g) - (m.p - m.g) || q.vc - m.vc)[0];
    const victima = mios.filter((m) => m.g > m.p).sort((m, q) => (q.g - q.p) - (m.g - m.p) || q.vf - m.vf)[0];
    if (negra) extra.push(linea('Tu bestia negra', `${esc(nom(negra.rival))}, que te gana ${negra.p} a ${negra.g}.`));
    if (victima) extra.push(linea('Tu víctima favorita', `${esc(nom(victima.rival))}: le ganas ${victima.g} a ${victima.p}.`));
  }
  if (grande.n > 1 || serie.ediciones > 1) {
    const dg = desde(grande, grande.x);
    extra.push(linea('La gran rivalidad', `${esc(nom(grande.x))} contra ${esc(nom(grande.y))}: ${plural(grande.n, 'batalla', 'batallas')}, ${dg.g}-${dg.e}-${dg.p}.`));
  }
  return `<section class="caja"><h2 class="h2">Cara a cara</h2>
    <p class="peq t2">Elige a dos combatientes y mira quién ha ganado más veces cuando se han enfrentado, sumando todas las ediciones.</p>
    <div class="fila" style="gap:8px"><label class="campo crece" style="margin:0"><span class="vh">Primer combatiente</span><select data-c="cara" data-v="a">${opciones(a, b)}</select></label>
      <label class="campo crece" style="margin:0"><span class="vh">Segundo combatiente</span><select data-c="cara" data-v="b">${opciones(b, a)}</select></label></div>
    ${marcador}
    ${extra.join('')}</section>`;
}
accion('cara', (lado, el) => {
  const series = S.ui.cronicas.series, serie = series.find((x) => x.serie === S.ui.serie) || series[0];
  const actual = Array.from(document.querySelectorAll('[data-c="cara"]')).map((s) => s.value);
  S.ui.cara = { serie: serie.serie, a: actual[0], b: actual[1] };
  if (lado === 'a' && el.value === actual[1]) S.ui.cara.b = '';
  pintar();
});

// ---------------------------------------------------------------- pestaña «Medallero»

function pestanaMedallero() {
  const c = S.ui.cronicas, persona = c.persona;
  if (!persona) return '<div class="caja"><p>El medallero es personal: entra con tu enlace de combatiente para ver el tuyo.</p></div>';
  const mias = c.guerras.map((x) => ({ c: x, yo: yoEn(x) })).filter((x) => x.yo);
  const terminadas = c.grados[persona] || 0, gr = Math.min(terminadas, GRADOS.length - 1);
  const est = { tit: 0, podios: 0, porras: 0, cond: 0, mejor: null, des: 0 };
  const condecoraciones = [], piezas = [], companeros = {}, enemigos = {};
  mias.forEach(({ c: x, yo }) => {
    if (yo.desertor) { est.des++; return; }
    if (x.campeon === yo.id) { est.tit++; piezas.push({ tipo: 'titulo', letra: '1', titulo: gen(yo, 'Campeón', 'Campeona'), sub: x.nombre }); }
    if (yo.pos && yo.pos <= 3) est.podios++;
    if (yo.pos && (est.mejor == null || yo.pos < est.mejor)) est.mejor = yo.pos;
    if (x.porraGana.indexOf(yo.id) >= 0) { est.porras++; piezas.push({ tipo: 'porra', letra: 'P', titulo: 'Porra', sub: x.nombre }); }
    (yo.premios || []).forEach((p) => { est.cond++; condecoraciones.push({ p, c: x }); piezas.push({ tipo: p.cual, letra: ({ rebelde: 'R', borrego: 'B', tardon: 'T', adivino: 'A' })[p.cual] || '★', titulo: CORTO[p.cual] ? tituloPremio(p.cual, yo) : 'Medalla', sub: x.nombre }); });
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
  // Tu retrato en grande: la foto de la guerra en la que estás o, si no, la última que tengas en las crónicas.
  const actual = S.est && S.est.yo ? (S.est.gente || []).find((g) => g.id === S.est.yo.id) : null;
  const conFoto = [actual].concat(mias.slice().reverse().map((m) => m.yo)).find((g) => g && g.foto && S.fotos[g.foto]);
  const nomYo = (actual || yoMismo || {}).nombre || '';
  const frase = (actual && actual.frase) || (yoMismo && yoMismo.frase) || '';
  return `<section class="retrato-yo"><div class="retrato-marco"><div class="retrato-foto" style="background:${tinte(actual ? actual.id : 'c0')[0]}">${conFoto ? `<img src="${S.fotos[conFoto.foto]}" alt="Tu foto">` : `<b>${esc(nomYo.charAt(0).toUpperCase())}</b>`}</div>
      ${gr ? `<span class="retrato-insignia" aria-hidden="true">${insignia(gr, 26)}</span>` : ''}</div>
      <div class="col g4" style="align-items:center;text-align:center"><span class="sobre">Tu medallero</span><strong class="bc retrato-nombre">${esc(nomYo)}</strong>
        <span class="yo-grado">${GRADOS[gr]} · ${plural(mias.length, 'guerra jugada', 'guerras jugadas')}</span>${frase ? `<em class="med t3">«${esc(frase)}»</em>` : ''}</div></section>
    <section class="caja oro"><div class="fila g12"><span class="oro" style="display:inline-flex">${insignia(gr, 52)}</span>
      <span class="col g4"><span class="sobre oro">Tu grado</span><strong class="bc" style="font-size:30px;color:#fff">${GRADOS[gr]}</strong>
      <span class="med t2">${plural(terminadas, 'guerra terminada', 'guerras terminadas')}${gr < GRADOS.length - 1 ? ' · ' + GRADOS[gr + 1].toLowerCase() + ' en la próxima' : ' · lo más alto del escalafón'}</span></span></div>
      <ol style="display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px">${escala}</ol>
      <div class="fila entre peq t2"><span>Recluta</span><span>General</span></div></section>
    <div class="rejilla3">${dato(est.tit, est.tit === 1 ? 'Título' : 'Títulos')}${dato(est.podios, est.podios === 1 ? 'Podio' : 'Podios')}${dato(est.porras, 'Porras ganadas')}
      ${dato(est.cond, est.cond === 1 ? 'Condecoración' : 'Condecoraciones')}${dato(est.mejor ? ordinal(est.mejor) : '—', 'Mejor puesto')}${dato(est.des, est.des === 1 ? 'Deserción' : 'Deserciones')}</div>
    <section class="col g8"><h2 class="h2">La vitrina</h2>${vitrina(piezas)}${piezas.length ? '' : '<p class="peq t2 centro">Aún vacía: títulos, porras y condecoraciones se cuelgan aquí.</p>'}</section>
    ${comp || enem ? `<section class="caja"><h2 class="h2">De siempre</h2>
      ${comp ? `<div class="fila g12">${circulo(comp.g, 'grande')}<span class="col g4"><span class="med t2">${gen(comp.g, 'Compañero', 'Compañera')} de trinchera:</span><strong>${esc(comp.g.nombre)}</strong><span class="med t2">En ${comp.n} de tus ${plural(mias.length, 'guerra', 'guerras')}</span></span></div>` : ''}
      ${enem ? `<div class="fila g12">${circulo(enem.g, 'grande rosa')}<span class="col g4"><span class="med t2">${gen(enem.g, 'Enemigo íntimo', 'Enemiga íntima')}:</span><strong>${esc(enem.g.nombre)}</strong><span class="med t2">En ${enem.n} de tus ${plural(mias.length, 'guerra', 'guerras')}</span></span></div>` : ''}</section>` : ''}
    <section class="caja"><h2 class="h2">Tus guerras</h2>${mias.length ? mias.map(({ c: x, yo }) => {
      const logros = [];
      if (yo.desertor) logros.push(`<span class="rosa">${gen(yo, 'Desertor', 'Desertora')}</span>`);
      else if (x.campeon === yo.id) logros.push(`<span class="oro">${gen(yo, 'Campeón', 'Campeona')}</span>`);
      else if (yo.pos) logros.push(ordinal(yo.pos) + ' puesto');
      if (x.porraGana.indexOf(yo.id) >= 0) logros.push('<span class="teal">Ganaste la porra</span>');
      return `<div class="fila entre" style="padding:6px 0;border-top:1px solid #2a2648"><span class="col g4"><strong>${esc(x.nombre)}</strong><span class="peq t2">${fecha(x.fecha)}</span></span><span class="med" style="text-align:right;max-width:55%">${logros.join(' · ') || 'Votaste'}</span></div>`;
    }).join('') : '<p class="med t2">Aún no has terminado ninguna guerra.</p>'}</section>`;
}

// ---------------------------------------------------------------- pestaña «Números»
// Estadísticas de un combatiente en todas las guerras que se ven aquí: batallas, rachas, preguntas y rivales.
function numerosDe(persona) {
  const lista = S.ui.cronicas.guerras.slice().sort((a, b) => a.fecha - b.fecha);
  const n = { guerras: 0, des: 0, g: 0, e: 0, p: 0, vf: 0, vc: 0, racha: 0, rachaDonde: '', sequia: 0, mejor: null, preguntas: {}, rivales: {}, serie: [] };
  let va = 0, vd = 0, donde = [];
  lista.forEach((c) => {
    const yo = c.gente.find((g) => g.persona === persona && g.combate);
    if (!yo) return;
    n.sexo = yo.sexo;
    if (yo.desertor) { n.des++; return; }
    n.guerras++;
    const G = porId(c.gente), qs = c.listaPreguntas && c.listaPreguntas.length ? c.listaPreguntas : [c.pregunta];
    const mias = (c.batallas || []).filter((b) => b[0] === yo.id || b[1] === yo.id).sort((x, y) => (x[4] || 0) - (y[4] || 0));
    let gg = 0, ee = 0, pp = 0;
    mias.forEach((b) => {
      const soyA = b[0] === yo.id, a = soyA ? b[2] : b[3], o = soyA ? b[3] : b[2], rival = G[soyA ? b[1] : b[0]];
      n.vf += a; n.vc += o;
      const q = qs[((b[4] || 1) - 1) % qs.length] || c.pregunta, kq = q.trim().toLowerCase();
      const fq = n.preguntas[kq] || (n.preguntas[kq] = { texto: q, g: 0, e: 0, p: 0 });
      const kr = rival.persona || 'cosa:' + rival.nombre, fr = n.rivales[kr] || (n.rivales[kr] = { g: rival, gano: 0, pierdo: 0 });
      n.serie.push(a > o ? 'g' : a < o ? 'p' : 'e');
      if (a > o) { n.g++; gg++; fq.g++; fr.gano++; va++; vd = 0; if (!donde.includes(c.nombre)) donde.push(c.nombre); }
      else if (a < o) { n.p++; pp++; fq.p++; fr.pierdo++; va = 0; donde = []; vd++; }
      else { n.e++; ee++; fq.e++; va = 0; donde = []; vd = 0; }
      if (va > n.racha) { n.racha = va; n.rachaDonde = donde.slice(); }
      if (vd > n.sequia) n.sequia = vd;
    });
    if (yo.pos && (!n.mejor || yo.pos < n.mejor.pos || (yo.pos === n.mejor.pos && gg > n.mejor.g))) n.mejor = { pos: yo.pos, c, g: gg, e: ee, p: pp };
  });
  return n;
}
function pestanaNumeros() {
  const c = S.ui.cronicas;
  const personas = {};
  c.guerras.forEach((x) => x.gente.forEach((g) => { if (g.persona && g.combate) personas[g.persona] = g; }));
  const claves = Object.keys(personas).sort((a, b) => personas[a].nombre.localeCompare(personas[b].nombre, 'es'));
  if (!claves.length) return '<div class="caja"><p>Los números se estrenan cuando acabe la primera guerra.</p></div>';
  const quien = S.ui.numerosDe && personas[S.ui.numerosDe] ? S.ui.numerosDe : c.persona && personas[c.persona] ? c.persona : claves[0];
  const yo = quien === c.persona, n = numerosDe(quien), total = n.g + n.e + n.p, nom = personas[quien].nombre;
  const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);
  const dato = (v, t) => `<div class="caja centro" style="gap:2px;padding:10px 6px"><b class="bc" style="font-size:28px;color:#fff;line-height:1;text-transform:none">${v}</b><span class="peq t2">${t}</span></div>`;
  const preguntas = Object.values(n.preguntas).filter((q) => q.g + q.e + q.p).sort((a, b) => pct(b.g, b.g + b.e + b.p) - pct(a.g, a.g + a.e + a.p));
  const rivales = Object.values(n.rivales);
  const victima = rivales.filter((r) => r.gano > r.pierdo).sort((a, b) => (b.gano - b.pierdo) - (a.gano - a.pierdo) || b.gano - a.gano)[0];
  const negra = rivales.filter((r) => r.pierdo > r.gano).sort((a, b) => (b.pierdo - b.gano) - (a.pierdo - a.gano) || b.pierdo - a.pierdo)[0];
  const T = yo ? { de: 'Tus', su: 'tu', le: 'te', mejor: 'Tu mejor guerra', victima: 'Tu víctima favorita', negra: 'Tu bestia negra', gana: 'le ganas', pierde: 'te gana' }
    : { de: 'Sus', su: 'su', le: 'le', mejor: 'Su mejor guerra', victima: 'Su víctima favorita', negra: 'Su bestia negra', gana: 'le gana', pierde: 'le gana' };
  return `<label class="campo"><span>Números de</span><select data-c="numerosDe">${claves.map((k) => `<option value="${esc(k)}" ${k === quien ? 'selected' : ''}>${esc(k === c.persona ? personas[k].nombre + ' (tú)' : personas[k].nombre)}</option>`).join('')}</select></label>
    ${!total ? `<div class="caja"><p>${esc(nom)} aún no ha librado ninguna batalla.</p></div>` : `
    <section class="fila anillos">${anillo(pct(n.g, total), 'Victorias')}${anillo(pct(n.vf, n.vf + n.vc), 'Votos a favor', '#8f7bff')}</section>
    <div class="rejilla3">${dato(cuenta(total, '', 'nb:' + quien), total === 1 ? 'Batalla' : 'Batallas')}${dato(`<span class="teal">${n.g}</span>-${n.e}-<span class="rosa">${n.p}</span>`, 'Gana · empata · pierde')}${dato(cuenta(n.guerras, '', 'ng:' + quien), n.guerras === 1 ? 'Guerra' : 'Guerras')}</div>
    <section class="caja"><h2 class="h2">Rachas</h2>
      ${casillasRacha(n.serie)}<div class="fila entre peq t2"><span>Antes</span><span><i class="ley-racha r-g"></i>Gana <i class="ley-racha r-e"></i>Empata <i class="ley-racha r-p"></i>Pierde</span><span>Ahora</span></div>
      <p class="med"><strong class="teal">${plural(n.racha, 'victoria seguida', 'victorias seguidas')}</strong> <span class="t2">como mejor racha${n.rachaDonde.length ? ', en ' + esc(enumerar(n.rachaDonde)) : ''}.</span></p>
      <p class="med"><strong class="rosa">${plural(n.sequia, 'derrota seguida', 'derrotas seguidas')}</strong> <span class="t2">en ${T.su} peor travesía del desierto.</span></p>
      <p class="med t2">En total, ${plural(n.vf, 'voto', 'votos')} a favor y ${n.vc} en contra.</p></section>
    ${n.mejor ? `<section class="caja oro"><h2 class="h2">${T.mejor}</h2><p class="med"><strong>${esc(n.mejor.c.nombre)}</strong> <span class="t2">· ${fecha(n.mejor.c.fecha)}</span></p>
      <p class="med">${n.mejor.c.campeon && n.mejor.pos === 1 ? `<span class="oro">${gen({ sexo: n.sexo }, 'Campeón', 'Campeona')}</span>` : ordinal(n.mejor.pos) + ' puesto'} <span class="t2">con ${n.mejor.g}-${n.mejor.e}-${n.mejor.p}.</span></p></section>` : ''}
    ${preguntas.length ? `<section class="caja"><h2 class="h2">Por pregunta</h2>${preguntas.map((q) => { const t = q.g + q.e + q.p, v = pct(q.g, t); return `<div class="col g4"><div class="fila entre"><span class="med">${esc(q.texto)}</span><strong class="${v >= 50 ? 'teal' : 'rosa'}">${v}%</strong></div>
      <div class="medidor"><i style="width:${v}%"></i></div><span class="peq t2">${q.g}-${q.e}-${q.p} en ${plural(t, 'batalla', 'batallas')}</span></div>`; }).join('')}</section>` : ''}
    ${victima || negra ? `<section class="caja"><h2 class="h2">Contra quién</h2>
      ${victima ? `<div class="fila g12">${circulo(victima.g, 'grande')}<span class="col g4"><span class="med t2">${T.victima}:</span><strong>${esc(victima.g.nombre)}</strong><span class="med t2">${T.gana.charAt(0).toUpperCase() + T.gana.slice(1)} ${victima.gano} a ${victima.pierdo}</span></span></div>` : ''}
      ${negra ? `<div class="fila g12">${circulo(negra.g, 'grande rosa')}<span class="col g4"><span class="med t2">${T.negra}:</span><strong>${esc(negra.g.nombre)}</strong><span class="med t2">${T.le === 'te' ? 'Te gana' : 'Le gana'} ${negra.pierdo} a ${negra.gano}</span></span></div>` : ''}</section>` : ''}
    ${n.des ? `<p class="peq rosa centro">${plural(n.des, 'deserción', 'deserciones')}: esas guerras no cuentan en los números.</p>` : ''}`}
    <p class="peq t2 centro">Suma todas las guerras que ves en las crónicas.</p>`;
}
accion('numerosDe', (v, el) => { S.ui.numerosDe = el.value; pintar(); });

registrar('/cronicas', () => {
  const c = S.ui.cronicas;
  if (!S.est || !c) return marco(cargando('Abriendo las crónicas'), { fondo: 'a' });
  const pest = S.ui.pestanaCronicas || 'guerras';
  const tabs = [['guerras', 'Guerras'], ['escalafon', 'Escalafón'], ['medallero', 'Medallero'], ['numeros', 'Números']];
  const cuerpo = pest === 'escalafon' ? pestanaEscalafon() : pest === 'medallero' ? pestanaMedallero() : pest === 'numeros' ? pestanaNumeros() : pestanaGuerras();
  const yoNom = c.persona && S.est && S.est.yo ? (S.est.gente.find((g) => g.id === S.est.yo.id) || {}).nombre : '';
  const series = c.series || [], fechas = c.guerras.map((x) => x.fecha).filter(Boolean);
  const hoja = portada({ pestana: 'Archivo · Leg. ' + String(c.guerras.length).padStart(3, '0'), membrete: ['ESTADO MAYOR DE LA NORMALIDAD', 'SERVICIO HISTÓRICO Y ARCHIVO DE CAMPAÑAS'],
    titulo: 'Crónicas', lineas: ['ASUNTO: palmarés, escalafón y hojas de servicio de todas las guerras.'],
    ficha: [['Guerras archivadas', c.guerras.length], ['Escalafones', series.length], fechas.length ? ['Primera guerra', fecha(Math.min(...fechas))] : null, yoNom ? ['Consulta', yoNom] : null].filter(Boolean),
    pie: c.persona ? 'SÓLO SE MUESTRAN LAS GUERRAS EN LAS QUE HA COMBATIDO EL CONSULTANTE.' : '', sello: 'Archivado', redondo: 'SERVICIO HISTÓRICO · ARCHIVO · ' });
  return marco(`<header class="col g4"><div class="sobre">Palmarés</div><h1 class="h1">Crónicas</h1></header>
    <div class="expediente">${hoja}
    <div class="opciones pestanas-archivo" role="tablist">${tabs.map(([k, t]) => `<button role="tab" aria-selected="${pest === k}" aria-pressed="${pest === k}" data-a="pestanaCronicas" data-v="${k}">${t}</button>`).join('')}</div>
    <div class="col g12 dossier parte-final cronicas-papel">${cuerpo}</div></div>`, { fondo: 'a' });
});
accion('miMedallero', () => { S.ui.pestanaCronicas = 'medallero'; ir('/cronicas'); });
accion('pestanaCronicas', (k) => { S.ui.pestanaCronicas = k; pintar(); window.scrollTo(0, 0); });
accion('abrirCronica', (id) => { S.ui.cronicaAbierta = id; pintar(); });
accion('serie', (s) => { S.ui.serie = s; pintar(); });
