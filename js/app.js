'use strict';
/* ====================================================================
   Movimiento, Fuerza y Peso — modelos, simuladores y laboratorio
   ==================================================================== */
const VEXC1 = 3.0, PPRS = [100, 200, 250, 360, 400, 500, 600, 1000], AV3 = 4.3, CAP3 = 20, FS3 = 0.5 * AV3 / 128 * 1000; // FS3 en mV
const lvdtV = (x, S, V, a) => S * V * x * (1 - a * Math.pow(x / 15, 4)) / 1000;      // V
function bench(code) {
  const r = mulberry(hashStr('movfp|' + String(code || 'demo').trim())), n = () => gauss(r), u = () => r();
  return {
    id: 'M-' + String(1 + Math.floor(u() * 24)).padStart(2, '0'),
    lv: { S: 30 * (1 + 0.03 * n()), x0: 0.4 * n(), a: (0.3 + 0.4 * u()) / 100, off: 2 * n() },
    en: { PPR: PPRS[Math.floor(u() * PPRS.length)] },
    lc: { RO: 2 * (1 + 0.04 * n()), z0: 0.05 * n(), NL: (0.015 + 0.02 * u()) / 100, H: (0.02 + 0.03 * u()) / 100 }
  };
}
const SV = { thin: 'stroke:var(--axis);fill:none;stroke-width:1.4', tx: 'fill:var(--fg-2);font:600 11px Manrope,system-ui,sans-serif', mono: 'fill:var(--fg);font:500 12px "JetBrains Mono",monospace', tag: 'fill:var(--gold);font:700 11px "JetBrains Mono",monospace' };
function lvdtSVG(o) {
  const cx = 210, sc = 3.2, xc = cx + clamp(o.x, -30, 30) * sc;
  let s = `<svg viewBox="0 0 420 220" role="img" aria-label="Esquema del LVDT"><rect x="70" y="70" width="280" height="70" rx="8" style="fill:var(--panel-solid);stroke:var(--axis);stroke-width:1.6"/>`;
  [[80, 'S₁', 'var(--c-rtd)'], [176, 'P', 'var(--gold)'], [272, 'S₂', 'var(--c-tc)']].forEach(([x, t, c]) => { s += `<rect x="${x}" y="78" width="68" height="54" rx="4" style="fill:${c};opacity:.18;stroke:${c};stroke-width:1.2"/><text x="${x + 34}" y="152" text-anchor="middle" style="${SV.tag}">${t}</text>`; });
  s += `<rect x="${xc - 55}" y="97" width="110" height="16" rx="3" style="fill:var(--fg-2)"/><line x1="${xc + 55}" y1="105" x2="${xc + 95}" y2="105" style="stroke:var(--fg-2);stroke-width:3"/>`;
  s += `<line x1="${cx}" y1="60" x2="${cx}" y2="150" style="stroke:var(--bad);stroke-dasharray:4 3"/><text x="${cx}" y="54" text-anchor="middle" style="fill:var(--bad);font:600 10.5px Manrope,sans-serif">cero</text>`;
  s += `<text x="${xc}" y="92" text-anchor="middle" style="${SV.tx}">núcleo</text>`;
  if (o.read) s += `<text x="210" y="190" text-anchor="middle" style="${SV.mono}">${o.read}</text>`;
  return s + '</svg>';
}
function encSVG(o) {
  const per = Math.max(2, Math.min(6, o.cyc || 4)), w = 340, x0 = 50, P = w / per, ph = o.dir > 0 ? P / 4 : -P / 4;
  const wave = (y, sh) => { let p = ''; for (let x = -P; x <= w + P; x += P) { const a = x0 + x + sh; p += `M${a} ${y + 22} H${a + P / 2} M${a + P / 2} ${y} H${a + P} M${a + P / 2} ${y + 22} V${y} M${a + P} ${y} V${y + 22}`; } return p; };
  let s = `<svg viewBox="0 0 420 200" role="img" aria-label="Señales A y B del encoder"><defs><clipPath id="encc"><rect x="${x0}" y="0" width="${w}" height="200"/></clipPath></defs>`;
  s += `<text x="20" y="62" style="${SV.tag}">A</text><text x="20" y="122" style="${SV.tag}">B</text><g clip-path="url(#encc)"><path d="${wave(42, 0)}" style="stroke:var(--c-rtd);fill:none;stroke-width:2"/><path d="${wave(102, ph)}" style="stroke:var(--c-tc);fill:none;stroke-width:2"/></g>`;
  s += `<text x="210" y="160" text-anchor="middle" style="${SV.tx}">${o.dir > 0 ? 'A adelanta a B 90°: giro horario, el contador suma' : 'B adelanta a A 90°: giro antihorario, el contador resta'}</text>`;
  if (o.read) s += `<text x="210" y="186" text-anchor="middle" style="${SV.mono}">${o.read}</text>`;
  return s + '</svg>';
}
function bridgeSVG(o) {
  const act = o.n, C = (i) => i < act ? 'var(--c-tc)' : 'var(--fg-2)';
  const R = (x1, y1, x2, y2, i, lab) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--axis);stroke-width:1.4"/><rect x="${mx - 15}" y="${my - 8}" width="30" height="16" rx="3" transform="rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI} ${mx} ${my})" style="fill:var(--panel-solid);stroke:${C(i)};stroke-width:2"/><text x="${mx + (x1 < 210 ? -24 : 24)}" y="${my + 4}" text-anchor="middle" style="fill:${C(i)};font:700 10.5px 'JetBrains Mono',monospace">${lab}</text>`; };
  let s = `<svg viewBox="0 0 420 230" role="img" aria-label="Puente de Wheatstone">`;
  s += R(210, 20, 110, 110, 0, act >= 1 ? 'R+ΔR' : 'R') + R(110, 110, 210, 200, 3, act === 4 ? 'R+ΔR' : 'R') + R(210, 20, 310, 110, 1, act >= 2 ? 'R−ΔR' : 'R') + R(310, 110, 210, 200, 2, act === 4 ? 'R−ΔR' : 'R');
  s += `<text x="210" y="14" text-anchor="middle" style="${SV.tx}">+V exc</text><text x="210" y="220" text-anchor="middle" style="${SV.tx}">0 V</text>`;
  s += `<line x1="110" y1="110" x2="165" y2="110" style="${SV.thin}"/><line x1="255" y1="110" x2="310" y2="110" style="${SV.thin}"/><circle cx="210" cy="110" r="24" style="fill:var(--panel-solid);stroke:var(--gold);stroke-width:1.6"/><text x="210" y="114" text-anchor="middle" style="${SV.tag}">Vo</text><line x1="165" y1="110" x2="186" y2="110" style="${SV.thin}"/><line x1="234" y1="110" x2="255" y2="110" style="${SV.thin}"/>`;
  if (o.read) s += `<text x="380" y="40" text-anchor="end" style="${SV.mono}">${o.read}</text>`;
  return s + '</svg>';
}
function cellSVG(o) {
  const k = Math.round(clamp(o.m, 0, 20) / 2.5);
  let s = `<svg viewBox="0 0 420 210" role="img" aria-label="Celda de carga con masas"><rect x="40" y="150" width="60" height="30" style="fill:var(--fg-2);opacity:.6"/><rect x="100" y="140" width="190" height="28" rx="3" style="fill:var(--panel-solid);stroke:var(--axis);stroke-width:1.6"/><circle cx="160" cy="154" r="6" style="fill:none;stroke:var(--axis)"/><circle cx="230" cy="154" r="6" style="fill:none;stroke:var(--axis)"/>`;
  for (let i = 0; i < k; i++) s += `<rect x="${236 - (i % 2) * 4}" y="${126 - i * 12}" width="50" height="11" rx="2" style="fill:var(--c-tc);opacity:${0.55 + 0.05 * (i % 3)}"/>`;
  s += `<rect x="320" y="60" width="74" height="34" rx="5" style="fill:var(--panel-solid);stroke:var(--gold);stroke-width:1.6"/><text x="357" y="82" text-anchor="middle" style="${SV.tag}">HX711</text><path d="M290 150 H330 V94" style="stroke:var(--c-ntc);fill:none;stroke-width:1.4"/>`;
  s += `<text x="195" y="190" text-anchor="middle" style="${SV.tx}">celda tipo barra · ${CAP3} kg</text>`;
  if (o.read) s += `<text x="357" y="116" text-anchor="middle" style="${SV.mono}">${o.read}</text>`;
  return s + '</svg>';
}

/* ====================================================================
   Simuladores
   ==================================================================== */
