// Presentación de la guerra: una página sólo para leer, que explica el juego y anima a participar.
// Se abre con #p=ID.CLAVE. No tiene botones, ni cartas, ni nombres de nadie: quien quiera alistarse avisa al alto mando.
import { S, llamar, esc, tituloGuerra, carta, marco, cargando, pintar, registrar, alEntrar } from './base.js';

// Los dos monigotes de la batalla de ejemplo: un soldado americano y uno prusiano de la Gran Guerra,
// dibujados sobre la misma silueta y con los mismos tintes que el resto de las cartas.
function soldado(cual) {
  const usa = cual === 'usa';
  const c = usa ? '#6b3572' : '#2f6170', claro = usa ? '#9a58a3' : '#4d93a6', oscuro = usa ? '#3a1d3f' : '#1b3540';
  const cuerpo = `<path d="M14 100 C14 72 32 60 50 60 C68 60 86 72 86 100 Z" fill="${c}"/><circle cx="50" cy="36" r="18" fill="${c}"/>`;
  const ojos = (mira) => `<circle cx="43" cy="37" r="3.1" fill="#f6f2ff"/><circle cx="57" cy="37" r="3.1" fill="#f6f2ff"/><circle cx="${43 + mira}" cy="37.3" r="1.5" fill="${oscuro}"/><circle cx="${57 + mira}" cy="37.3" r="1.5" fill="${oscuro}"/>`;
  if (usa) {
    return `<svg aria-hidden="true" viewBox="0 0 100 100" style="height:88%;overflow:visible">
      <g stroke-linecap="round"><path d="M25 97 L15 36" stroke="${claro}" stroke-width="5"/><path d="M15 36 L11.5 13" stroke="${claro}" stroke-width="2.2"/><path d="M20 66 Q27 62 30 70" stroke="${claro}" stroke-width="1.6" fill="none"/></g>
      <g fill="#f6f2ff"><circle cx="11" cy="6.5" r="2.6"/><circle cx="15.3" cy="9.6" r="2.6"/><circle cx="13.6" cy="14.6" r="2.6"/><circle cx="8.4" cy="14.6" r="2.6"/><circle cx="6.7" cy="9.6" r="2.6"/></g><circle cx="11" cy="11" r="2.4" fill="#ffd36a"/>
      ${cuerpo}
      <path d="M33 30 Q35 52 50 55 Q65 52 67 30" stroke="${claro}" stroke-width="1.6" fill="none"/>
      ${ojos(1)}
      <path d="M38.5 31.5 Q43 29.5 47 31.8 M53 31.8 Q57 29.5 61.5 31.5" stroke="${oscuro}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <g transform="rotate(-9 50 27)"><path d="M32 27 Q34 8 50 8 Q66 8 68 27 Z" fill="${claro}"/><ellipse cx="50" cy="27" rx="28" ry="5.2" fill="${claro}"/><path d="M24 28.4 Q50 34 76 28.4" stroke="${oscuro}" stroke-width="1" fill="none" opacity=".45"/>
        <path fill="#f6f2ff" d="M50 11.5l1.7 3.6 3.9.5-2.9 2.7.8 3.9-3.5-1.9-3.5 1.9.8-3.9-2.9-2.7 3.9-.5z"/></g>
      <circle cx="60" cy="48" r="7.5" fill="#ff6ad5"/><path d="M56.2 45.6 Q57.6 42.8 60.6 42.6" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M45 46.5 Q49 49.5 53 47.5" stroke="${oscuro}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M42 62.5 Q50 70 58 62.5" stroke="${claro}" stroke-width="1" fill="none"/><rect x="47.6" y="67.5" width="4.8" height="6.4" rx="1.2" fill="#ffd36a"/>
    </svg>`;
  }
  return `<svg aria-hidden="true" viewBox="0 0 100 100" style="height:88%;overflow:visible">
    <g stroke-linecap="round"><path d="M75 97 L85 36" stroke="${claro}" stroke-width="5"/><path d="M85 36 L88.5 13" stroke="${claro}" stroke-width="2.2"/><path d="M88.5 13 L89.6 4" stroke="#f6f2ff" stroke-width="1.5"/>
      <path d="M83.5 9.5 L94.5 12.5" stroke="#ff9d7a" stroke-width="5.4"/><path d="M84.6 8.6 L93 10.9" stroke="#ffc7ad" stroke-width="1" opacity=".8"/><path d="M80 66 Q73 62 70 70" stroke="${claro}" stroke-width="1.6" fill="none"/></g>
    ${cuerpo}
    <path d="M32 29 Q32 9 50 9 Q68 9 68 29 Q50 33.5 32 29 Z" fill="${claro}"/><path d="M30 26.6 Q50 32.4 70 26.6 L70 28.8 Q50 34.8 30 28.8 Z" fill="${oscuro}" opacity=".55"/>
    <path d="M47.4 10 L50 -6 L52.6 10 Z" fill="#ffd36a"/><ellipse cx="50" cy="10.2" rx="5.6" ry="2.1" fill="#ffd36a"/>
    <path fill="#ffd36a" d="M50 15.5c2.6 0 3 2.2 5.6 1.6-.4 2.6-2 3.4-2 5.2 0 2-1.6 3.4-3.6 4.4-2-1-3.6-2.4-3.6-4.4 0-1.8-1.6-2.6-2-5.2 2.6.6 3-1.6 5.6-1.6z"/>
    ${ojos(-1)}
    <path d="M38.8 31.8 L46.6 34 M53.4 34 L61.2 31.8" stroke="${oscuro}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <circle cx="57" cy="37" r="5.3" fill="rgba(255,255,255,.14)" stroke="#ffd36a" stroke-width="1.3"/><path d="M61.6 39.8 Q68 48 63.5 61" stroke="#ffd36a" stroke-width=".8" fill="none"/>
    <g stroke="#f6f2ff" stroke-width="3.1" fill="none" stroke-linecap="round"><path d="M50 46.6 Q43 51.5 36.5 47 Q32.5 44 35 40.2"/><path d="M50 46.6 Q57 51.5 63.5 47 Q67.5 44 65 40.2"/></g>
    <path d="M47.9 63.2h4.2v2.6h2.6v4.2h-2.6v2.6h-4.2v-2.6h-2.6v-4.2h2.6z" fill="#ffd36a"/>
  </svg>`;
}

