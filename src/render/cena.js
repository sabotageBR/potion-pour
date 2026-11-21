// Cena do laboratorio: fundo (arte do Grok, um por cenario e orientacao), prateleiras de madeira,
// enfeites ganhos, o gato Miso (poses do Grok com respiracao), particulas (bolhas, brilhos), o fio de
// liquido do despejo e as garrafinhas voando para o Grimorio.
import { ESSENCIAS } from '../jogo/essencias.js';
import { CONTORNO, hexA, estrelinha, arredondado } from './frascos.js';

/** Poses do gato, na ordem da folha do Grok (gato-01..09). */
export const POSES = ['dormindo', 'sentado', 'apontando', 'feliz', 'surpreso', 'lambendo', 'bocejo', 'acenando', 'pensando'];

/**
 * @typedef {{ x: number, y: number, vx: number, vy: number, vida: number, max: number, tipo: 'bolha'|'brilho'|'gota', cor: string, s: number }} Particula
 * @typedef {{ img: HTMLImageElement|null, cor: string, x0: number, y0: number, x1: number, y1: number, t: number, dur: number, fim?: () => void }} Voo
 */

/** Desenha a imagem cobrindo a tela (cover). */
function cobrir(g, img, W, H) {
  const k = Math.max(W / img.width, H / img.height);
  const w = img.width * k;
  const h = img.height * k;
  g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}

const CORES_CENARIO = [['#2b1840', '#1a1030'], ['#1c1a44', '#0f0e2a'], ['#2a2238', '#152018']];

/**
 * @param {CanvasRenderingContext2D} g @param {import('./layout.js').Layout} L
 * @param {HTMLImageElement|null} img fundo do cenario na orientacao certa
 * @param {number} cenario
 */
export function desenharFundo(g, L, img, cenario) {
  const [a, b] = CORES_CENARIO[cenario % 3];
  const grad = g.createLinearGradient(0, 0, 0, L.H);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  g.fillStyle = grad;
  g.fillRect(0, 0, L.W, L.H);
  if (img) cobrir(g, img, L.W, L.H);
  // veu suave no meio para os frascos lerem bem
  const v = g.createRadialGradient(L.W / 2, (L.area.y0 + L.area.y1) / 2, 10, L.W / 2, (L.area.y0 + L.area.y1) / 2, Math.max(L.W, L.H) * 0.7);
  v.addColorStop(0, 'rgba(20, 10, 35, 0.28)');
  v.addColorStop(1, 'rgba(20, 10, 35, 0.05)');
  g.fillStyle = v;
  g.fillRect(0, 0, L.W, L.H);
}

/** @type {WeakMap<HTMLImageElement, CanvasPattern|null>} */
const padroes = new WeakMap();

/**
 * Tabua de madeira (textura do Grok repetida, ou cor chapada).
 * @param {CanvasRenderingContext2D} g
 */
export function tabua(g, x0, x1, y, esp, madeira) {
  g.save();
  arredondado(g, x0, y, x1 - x0, esp, Math.min(6, esp / 2));
  if (madeira) {
    let p = padroes.get(madeira);
    if (p === undefined) { p = g.createPattern(madeira, 'repeat'); padroes.set(madeira, p); }
    g.fillStyle = p || '#a0582c';
  } else g.fillStyle = '#a0582c';
  g.save();
  g.clip();
  if (madeira) {
    g.translate(x0, y);
    const k = Math.max(0.12, esp / 70);
    g.scale(k, k);
    g.fillRect(0, 0, (x1 - x0) / k, esp / k);
  } else g.fillRect(x0, y, x1 - x0, esp);
  g.restore();
  // sombra embaixo, luz em cima, contorno
  g.fillStyle = 'rgba(0, 0, 0, 0.25)';
  g.fillRect(x0 + 4, y + esp, x1 - x0 - 8, Math.max(3, esp * 0.35));
  g.fillStyle = 'rgba(255, 210, 150, 0.25)';
  g.fillRect(x0 + 3, y + 1, x1 - x0 - 6, Math.max(1.5, esp * 0.16));
  g.strokeStyle = CONTORNO;
  g.lineWidth = Math.max(2, esp * 0.16);
  arredondado(g, x0, y, x1 - x0, esp, Math.min(6, esp / 2));
  g.stroke();
  g.restore();
}

/** @param {CanvasRenderingContext2D} g @param {import('./layout.js').Layout} L */
export function desenharPrateleiras(g, L, madeira) {
  for (const p of L.prateleiras) tabua(g, p.x0, p.x1, p.y, p.esp, madeira);
}