MOUNT.cadena = () => {
  const desc = ['La tolva cuelga de tres celdas de carga. Su peso es la variable de proceso: debe bajar al ritmo de la dosificación.',
    'Elementos primarios WE: tres celdas en paralelo suman 2 mV/V a 500 kg; con 10 V de excitación son 20 mV a plena carga.',
    'El transmisor WT acondiciona los milivoltios y entrega 4–20 mA de 0 a 500 kg.',
    'El WIC compara el peso con la consigna de 300 kg y calcula la salida hacia el variador.',
    'El variador SC convierte la salida en frecuencia (0–60 Hz) y el motor de 4 polos mueve el tornillo sinfín que descarga la tolva.'];
  const up = () => {
    const W = +$('#ch-T').value; $('#ch-To').textContent = W + ' kg';
    const mv = 20 * W / 500, I = 4 + 16 * W / 500, u = clamp(40 + 0.25 * (W - 300), 0, 100), f = 60 * u / 100, rpm = 120 * f / 4 * 0.97;
    $('#ch-v0').innerHTML = `${W}<i> kg</i>`; $('#ch-v1').innerHTML = `${fmt(mv, 2)}<i> mV</i>`; $('#ch-v2').innerHTML = `${fmt(I, 2)}<i> mA</i>`;
    $('#ch-v3').innerHTML = `${fmt(W / 5, 1)}<i> %</i> → ${fmt(u, 0)}<i> %</i>`; $('#ch-v4').innerHTML = `${fmt(f, 1)}<i> Hz</i> · ${fmt(rpm, 0)}<i> rpm</i>`;
  };
  const show = i => { $$('#chain .node').forEach((n, k) => n.classList.toggle('on', k === i)); $('#ch-desc').textContent = desc[i]; };
  $('#chain').addEventListener('click', e => { const n = e.target.closest('.node'); if (n) show(+n.dataset.i); });
  $('#ch-T').addEventListener('input', up); up(); show(0);
};
MOUNT.simlvdt = () => {
  const pl = new Plane($('#lv-plot'), { xmin: -28, xmax: 28, ymin: -2.6, ymax: 2.6, xlabel: 'x (mm)', ylabel: 'V (V)', title: 'Salida del LVDT frente al desplazamiento', xd: 2, yd: 3, h: 340 });
  const up = rehome => {
    const x = +$('#lv-x').value, S = +$('#lv-S').value, V = +$('#lv-V').value, a = +$('#lv-n').value / 100;
    $('#lv-xo').textContent = fmt(x, 1) + ' mm'; $('#lv-So').textContent = S + ' mV/V/mm'; $('#lv-Vo').textContent = fmt(V, 1) + ' V rms'; $('#lv-no').textContent = fmt(a * 100, 2) + ' % FS';
    const vo = lvdtV(x, S, V, a), vb = 0.4 * V, v1 = vb + vo / 2, v2 = vb - vo / 2, e = (vo - S * V * x / 1000) / (S * V * 15 / 1000) * 100;
    kpis($('#lv-k'), [{ l: 'V₁ secundario 1', v: fmt(v1, 3), u: 'V rms' }, { l: 'V₂ secundario 2', v: fmt(v2, 3), u: 'V rms' }, { l: 'Amplitud |V₁ − V₂|', v: fmt(Math.abs(vo), 3), u: 'V rms' },
      { l: 'Fase', v: x >= 0 ? '0°' : '180°' }, { l: 'Salida demodulada', v: (vo >= 0 ? '+' : '') + fmt(vo, 3), u: 'V' }, { l: 'Desviación de la recta', v: fmt(e, 2), u: '% FS', c: Math.abs(e) <= .5 ? 'ok' : 'bad' }]);
    if (rehome) { const m = lvdtV(25, S, V, a) * 1.15; pl.setHome({ xmin: -28, xmax: 28, ymin: -m, ymax: m }); }
    pl.set([{ id: 'i', type: 'fn', label: 'Recta ideal', color: 'var(--tick)', dash: 'dot', width: 1.4, fn: X => S * V * X / 1000, dom: [-25, 25] },
      { id: 'a', type: 'fn', label: 'Amplitud sin fase |V₁ − V₂|', color: 'var(--c-tc)', dash: 'dash', width: 2, fn: X => Math.abs(lvdtV(X, S, V, a)), dom: [-25, 25] },
      { id: 'd', type: 'fn', label: 'Salida demodulada', color: 'var(--c-rtd)', width: 2.6, fn: X => lvdtV(X, S, V, a), dom: [-25, 25] },
      { id: 'p', type: 'point', x, y: vo, color: 'var(--gold)', tag: fmt(vo, 3) + ' V' }]);
    $('#lv-svg').innerHTML = lvdtSVG({ x, read: `V₁ − V₂ = ${fmt(vo, 3)} V` });
  };
  $('#lv-x').addEventListener('input', () => up(false)); ['#lv-S', '#lv-V', '#lv-n'].forEach(s => $(s).addEventListener('input', () => up(true))); up(true);
};
MOUNT.simenc = () => {
  let dir = 1;
  const pl = new Plane($('#en-plot'), { xmin: -60, xmax: 3100, ymin: 0, ymax: 12, xlabel: 'n (rpm)', ylabel: 'Resolución (% lectura)', title: 'Resolución relativa de cada método', xd: 0, yd: 3, h: 320 });
  const up = () => {
    const P = +$('#en-p').value, n = +$('#en-n').value, T = +$('#en-T').value / 1000, fc = +$('#en-c').value * 1e6;
    $('#en-po').textContent = P; $('#en-no').textContent = n + ' rpm'; $('#en-To').textContent = fmt(T * 1000, 0) + ' ms'; $('#en-co').textContent = fmt(fc / 1e6, 1) + ' MHz';
    const fA = P * n / 60, Nc = 4 * fA * T, rf = 60 / (4 * P * T) / n * 100, tp = 1 / fA, rp = P * n / (60 * fc) * 100, nc = 60 * Math.sqrt(fc / (4 * P * P * T));
    kpis($('#en-k'), [{ l: 'Frecuencia de A', v: fmt(fA, 1), u: 'Hz' }, { l: 'Cuentas ×4 en T', v: fmt(Math.floor(Nc), 0) }, { l: 'Resolución angular', v: fmt(360 / (4 * P), 3), u: '°' },
      { l: 'Res. método frecuencia', v: fmt(rf, 3), u: '%', c: rf < rp ? 'ok' : 'warn' }, { l: 'Período de A', v: fmt(tp * 1e6, 1), u: 'µs' }, { l: 'Res. método período', v: fmt(rp, 4), u: '%', c: rp < rf ? 'ok' : 'warn' },
      { l: 'Velocidad de cruce', v: fmt(nc, 0), u: 'rpm' }]);
    pl.set([{ id: 'f', type: 'fn', label: `Frecuencia (T = ${fmt(T * 1000, 0)} ms)`, color: 'var(--c-rtd)', width: 2.6, fn: x => x > 0 ? 60 / (4 * P * T) / x * 100 : NaN, dom: [1, 3000] },
      { id: 'p', type: 'fn', label: `Período (reloj ${fmt(fc / 1e6, 1)} MHz)`, color: 'var(--c-tc)', width: 2.6, fn: x => P * x / (60 * fc) * 100, dom: [0, 3000] },
      { id: 'c', type: 'vline', x: nc, color: 'var(--tick)', tag: 'cruce' }, { id: 'pt', type: 'point', x: n, y: Math.min(rf, rp), color: 'var(--gold)', tag: `${fmt(Math.min(rf, rp), 3)} %` }]);
    $('#en-svg').innerHTML = encSVG({ dir, cyc: 4, read: `${fmt(Math.floor(Nc), 0)} cuentas en ${fmt(T * 1000, 0)} ms · período ${fmt(tp * 1e6, 0)} µs` });
  };
  seg('#en-d', v => { dir = +v; up(); }); ['#en-p', '#en-n', '#en-T', '#en-c'].forEach(s => $(s).addEventListener('input', up)); up();
};
MOUNT.simpuente = () => {
  let nA = 1;
  const pl = new Plane($('#br-plot'), { xmin: -3300, xmax: 3300, ymin: -36, ymax: 36, xlabel: 'ε (µε)', ylabel: 'Vo (mV)', title: 'Salida del puente frente a la deformación', xd: 0, yd: 3, h: 320 });
  const out = (n, e, GF, V, dT) => { if (n === 1) { const x = GF * (e + 6 * dT) * 1e-6; return V * (x / 4) / (1 + x / 2) * 1000; } const x = GF * e * 1e-6, t = GF * 6 * dT * 1e-6; return n === 2 ? V * x / (2 * (1 + t)) * 1000 : V * x / (1 + t) * 1000; };
  const up = () => {
    const e = +$('#br-e').value, GF = +$('#br-g').value, V = +$('#br-v').value, dT = +$('#br-t').value;
    $('#br-eo').textContent = e + ' µε'; $('#br-go').textContent = fmt(GF, 2); $('#br-vo').textContent = fmt(V, 1) + ' V'; $('#br-to').textContent = (dT >= 0 ? '+' : '') + dT + ' °C';
    const vo = out(nA, e, GF, V, dT), v0 = out(nA, e, GF, V, 0), lin = V * GF * e * 1e-6 * nA / 4 * 1000, eT = (vo - v0) / (V * GF * 1e-6 * nA / 4 * 1000);
    kpis($('#br-k'), [{ l: 'ΔR en 350 Ω', v: fmt(350 * GF * e * 1e-6, 4), u: 'Ω' }, { l: 'Salida Vo', v: fmt(vo, 4), u: 'mV' }, { l: 'Sensibilidad', v: fmt(V * GF * nA / 4, 2), u: 'µV/µε' },
      { l: 'Error por temperatura', v: fmt(eT, 1), u: 'µε', c: Math.abs(eT) > 20 ? 'bad' : 'ok' }, { l: 'No linealidad', v: lin ? fmt((v0 - lin) / lin * 100, 3) : '0', u: '%', c: nA === 1 && Math.abs(e) > 1000 ? 'warn' : 'ok' }]);
    pl.set([{ id: 'q', type: 'fn', label: 'Cuarto de puente', color: 'var(--c-rtd)', width: nA === 1 ? 2.8 : 1.6, fn: x => out(1, x, GF, V, dT), dom: [-3000, 3000] },
      { id: 'h', type: 'fn', label: 'Medio puente', color: 'var(--c-tc)', width: nA === 2 ? 2.8 : 1.6, fn: x => out(2, x, GF, V, dT), dom: [-3000, 3000] },
      { id: 'f', type: 'fn', label: 'Puente completo', color: 'var(--c-ntc)', width: nA === 4 ? 2.8 : 1.6, fn: x => out(4, x, GF, V, dT), dom: [-3000, 3000] },
      { id: 'p', type: 'point', x: e, y: vo, color: 'var(--gold)', tag: fmt(vo, 3) + ' mV' }]);
    $('#br-svg').innerHTML = bridgeSVG({ n: nA, read: `Vo = ${fmt(vo, 3)} mV` });
  };
  seg('#br-c', v => { nA = +v; up(); }); ['#br-e', '#br-g', '#br-v', '#br-t'].forEach(s => $(s).addEventListener('input', up)); up();
};
MOUNT.simcelda = () => {
  let G = 128;
  const pl = new Plane($('#hx-plot'), { xmin: -5, xmax: 108, ymin: -0.3e6, ymax: 8.6e6, xlabel: 'Carga (% de la capacidad)', ylabel: 'Cuentas', title: 'Cuentas del HX711 frente a la carga', xd: 1, yd: 0, h: 300 });
  const up = () => {
    const C = +$('#hx-C').value, RO = +$('#hx-r').value, V = +$('#hx-v').value, pc = +$('#hx-m').value, m = pc / 100 * C;
    $('#hx-Co').textContent = C + ' kg'; $('#hx-ro').textContent = fmt(RO, 2) + ' mV/V'; $('#hx-vo').textContent = fmt(V, 1) + ' V'; $('#hx-mo').textContent = `${fmt(m, 2)} kg (${fmt(pc, 1)} %)`;
    const FS = 0.5 * V / G * 1000, vin = RO * V * m / C, N = vin / FS * 8388608, cpk = RO * V / C / FS * 8388608, use = RO * V / FS * 100, res = 0.33e-3 / (RO * V / C) * 1000;
    kpis($('#hx-k'), [{ l: 'Tensión de la celda', v: fmt(vin, 3), u: 'mV' }, { l: 'Escala del HX711', v: '±' + fmt(FS, 2), u: 'mV' }, { l: 'Cuentas', v: fmt(N, 0) },
      { l: 'Cuentas por kg', v: fmt(cpk, 0) }, { l: 'Uso de la escala', v: fmt(use, 0), u: '%', c: use > 100 ? 'bad' : use < 30 ? 'warn' : 'ok' }, { l: 'Resolución estable', v: fmt(res, 2), u: 'g' },
      { l: 'Divisiones útiles', v: fmt(C * 1000 / res, 0) }, { l: 'Salida 4–20 mA', v: fmt(4 + 16 * pc / 100, 2), u: 'mA' }]);
    pl.setHome({ xmin: -5, xmax: 108, ymin: -0.04 * cpk * C, ymax: Math.max(cpk * C, 8388608) * 1.08 });
    pl.set([{ id: 'c', type: 'fn', label: 'Cuentas', color: 'var(--c-ntc)', width: 2.6, fn: x => Math.min(8388607, cpk * x / 100 * C), dom: [0, 100] },
      { id: 'h', type: 'hline', y: 8388607, color: 'var(--bad)', tag: 'saturación 2²³' }, { id: 'p', type: 'point', x: pc, y: Math.min(N, 8388607), color: 'var(--gold)', tag: fmt(N, 0) }]);
  };
  seg('#hx-g', v => { G = +v; up(); }); ['#hx-C', '#hx-r', '#hx-v', '#hx-m'].forEach(s => $(s).addEventListener('input', up)); up();
};
MOUNT.actuadores = () => {
  let p = 4;
  const up = () => {
    const I = +$('#vf-I').value, s = +$('#vf-s').value / 100, i = +$('#vf-i').value, D = +$('#vf-D').value;
    $('#vf-Io').textContent = fmt(I, 1) + ' mA'; $('#vf-so').textContent = fmt(s * 100, 1) + ' %'; $('#vf-io').textContent = i + ':1'; $('#vf-Do').textContent = fmt(D, 2) + ' m';
    const f = (I - 4) / 16 * 60, ns = 120 * f / p, n = ns * (1 - s), v = n / i * Math.PI * D / 60;
    kpis($('#vf-k'), [{ l: 'Frecuencia', v: fmt(f, 2), u: 'Hz' }, { l: 'Tensión (V/f)', v: fmt(440 * f / 60, 0), u: 'V' }, { l: 'Velocidad síncrona', v: fmt(ns, 0), u: 'rpm' },
      { l: 'Velocidad del rotor', v: fmt(n, 0), u: 'rpm' }, { l: 'Velocidad del tambor', v: fmt(n / i, 1), u: 'rpm' }, { l: 'Velocidad de la banda', v: fmt(v, 3), u: 'm/s' }]);
  };
  seg('#vf-p', v => { p = +v; up(); }); ['#vf-I', '#vf-s', '#vf-i', '#vf-D'].forEach(s => $(s).addEventListener('input', up)); up();
};
MOUNT.compara = () => {
  const O = ['Potenciómetro', 'LVDT', 'Encoder incremental', 'Encoder absoluto', 'Celda de carga'];
  const S = [
    { q: 'Posición de la compuerta de un silo de grano que debe conocerse al restablecerse la energía, sin hacer una rutina de búsqueda de referencia.', a: 'Encoder absoluto', why: 'Un encoder absoluto entrega la posición única al encender. El incremental perdería la cuenta en un corte de energía.' },
    { q: 'Medir con resolución de micrómetros la deformación de una viga de concreto durante un ensayo de carga de 10 000 ciclos.', a: 'LVDT', why: 'El LVDT no tiene contacto entre núcleo y bobinas: resolución prácticamente infinita y vida ilimitada en ensayos cíclicos.' },
    { q: 'Control de velocidad de una banda transportadora con un variador, con realimentación al PLC.', a: 'Encoder incremental', why: 'Un encoder incremental en el eje del tambor da velocidad y sentido con un contador rápido del PLC, a bajo costo.' },
    { q: 'Báscula de recepción de camiones de caña en un ingenio, con varias plataformas de 20 t.', a: 'Celda de carga', why: 'Las básculas camioneras usan celdas de carga de compresión en paralelo, con caja sumadora o lectura digital por celda.' }
  ];
  $('#scen').innerHTML = S.map((s, i) => `<div class="card"><p style="margin:0">${s.q}</p><div class="opts">${O.map(o => `<button class="btn sm" data-i="${i}" data-o="${o}">${o}</button>`).join('')}</div><p class="fb" hidden></p></div>`).join('');
  $('#scen').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const s = S[+b.dataset.i], card = b.closest('.card'), fb = $('.fb', card), ok = b.dataset.o === s.a;
    fb.hidden = false; fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.style.marginTop = '10px'; fb.textContent = (ok ? 'Correcto. ' : `Mejor opción: ${s.a}. `) + s.why; });
};

