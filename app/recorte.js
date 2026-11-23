// Encuadre de fotos: antes de subir la foto de un combatiente, se mueve y se acerca dentro de un marco
// cuadrado (el de las cartas); el círculo discontinuo marca lo que se ve en las fotos redondas.
// recortarFoto(archivo o dataURL) → promesa con la foto recortada (JPEG 480×480) o null si se cancela.

const LADO = 480;

export function recortarFoto(fuente) {
  return new Promise((resolver, fallar) => {
    const img = new Image();
    const url = typeof fuente === 'string' ? fuente : URL.createObjectURL(fuente);
    img.onload = () => abrir(img, (r) => { if (typeof fuente !== 'string') URL.revokeObjectURL(url); resolver(r); });
    img.onerror = () => { if (typeof fuente !== 'string') URL.revokeObjectURL(url); fallar(new Error('No se ha podido leer esa foto.')); };
    img.src = url;
  });
}

function abrir(img, terminar) {
  const velo = document.createElement('div');
  velo.className = 'velo recorte-velo';
  velo.innerHTML = `<div class="caja recorte" role="dialog" aria-modal="true" aria-labelledby="recorte-t">
      <h2 class="h2" id="recorte-t">Encuadra la foto</h2>
      <p class="med t2">Arrastra para mover y pellizca o usa la barra para acercar. El círculo marca lo que se ve en las fotos redondas.</p>
      <div class="recorte-marco" tabindex="0" aria-label="Foto: arrástrala para moverla; con las flechas también se mueve y con + y − se acerca"><img alt="" draggable="false"><span class="recorte-circulo" aria-hidden="true"></span></div>
      <div class="fila" style="gap:10px;align-items:center"><span class="peq t2" aria-hidden="true">−</span>
        <input class="recorte-zoom crece" type="range" min="1" max="4" step="0.01" value="1" aria-label="Acercar o alejar"><span class="peq t2" aria-hidden="true">+</span>
        <button class="btn linea chico recorte-girar" type="button">Girar</button></div>
      <div class="fila" style="gap:10px"><button class="btn linea medio crece recorte-no" type="button">Cancelar</button><button class="btn crece recorte-si" type="button">Usar esta foto</button></div>
    </div>`;
  document.body.appendChild(velo);
  const marco = velo.querySelector('.recorte-marco'), foto = velo.querySelector('img'), barra = velo.querySelector('.recorte-zoom');
  foto.src = img.src;
  // Estado: zoom (1 = la foto justo cubre el marco), desplazamiento en px del marco y giro en grados.
  const st = { z: 1, x: 0, y: 0, giro: 0 };
  const F = () => marco.clientWidth;
  const dims = () => {
    const tumbada = st.giro % 180 !== 0, w = tumbada ? img.height : img.width, h = tumbada ? img.width : img.height;
    const base = Math.max(F() / w, F() / h);
    return { w: w * base * st.z, h: h * base * st.z, base };
  };
  const ajustar = () => {
    const d = dims(), mx = Math.max(0, (d.w - F()) / 2), my = Math.max(0, (d.h - F()) / 2);
    st.x = Math.max(-mx, Math.min(mx, st.x)); st.y = Math.max(-my, Math.min(my, st.y));
    const e = d.base * st.z;
    foto.style.width = img.width * e + 'px'; foto.style.height = img.height * e + 'px';
    foto.style.transform = `translate(-50%, -50%) translate(${st.x}px, ${st.y}px) rotate(${st.giro}deg)`;
    barra.value = st.z;
  };
  const zoom = (z, cx = 0, cy = 0) => {
    const z2 = Math.max(1, Math.min(4, z)), k = z2 / st.z;
    // Acerca hacia el punto (cx, cy), medido desde el centro del marco.
    st.x = cx - (cx - st.x) * k; st.y = cy - (cy - st.y) * k; st.z = z2; ajustar();
  };
  // Arrastrar con un dedo, pellizcar con dos.
  const dedos = new Map();
  let previo = null;
  const centro = () => { const r = marco.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  marco.addEventListener('pointerdown', (ev) => { marco.setPointerCapture(ev.pointerId); dedos.set(ev.pointerId, [ev.clientX, ev.clientY]); previo = null; });
  marco.addEventListener('pointermove', (ev) => {
    if (!dedos.has(ev.pointerId)) return;
    const antes = dedos.get(ev.pointerId);
    dedos.set(ev.pointerId, [ev.clientX, ev.clientY]);
    if (dedos.size === 1) { st.x += ev.clientX - antes[0]; st.y += ev.clientY - antes[1]; ajustar(); return; }
    const [p1, p2] = [...dedos.values()], dist = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
    if (previo) { const [cx, cy] = centro(); zoom(st.z * dist / previo, (p1[0] + p2[0]) / 2 - cx, (p1[1] + p2[1]) / 2 - cy); }
    previo = dist;
  });
  const soltar = (ev) => { dedos.delete(ev.pointerId); previo = null; };
  marco.addEventListener('pointerup', soltar); marco.addEventListener('pointercancel', soltar);
  marco.addEventListener('wheel', (ev) => { ev.preventDefault(); const [cx, cy] = centro(); zoom(st.z * (ev.deltaY < 0 ? 1.08 : 1 / 1.08), ev.clientX - cx, ev.clientY - cy); }, { passive: false });
  marco.addEventListener('keydown', (ev) => {
    const m = { ArrowLeft: [8, 0], ArrowRight: [-8, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[ev.key];
    if (m) { ev.preventDefault(); st.x += m[0]; st.y += m[1]; ajustar(); }
    if (ev.key === '+' || ev.key === '=') zoom(st.z * 1.1);
    if (ev.key === '-') zoom(st.z / 1.1);
  });
  barra.addEventListener('input', () => zoom(Number(barra.value)));
  velo.querySelector('.recorte-girar').addEventListener('click', () => { st.giro = (st.giro + 90) % 360; st.x = 0; st.y = 0; ajustar(); });
  const cerrar = (r) => { document.removeEventListener('keydown', esc); velo.remove(); terminar(r); };
  const esc = (ev) => { if (ev.key === 'Escape') cerrar(null); };
  document.addEventListener('keydown', esc);
  velo.querySelector('.recorte-no').addEventListener('click', () => cerrar(null));
  velo.querySelector('.recorte-si').addEventListener('click', () => {
    // Lo que se ve en el marco, pasado a un lienzo de 480×480.
    const k = LADO / F(), d = dims(), c = document.createElement('canvas');
    c.width = LADO; c.height = LADO;
    const x = c.getContext('2d');
    x.fillStyle = '#16132b'; x.fillRect(0, 0, LADO, LADO);
    x.translate(LADO / 2 + st.x * k, LADO / 2 + st.y * k); x.rotate(st.giro * Math.PI / 180);
    const e = d.base * st.z * k;
    x.drawImage(img, -img.width * e / 2, -img.height * e / 2, img.width * e, img.height * e);
    let q = 0.85, datos = c.toDataURL('image/jpeg', q);
    while (datos.length > 110000 && q > 0.3) { q -= 0.08; datos = c.toDataURL('image/jpeg', q); }
    cerrar(datos);
  });
  requestAnimationFrame(() => { ajustar(); marco.focus(); });
}
