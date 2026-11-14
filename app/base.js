// Cimientos de las pantallas: conexión con el motor, memoria local, piezas comunes y pintado.
import { API } from './config.js';

const mem = {
  leer(k, d) { try { const v = localStorage.getItem('gn.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  poner(k, v) { try { localStorage.setItem('gn.' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: se sigue en memoria */ } }
};

export const S = {
  mando: mem.leer('mando', null),          // clave del alto mando, sólo en su dispositivo
  sesiones: mem.leer('sesiones', {}),      // guerra → enlace personal
  generales: mem.leer('generales', {}),    // guerra → enlace general
  llaves: mem.leer('llaves', {}),          // carta → llave personal del llamamiento
  guerra: mem.leer('actual', null),
  est: null, ruta: '/batallas', ui: {}, fotos: {}, desfase: 0, aviso: null, velo: ''
};
export function recordar() {
  mem.poner('mando', S.mando); mem.poner('sesiones', S.sesiones); mem.poner('generales', S.generales); mem.poner('llaves', S.llaves); mem.poner('actual', S.guerra);
}
export const preferencia = { leer: (k, d) => mem.leer('pref.' + k, d), poner: (k, v) => mem.poner('pref.' + k, v) };

// ---------------------------------------------------------------- conexión

function credenciales() {
  const c = {};
  if (S.mando) c.mando = S.mando;
  const t = S.guerra && S.sesiones[S.guerra];
  if (t) c.token = t;
  else if (S.guerra && S.mando) c.guerra = S.guerra;
  else if (S.guerra && S.generales[S.guerra]) c.g = S.generales[S.guerra];
  return c;
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function llamar(accion, params = {}, reintentos = 0) {
  const cuerpo = JSON.stringify(Object.assign({ accion }, credenciales(), params));
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: cuerpo });
      const j = await r.json();
      if (j.ok) return j.datos;
      const err = new Error(j.error || 'Algo ha fallado.');
      err.codigo = j.codigo || 'interno';
      throw err;
    } catch (err) {
      if (err.codigo) throw err;
      if (i >= reintentos) { err.codigo = 'red'; err.message = 'No hay conexión con el cuartel general. Comprueba tu internet y vuelve a intentarlo.'; throw err; }
      await espera(900);
    }
  }
}

// Las órdenes que cambian votos van en fila india: así nunca se pisan entre sí.
let cadena = Promise.resolve(), enCola = 0;
export function encolar(fn) {
  enCola++;
  cadena = cadena.then(fn).catch(() => {}).finally(() => { enCola--; });
  return cadena;
}

export async function refrescar(forzar) {
  if (!S.guerra) return false;
  const d = await llamar('estado', forzar || !S.est ? {} : { rev: S.est.rev }, 1);
  S.desfase = d.ahora - Date.now();
  if (d.igual) return false;
  S.est = d;
  pedirFotos(d.gente.map((g) => g.foto));
  return true;
}
export function ahoraServidor() { return Date.now() + S.desfase; }

export function pedirFotos(ids) {
  const faltan = [];
  ids.filter(Boolean).forEach((id) => {
    if (S.fotos[id]) return;
    const guardada = mem.leer('f.' + id, null);
    if (guardada) S.fotos[id] = guardada; else if (faltan.indexOf(id) < 0) faltan.push(id);
  });
  if (!faltan.length) return;
  llamar('fotos', { ids: faltan }, 1).then((mapa) => {
    Object.keys(mapa).forEach((id) => { S.fotos[id] = mapa[id]; mem.poner('f.' + id, mapa[id]); });
    pintar();
  }).catch(() => {});
}

let reloj = null;
export function latido() {
  clearTimeout(reloj);
  const fase = S.est && S.est.guerra.fase;
  const vivo = fase === 'desfile' || (S.est && S.est.duelo && !S.est.duelo.cerrado);
  const ms = vivo ? 2500 : fase === 'abierta' || fase === 'terminada' ? 10000 : 30000;
  reloj = setTimeout(async () => {
    const quieta = /^\/(plan|guerras|entrada|informe|armisticio|ensayo)/.test(S.ruta);
    if (!document.hidden && S.guerra && !enCola && !quieta) {
      try { if (await refrescar()) pintar(); } catch (e) { /* ya se reintentará */ }
    }
    latido();
  }, ms);
}

// ---------------------------------------------------------------- utilidades de texto

