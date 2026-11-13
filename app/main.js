// Arranque: lee el enlace con el que se entra, decide la pantalla y pone en marcha el latido.
import { S, recordar, refrescar, latido, pintar, ir, marco, registrar, definirPestanas, esc } from './base.js';
import './combate.js';
import './mando.js';

definirPestanas(() => {
  const e = S.est, lista = [];
  if (!e) return lista;
  const declarada = ['abierta', 'terminada', 'desfile', 'publicada'].indexOf(e.guerra.fase) >= 0;
  if (declarada && e.yo) {
    lista.push({ ruta: '/batallas', texto: 'Batallas' });
    if (e.guerra.extras.porra && e.yo.vota) lista.push({ ruta: '/porra', texto: 'Porra' });
  }
  if (declarada) lista.push({ ruta: '/ordenanzas', texto: 'Ordenanzas' }, { ruta: '/cronicas', texto: 'Crónicas' });
  if (S.mando) lista.push({ ruta: '/cuartel', texto: 'Cuartel general', corto: 'Cuartel' });
  return lista;
});

registrar('/sin-enlace', () => marco(`<header class="col g4"><div class="sobre">Guerra de la Normalidad</div><h1 class="h1">Identifícate, soldado</h1></header>
  <div class="caja"><p>${esc(S.ui.motivo || 'Para entrar en combate necesitas tu enlace personal.')}</p>
  ${S.ui.sinPista ? '' : '<p class="med t2">Está en tu orden de movilización, el correo que te mandó el alto mando. Si no lo encuentras, pídele el enlace general.</p>'}</div>
  <p class="bc centro" style="font-weight:800;font-size:20px;color:#fff">¡Sólo puede quedar uno!</p>`, { sinNav: true }));

// El enlace puede traer la carta personal (#t=), la clave del alto mando (#mando=) o el enlace general (#g=).
function leerEnlace() {
  const h = location.hash.slice(1);
  if (h.charAt(0) === '/') return h;
  const p = new URLSearchParams(h);
  if (p.get('t')) {
    const gid = p.get('t').split('.')[0];
    S.sesiones[gid] = p.get('t'); S.guerra = gid;
    recordar();
    return '/batallas';
  }
  if (p.get('mando')) { S.mando = p.get('mando'); recordar(); return '/guerras'; }
  if (p.get('g')) {
    const gid = p.get('g').split('.')[0];
    const [carta, llave] = (p.get('r') || '').split('~');
    S.generales[gid] = p.get('g'); S.guerra = gid; S.ui.carta = carta || null; S.ui.cartaEnlace = S.ui.carta;
    if (carta && llave) S.llaves[gid + ':' + carta] = llave;
    recordar();
    return S.sesiones[gid] ? '/batallas' : '/entrada';
  }
  return S.guerra ? '/batallas' : S.mando ? '/guerras' : '/sin-enlace';
}

async function arrancar() {
  let ruta = leerEnlace();
  if (!S.guerra && !S.mando) ruta = '/sin-enlace';
  if (ruta === '/batallas' && !S.sesiones[S.guerra] && !S.mando) ruta = S.generales[S.guerra] ? '/entrada' : '/sin-enlace';
  S.ruta = ruta;
  pintar();
  if (S.guerra && ['/entrada', '/guerras', '/sin-enlace'].indexOf(ruta) < 0) {
    try {
      await refrescar(true);
      const previa = ['borrador', 'llamamiento'].indexOf(S.est.guerra.fase) >= 0;
      if (previa && S.mando) ruta = '/plan';
      else if (previa) ruta = S.generales[S.guerra] ? '/entrada' : '/batallas';
      else if (!S.est.yo && S.mando && ruta === '/batallas') ruta = '/cuartel';
    } catch (err) {
      if (err.codigo === 'enlace' || err.codigo === 'noexiste') {
        delete S.sesiones[S.guerra];
        S.guerra = null; recordar();
        S.ui.motivo = err.codigo === 'enlace' ? err.message : 'Esa guerra ya no existe: el alto mando la ha borrado.';
        S.ui.sinPista = err.codigo !== 'enlace';
        ruta = S.mando ? '/guerras' : '/sin-enlace';
      } else S.ui.motivo = err.message;
    }
  }
  ir(ruta, true);
  latido();
}
window.addEventListener('hashchange', () => { if (location.hash.charAt(1) !== '/') location.reload(); });
arrancar();
