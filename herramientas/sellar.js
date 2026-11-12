// Calcula la huella del motor y la deja en motor/version.txt. El cascarón de Google sólo
// ejecuta un motor cuya huella coincida. Ejecutar antes de cada publicación: node herramientas/sellar.js
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const raiz = path.join(__dirname, '..');
const huella = crypto.createHash('sha256').update(fs.readFileSync(path.join(raiz, 'motor', 'motor.js'))).digest('hex');
fs.writeFileSync(path.join(raiz, 'motor', 'version.txt'), huella + '\n');
console.log('Motor sellado: ' + huella);