/* ====================================================================
   Laboratorio virtual
   ==================================================================== */
function an1(rows) {
  const fitR = R => { const s = rows.filter(r => Math.abs(r.x) <= R + 1e-9); if (s.length < 3) return null; const f = linfit(s.map(r => r.x), s.map(r => r.V)); return { f, nl: Math.max(...s.map(r => Math.abs(r.V - (f.m * r.x + f.b)))) / (Math.abs(f.m) * R) * 100 }; };
  const F15 = fitR(15) || fitR(25), b = F15.f.m, a0 = F15.f.b, S = b * 1000 / VEXC1, x0 = -a0 / b;
  let rl = 0; for (let R = 5; R <= 25; R += 2.5) { const q = fitR(R); if (q && q.nl <= 0.5) rl = R; }
  const F25 = fitR(25), det = rows.map(r => ({ ...r, fit: b * r.x + a0, res: (r.V - (b * r.x + a0)) / (b * 15) * 100 }));
  return { b, a0, S, x0, r2: F15.f.r2, nl15: F15.nl, nl25: F25 ? F25.nl : NaN, rl, det };
}
function an2(rows) {
  const xs = rows.map(r => r.x / 60), ys = rows.map(r => r.Nc / (r.T / 1000)), s = xs.reduce((a, x, i) => a + x * ys[i], 0) / xs.reduce((a, x) => a + x * x, 0);
  const Pe = s / 4, P = Math.round(Pe), det = rows.map(r => { const nf = 60 * r.Nc / (4 * P * r.T / 1000), np = 60e6 / (P * r.Pu); return { ...r, nf, np, ef: (nf - r.x) / r.x * 100, ep: (np - r.x) / r.x * 100 }; });
  const lo = det.filter(d => d.x < 100), hi = det.filter(d => d.x > 1500), mx = (a, k) => a.length ? Math.max(...a.map(d => Math.abs(d[k]))) : NaN;
  return { Pe, P, det, efl: mx(lo, 'ef'), epl: mx(lo, 'ep'), efh: mx(hi, 'ef'), eph: mx(hi, 'ep'), c10: 60 * Math.sqrt(1e6 / (4 * P * P * 0.01)), c100: 60 * Math.sqrt(1e6 / (4 * P * P * 0.1)) };
}
function an3(rows) {
  const f = linfit(rows.map(r => r.x), rows.map(r => r.N)), k = f.m, N0 = f.b, FS = k * CAP3, RO = FS / 8388608 * FS3 / AV3;
  const ms = [...new Set(rows.map(r => r.x))].sort((a, b) => a - b), avg = (m, d) => { const s = rows.filter(r => r.x === m && (!d || r.dir === d)); return s.length ? s.reduce((a, r) => a + r.N, 0) / s.length : NaN; };
  let nl = 0, hy = 0; ms.forEach(m => { nl = Math.max(nl, Math.abs(avg(m) - (k * m + N0)) / FS * 100); const a = avg(m, 'asc'), d = avg(m, 'desc'); if (isFinite(a) && isFinite(d)) hy = Math.max(hy, Math.abs(d - a) / FS * 100); });
  const det = rows.map(r => ({ ...r, kg: (r.N - N0) / k, res: (r.N - (k * r.x + N0)) / FS * 100 }));
  return { k, N0, FS, RO, r2: f.r2, nl, hy, comb: Math.max(...det.map(d => Math.abs(d.res))), gpc: 1000 / k, det };
}
const LAB1 = { key: 'lab1', p: 'l1', min: 11, ncol: 2, jit: [0.4], d: ['l1-d1', 'l1-d2', 'l1-d3'], headRaw: ['x (mm)', 'V demodulada (V)'],
  sps: [{ id: 'l1-sp', f: v => fmt(v, 2) + ' mm' }],
  read: (b, vj, v) => { const xc = vj[0] - b.lv.x0, V = lvdtV(xc, b.lv.S, VEXC1, b.lv.a) + b.lv.off / 1000 + noise(.0003); return { x: v[0] + noise(.002), V, A: Math.abs(V - b.lv.off / 1000) }; },
  disp: r => [fmt(r.x, 3) + ' mm', (r.V >= 0 ? '+' : '') + fmt(r.V, 4) + ' V', fmt(r.A, 4) + ' V rms'],
  cells: r => [fmt(r.x, 3), fmt(r.V, 4)],
  svg: (b, vj, r) => lvdtSVG({ x: vj[0] - (b ? b.lv.x0 : 0), read: r ? `${fmt(r.V, 3)} V` : '' }),
  check: rows => Math.min(...rows.map(r => r.x)) > -20 || Math.max(...rows.map(r => r.x)) < 20 ? 'Recorre el micrómetro desde −20 mm o menos hasta +20 mm o más.' : null,
  an: an1,
  analyze: rows => { const a = an1(rows);
    return { kpis: [{ l: 'Sensibilidad', v: fmt(a.b * 1000, 2), u: 'mV/mm' }, { l: 'Sensibilidad S', v: fmt(a.S, 2), u: 'mV/V/mm' }, { l: 'Cero eléctrico x₀', v: fmt(a.x0, 3), u: 'mm' }, { l: 'R² en ±15 mm', v: fmt(a.r2, 6) },
        { l: 'No linealidad ±15 mm', v: fmt(a.nl15, 2), u: '% FS', c: a.nl15 <= .5 ? 'ok' : 'warn' }, { l: 'No linealidad ±25 mm', v: fmt(a.nl25, 2), u: '% FS', c: 'bad' }, { l: 'Rango lineal (0,5 % FS)', v: '±' + fmt(a.rl, 1), u: 'mm', c: 'ok' }],
      head: ['x (mm)', 'V medida (V)', 'V recta ±15 (V)', 'Residuo (% FS)'], body: a.det.map(d => [fmt(d.x, 2), fmt(d.V, 4), fmt(d.fit, 4), fmt(d.res, 2)]),
      plots: [{ o: { xmin: -28, xmax: 28, ymin: -2.6, ymax: 2.6, xlabel: 'x (mm)', ylabel: 'V (V)', title: 'Salida del LVDT frente al micrómetro', xd: 2, yd: 4 }, layers: [
          { id: 'f', type: 'fn', label: `Recta en ±15 mm: V = ${fmt(a.b * 1000, 2)} mV/mm · x ${a.a0 >= 0 ? '+' : '−'} ${fmt(Math.abs(a.a0 * 1000), 2)} mV`, color: 'var(--gold)', width: 2, fn: x => a.b * x + a.a0, dom: [-27, 27] },
          { id: 'd', type: 'scatter', label: 'Lecturas', color: 'var(--c-rtd)', pts: rows.map(r => [r.x, r.V]) }] },
        { o: { xmin: -28, xmax: 28, ymin: -6, ymax: 6, xlabel: 'x (mm)', ylabel: 'Residuo (% FS)', title: 'Desviación respecto a la recta de ±15 mm', xd: 2, yd: 3, h: 280 }, layers: [
          { id: 'b1', type: 'hline', y: 0.5, color: 'var(--ok)', tag: '+0,5 % FS' }, { id: 'b2', type: 'hline', y: -0.5, color: 'var(--ok)', tag: '−0,5 % FS' },
          { id: 'r', type: 'scatter', label: 'Residuo', color: 'var(--c-tc)', pts: a.det.map(d => [d.x, d.res]) }] }] }; } };
