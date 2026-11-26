// Género gramatical de cada combatiente: «h» (él) o «m» (ella).
// Si el alto mando no lo ha marcado, se adivina por el nombre; «dudoso» avisa de que conviene confirmarlo.
// El motor (motor/motor.js) lleva una copia de esta misma función: si se cambia aquí, hay que cambiarla allí.
const ELLA = new Set(('carmen isabel raquel pilar rocio consuelo mercedes dolores beatriz ines belen ruth nieves sol luz miriam ester esther abigail ' +
  'montserrat flor amparo encarnacion asuncion concepcion itziar noemi mabel maribel lourdes iris judith elisabet elizabeth salud paz angeles remedios ' +
  'milagros trinidad soledad piedad caridad leire uxue aitziber maite jone lis cloe chloe zoe cande mari isa lu marisol rosario guadalupe reyes ' +
  'raquel macarena ingrid carmen yaiza naiara arancha begonya nur noor rut edurne amaia ainhoa miren itsaso iratxe idoia aranzazu arantzazu ' +
  'covadonga montse gemma yasmin jazmin carol karen helen ellen anabel cristel liz beth ruth estrella').split(' '));
const EL = new Set(('borja luca josema nicola jota garcia sasha misha kostia ilia elias jonas andreas tomas lucas matias nicolas ' +
  'jose juan luis pablo jorge carlos javier jacobo diego david daniel miguel manuel rafael alvaro sergio adrian ivan ruben oscar raul ' +
  'victor hector fernando alberto antonio francisco ignacio enrique eduardo ramon roberto gonzalo joaquin jaime marcos mario alfonso ' +
  'guillermo angel agustin cesar felix samuel ismael gabriel abel isaac aaron noel saul bruno hugo leo marc pau pol oriol jordi xavi ' +
  'iker unai aitor asier gorka ander mikel jon julen ibai eneko paco pepe pepito curro quique nacho chema manolo lolo santi rodrigo ' +
  'emilio julio cristian christian kevin jesus martin german esteban sebastian tobias gaspar baltasar melchor benito andres mateo simon').split(' '));
const DUDOSOS = new Set('fran alex cris dani sam toni juli chus pat eli ariel noa mar trini nico andrea dominique charlie jesse robin'.split(' '));
const limpio = (s) => String(s || '').trim().split(/[\s-]+/)[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ]/g, '');
export function adivinarSexo(nombre) {
  const n = limpio(nombre);
  if (!n) return { s: 'h', dudoso: true };
  if (DUDOSOS.has(n)) return { s: ['noa', 'mar', 'trini', 'eli', 'andrea'].indexOf(n) >= 0 ? 'm' : 'h', dudoso: true };
  if (ELLA.has(n)) return { s: 'm', dudoso: false };
  if (EL.has(n)) return { s: 'h', dudoso: false };
  if (/a$/.test(n)) return { s: 'm', dudoso: false };
  if (/(o|os|el|on|an|in|er|or|ez|is|us)$/.test(n)) return { s: 'h', dudoso: false };
  return { s: 'h', dudoso: true };
}
// El sexo efectivo de una ficha: el marcado por el alto mando o, si no lo hay, el adivinado.
export const sexoDe = (g) => (g && (g.sexo === 'h' || g.sexo === 'm') ? g.sexo : adivinarSexo(g && g.nombre).s);
// gen(g, 'ganador', 'ganadora'): la palabra que toca para esa persona.
export const gen = (g, el, ella) => (sexoDe(g) === 'm' ? ella : el);
// Artículo y desinencias de uso común: o(g) → «o»/«a»; art(g) → «el»/«la».
export const o = (g) => gen(g, 'o', 'a');
export const art = (g) => gen(g, 'el', 'la');
// Títulos de las condecoraciones para la persona que las recibe.
const TIT = { rebelde: ['El más rebelde', 'La más rebelde'], borrego: ['El más borrego', 'La más borrega'], tardon: ['El más tardón', 'La más tardona'], adivino: ['El adivino', 'La adivina'] };
export const tituloPremio = (k, g) => (TIT[k] ? TIT[k][sexoDe(g) === 'm' ? 1 : 0] : k);
// «Medalla al más rebelde» / «Medalla a la más rebelde».
export const medallaPremio = (k, g) => 'Medalla ' + tituloPremio(k, g).replace(/^El /, 'al ').replace(/^La /, 'a la ');