export function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export const tituloGuerra = (g) => (g ? g.nombre + (g.campo ? ' · ' + g.campo : '') : '');
export const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
export const signo = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
export const ordinal = (n) => n + (n === 1 || n === 3 ? '.er' : '.º');
export function enumerar(lista) {
  if (lista.length < 2) return lista.join('');
  const ultimo = lista[lista.length - 1];
  return lista.slice(0, -1).join(', ') + (/^(i|hi)/i.test(ultimo) ? ' e ' : ' y ') + ultimo;
}
export const porId = (lista) => Object.fromEntries(lista.map((x) => [x.id, x]));
export function fecha(ts) { return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }); }
export function diaHora(ts) { return new Date(ts).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); }
export function hace(ts) {
  const m = Math.max(0, Math.round((ahoraServidor() - ts) / 60000));
  if (m < 1) return 'Ahora mismo';
  if (m < 60) return 'Hace ' + m + ' min';
  if (m < 60 * 24) return 'Hace ' + Math.round(m / 60) + ' h';
  if (m < 60 * 48) return 'Ayer';
  return 'El ' + fecha(ts);
}
export function duracion(ms) {
  const h = ms / 3600000;
  if (h < 1) return plural(Math.max(1, Math.round(ms / 60000)), 'minuto', 'minutos');
  if (h < 36) return plural(Math.round(h), 'hora', 'horas');
  return plural(Math.round(h / 24), 'día', 'días');
}
export function poner(obj, ruta, valor) {
  const partes = ruta.split('.');
  let o = obj;
  partes.slice(0, -1).forEach((p) => { o = o[p]; });
  o[partes[partes.length - 1]] = valor;
}

// ---------------------------------------------------------------- piezas

const ICONOS = {
  izq: '<path d="M15 6l-6 6 6 6"/>', der: '<path d="M9 6l6 6-6 6"/>', arriba: '<path d="M6 15l6-6 6 6"/>', abajo: '<path d="M6 9l6 6 6-6"/>',
  visto: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', mas: '<path d="M12 5v14M5 12h14"/>', equis: '<path d="M6 6l12 12M18 6L6 18"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>', sonido: '<path d="M4 9.5h4l5-4v13l-5-4H4z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
  estrella: '<path d="M12 4.5l2 5.2 5.6.3-4.4 3.6 1.5 5.4-4.7-3.1-4.7 3.1 1.5-5.4-4.4-3.6 5.6-.3z"/>',
  wasap: '<path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.5z"/>', copiar: '<path d="M9 9h10v11H9zM5 15V4h10"/>'
};
export function ico(nombre, tam = 18, extra = '') {
  return `<svg aria-hidden="true" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" ${extra}>${ICONOS[nombre]}</svg>`;
}

export const GRADOS = ['Recluta', 'Soldado', 'Cabo', 'Sargento', 'Alférez', 'Teniente', 'Capitán', 'Comandante', 'Coronel', 'General'];
const E1 = 'M12.0 4.5 14.0 9.7 19.6 10.0 15.2 13.6 16.7 19.0 12.0 15.9 7.3 19.0 8.8 13.6 4.4 10.0 10.0 9.7Z';
const E3 = 'M12.0 2.4 13.1 5.5 16.4 5.6 13.8 7.6 14.7 10.7 12.0 8.9 9.3 10.7 10.2 7.6 7.6 5.6 10.9 5.5ZM6.6 11.9 7.7 15.0 11.0 15.1 8.4 17.1 9.3 20.2 6.6 18.4 3.9 20.2 4.8 17.1 2.2 15.1 5.5 15.0ZM17.4 11.9 18.5 15.0 21.8 15.1 19.2 17.1 20.1 20.2 17.4 18.4 14.7 20.2 15.6 17.1 13.0 15.1 16.3 15.0Z';
const trazo = (d) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
const INSIGNIAS = [
  '',
  trazo('M5 14l7-5 7 5'),
  trazo('M5 11l7-5 7 5M5 17l7-5 7 5'),
  trazo('M5 8.5l7-4.5 7 4.5M5 13.5l7-4.5 7 4.5M5 18.5l7-4.5 7 4.5'),
  `<path d="${E1}" fill="currentColor"/>`,
  '<path d="M6.8 7.5 8.0 10.8 11.6 11.0 8.8 13.1 9.7 16.5 6.8 14.6 3.9 16.5 4.8 13.1 2.0 11.0 5.6 10.8ZM17.2 7.5 18.4 10.8 22.0 11.0 19.2 13.1 20.1 16.5 17.2 14.6 14.3 16.5 15.2 13.1 12.4 11.0 16.0 10.8Z" fill="currentColor"/>',
  `<path d="${E3}" fill="currentColor"/>`,
  '<path d="M12.0 3.5 13.6 7.8 18.2 8.0 14.6 10.8 15.8 15.3 12.0 12.7 8.2 15.3 9.4 10.8 5.8 8.0 10.4 7.8Z" fill="currentColor"/>' + trazo('M5 20h14'),
  `<path d="${E3}" fill="currentColor" transform="translate(1.8 0) scale(0.85)"/>` + trazo('M5 21h14'),
  '<path d="M12.0 5.5 13.2 8.8 16.8 9.0 14.0 11.1 14.9 14.5 12.0 12.6 9.1 14.5 10.0 11.1 7.2 9.0 10.8 8.8Z" fill="currentColor"/>' + trazo('M5.5 7.5c-2 4 0 9.5 5 11.5M18.5 7.5c2 4 0 9.5-5 11.5')
];
export function insignia(grado, tam = 12) {
  return `<svg aria-hidden="true" width="${tam}" height="${tam}" viewBox="0 0 24 24">${INSIGNIAS[Math.min(grado, 9)]}</svg>`;
}
export function pildoraGrado(grado) {
  return grado ? `<span class="pildora">${insignia(grado)}${GRADOS[Math.min(grado, 9)]}</span>` : '';
}