MOUNT.lab1 = () => makeLab(LAB1);

const LAB2 = { key: 'lab2', p: 'l2', min: 10, ncol: 4, jit: [8, 0], d: ['l2-d1', 'l2-d2', 'l2-d3'], headRaw: ['n patrón (rpm)', 'T (ms)', 'Cuentas', 'Período (µs)'],
  sps: [{ id: 'l2-sp', f: v => v + ' rpm' }, { id: 'l2-sp2', f: v => v + ' ms' }],
  read: (b, vj, v) => { const n = Math.max(1, vj[0]), P = b.en.PPR, T = v[1]; return { x: v[0] * (1 + noise(.0005)), T, Nc: Math.floor(4 * P * n / 60 * T / 1000 + Math.random()), Pu: Math.max(1, Math.round(60e6 / (P * n) + noise(.6))) }; },
  disp: r => [fmt(r.x, 1) + ' rpm', String(r.Nc), String(r.Pu) + ' µs'],
  cells: r => [fmt(r.x, 1), String(r.T), String(r.Nc), String(r.Pu)],
  svg: (b, vj, r) => encSVG({ dir: 1, cyc: 4, read: r ? `${r.Nc} cuentas en ${r.T} ms · período ${r.Pu} µs` : '' }),
  check: rows => !rows.some(r => r.x < 100) || !rows.some(r => r.x > 1500) ? 'Incluye lecturas por debajo de 100 rpm y por encima de 1500 rpm.' : null,
  an: an2,
  analyze: rows => { const a = an2(rows), cl = v => clamp(v, -40, 40);
    return { kpis: [{ l: 'PPR del encoder', v: String(a.P), c: 'ok' }, { l: 'PPR estimado', v: fmt(a.Pe, 2) }, { l: 'Cuentas por vuelta (×4)', v: String(4 * a.P) }, { l: 'Resolución angular', v: fmt(360 / (4 * a.P), 3), u: '°' },
        { l: 'Error frecuencia < 100 rpm', v: fmt(a.efl, 2), u: '%', c: 'bad' }, { l: 'Error período < 100 rpm', v: fmt(a.epl, 3), u: '%', c: 'ok' }, { l: 'Error frecuencia > 1500 rpm', v: fmt(a.efh, 3), u: '%' }, { l: 'Error período > 1500 rpm', v: fmt(a.eph, 3), u: '%' },
        { l: 'Cruce con T = 10 ms', v: fmt(a.c10, 0), u: 'rpm' }, { l: 'Cruce con T = 100 ms', v: fmt(a.c100, 0), u: 'rpm' }],
      head: ['n patrón (rpm)', 'T (ms)', 'n frecuencia (rpm)', 'Error (%)', 'n período (rpm)', 'Error (%)'],
      body: a.det.map(d => [fmt(d.x, 1), String(d.T), fmt(d.nf, 1), fmt(d.ef, 2), fmt(d.np, 2), fmt(d.ep, 3)]),
      plots: [{ o: { xmin: -60, xmax: 3150, ymin: -0.04, ymax: 4 * a.P * 52 / 1000 * 1.08, xlabel: 'n (rpm)', ylabel: 'Cuentas/T (miles por s)', title: 'Tasa de cuentas frente a la velocidad', xd: 0, yd: 2 }, layers: [
          { id: 'f', type: 'fn', label: `Recta: 4 · ${a.P} PPR · n/60`, color: 'var(--gold)', width: 2, fn: x => 4 * a.P * x / 60 / 1000, dom: [0, 3100] },
          { id: 'd', type: 'scatter', label: 'Lecturas', color: 'var(--c-rtd)', pts: rows.map(r => [r.x, r.Nc / (r.T / 1000) / 1000]) }] },
        { o: { xmin: -60, xmax: 3150, ymin: -42, ymax: 42, xlabel: 'n (rpm)', ylabel: 'Error (%)', title: 'Error de cada método (recortado a ±40 %)', xd: 0, yd: 3, h: 300 }, layers: [
          { id: 'z', type: 'hline', y: 0, color: 'var(--tick)' },
          { id: 'f', type: 'scatter', label: 'Método de frecuencia', color: 'var(--c-rtd)', pts: a.det.map(d => [d.x, cl(d.ef)]) },
          { id: 'p', type: 'scatter', label: 'Método de período', color: 'var(--c-tc)', pts: a.det.map(d => [d.x, cl(d.ep)]) }] }] }; } };
MOUNT.lab2 = () => makeLab(LAB2);

