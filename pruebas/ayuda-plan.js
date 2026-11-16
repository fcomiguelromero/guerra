// Ayudas para recorrer el plan de guerra por pasos en las pruebas de navegador.
'use strict';
async function quieto(m) { await m.waitForLoadState('networkidle'); await m.waitForTimeout(150); }
// Va al paso n del plan (guarda el borrador por el camino, como al pulsar en la barra de pasos).
async function paso(m, n) { await m.locator(`.pasos [data-a="pasoPlan"][data-v="${n}"]`).click(); await quieto(m); }
// Recluta a alguien desde la rejilla de fichas: se abre su ficha, se rellena y se cierra.
async function reclutar(m, i, nombre, correo, frase) {
  await m.locator('[data-a="masGente"]').first().click();
  await m.fill('#gn-' + i, nombre);
  if (correo) await m.fill('#gc-' + i, correo);
  if (frase) await m.fill('#gf-' + i, frase);
  await m.locator('.hoja [data-a="cerrarFicha"]').click();
}
async function soyYo(m, i) {
  await m.locator(`[data-a="abrirFicha"][data-v="${i}"]`).click();
  await m.locator(`.hoja [data-a="soyYo"][data-v="${i}"]`).click();
  await m.locator('.hoja [data-a="cerrarFicha"]').click();
}
// Abre un bloque plegable del plan si está cerrado.
async function abrir(m, clave) {
  const b = m.locator(`[data-a="plegar"][data-v="${clave}"]`).first();
  if ((await b.getAttribute('aria-expanded')) !== 'true') { await b.click(); await m.waitForTimeout(100); }
}
async function declarar(m) {
  await paso(m, 6);
  await m.locator('.plan-pie [data-a="declarar"]').click();
  await quieto(m);
}
module.exports = { paso, reclutar, soyYo, abrir, declarar, quieto };
