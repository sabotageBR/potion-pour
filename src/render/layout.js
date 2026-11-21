// Layout da tela de jogo: onde ficam HUD, barra de ferramentas, o gato e os recipientes, em retrato
// (celular) e paisagem (desktop, ate 640x360 da Poki). Escolhe o numero de fileiras que deixa os frascos
// maiores. Frasco: largura w, altura 3,2w; caldeirao: 1,7w de largura e 0,74 da altura de um frasco.

export const RAZAO_FRASCO = 3.2;

/**
 * @typedef {{ x: number, y: number, w: number, h: number, caldeirao: boolean, base: number }} Lugar
 *   x: centro; y: boca; base: y da prateleira
 * @typedef {{
 *   W: number, H: number, retrato: boolean, topo: number, barraY: number, barraH: number,
 *   gato: { x: number, y: number, s: number }, area: { x0: number, y0: number, x1: number, y1: number },
 *   lugares: Lugar[], prateleiras: { x0: number, x1: number, y: number, esp: number }[], w: number, botao: number,
 *   deco: { x0: number, x1: number, y: number, s: number, fileiras: number } | null
 * }} Layout
 */

/**
 * @param {number} W @param {number} H
 * @param {{ caldeirao: boolean }[]} vasos
 * @returns {Layout}
 */
export function calcularLayout(W, H, vasos) {
  const retrato = H >= W * 1.05;
  const pequeno = Math.min(W, H) < 420;
  const topo = pequeno ? 50 : 68;
  const botao = pequeno ? 46 : 60;
  const barraH = botao + (pequeno ? 14 : 26);
  const barraY = H - barraH;
  const gatoS = retrato ? Math.min(118, W * 0.27, H * 0.15) : Math.min(150, H * 0.3, W * 0.16);
  const gato = retrato
    ? { x: 10 + gatoS * 0.5, y: H - 6, s: gatoS }
    : { x: 14 + gatoS * 0.5, y: barraY + barraH * 0.35, s: gatoS };
  // prateleira dos enfeites: faixa no alto (retrato alto) ou coluna acima do gato (paisagem)
  const decoS = retrato ? Math.min(46, W / 9) : Math.min(46, gatoS * 0.36);
  const deco = retrato
    ? (H >= 600 ? { x0: 10, x1: W - 10, y: topo + decoS + 18, s: decoS, fileiras: 1 } : null)
    : (barraY - topo > 260 ? { x0: 12, x1: gatoS + 22, y: topo + decoS + 34, s: decoS, fileiras: 3 } : null);
  const area = retrato
    ? { x0: 8, y0: (deco ? deco.y + 8 : topo + 12), x1: W - 8, y1: barraY - (pequeno ? 6 : 14) }
    : { x0: gatoS + 30, y0: topo + 8, x1: W - Math.max(16, W * 0.04), y1: barraY - 6 };
  const n = vasos.length;
  const largura = (v) => (v.caldeirao ? 1.7 : 1);
  let melhor = /** @type {Layout | null} */ (null);
  for (let fileiras = 1; fileiras <= 4; fileiras++) {
    const porFileira = Math.ceil(n / fileiras);
    if (fileiras > 1 && porFileira < 2) break;
    // distribuicao das fileiras (as de cima com mais quando nao fecha)
    /** @type {number[][]} */
    const grupos = [];
    let k = 0;
    for (let f = 0; f < fileiras; f++) {
      const cabe = Math.ceil((n - k) / (fileiras - f));
      grupos.push(Array.from({ length: cabe }, (_, i) => k + i));
      k += cabe;
    }
    const aw = area.x1 - area.x0;
    const ah = area.y1 - area.y0;
    const unidadesMax = Math.max(...grupos.map((gr) => gr.reduce((s, i) => s + largura(vasos[i]), 0)));
    const fileiraH = ah / fileiras;
    // w pela largura (slot com folga de 0,62) e pela altura (frasco + levantar + prateleira)
    const wLarg = (aw / unidadesMax) * 0.62;
    const wAlt = fileiraH / (RAZAO_FRASCO + 0.85);
    const w = Math.max(10, Math.min(wLarg, wAlt, retrato ? 70 : 104));
    if (melhor && w <= melhor.w) continue;
    const h = w * RAZAO_FRASCO;
    /** @type {Lugar[]} */
    const lugares = Array(n);
    const prateleiras = [];
    const usadoH = fileiras * (h + w * 0.85);
    const sobraY = Math.max(0, ah - usadoH) / 2;
    grupos.forEach((gr, f) => {
      const base = area.y0 + sobraY + (f + 1) * (h + w * 0.85) - w * 0.25;
      const unidades = gr.reduce((s, i) => s + largura(vasos[i]), 0);
      const passo = Math.min(aw / unidades, w * 2.3);
      const total = passo * unidades;
      let x = area.x0 + (aw - total) / 2;
      for (const i of gr) {
        const lw = largura(vasos[i]) * passo;
        const cal = vasos[i].caldeirao;
        const ww = cal ? w * 1.7 : w;
        const hh = cal ? h * 0.74 : h;
        lugares[i] = { x: x + lw / 2, y: base - hh, w: ww, h: hh, caldeirao: cal, base };
        x += lw;
      }
      prateleiras.push({ x0: area.x0 + (aw - total) / 2 - w * 0.35, x1: area.x0 + (aw + total) / 2 + w * 0.35, y: base, esp: Math.max(6, w * 0.3) });
    });
    melhor = { W, H, retrato, topo, barraY, barraH, gato, area, lugares, prateleiras, w, botao, deco };
  }
  return /** @type {Layout} */ (melhor);
}

/**
 * Qual recipiente esta em (x, y)? Area de toque generosa (o slot inteiro, da boca levantada a prateleira).
 * @param {Layout} L @param {number} x @param {number} y
 * @returns {number} indice ou -1
 */
export function vasoEm(L, x, y) {
  let melhor = -1;
  let dist = Infinity;
  L.lugares.forEach((p, i) => {
    const meia = Math.max(p.w * 0.85, 22);
    if (x < p.x - meia || x > p.x + meia) return;
    if (y < p.y - p.w * 1.1 || y > p.base + p.w * 0.4) return;
    const d = Math.abs(x - p.x);
    if (d < dist) { dist = d; melhor = i; }
  });
  return melhor;
}