/**
 * Enfeites ganhos (os mais novos aparecem; os outros ficam no Grimorio).
 * @param {CanvasRenderingContext2D} g @param {import('./layout.js').Layout} L
 * @param {(HTMLImageElement|null)[]} imgs @param {number} n quantos ganhos @param {number} t
 * @param {number} novo indice do enfeite que acabou de chegar (pulinho), ou -1
 */
export function desenharEnfeites(g, L, imgs, n, t, novo, madeira) {
  if (!L.deco || n <= 0) return;
  const d = L.deco;
  const porFileira = Math.max(1, Math.floor((d.x1 - d.x0) / (d.s * 1.1)));
  const cabem = porFileira * d.fileiras;
  const ini = Math.max(0, n - cabem);
  for (let f = 0; f < d.fileiras; f++) {
    const y = d.y + f * (d.s * 1.55);
    if (ini + f * porFileira >= n) break;
    tabua(g, d.x0, d.x1, y, Math.max(5, d.s * 0.16), madeira);
  }
  for (let i = ini; i < n; i++) {
    const k = i - ini;
    const f = Math.floor(k / porFileira);
    const c = k % porFileira;
    const img = imgs[i];
    const passo = (d.x1 - d.x0) / porFileira;
    const x = d.x0 + passo * (c + 0.5);
    const y = d.y + f * (d.s * 1.55);
    const pulo = i === novo ? Math.abs(Math.sin(t * 8)) * d.s * 0.25 : 0;
    if (img) {
      const s = d.s * 0.95;
      const h = s * Math.min(1.4, img.height / img.width);
      const w = h * (img.width / img.height);
      g.drawImage(img, x - w / 2, y - h - pulo, w, h);
    } else {
      g.fillStyle = '#ffd56b';
      g.beginPath();
      g.arc(x, y - d.s * 0.35 - pulo, d.s * 0.25, 0, Math.PI * 2);
      g.fill();
    }
  }
}

/**
 * O gato Miso. (x, y) = centro da base.
 * @param {CanvasRenderingContext2D} g
 * @param {{ x: number, y: number, s: number }} p
 * @param {(HTMLImageElement|null)[]} poses @param {string} pose @param {number} t
 * @param {string} fala texto do balao ('' sem balao)
 * @param {number} W largura da tela (o balao nao sai dela)
 */