let L3S = { prev: 0, dir: 'asc' };
const LAB3 = { key: 'lab3', p: 'l3', min: 11, ncol: 3, jit: [0], keepOrder: true, d: ['l3-d1', 'l3-d2', 'l3-d3'], headRaw: ['m (kg)', 'Cuentas HX711', 'Sentido'],
  sps: [{ id: 'l3-sp', f: v => fmt(v, 1) + ' kg' }],
  read: (b, vj, v) => { const m = v[0], q = m / CAP3, c = b.lc, sg = L3S.dir === 'desc' ? 0.5 : -0.5;
    const mvv = c.z0 + c.RO * q + c.RO * c.NL * 4 * q * (1 - q) + sg * c.RO * c.H * (1 - (2 * q - 1) ** 2), N = Math.round(AV3 * mvv / FS3 * 8388608 + noise(25));
    return { x: m, N, dir: L3S.dir }; },
  disp: r => [fmt(r.x, 2) + ' kg', fmt(r.N, 0), r.dir === 'asc' ? 'ascendente ↑' : 'descendente ↓'],
  cells: r => [fmt(r.x, 2), String(r.N), r.dir === 'asc' ? 'asc.' : 'desc.'],
  svg: (b, vj, r) => cellSVG({ m: vj[0], read: r ? fmt(r.N, 0) : '' }),
  check: rows => rows.filter(r => r.dir === 'asc').length < 5 || rows.filter(r => r.dir === 'desc').length < 4 ? 'Necesitas al menos 5 lecturas ascendentes y 4 descendentes.' : Math.max(...rows.map(r => r.x)) < 15 ? 'Lleva la carga al menos hasta 15 kg.' : null,
  an: an3,
  analyze: rows => { const a = an3(rows);
    return { kpis: [{ l: 'Factor de calibración', v: fmt(a.k, 1), u: 'cuentas/kg' }, { l: 'Tara N₀', v: fmt(a.N0, 0), u: 'cuentas' }, { l: 'Salida nominal RO', v: fmt(a.RO, 4), u: 'mV/V', c: Math.abs(a.RO - 2) <= .2 ? 'ok' : 'warn' },
        { l: 'R²', v: fmt(a.r2, 7) }, { l: 'No linealidad', v: fmt(a.nl, 3), u: '% FS' }, { l: 'Histéresis', v: fmt(a.hy, 3), u: '% FS' }, { l: 'Error combinado', v: fmt(a.comb, 3), u: '% FS' }, { l: 'Gramos por cuenta', v: fmt(a.gpc, 4), u: 'g' }],
      head: ['m (kg)', 'Sentido', 'Cuentas', 'm calculada (kg)', 'Residuo (% FS)'], body: a.det.map(d => [fmt(d.x, 2), d.dir === 'asc' ? 'asc.' : 'desc.', fmt(d.N, 0), fmt(d.kg, 3), fmt(d.res, 3)]),
      plots: [{ o: { xmin: -0.8, xmax: 21.5, ymin: -0.2e6, ymax: a.FS * 1.12 + a.N0, xlabel: 'm (kg)', ylabel: 'Cuentas', title: 'Cuentas del HX711 frente a la masa', xd: 2, yd: 0 }, layers: [
          { id: 'f', type: 'fn', label: `N = ${fmt(a.k, 1)}·m + ${fmt(a.N0, 0)}`, color: 'var(--gold)', width: 2, fn: x => a.k * x + a.N0, dom: [0, 21] },
          { id: 'u', type: 'scatter', label: 'Carga ascendente', color: 'var(--c-rtd)', pts: rows.filter(r => r.dir === 'asc').map(r => [r.x, r.N]) },
          { id: 'd', type: 'scatter', label: 'Carga descendente', color: 'var(--c-tc)', pts: rows.filter(r => r.dir === 'desc').map(r => [r.x, r.N]) }] },
        { o: { xmin: -0.8, xmax: 21.5, ymin: -0.08, ymax: 0.08, xlabel: 'm (kg)', ylabel: 'Residuo (% FS)', title: 'Residuos: no linealidad e histéresis', xd: 2, yd: 4, h: 300 }, layers: [
          { id: 'z', type: 'hline', y: 0, color: 'var(--tick)' },
          { id: 'u', type: 'line', label: 'Ascendente', color: 'var(--c-rtd)', width: 2, pts: a.det.filter(d => d.dir === 'asc').sort((p, q) => p.x - q.x).map(d => [d.x, d.res]) },
          { id: 'd', type: 'line', label: 'Descendente', color: 'var(--c-tc)', width: 2, pts: a.det.filter(d => d.dir === 'desc').sort((p, q) => p.x - q.x).map(d => [d.x, d.res]) },
          { id: 'su', type: 'scatter', color: 'var(--c-rtd)', pts: a.det.filter(d => d.dir === 'asc').map(d => [d.x, d.res]) }, { id: 'sd', type: 'scatter', color: 'var(--c-tc)', pts: a.det.filter(d => d.dir === 'desc').map(d => [d.x, d.res]) }] }] }; } };
MOUNT.lab3 = () => {
  const sp = $('#l3-sp'); L3S.prev = +sp.value;
  sp.addEventListener('input', () => { const v = +sp.value; if (v > L3S.prev) L3S.dir = 'asc'; else if (v < L3S.prev) L3S.dir = 'desc'; L3S.prev = v; $('#l3-dir').textContent = L3S.dir === 'asc' ? 'Carga ascendente ↑' : 'Carga descendente ↓'; });
  makeLab(LAB3);
};

/* ====================================================================
   Ejercicios y especificación del informe
   ==================================================================== */
const ANS = { e1: [5 * 81 / 270, 3], e2: [30 * 3 * 4, 1], e3: [360 / 2000, 3], e4: [60 * 5000 / (2000 * 0.1), 1], e5: [60 / (360 * 500e-6), 2], e6: [7 * 1.8, 2],
  e7: [350 * 2.1 * 500e-6, 4], e8: [5 * 2 * 1000e-6 / 4 * 1000, 3], e9: [2 * 5 * 20 / 50, 2], e10: [4 / (0.5 * 5 / 128 * 1000) * 8388608, 0], e11: [120 * 45 / 4, 0], e12: [1710 / 20 * Math.PI * 0.3 / 60, 4] };
const EX_KEYS = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'e10', 'e11', 'e12'];
const EX_TEMA = ['Potenciómetro', 'LVDT', 'Encoder', 'Frecuencia', 'Período', 'Tacogenerador', 'Galga', 'Puente', 'Celda de carga', 'HX711', 'Variador', 'Banda'];
const NB = {
  title: 'sensores de posición, velocidad y peso: LVDT, encoder incremental y celda de carga',
  obj: 'Calibrar un LVDT y determinar su rango lineal, determinar la resolución de un encoder incremental y comparar los métodos de medición de velocidad por frecuencia y por período, y calibrar una celda de carga leída con un HX711 evaluando su no linealidad y su histéresis.',
  theory: 'Presenta el principio del LVDT y su demodulación, el encoder incremental en cuadratura con los métodos de frecuencia y período, las galgas extensiométricas con el puente de Wheatstone y la celda de carga con el convertidor HX711, citando las referencias',
  proc: ['Práctica 1: el núcleo de un LVDT excitado con 3,0 V rms se desplazó con un micrómetro entre −25 y +25 mm y se registró la salida demodulada del acondicionador.',
    'Práctica 2: un motor DC con un encoder incremental se llevó a velocidades entre 5 y 3000 rpm medidas con un tacómetro óptico; un microcontrolador contó los flancos en cuadratura en ventanas de 10 a 1000 ms y midió el período del canal A con un reloj de 1 MHz.',
    'Práctica 3: una celda de carga tipo barra de 20 kg, excitada con 4,3 V por un HX711 con ganancia 128, se cargó con masas patrón de 0 a 20 kg en sentido ascendente y luego descendente.'],
  refs: ['OIML R 60:2021. Metrological regulation for load cells. Organización Internacional de Metrología Legal.', 'ANSI/ISA-5.1-2009. Instrumentation Symbols and Identification. International Society of Automation.',
    'Creus Solé, A. (2010). Instrumentación industrial (8.ª ed.). Marcombo.', 'Pallás Areny, R. (2003). Sensores y acondicionadores de señal (4.ª ed.). Marcombo.', 'Doebelin, E. O. (2004). Sistemas de medición e instrumentación: diseño y aplicación. McGraw-Hill.',
    'Analog Devices. AD598: LVDT Signal Conditioner. Hoja de datos.', 'Avia Semiconductor. HX711: 24-Bit Analog-to-Digital Converter for Weigh Scales. Hoja de datos.'],
  benchDesc: ['LVDT de ±25 mm con acondicionador demodulador y micrómetro de 0,01 mm; centrado mecánico imperfecto.', 'Motor DC con encoder incremental de resolución desconocida, tacómetro óptico patrón y microcontrolador.', 'Celda de carga de 20 kg con HX711 y juego de masas patrón de 0,5 a 20 kg.'],
  labs: [
    { L: LAB1, name: 'Calibración de un LVDT', tcap: 'Lecturas del LVDT.', missing: 'Práctica no realizada o incompleta: se requieren al menos 11 lecturas de −20 a +20 mm',
      summary: (a, F) => `Recta ajustada en ±15 mm: V = ${F(a.b * 1000, 2)} mV/mm · x ${a.a0 >= 0 ? '+' : '−'} ${F(Math.abs(a.a0 * 1000), 2)} mV (R² = ${F(a.r2, 6)}). Sensibilidad S = ${F(a.S, 2)} mV/V por mm con 3,0 V de excitación. El cero eléctrico está en x = ${F(a.x0, 3)} mm. No linealidad: ${F(a.nl15, 2)} % FS en ±15 mm y ${F(a.nl25, 2)} % FS en ±25 mm; rango lineal con 0,5 % FS: ±${F(a.rl, 1)} mm.`,
      figs: ['Salida demodulada del LVDT frente a la posición del micrómetro, con la recta ajustada en ±15 mm.', 'Residuos respecto a la recta de ±15 mm en porcentaje del fondo de escala.'] },
    { L: LAB2, name: 'Encoder y medición de velocidad', tcap: 'Lecturas del encoder.', missing: 'Práctica no realizada o incompleta: se requieren al menos 10 lecturas, por debajo de 100 rpm y por encima de 1500 rpm',
      summary: (a, F) => `La pendiente de la tasa de cuentas da ${F(a.Pe, 2)} pulsos por vuelta: el encoder es de ${a.P} PPR (${4 * a.P} cuentas por vuelta en cuadratura, ${F(360 / (4 * a.P), 3)}° por cuenta). Por debajo de 100 rpm, el error máximo es ${F(a.efl, 2)} % con el método de frecuencia y ${F(a.epl, 3)} % con el de período; por encima de 1500 rpm, ${F(a.efh, 3)} % y ${F(a.eph, 3)} %. Los métodos se cruzan en ${F(a.c10, 0)} rpm con T = 10 ms y en ${F(a.c100, 0)} rpm con T = 100 ms.`,
      detail: { cap: 'Velocidad calculada con cada método y su error.', head: ['n patrón (rpm)', 'T (ms)', 'n frec. (rpm)', 'Error (%)', 'n período (rpm)', 'Error (%)'], rows: a => a.det.map(d => [fmt(d.x, 1), String(d.T), fmt(d.nf, 1), fmt(d.ef, 2), fmt(d.np, 2), fmt(d.ep, 3)]) },
      figs: ['Tasa de cuentas del encoder frente a la velocidad patrón.', 'Error de la velocidad calculada con los métodos de frecuencia y de período.'] },
    { L: LAB3, name: 'Celda de carga con HX711', tcap: 'Lecturas de la celda de carga en carga ascendente y descendente.', missing: 'Práctica no realizada o incompleta: se requieren al menos 5 lecturas ascendentes y 4 descendentes hasta 15 kg o más',
      summary: (a, F) => `Ajuste N = ${F(a.k, 1)} cuentas/kg · m + ${F(a.N0, 0)} (R² = ${F(a.r2, 7)}). Salida nominal de la celda: ${F(a.RO, 4)} mV/V. No linealidad ${F(a.nl, 3)} % FS, histéresis ${F(a.hy, 3)} % FS y error combinado ${F(a.comb, 3)} % FS. Una cuenta equivale a ${F(a.gpc, 4)} g.`,
      figs: ['Cuentas del HX711 frente a la masa patrón en carga ascendente y descendente.', 'Residuos respecto a la recta ajustada: no linealidad e histéresis.'] }
  ]
};