const TINTES = [['#23204a', '#3d3880'], ['#3a1d3f', '#6b3572'], ['#1b3540', '#2f6170'], ['#3a301b', '#6b5a2f']];
export function tinte(id) { return TINTES[(Number(String(id).replace(/\D/g, '')) || 0) % 4]; }
export function silueta(id, estilo) {
  const c = tinte(id)[1];
  return `<svg aria-hidden="true" viewBox="0 0 100 100" style="${estilo}"><circle cx="50" cy="36" r="18" fill="${c}"/><path d="M14 100 C14 72 32 60 50 60 C68 60 86 72 86 100 Z" fill="${c}"/></svg>`;
}
export function nombreDe(g) { return S.est && S.est.yo && g.id === S.est.yo.id ? 'Tú' : g.nombre; }

// Carta holográfica de un contendiente. Opciones: clase, sello, selloClase, pie y figura (un dibujo en lugar de la silueta).
export function carta(g, o = {}) {
  const foto = g.foto && S.fotos[g.foto];
  const grado = g.grado ? `<span class="pildora grado">${insignia(g.grado)}${GRADOS[Math.min(g.grado, 9)]}</span>` : '';
  return `<div class="carta ${o.clase || ''}"><div>
    <div class="foto" style="background:${tinte(g.id)[0]}">${foto ? `<img src="${foto}" alt="Foto de ${esc(g.nombre)}">` : o.figura || silueta(g.id, 'height:82%')}${grado}${o.sello ? `<span class="sello ${o.selloClase || ''}">${esc(o.sello)}</span>` : ''}</div>
    <div class="nombre">${esc(g.nombre)}</div><div class="raya" aria-hidden="true"></div>
    <p class="frase">${esc(g.frase || '')}</p>${o.pie || ''}
  </div></div>`;
}
export function avatar(g, clase = '', tu = false) {
  const foto = g.foto && S.fotos[g.foto];
  return `<span class="avatar ${clase}" aria-hidden="true">${foto ? `<img src="${foto}" alt="">` : esc(String(tu ? nombreDe(g) : g.nombre).charAt(0).toUpperCase())}</span>`;
}

// ---------------------------------------------------------------- armazón, rutas y pintado

const pantallas = {}, acciones = {};
let pestanas = () => [];
export function registrar(ruta, fn) { pantallas[ruta] = fn; }
export function accion(nombre, fn) { acciones[nombre] = fn; }
export function definirPestanas(fn) { pestanas = fn; }

