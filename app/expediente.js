// Piezas del «expediente»: carpeta de cartón, hojas a máquina, clip, sellos y firma.
// Se usan en el parte de guerra final, la porra y las crónicas.
import { esc } from './base.js?v=52';

export const fechaParte = (ts) => (ts ? new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase() : '—');
export const garabato = '<svg class="garabato" viewBox="0 0 160 46" aria-hidden="true"><path d="M6 32 C 18 6, 30 6, 26 30 S 40 40, 48 18 S 60 6, 62 26 S 74 40, 84 22 Q 92 10 98 24 T 118 22 Q 130 16 152 12" fill="none" stroke="#1d2a6b" stroke-width="2.2" stroke-linecap="round"/><path d="M40 40 Q 90 30 146 36" fill="none" stroke="#1d2a6b" stroke-width="1.4" stroke-linecap="round"/></svg>';
export const clip = '<svg class="clip-papel" viewBox="0 0 28 70" aria-hidden="true"><path d="M9 62 V14 a5 5 0 0 1 10 0 V56 a8 8 0 0 1 -16 0 V20" fill="none" stroke="#b9c0c8" stroke-width="3" stroke-linecap="round"/></svg>';
export function selloRedondo(texto) {
  return `<svg class="sello-redondo" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="circ-sello" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/></defs>
    <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" stroke-width="1.6"/>
    <text font-family="Courier New, monospace" font-weight="700" font-size="11.5" letter-spacing="2.2" fill="currentColor"><textPath href="#circ-sello">${esc(texto)}</textPath></text>
    <path fill="currentColor" d="M60 44l4.2 9.4 10.2 1-7.7 6.8 2.3 10-9-5.3-9 5.3 2.3-10-7.7-6.8 10.2-1z"/></svg>`;
}

// Hoja de portada: pestaña, membrete, título, líneas de asunto, ficha a máquina y sellos.
export function portada(o) {
  return `<div class="parte-hoja parte-portada">${clip}
    <span class="pestana-carpeta">${esc(o.pestana)}</span>
    <div class="fila entre" style="align-items:flex-start;gap:10px"><div class="col g4">${(o.membrete || ['ESTADO MAYOR DE LA NORMALIDAD']).map((l) => `<span class="maquina peq">${esc(l)}</span>`).join('')}</div>
      ${o.registro ? `<span class="maquina peq" style="text-align:right">${o.registro}</span>` : ''}</div>
    <h1 class="h1 maquina-t">${esc(o.titulo)}</h1>${(o.lineas || []).map((l) => `<span class="maquina med">${l}</span>`).join('')}
    ${o.sello ? `<span class="sello-conf sello-oficial sello-linea" aria-hidden="true">${esc(o.sello)}</span>` : ''}
    ${o.ficha && o.ficha.length ? `<dl class="ficha-parte">${o.ficha.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(String(v))}</dd></div>`).join('')}</dl>` : ''}
    ${o.pie ? `<p class="maquina peq">${o.pie}</p>` : ''}
    ${selloRedondo(o.redondo || 'ALTO MANDO · VERIFICADO · ')}</div>`;
}
