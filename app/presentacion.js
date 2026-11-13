// Presentación de la guerra: una página sólo para leer, que explica el juego y anima a participar.
// Se abre con #p=ID.CLAVE. No tiene botones, ni cartas, ni nombres de nadie: quien quiera alistarse avisa al alto mando.
import { S, llamar, esc, tituloGuerra, carta, marco, cargando, pintar, registrar, alEntrar } from './base.js';

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
  const demo = cosas ? '' : `<section class="col g4"><div class="duelo">${carta({ id: 'c1', nombre: 'Tú', frase: 'Aquí irá tu grito de guerra' })}${carta({ id: 'c2', nombre: 'Tu rival', frase: 'Y aquí, el suyo' }, { clase: 'izq' })}<div class="vs" aria-hidden="true">VS</div></div>
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