/* ====================================================================
   Núcleo común: laboratorio virtual, ejercicios e informe
   (cada cuaderno define NB, bench(), LABS, ANS, EX_KEYS)
   ==================================================================== */
const getId = () => store.get('id', {});
const getBench = () => { const id = getId(); return id.code ? bench(id.code) : null; };
MOUNT.labid = () => {
  const id = getId(), f = ['name', 'code', 'mates', 'group', 'date'];
  f.forEach(k => { const el = $('#id-' + k); el.value = id[k] || (k === 'date' ? new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : ''); el.addEventListener('input', () => { const o = getId(); if (k !== 'code') { o[k] = el.value; store.set('id', o); } }); });
  const show = () => { const b = getBench(), o = getId(); if (!b) return;
    $('#id-bench').className = ''; $('#id-bench').innerHTML = `<div class="row" style="margin-bottom:10px"><span class="pill ok">Banco ${b.id} asignado</span><span class="tag">código ${esc(o.code)}</span></div><ul style="margin:0">${NB.benchDesc.map(x => `<li>${x}</li>`).join('')}</ul>`; };
  $('#id-go').onclick = () => {
    const code = $('#id-code').value.trim(); if (!code) { toast('Escribe tu código estudiantil.'); return; }
    const o = getId(); if (o.code && o.code !== code) NB.labs.forEach(l => store.set('lab:' + l.L.key, []));
    f.forEach(k => o[k] = $('#id-' + k).value.trim()); store.set('id', o); show(); toast('Banco asignado. Ya puedes ir a la práctica 1.');
  };
  show();
};

