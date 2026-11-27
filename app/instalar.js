// El juego como app en la pantalla de inicio del móvil (sin tienda ni descarga).
// · El manifiesto se rehace al vuelo para que la app instalada abra directamente con el enlace personal
//   de quien la instala (en el iPhone, la app de la pantalla de inicio no comparte memoria con Safari).
// · En Android/Chrome se aprovecha el aviso de instalación del navegador; en el iPhone se explica el paso.
import { S, ico, accion, pintar, preferencia } from './base.js?v=56';

const base = location.origin + location.pathname.replace(/index\.html$/, '');
let aviso = null;   // el evento «beforeinstallprompt» de Chrome, si llega

export const enApp = () => (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
const esIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const esMovil = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || esIphone();

// Con qué enlace debe arrancar la app instalada: la carta de la guerra actual o, si no hay, la del alto mando.
function enlaceInicio() {
  if (S.guerra && S.sesiones[S.guerra]) return base + '#t=' + encodeURIComponent(S.sesiones[S.guerra]);
  if (S.mando) return base + '#mando=' + encodeURIComponent(S.mando);
  return base;
}
let ultimo = '';
export function ponerManifiesto() {
  const inicio = enlaceInicio();
  if (inicio === ultimo) return;
  ultimo = inicio;
  const m = {
    id: base, name: 'Guerra de la Normalidad', short_name: 'Guerra', description: 'Batallas, ofensivas y un desfile de la victoria. ¡Sólo puede quedar uno!',
    lang: 'es', start_url: inicio, scope: base, display: 'standalone', orientation: 'portrait', background_color: '#0d0b1a', theme_color: '#0d0b1a',
    icons: [{ src: base + 'assets/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' }, { src: base + 'assets/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
  };
  let link = document.querySelector('link[rel="manifest"]');
  if (!link) { link = document.createElement('link'); link.rel = 'manifest'; document.head.appendChild(link); }
  link.href = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(m));
}

window.addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); aviso = ev; pintar(); });
window.addEventListener('appinstalled', () => { aviso = null; preferencia.poner('instalada', true); pintar(); });
// Un trabajador mínimo: no guarda nada en caché (así nunca se queda una versión vieja); sólo hace que el móvil ofrezca instalarla.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

// Tarjeta para invitar a instalar: sólo en el móvil, fuera de la app y si no se ha descartado.
export function tarjetaInstalar(forzar) {
  if (enApp() || preferencia.leer('instalada', false)) return '';
  if (!forzar && (preferencia.leer('sinInstalar', false) || !esMovil())) return '';
  const pasos = esIphone()
    ? `<ol class="pasos-instalar"><li>Pulsa <strong>Compartir</strong> ${ico('compartir', 16)} en la barra de Safari.</li><li>Elige <strong>Añadir a pantalla de inicio</strong>.</li><li>Pulsa <strong>Añadir</strong>. Ya está.</li></ol>`
    : aviso ? '' : `<ol class="pasos-instalar"><li>Abre el menú del navegador (los tres puntos ⋮).</li><li>Elige <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li></ol>`;
  return `<section class="caja instalar"><div class="fila entre" style="align-items:flex-start;gap:10px">
      <div class="fila" style="gap:10px;align-items:center"><img src="assets/icono-192.png" alt="" width="44" height="44" style="border-radius:11px"><span class="col g4"><strong>Ponte la guerra en el móvil</strong>
        <span class="peq t2">Con su icono en la pantalla de inicio: un toque y a votar, sin buscar el correo.</span></span></div>
      ${forzar ? '' : `<button class="cuadro" data-a="noInstalar" aria-label="No, gracias">${ico('equis')}</button>`}</div>
    ${aviso ? `<button class="btn medio" data-a="instalarApp">Añadir a la pantalla de inicio</button>` : pasos}</section>`;
}
accion('instalarApp', async () => {
  if (!aviso) return;
  aviso.prompt();
  const r = await aviso.userChoice.catch(() => null);
  if (r && r.outcome === 'accepted') preferencia.poner('instalada', true);
  aviso = null; pintar();
});
accion('noInstalar', () => { preferencia.poner('sinInstalar', true); pintar(); });