export function desenharGato(g, p, poses, pose, t, fala, W) {
  const img = poses[Math.max(0, POSES.indexOf(pose))] || poses[1] || null;
  const resp = pose === 'dormindo' ? 1 + Math.sin(t * 1.6) * 0.025 : 1 + Math.sin(t * 2.2) * 0.012;
  const pulo = pose === 'feliz' ? Math.abs(Math.sin(t * 7)) * p.s * 0.08 : 0;
  g.save();
  // sombra
  g.fillStyle = 'rgba(0, 0, 0, 0.3)';
  g.beginPath();
  g.ellipse(p.x, p.y - 2, p.s * 0.36, p.s * 0.06, 0, 0, Math.PI * 2);
  g.fill();
  g.translate(p.x, p.y - pulo);
  g.scale(1 / resp ** 0.3, resp);
  if (img) {
    const h = p.s;
    const w = h * (img.width / img.height);
    g.drawImage(img, -w / 2, -h, w, h);
  } else {
    // reserva sem arte: gatinho redondo
    g.fillStyle = '#f3dcb8';
    g.strokeStyle = CONTORNO;
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(0, -p.s * 0.32, p.s * 0.3, p.s * 0.3, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = '#7a3fd0';
    g.beginPath();
    g.moveTo(-p.s * 0.25, -p.s * 0.55);
    g.lineTo(0, -p.s * 0.95);
    g.lineTo(p.s * 0.25, -p.s * 0.55);
    g.fill();
  }
  g.restore();
  if (fala) balao(g, p.x + p.s * 0.2, p.y - p.s * 1.02, fala, Math.max(12, p.s * 0.15), W);
  if (pose === 'dormindo') {
    g.fillStyle = 'rgba(255, 241, 214, 0.85)';
    g.font = `700 ${Math.round(p.s * 0.16)}px Fredoka, sans-serif`;
    g.textAlign = 'left';
    const z = (t * 0.6) % 1;
    g.globalAlpha = 1 - z;
    g.fillText('z', p.x + p.s * 0.25 + z * 10, p.y - p.s * 0.7 - z * 22);
    g.globalAlpha = 1;
  }
}

/** Balao de fala. @param {CanvasRenderingContext2D} g */
function balao(g, x, y, texto, tam, W) {
  g.save();
  g.font = `700 ${Math.round(tam)}px Fredoka, sans-serif`;
  const w = g.measureText(texto).width + tam * 1.2;
  const h = tam * 1.8;
  const bx = Math.max(6, Math.min(x - w * 0.2, W - w - 6));
  const by = Math.max(6, y - h);
  g.fillStyle = '#fff6e6';
  g.strokeStyle = CONTORNO;
  g.lineWidth = 2.5;
  arredondado(g, bx, by, w, h, h / 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(bx + w * 0.22, by + h - 1);
  g.lineTo(bx + w * 0.12, by + h + tam * 0.6);
  g.lineTo(bx + w * 0.34, by + h - 1);
  g.fill();
  g.fillStyle = '#3b2457';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(texto, bx + w / 2, by + h / 2 + 1);
  g.restore();
}

/**
 * Fio de liquido ondulante do despejo.
 * @param {CanvasRenderingContext2D} g
 */
export function desenharFio(g, x0, y0, x1, y1, cor, largura, t, k) {
  const ess = ESSENCIAS[cor] || ESSENCIAS[0];
  const n = 14;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = x0 + (x1 - x0) * u * u + Math.sin(t * 14 + u * 9) * largura * 0.25 * u;
    const y = y0 + (y1 - y0) * u;
    pts.push([x, y]);
  }
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = CONTORNO;
  g.lineWidth = largura * k + 3;
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  g.strokeStyle = ess.cor;
  g.lineWidth = largura * k;
  g.stroke();
  g.strokeStyle = hexA(ess.clara, 0.8);
  g.lineWidth = Math.max(1, largura * k * 0.3);
  g.stroke();
  g.restore();
}

/** @param {CanvasRenderingContext2D} g @param {Particula[]} lista */
export function desenharParticulas(g, lista) {
  for (const p of lista) {
    const a = Math.max(0, Math.min(1, p.vida / p.max));
    if (p.tipo === 'brilho') {
      g.globalAlpha = a;
      estrelinha(g, p.x, p.y, p.s * (0.5 + a * 0.5), p.cor);
    } else if (p.tipo === 'bolha') {
      g.globalAlpha = a * 0.9;
      g.strokeStyle = p.cor;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.beginPath();
      g.arc(p.x - p.s * 0.35, p.y - p.s * 0.35, p.s * 0.25, 0, Math.PI * 2);
      g.fill();
    } else {
      g.globalAlpha = a;
      g.fillStyle = p.cor;
      g.beginPath();
      g.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}

/** @param {Particula[]} lista @param {number} dt */
export function moverParticulas(lista, dt) {
  for (const p of lista) {
    p.vida -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.tipo === 'gota') p.vy += 900 * dt;
    if (p.tipo === 'bolha') p.vx += Math.sin(p.vida * 9) * 20 * dt;
  }
  for (let i = lista.length - 1; i >= 0; i--) if (lista[i].vida <= 0) lista.splice(i, 1);
}

/**
 * Garrafinhas voando num arco ate o Grimorio.
 * @param {CanvasRenderingContext2D} g @param {Voo[]} voos @param {number} s tamanho
 */
export function desenharVoos(g, voos, s) {
  for (const v of voos) {
    const u = Math.min(1, v.t / v.dur);
    const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
    const cx = (v.x0 + v.x1) / 2;
    const cy = Math.min(v.y0, v.y1) - 120;
    const x = (1 - e) ** 2 * v.x0 + 2 * (1 - e) * e * cx + e * e * v.x1;
    const y = (1 - e) ** 2 * v.y0 + 2 * (1 - e) * e * cy + e * e * v.y1;
    const k = 1 + Math.sin(u * Math.PI) * 0.6 - u * 0.5;
    g.save();
    g.translate(x, y);
    g.rotate(Math.sin(u * Math.PI * 2) * 0.4);
    const ss = s * k;
    const halo = g.createRadialGradient(0, 0, 2, 0, 0, ss);
    halo.addColorStop(0, hexA(v.cor, 0.6));
    halo.addColorStop(1, hexA(v.cor, 0));
    g.fillStyle = halo;
    g.fillRect(-ss, -ss, ss * 2, ss * 2);
    if (v.img) {
      const h = ss * 1.2;
      const w = h * (v.img.width / v.img.height);
      g.drawImage(v.img, -w / 2, -h / 2, w, h);
    } else {
      g.fillStyle = v.cor;
      g.strokeStyle = CONTORNO;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, ss * 0.15, ss * 0.4, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillRect(-ss * 0.12, -ss * 0.5, ss * 0.24, ss * 0.3);
    }
    g.restore();
  }
}