function makeLab(o) {
  let rows = store.get('lab:' + o.key, []), until = 0, last = null;
  const el = $('#' + o.key), P = o.p, sps = o.sps.map(s => $('#' + s.id)), svgEl = $('#' + P + '-svg'), srt = o.sort || 'x';
  o.sps.forEach(s => bindOut('#' + s.id, '#' + s.id + 'o', s.f));
  sps.forEach(e => e.addEventListener('input', () => { until = Date.now() + 1500; }));
  until = Date.now() + 700;
  const tick = () => {
    if (el.hidden) return; const b = getBench(), v = sps.map(e => +e.value);
    if (!b) { $('#' + P + '-st').textContent = 'Sin banco asignado'; o.d.forEach(d => $('#' + d).textContent = '—'); if (svgEl && o.svg) svgEl.innerHTML = o.svg(null, v, null); return; }
    const frac = Math.max(0, (until - Date.now()) / 1500);
    $('#' + P + '-st').textContent = frac > 0 ? 'Estabilizando…' : 'Estable · listo para registrar';
    const vj = v.map((x, i) => x + (Math.random() - .5) * (o.jit[i] || 0) * frac);
    last = o.read(b, vj, v); o.disp(last).forEach((s, i) => $('#' + o.d[i]).textContent = s);
    if (svgEl && o.svg) svgEl.innerHTML = o.svg(b, vj, last);
  };
  setInterval(tick, 420); tick();
  const render = () => {
    $('#' + P + '-tb').innerHTML = rows.length ? rows.map((r, i) => `<tr><td class="num">${i + 1}</td>${o.cells(r).map(c => `<td class="num">${c}</td>`).join('')}<td><button class="btn sm" data-del="${i}" aria-label="Borrar lectura ${i + 1}">Quitar</button></td></tr>`).join('')
      : `<tr><td colspan="${o.ncol + 2}" class="muted">Aún no hay lecturas. Necesitas al menos ${o.min}.</td></tr>`;
  };
  $('#' + P + '-tb').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; rows.splice(+b.dataset.del, 1); store.set('lab:' + o.key, rows); render(); });
  $('#' + P + '-rec').onclick = () => {
    if (!getBench()) { toast('Primero asigna tu banco en «Ingreso al laboratorio».'); return; }
    if (Date.now() < until) { toast('Espera a que la lectura se estabilice.'); return; }
    const b0 = getBench(), v0 = sps.map(e => +e.value); last = o.read(b0, v0, v0); o.disp(last).forEach((t, i) => $('#' + o.d[i]).textContent = t);
    const r = { ...last }; if (o.onRec) o.onRec(r, rows); rows.push(r); if (!o.keepOrder) rows.sort((a, b) => a[srt] - b[srt]); store.set('lab:' + o.key, rows); render();
  };
  $('#' + P + '-clr').onclick = () => { if (!rows.length) return; const b = $('#' + P + '-clr'); if (b.dataset.sure) { rows = []; store.set('lab:' + o.key, rows); render(); $('#' + P + '-res').innerHTML = ''; b.textContent = 'Borrar tabla'; delete b.dataset.sure; } else { b.dataset.sure = 1; b.textContent = '¿Seguro? Pulsa otra vez'; setTimeout(() => { b.textContent = 'Borrar tabla'; delete b.dataset.sure; }, 3000); } };
  $('#' + P + '-an').onclick = () => {
    if (rows.length < o.min) { toast(`Necesitas al menos ${o.min} lecturas; llevas ${rows.length}.`); return; }
    const msg = o.check && o.check(rows); if (msg) { toast(msg); return; }
    const A = o.analyze(rows), box = $('#' + P + '-res');
    box.innerHTML = `<h3>Resultados del análisis</h3><div class="kpis">${A.kpis.map(k => `<div class="kpi ${k.c || ''}"><small>${nc(k.l)}</small><b>${k.v}${k.u ? `<i>${k.u}</i>` : ''}</b></div>`).join('')}</div>
      <div class="tbl"><table><thead><tr>${A.head.map(h => `<th class="num">${nc(h)}</th>`).join('')}</tr></thead><tbody>${A.body.map(r => `<tr>${r.map(c => `<td class="num">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      ${A.plots.map((_, i) => `<div id="${P}-pl${i}" style="margin-top:14px"></div>`).join('')}`;
    A.plots.forEach((pc, i) => { const pl = new Plane($(`#${P}-pl${i}`), pc.o); pl.set(pc.layers); });
  };
  const ta = $('#' + P + '-txt'); ta.value = store.get('txt:' + o.key, ''); ta.addEventListener('input', () => store.set('txt:' + o.key, ta.value));
  render();
  if (rows.length >= o.min && !(o.check && o.check(rows))) $('#' + P + '-an').click();
}
const labOk = (L, rows) => rows.length >= L.min && !(L.check && L.check(rows));

/* ---------- ejercicios ---------- */
MOUNT.ejer = el => {
  $$('.ans', el).forEach(s => { const a = ANS[s.dataset.k]; s.textContent = fmt(a[0], a[1]); });
  let st = store.get('ex', {});
  const score = () => { const n = EX_KEYS.filter(k => st[k] && st[k].ok).length; $('#ex-score').textContent = `${n} / ${EX_KEYS.length} correctos`; $('#ex-score').className = 'pill' + (n === EX_KEYS.length ? ' ok' : ''); };
  const paint = (box, k) => { const s = st[k], fb = $('.fb', box); box.classList.remove('ok', 'bad'); fb.className = 'fb'; fb.textContent = '';
    if (!s) return; box.classList.add(s.ok ? 'ok' : 'bad'); fb.classList.add(s.ok ? 'ok' : 'bad'); fb.textContent = s.ok ? 'Correcto' : 'Revisa tu cálculo'; };
  $$('.ex', el).forEach(box => {
    const k = box.dataset.k, tol = +box.dataset.tol, inp = $('input', box);
    if (st[k]) inp.value = st[k].v;
    const check = () => { const v = num(inp.value); if (!isFinite(v)) { toast('Escribe un número.'); return; } st[k] = { v: inp.value, ok: Math.abs(v - ANS[k][0]) <= tol }; store.set('ex', st); paint(box, k); score(); };
    $('button', box).onclick = check; inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    paint(box, k);
  });
  $('#ex-reset').onclick = () => { st = {}; store.set('ex', st); $$('.ex', el).forEach(b => { $('input', b).value = ''; paint(b, b.dataset.k); }); score(); };
  score();
};

/* ---------- informe ---------- */
function reportData() {
  const id = getId(), b = getBench(), ex = store.get('ex', {});
  const labs = NB.labs.map(s => { const rows = store.get('lab:' + s.L.key, []); return { s, rows, a: labOk(s.L, rows) ? s.L.an(rows) : null, txt: store.get('txt:' + s.L.key, '') }; });
  return { id, b, labs, res: store.get('txt:res', ''), con: store.get('txt:con', ''), ex, nex: EX_KEYS.filter(k => ex[k] && ex[k].ok).length };
}
function buildReport() {
  const D = reportData(), ph = s => `<span class="pm">[${s}]</span>`, para = (t, p) => t.trim() ? t.trim().split(/\n+/).map(x => `<p>${esc(x)}</p>`).join('') : `<p>${ph(p)}</p>`;
  const tbl = (head, rows) => `<div class="tbl"><table><thead><tr>${head.map(h => `<th class="num">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td class="num">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const T = [], line = s => T.push(s), ttab = (head, rows) => { line(head.join('\t')); rows.forEach(r => line(r.join('\t'))); line(''); };
  const id = D.id;
  let h = `<div class="cover"><p class="pm" style="margin:0 0 6px;max-width:none">Universidad del Valle · Sede Cartago · Tecnología en Electrónica</p><h1>Informe de laboratorio: ${NB.title}</h1><p class="pm" style="margin:6px 0 0;max-width:none">Instrumentación Industrial · Docente: Dra. María Elena Leyes</p>
    <div class="meta"><div><b>Estudiante:</b> ${esc(id.name) || ph('nombre')}</div><div><b>Código:</b> ${esc(id.code) || ph('código')}</div><div><b>Compañeros:</b> ${esc(id.mates) || '—'}</div><div><b>Grupo:</b> ${esc(id.group) || ph('grupo')}</div><div><b>Fecha:</b> ${esc(id.date) || ph('fecha')}</div><div><b>Banco:</b> ${D.b ? D.b.id : ph('sin asignar')}</div></div></div>`;
  line('UNIVERSIDAD DEL VALLE · SEDE CARTAGO · TECNOLOGÍA EN ELECTRÓNICA'); line(('Informe de laboratorio: ' + NB.title).toUpperCase()); line('Instrumentación Industrial · Docente: Dra. María Elena Leyes');
  line(`Estudiante: ${id.name || ''}\tCódigo: ${id.code || ''}\tGrupo: ${id.group || ''}`); line(`Compañeros: ${id.mates || '—'}\tFecha: ${id.date || ''}\tBanco: ${D.b ? D.b.id : ''}`); line('');
  h += `<h2>1. Resumen</h2>${para(D.res, 'Escribe el resumen en el generador')}`; line('1. RESUMEN'); line(D.res || '[Escribe el resumen]'); line('');
  h += `<h2>2. Objetivos</h2><p>${NB.obj}</p>`; line('2. OBJETIVOS'); line(NB.obj); line('');
  h += `<h2>3. Marco teórico</h2><p>${ph(NB.theory)}</p>`; line('3. MARCO TEÓRICO'); line('[' + NB.theory + ']'); line('');
  h += `<h2>4. Montaje y procedimiento</h2>${NB.proc.map(p => `<p>${p}</p>`).join('')}<p>${ph('Inserta el P&ID del montaje con simbología ISA-5.1')}</p>`; line('4. MONTAJE Y PROCEDIMIENTO'); NB.proc.forEach(line); line('');
  h += `<h2>5. Resultados</h2>`; line('5. RESULTADOS');
  D.labs.forEach(({ s, rows, a }, i) => {
    const tt = `5.${i + 1} ${s.name}`; h += `<h3>${tt}</h3>`; line(tt);
    if (rows.length) { const rw = rows.map(r => s.L.cells(r)); h += tbl(s.L.headRaw, rw); ttab(s.L.headRaw, rw.map(r => r.map(c => String(c).replace(/\./g, '').replace(',', ',')))); }
    if (a) { const t = s.summary(a, fmtc); h += `<p>${t}</p>`; line(t); } else { h += `<p>${ph(s.missing)}</p>`; line('[' + s.missing + ']'); } line('');
  });
  h += `<p>${ph('El PDF incluye las gráficas de cada práctica con ejes rotulados y numeración de figuras')}</p>`;
  h += `<h2>6. Análisis de resultados</h2>`; line('6. ANÁLISIS DE RESULTADOS');
  D.labs.forEach(({ s, txt }, i) => { h += `<h3>6.${i + 1} ${s.name}</h3>${para(txt, `Escribe el análisis en la página de la práctica ${i + 1}`)}`; line(`6.${i + 1} ${s.name}`); line(txt || `[Análisis práctica ${i + 1}]`); });
  line('');
  const exr = EX_KEYS.map((k, i) => [String(i + 1), EX_TEMA[i], D.ex[k] ? esc(D.ex[k].v) : '—', D.ex[k] ? (D.ex[k].ok ? 'Correcto' : 'Incorrecto') : 'Sin responder']);
  h += `<h2>7. Ejercicios</h2><p>Puntaje: <b>${D.nex} de ${EX_KEYS.length}</b> ejercicios correctos.</p>${tbl(['Ejercicio', 'Tema', 'Respuesta', 'Estado'], exr)}`;
  line('7. EJERCICIOS'); line(`Puntaje: ${D.nex} de ${EX_KEYS.length} correctos`); ttab(['Ejercicio', 'Tema', 'Respuesta', 'Estado'], exr);
  h += `<h2>8. Conclusiones</h2>${para(D.con, 'Escribe las conclusiones en el generador')}`; line('8. CONCLUSIONES'); line(D.con || '[Conclusiones]'); line('');
  h += `<h2>9. Referencias</h2><ol>${NB.refs.map(r => `<li>${esc(r)}</li>`).join('')}</ol>`; line('9. REFERENCIAS'); NB.refs.forEach((r, i) => line(`[${i + 1}] ${r}`));
  $('#paper').innerHTML = h;
  return T.join('\n');
}
function buildCSV() {
  const D = reportData(), o = [];
  D.labs.forEach(({ s, rows }, i) => { o.push(`Practica ${i + 1} - ${s.name}`); o.push(s.L.headRaw.join(';')); rows.forEach(r => o.push(s.L.cells(r).map(c => String(c).replace(/\./g, '')).join(';'))); o.push(''); });
  return o.join('\n');
}
MOUNT.informe = () => {
  [['#inf-res', 'txt:res'], ['#inf-con', 'txt:con']].forEach(([s, k]) => { const t = $(s); t.value = store.get(k, ''); t.addEventListener('input', () => store.set(k, t.value)); });
  DL_PROMISE = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
  $('#inf-pdf').onclick = e => savePDF(e.currentTarget);
  let txt = buildReport();
  $('#inf-gen').onclick = () => { txt = buildReport(); toast('Borrador actualizado.'); };
  $('#inf-copy').onclick = () => { txt = buildReport(); copyText(txt, 'Informe copiado. Pégalo en tu procesador de texto.'); };
  $('#inf-csv').onclick = () => copyText(buildCSV(), 'Datos copiados en formato CSV con separador «;».');
};


/* ====================================================================
   Informe en PDF (jsPDF + AutoTable)
   ==================================================================== */
const PDFMAP = [[/Ω/g, 'ohm'], [/α/g, 'alfa'], [/β/g, 'beta'], [/τ/g, 'tau'], [/δ/g, 'delta'], [/₂₅/g, '25'], [/₀/g, '0'], [/₂/g, '2'], [/ₕ/g, 'h'],
  [/⁻¹/g, '^-1'], [/⁻³/g, '^-3'], [/⁻⁷/g, '^-7'], [/⁻/g, '-'], [/≈/g, '~'], [/²/g, '^2'], [/³/g, '^3'], [/µ/g, 'u'], [/≤/g, '<='], [/≥/g, '>='], [/→/g, '->'], [/−/g, '-'], [/[^\x00-\xff–—‘’“”•…]/g, '']];
const pdfTxt = s => PDFMAP.reduce((t, [r, v]) => t.replace(r, v), String(s ?? ''));
function chartImage(pc) {
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-12000px;top:0;width:900px'; document.body.appendChild(host);
  const pl = new Plane(host, { ...pc.o, fixed: true, h: 430, scale: 2 }); pl.resize(); pl.set(pc.layers);
  const url = pl.cv.toDataURL('image/png'), ratio = pl.H / pl.W; pl.ro.disconnect(); LIVE.delete(pl); host.remove(); return { url, ratio };
}

PDFMAP.unshift([/ρ/g, 'rho'], [/Δ/g, 'Delta '], [/ε/g, 'eps'], [/μ/g, 'mu'], [/ω/g, 'omega'], [/θ/g, 'theta'], [/η/g, 'eta'], [/ν/g, 'nu'], [/σ/g, 'sigma'], [/π/g, 'pi'], [/√/g, 'raiz '], [/₁/g, '1'], [/ₛ/g, 's'], [/₃/g, '3'], [/ₚ/g, 'p'], [/ᵥ/g, 'v'], [/⁴/g, '^4']);
function buildPDF() {
  const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const D = reportData(), id = D.id, PW = 215.9, PH = 279.4, M = 20, CW = PW - 2 * M, RED = [181, 18, 27], INK = [29, 26, 31], MUTE = [94, 90, 99];
  let y = 22, fig = 0, tab = 0;
  const need = h => { if (y + h > PH - 20) { doc.addPage(); y = 24; } };
  const H2 = t => { need(16); y += 3; doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...RED); doc.text(pdfTxt(t), M, y); y += 2; doc.setDrawColor(...RED); doc.setLineWidth(.4); doc.line(M, y, PW - M, y); y += 6.5; };
  const H3 = t => { need(32); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...INK); doc.text(pdfTxt(t), M, y); y += 5.5; };
  const P = (t, it = false, color = INK) => { doc.setFont('helvetica', it ? 'italic' : 'normal'); doc.setFontSize(10); doc.setTextColor(...color);
    String(t).split(/\n+/).filter(x => x.trim()).forEach(par => { doc.splitTextToSize(pdfTxt(par.trim()), CW).forEach(l => { need(5); doc.text(l, M, y); y += 4.8; }); y += 1.8; }); };
  const PH_ = t => P('[' + t + ']', true, MUTE);
  const TXT = (t, p) => t && t.trim() ? P(t) : PH_(p);
  const T = (cap, head, body) => { tab++; need(20); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...MUTE); doc.text(pdfTxt(`Tabla ${tab}. ${cap}`), M, y); y += 2;
    doc.autoTable({ startY: y, head: [head.map(pdfTxt)], body: body.map(r => r.map(c => pdfTxt(c))), margin: { left: M, right: M, top: 24, bottom: 22 }, theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 1.6, halign: 'right', lineColor: [221, 214, 216], lineWidth: .2, textColor: INK },
      headStyles: { fillColor: RED, textColor: 255, fontStyle: 'bold', halign: 'center' }, alternateRowStyles: { fillColor: [250, 245, 246] } });
    y = doc.lastAutoTable.finalY + 7; };
  const F = (pc, cap) => { const im = chartImage(pc), h = CW * im.ratio; fig++; need(h + 12); doc.addImage(im.url, 'PNG', M, y, CW, h); doc.setDrawColor(221, 214, 216); doc.setLineWidth(.2); doc.rect(M, y, CW, h); y += h + 4.5;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(...MUTE); doc.splitTextToSize(pdfTxt(`Figura ${fig}. ${cap}`), CW).forEach(l => { doc.text(l, M, y); y += 4.3; }); y += 4; };

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...RED); doc.text('INFORME DE LABORATORIO', M, y); y += 7;
  doc.setFontSize(17); doc.setTextColor(...INK); const tt = NB.title.charAt(0).toUpperCase() + NB.title.slice(1); doc.splitTextToSize(pdfTxt(tt), CW).forEach(l => { doc.text(l, M, y); y += 7.4; });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(...MUTE); doc.text(pdfTxt('Instrumentación Industrial · Tecnología en Electrónica · Universidad del Valle, sede Cartago'), M, y); y += 5;
  doc.autoTable({ startY: y, theme: 'plain', margin: { left: M, right: M }, styles: { font: 'helvetica', fontSize: 10, cellPadding: { top: 1.4, bottom: 1.4, left: 0, right: 2 }, textColor: INK },
    columnStyles: { 0: { fontStyle: 'bold', textColor: RED, cellWidth: 34 } },
    body: [['Estudiante', id.name || '—'], ['Código', id.code || '—'], ['Compañeros', id.mates || '—'], ['Grupo', id.group || '—'], ['Fecha', id.date || '—'], ['Banco', D.b ? D.b.id : '—'], ['Docente', 'Dra. María Elena Leyes']].map(r => r.map(pdfTxt)) });
  y = doc.lastAutoTable.finalY + 4; doc.setDrawColor(...RED); doc.setLineWidth(.8); doc.line(M, y, PW - M, y); y += 8;

  H2('1. Resumen'); TXT(D.res, 'Escribe el resumen en el generador del informe');
  H2('2. Objetivos'); P(NB.obj);
  H2('3. Marco teórico'); PH_(NB.theory);
  H2('4. Montaje y procedimiento'); NB.proc.forEach(p => P(p)); PH_('Inserta el P&ID del montaje con simbología ISA-5.1');
  H2('5. Resultados');
  D.labs.forEach(({ s, rows, a }, i) => {
    H3(`5.${i + 1} ${s.name}`);
    if (rows.length) T(s.tcap, s.L.headRaw, rows.map(r => s.L.cells(r)));
    if (a) { P(s.summary(a, fmt)); if (s.detail) T(s.detail.cap, s.detail.head, s.detail.rows(a));
      const pl = s.L.analyze(rows).plots; s.figs.forEach((c, j) => pl[j] && F(pl[j], c));
    } else PH_(s.missing);
  });
  H2('6. Análisis de resultados');
  D.labs.forEach(({ s, txt }, i) => { H3(`6.${i + 1} ${s.name}`); TXT(txt, `Escribe el análisis en la página de la práctica ${i + 1}`); });
  H2('7. Ejercicios'); P(`Puntaje: ${D.nex} de ${EX_KEYS.length} ejercicios correctos.`);
  T('Respuestas a los ejercicios de verificación.', ['Ejercicio', 'Tema', 'Respuesta', 'Estado'], EX_KEYS.map((k, i) => [String(i + 1), EX_TEMA[i], D.ex[k] ? D.ex[k].v : '—', D.ex[k] ? (D.ex[k].ok ? 'Correcto' : 'Incorrecto') : 'Sin responder']));
  H2('8. Conclusiones'); TXT(D.con, 'Escribe las conclusiones en el generador del informe');
  H2('9. Referencias'); NB.refs.forEach((r, i) => P(`[${i + 1}] ${r}`));

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFillColor(...RED); doc.rect(0, 0, PW, 12, 'F');
    doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.text('UNIVERSIDAD DEL VALLE · SEDE CARTAGO', M, 7.6);
    doc.setFont('helvetica', 'normal'); doc.text(pdfTxt('Instrumentación Industrial · Tecnología en Electrónica'), PW - M, 7.6, { align: 'right' });
    doc.setDrawColor(221, 214, 216); doc.setLineWidth(.3); doc.line(M, PH - 13, PW - M, PH - 13);
    doc.setFontSize(8); doc.setTextColor(...MUTE); doc.text(pdfTxt(`Informe de laboratorio · ${id.name || 'Estudiante'} · ${id.code || ''}`), M, PH - 8.5);
    doc.text(`Página ${i} de ${n}`, PW - M, PH - 8.5, { align: 'right' });
  }
  return doc;
}


