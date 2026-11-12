# Guerra de la Normalidad

Juego de batallas por votación entre amigos: todos contra todos, voto secreto y desfile de la victoria.

- `index.html`, `app/`, `assets/`: las pantallas (se sirven con GitHub Pages).
- `motor/`: el motor del juego. Se ejecuta en Google Apps Script, pegado a la hoja de cálculo del alto mando, que es donde viven los datos.
- `instalar/`: el cascarón que se pega una sola vez en Apps Script.
- `pruebas/`: guerras simuladas. `node pruebas/motor.test.js`

Aquí no hay datos de nadie: votos, correos y fotos se guardan en la hoja de Google del organizador.
