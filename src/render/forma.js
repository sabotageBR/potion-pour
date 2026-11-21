// Formas dos recipientes e o calculo do nivel do liquido com o frasco inclinado: a superficie fica sempre
// na horizontal do mundo. Para cada fracao de volume acha-se (bissecao) a altura Y em que a area do
// poligono interno abaixo de Y bate com a fracao. Assim o liquido escorre certo quando o frasco inclina.

/**
 * Poligono interno (coordenadas locais: origem na boca, y para baixo) de um frasco de largura w e altura h.
 * @param {number} w @param {number} h
 * @returns {[number, number][]}
 */
export function poligonoFrasco(w, h) {
  const r = w / 2;
  const topo = h * 0.1;
  const pts = /** @type {[number, number][]} */ ([[-r, topo]]);
  const fundo = h - r;
  pts.push([-r, fundo]);
  for (let i = 1; i < 12; i++) {
    const a = Math.PI - (i / 12) * Math.PI;
    pts.push([Math.cos(a) * r, fundo + Math.sin(a) * r]);
  }
  pts.push([r, fundo]);
  pts.push([r, topo]);
  return pts;
}

/**
 * Caldeirao de vidro: bojo largo (elipse) e boca mais estreita.
 * @param {number} w largura do bojo @param {number} h altura
 * @returns {[number, number][]}
 */
export function poligonoCaldeirao(w, h) {
  const boca = w * 0.34;
  const rx = w / 2;
  const ry = h * 0.4;
  const cy = h - ry;
  const alfa = Math.acos(Math.min(0.99, boca / rx));
  const ombro = cy - ry * Math.sin(alfa);
  const pts = /** @type {[number, number][]} */ ([[-boca, h * 0.08], [-boca, ombro]]);
  // do ombro esquerdo, pelo fundo, ate o ombro direito (theta de pi+alfa ate -alfa)
  const N = 24;
  for (let i = 1; i < N; i++) {
    const th = Math.PI + alfa - (i / N) * (Math.PI + 2 * alfa);
    pts.push([Math.cos(th) * rx, cy + Math.sin(th) * ry]);
  }
  pts.push([boca, ombro], [boca, h * 0.08]);
  return pts;
}

/**
 * Gira e desloca um poligono local.
 * @param {[number, number][]} pts @param {number} x @param {number} y @param {number} ang
 * @returns {[number, number][]}
 */
export function transformar(pts, x, y, ang) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return pts.map(([px, py]) => [x + px * c - py * s, y + px * s + py * c]);
}

/** Area (com sinal tirado) de um poligono. @param {[number, number][]} p */
export function area(p) {
  let a = 0;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += p[j][0] * p[i][1] - p[i][0] * p[j][1];
  return Math.abs(a) / 2;
}

/**
 * Parte do poligono com y >= Y (abaixo da linha na tela).
 * @param {[number, number][]} p @param {number} Y
 * @returns {[number, number][]}
 */
export function cortarAbaixo(p, Y) {
  /** @type {[number, number][]} */
  const r = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    const da = a[1] >= Y;
    const db = b[1] >= Y;
    if (da) r.push(a);
    if (da !== db) {
      const t = (Y - a[1]) / (b[1] - a[1]);
      r.push([a[0] + (b[0] - a[0]) * t, Y]);
    }
  }
  return r;
}

/**
 * Alturas Y (mundo) das fronteiras para as fracoes de volume pedidas (0 = vazio, 1 = cheio ate a boca
 * util). O poligono ja esta no mundo.
 * @param {[number, number][]} p
 * @param {number[]} fracoes crescentes
 * @returns {number[]}
 */
export function niveis(p, fracoes) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of p) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const total = area(p);
  return fracoes.map((f) => {
    if (f <= 0) return maxY;
    if (f >= 1) return minY;
    let lo = minY;
    let hi = maxY;
    const alvo = f * total;
    for (let k = 0; k < 18; k++) {
      const m = (lo + hi) / 2;
      if (area(cortarAbaixo(p, m)) > alvo) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  });
}