export function marco(cuerpo, o = {}) {
  const lista = o.sinNav ? [] : pestanas();
  const nav = (corto) => lista.map((p) => `<button data-a="ir" data-v="${p.ruta}" ${S.ruta.indexOf(p.ruta) === 0 ? 'aria-current="page"' : ''}>${corto && p.corto ? p.corto : p.texto}</button>`).join('');
  const marca = o.marca || (S.est ? S.est.guerra.nombre : '') || 'Guerra de la Normalidad';
  return `<div class="marco fondo-${o.fondo || 'b'}">
    <aside class="lateral"><div class="marca">${esc(marca)}</div><nav aria-label="Secciones">${nav(false)}</nav><div class="abajo">${o.lateral || ''}</div></aside>
    <div class="pantalla ${o.ancha ? 'ancha' : ''}">${cuerpo}</div>
    ${lista.length ? `<nav class="barra ${lista.length > 4 ? 'cinco' : ''}" aria-label="Secciones">${nav(true)}</nav>` : ''}
  </div>`;
}
export function cargando(texto = 'Cargando') { return `<div class="cargando" role="status">${esc(texto)}…</div>`; }

export function pintar() {
  const raiz = document.getElementById('app');
  const activo = document.activeElement, idActivo = activo && activo.id;
  let ini = null, fin = null;
  try { ini = activo.selectionStart; fin = activo.selectionEnd; } catch (e) { /* no es un campo de texto */ }
  const y = window.scrollY, partes = S.ruta.split('/');
  const fn = pantallas['/' + partes[1]] || pantallas['/batallas'];
  let html;
  try { html = fn(partes.slice(2)); } catch (err) {
    console.error(err);
    html = marco(`<div class="caja rosa"><strong>Esta pantalla se ha torcido.</strong><span class="med t2">${esc(err.message)}</span><button class="btn linea medio" data-a="recargar">Recargar</button></div>`, { sinNav: true });
  }
  raiz.innerHTML = html + (S.aviso ? `<div class="aviso ${S.aviso.bien ? 'bien' : ''}" role="status">${esc(S.aviso.texto)}</div>` : '') + (S.velo || '');
  if (idActivo) {
    const el = document.getElementById(idActivo);
    if (el) { el.focus(); try { if (ini != null) el.setSelectionRange(ini, fin); } catch (e) { /* nada */ } }
  }
  window.scrollTo(0, y);
}

export function ir(ruta, reemplazar, sinTocarEnlace) {
  S.ruta = ruta;
  const destino = '#' + ruta;
  if (!sinTocarEnlace && location.hash !== destino) { if (reemplazar) history.replaceState(null, '', destino); else history.pushState(null, '', destino); }
  pintar();
  window.scrollTo(0, 0);
  const entrar = entradas['/' + ruta.split('/')[1]];
  if (entrar) Promise.resolve(entrar(ruta.split('/').slice(2))).catch(mostrarError);
}
const entradas = {};
export function alEntrar(ruta, fn) { entradas[ruta] = fn; }

let relojAviso = null;
export function aviso(texto, bien) {
  S.aviso = { texto, bien: !!bien };
  clearTimeout(relojAviso);
  relojAviso = setTimeout(() => { S.aviso = null; pintar(); }, bien ? 3000 : 6000);
  pintar();
}
export function mostrarError(err) { console.error(err); aviso(err && err.message ? err.message : 'Algo ha fallado.'); }

accion('ir', (ruta) => ir(ruta));
accion('recargar', () => location.reload());
accion('cerrarVelo', () => { S.velo = ''; pintar(); });

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.disabled) return;
  ev.preventDefault();
  const fn = acciones[el.dataset.a];
  if (!fn) return;
  const res = fn(el.dataset.v, el, ev);
  if (res && res.then) {
    el.disabled = true;
    res.catch(mostrarError).finally(() => { el.disabled = false; });
  }
});
document.addEventListener('input', (ev) => {
  const el = ev.target.closest('[data-m]');
  if (!el) return;
  poner(S.ui, el.dataset.m, el.value);
  const cuenta = el.dataset.cuenta && document.getElementById(el.dataset.cuenta);
  if (cuenta) cuenta.textContent = el.value.length + '/' + el.maxLength;
});
document.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-c]');
  if (!el) return;
  const fn = acciones[el.dataset.c];
  if (fn) Promise.resolve(fn(el.dataset.v, el, ev)).catch(mostrarError);
});
window.addEventListener('popstate', () => { const h = location.hash.slice(1); if (h.charAt(0) === '/') { S.ruta = h; pintar(); } });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && S.guerra && S.est && !enCola) refrescar().then((c) => { if (c) pintar(); }).catch(() => {});
});
