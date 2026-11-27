// Trabajador mínimo de la Guerra de la Normalidad: no guarda nada en caché (así nunca se sirve una versión vieja).
// Sólo existe para que el móvil ofrezca instalar el juego en la pantalla de inicio.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (ev) => ev.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
