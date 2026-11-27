// Recordatorio del desfile (o del parte) en el calendario: Google Calendar o un archivo .ics para cualquier otro.
import { esc, accion, aviso } from './base.js?v=56';

let guerraActual = null;

const fechaIcs = (ts) => new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const enlaceApp = () => location.origin + location.pathname;
function evento(g) {
  return { titulo: (g.extras.desfile ? 'Desfile de la victoria: ' : 'Parte de guerra: ') + g.nombre, ini: g.desfileTs, fin: g.desfileTs + 2 * 3600000,
    detalle: [g.desfileInfo || '', '¡Sólo puede quedar uno! ' + enlaceApp()].filter(Boolean).join('\n') };
}
function ics(g) {
  const ev = evento(g), limpio = (s) => String(s).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Guerra de la Normalidad//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:' + g.id + '-desfile@guerra-de-la-normalidad', 'DTSTAMP:' + fechaIcs(Date.now()), 'DTSTART:' + fechaIcs(ev.ini), 'DTEND:' + fechaIcs(ev.fin),
    'SUMMARY:' + limpio(ev.titulo), 'DESCRIPTION:' + limpio(ev.detalle),
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + limpio(ev.titulo), 'TRIGGER:-PT1H', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
}
function google(g) {
  const ev = evento(g);
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(ev.titulo) +
    '&dates=' + fechaIcs(ev.ini) + '/' + fechaIcs(ev.fin) + '&details=' + encodeURIComponent(ev.detalle);
}
// Botones para apuntarse el desfile. Sólo si el alto mando ha puesto fecha y hora y aún no ha pasado.
export function botonesCalendario(g) {
  guerraActual = g || guerraActual;
  if (!g || !g.desfileTs || g.desfileTs < Date.now() - 2 * 3600000) return '';
  return `<div class="col g4"><span class="etiqueta">Apúntatelo</span><div class="fila" style="flex-wrap:wrap;gap:8px">
    <a class="btn linea medio crece" href="${esc(google(g))}" target="_blank" rel="noopener">Google Calendar</a>
    <button class="btn linea medio crece" data-a="calendarioIcs">Otro calendario</button></div></div>`;
}
accion('calendarioIcs', () => {
  if (!guerraActual) return;
  const url = URL.createObjectURL(new Blob([ics(guerraActual)], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'desfile.ics'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  aviso('Abre el archivo desfile.ics para añadirlo a tu calendario.', true);
});