alEntrar('/presentacion', async () => {
  S.ui.presDatos = null; S.ui.presError = null;
  try { S.ui.presDatos = await llamar('presentacion', { p: S.ui.pres }, 2); } catch (err) { S.ui.presError = err.message; }
  pintar();
});

registrar('/presentacion', () => {
  const d = S.ui.presDatos;
  if (S.ui.presError) return marco(`<div class="caja"><p>${esc(S.ui.presError)}</p></div>`, { sinNav: true });
  if (!d) return marco(cargando('Desplegando el mapa'), { sinNav: true });
  const x = d.extras, cosas = d.modo === 'cosas', nombre = d.nombre || 'La guerra';
  const paso = (n, t, txt) => `<li class="caja" style="flex-direction:row;gap:12px;align-items:flex-start"><b class="bc teal" style="font-size:34px;font-weight:800;line-height:.9;min-width:22px">${n}</b>
    <span class="col g4"><strong class="bc" style="font-size:22px;line-height:1.05;color:#fff;text-transform:uppercase">${t}</strong><span class="med t3">${txt}</span></span></li>`;
  const pasos = [
    cosas ? ['Dos contendientes, una pregunta', 'Cada batalla enfrenta a dos contendientes y tú eliges cuál gana. Hay que mojarse: no vale el empate.']
      : ['Todos contra todos', 'Cada batalla enfrenta a dos de nosotros y los demás eligen a uno según la pregunta. Hay que mojarse: no vale el empate. En tus propios combates no votas.'],
    ['Votas desde el móvil', (d.ritmo === 'diaria' ? `Cada mañana, a las ${d.hora}:00, se abre una ofensiva nueva con unas pocas batallas, y te avisamos por correo. Las votas en un par de minutos, cuando te venga bien.` : 'Todas las batallas se abren a la vez y las votas a tu ritmo, cuando te venga bien.') + ' Sin instalar nada: entras con un enlace que es sólo tuyo.'],
    ['En secreto', 'Los demás combatientes nunca sabrán a quién has votado. Y nadie ve cómo va la clasificación hasta el final: sólo se sabe quién se está retrasando.'],
    [d.puntuacion === 'votos' ? 'Cada voto cuenta' : 'Puntos, como en el fútbol', d.puntuacion === 'votos' ? 'Cada voto que recibe un contendiente le da puntos. Gana quien más sume al acabar todas las batallas.' : 'Ganar una batalla da 3 puntos; empatarla, 1; perderla, 0. Gana quien más sume al acabar todas las batallas.'],
    x.desfile ? ['El desfile de la victoria', 'El gran final: el parte de guerra se revela en directo, del último puesto al primero, con redoble de tambor. Hasta entonces, nadie sabe nada.']
      : ['El parte de guerra', 'Cuando vota el último, se publica la clasificación completa, de golpe.']
  ];
  const propinas = [
    x.porra ? ['La porra', 'Ordena a todos del primero al último. Gana quien más se acerque al resultado' + (d.botin ? ', y se lleva el botín: ' + esc(d.botin) : '') + '.'] : null,
    x.radio ? ['Radio Macuto', 'Pullas anónimas desde las trincheras, para calentar el ambiente.'] : null,
    x.espia ? ['El espía', 'Un solo uso: descubre quién ganó un combate antes que nadie.'] : null,
    x.proclamas ? ['Proclamas anónimas', 'Explica tu voto, si te atreves. Las mejores se leen al final, sin firma.'] : null,
    x.condecoraciones ? ['Condecoraciones', 'Medallas al más rebelde, al más borrego y al más tardón.'] : null,
    ['Galones', 'Cada guerra terminada cuenta: se asciende de recluta a general. Y hay consejo de guerra para los desertores.']
  ].filter(Boolean);
  const demo = cosas ? '' : `<section class="col g4"><div class="duelo">${carta({ id: 'c1', nombre: 'Tú', frase: 'Aquí irá tu grito de guerra' }, { figura: soldado('usa') })}${carta({ id: 'c2', nombre: 'Tu rival', frase: 'Y aquí, el suyo' }, { clase: 'izq', figura: soldado('prusia') })}<div class="vs" aria-hidden="true">VS</div></div>
    <p class="peq t2 centro">Así es una batalla: dos cartas, una pregunta y un voto.</p></section>`;
  return marco(`<header class="col centro" style="align-items:center;gap:10px;padding-top:8px">
      <span class="chapa">Se avecina una guerra</span>
      ${d.campo ? `<div class="sobre">${esc(d.campo)}</div>` : ''}
      <h1 class="enorme">${esc(nombre)}</h1>
      ${d.pregunta ? `<p class="bc oro" style="font-weight:800;font-size:34px;line-height:1.05">${esc(d.pregunta)}</p>` : ''}
      <p class="t3">${cosas ? 'Un torneo para resolverlo de una vez por todas, a votos y desde el móvil.' : 'Un torneo de todos contra todos para resolverlo de una vez, a votos y desde el móvil. Es un juego: aquí se viene a reír.'}</p>
    </header>
    ${demo}
    ${d.pitch ? `<section class="caja rosa"><p style="font-style:italic;white-space:pre-line">«${esc(d.pitch)}»</p><span class="peq t2">${esc(d.firma)}, alto mando</span></section>` : ''}
    <section class="col"><h2 class="h2">Cómo funciona</h2><ol class="col g12">${pasos.map(([t, txt], k) => paso(k + 1, esc(t), esc(txt))).join('')}</ol></section>
    <section class="caja"><h2 class="h2">Y de propina</h2>
      ${propinas.map(([t, txt]) => `<p class="med"><strong class="teal">${t}.</strong> <span class="t3">${txt}</span></p>`).join('')}</section>
    ${d.premio ? `<section class="caja oro centro" style="align-items:center"><span class="sobre oro">El premio</span><strong class="bc" style="font-size:28px;line-height:1.05;color:#fff">${esc(d.premio)}</strong></section>` : ''}
    <section class="caja teal centro" style="align-items:center;padding:20px 14px">
      <div class="enorme teal" style="font-size:40px">${d.enMarcha ? 'Esta guerra ya ha empezado' : '¿Te alistas?'}</div>
      <p style="font-size:17px">${d.enMarcha ? `Si quieres entrar en la próxima, díselo a <strong>${esc(d.firma)}</strong>.` : `Díselo a <strong>${esc(d.firma)}</strong> y te meterá en la guerra.`}</p>
      ${d.enMarcha ? '' : `<p class="med t2">Sólo hacen falta tu nombre y tu correo${cosas ? '' : '. Si quieres lucirte, también una foto y un grito de guerra'}.</p>`}
    </section>
    <p class="bc centro" style="font-weight:800;font-size:24px;color:#fff">¡Sólo puede quedar uno!</p>`, { sinNav: true, fondo: 'b', marca: tituloGuerra(d) });
});