let DL_PROMISE = null;
async function savePDF(btn) {
  if (!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API.autoTable)) { toast('El generador de PDF aún está cargando. Intenta de nuevo en unos segundos.'); return; }
  btn.disabled = true; const label = btn.textContent; btn.textContent = 'Generando PDF…';
  try {
    await new Promise(r => setTimeout(r, 30));
    const id = getId(), doc = buildPDF(), blob = doc.output('blob');
    const fn = `Informe_Movimiento_Fuerza_Peso_${String(id.code || 'estudiante').replace(/[^\w-]/g, '')}.pdf`;
    const dl = await (DL_PROMISE || Promise.resolve(null));
    if (dl) {
      try { await dl.save({ filename: fn, data: blob }); toast('Informe guardado en PDF.'); }
      catch (e) { toast(e && e.code === 'declined' ? 'Descarga cancelada.' : e && e.code === 'rate_limited' ? 'Ya hay una descarga pendiente; espera un momento.' : 'No fue posible guardar el PDF en esta vista.'); }
    } else {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fn; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000); toast('Informe descargado en PDF.');
    }
  } catch (err) { console.error(err); toast('No se pudo generar el PDF.'); }
  finally { btn.disabled = false; btn.textContent = label; }
}

/* ====================================================================
   Arranque
   ==================================================================== */
buildToc(); initTheme();
$('#prevBtn').onclick = () => goToPage(cur - 1); $('#nextBtn').onclick = () => goToPage(cur + 1);
$('#pager').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) goToPage(+b.dataset.go); });
$('#menuBtn').onclick = openDrawer; $('#scrim').onclick = closeDrawer;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDrawer();
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) return;
  if (e.key === 'ArrowRight' && !e.altKey) goToPage(cur + 1); if (e.key === 'ArrowLeft' && !e.altKey) goToPage(cur - 1);
});
(function start() {
  const h = (location.hash || '').slice(1), k = BOOK_DATA.findIndex(p => p.id === h);
  goToPage(k >= 0 ? k : clamp(store.get('page', 0), 0, BOOK_DATA.length - 1), k < 0);
})();
