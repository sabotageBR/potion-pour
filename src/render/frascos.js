// Desenho dos recipientes: vidro, liquido em camadas com superficie ondulante (sempre horizontal, mesmo
// com o frasco inclinado), camada oculta "?", gelo, rolha, pocao pronta brilhando e o frasco dourado da
// Pocao do Dia. Tudo em Canvas 2D; a arte do Grok entra por cima (rolha, cristal de gelo, suporte do
// caldeirao) quando carregada.
import { ESSENCIAS } from '../jogo/essencias.js';
import { poligonoFrasco, poligonoCaldeirao, transformar, niveis } from './forma.js';

export const CONTORNO = '#2a1a3a';

/**
 * @typedef {{ cor: number, q: number, oculta: boolean }} Camada
 * @typedef {{
 *   x: number, y: number, w: number, h: number, ang: number, caldeirao: boolean, cap: number,
 *   camadas: Camada[], pronto: number, rolha: number, gelo: number, geloFalta: number,
 *   selecionado: boolean, dourado: boolean, onda: number, brilho: number, t: number, extra: boolean, simbolos: boolean
 * }} Vista
 * @typedef {{ rolha?: HTMLImageElement|null, gelo?: HTMLImageElement|null, suporte?: HTMLImageElement|null }} ArteFrasco
 */

/** @param {Vista} v */
export function poligonoMundo(v) {
  const local = v.caldeirao ? poligonoCaldeirao(v.w, v.h) : poligonoFrasco(v.w, v.h);
  return transformar(local, v.x, v.y, v.ang);
}

/** @param {CanvasRenderingContext2D} g @param {[number, number][]} p */
function caminho(g, p) {
  g.beginPath();
  g.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]);
  g.closePath();
}

/**
 * Simbolo da essencia (ajuda para daltonicos), centrado em (x, y), tamanho s.
 * @param {CanvasRenderingContext2D} g @param {string} nome @param {number} x @param {number} y @param {number} s
 */
export function simbolo(g, nome, x, y, s) {
  g.save();
  g.translate(x, y);
  g.scale(s / 20, s / 20);
  g.beginPath();
  switch (nome) {
    case 'chama': g.moveTo(0, -9); g.bezierCurveTo(7, -2, 8, 4, 0, 9); g.bezierCurveTo(-8, 4, -7, -2, 0, -9); break;
    case 'gota': g.moveTo(0, -9); g.bezierCurveTo(6, -2, 7, 3, 0, 8); g.bezierCurveTo(-7, 3, -6, -2, 0, -9); break;
    case 'sol': g.arc(0, 0, 5, 0, Math.PI * 2); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); g.arc(Math.cos(a) * 8, Math.sin(a) * 8, 1.4, 0, Math.PI * 2); } break;
    case 'folha': g.moveTo(-8, 6); g.quadraticCurveTo(-6, -8, 8, -7); g.quadraticCurveTo(6, 7, -8, 6); break;
    case 'estrela': for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; const r = i % 2 ? 4 : 9; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); break;
    case 'lua': g.arc(0, 0, 8, Math.PI * 0.25, Math.PI * 1.75); g.arc(4, 0, 6, Math.PI * 1.6, Math.PI * 0.4, true); break;
    case 'coracao': g.moveTo(0, 8); g.bezierCurveTo(-10, 0, -6, -9, 0, -4); g.bezierCurveTo(6, -9, 10, 0, 0, 8); break;
    case 'onda': g.moveTo(-9, 2); g.quadraticCurveTo(-4.5, -6, 0, 2); g.quadraticCurveTo(4.5, 10, 9, 2); g.lineTo(9, 6); g.quadraticCurveTo(4.5, 14, 0, 6); g.quadraticCurveTo(-4.5, -2, -9, 6); break;
    case 'nuvem': g.arc(-4, 2, 4.5, 0, Math.PI * 2); g.arc(1, -2, 5.5, 0, Math.PI * 2); g.arc(6, 2, 4, 0, Math.PI * 2); g.rect(-4, 2, 10, 4.5); break;
    case 'losango': g.moveTo(0, -9); g.lineTo(7, 0); g.lineTo(0, 9); g.lineTo(-7, 0); break;
    case 'raio': g.moveTo(2, -9); g.lineTo(-6, 1); g.lineTo(0, 1); g.lineTo(-2, 9); g.lineTo(6, -1); g.lineTo(0, -1); break;
    case 'espiral': for (let i = 0; i <= 30; i++) { const a = i * 0.42; const r = 1 + i * 0.27; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } break;
    default: g.arc(0, 0, 5, 0, Math.PI * 2);
  }
  if (nome === 'espiral') {
    g.lineWidth = 2.6;
    g.lineCap = 'round';
    g.stroke();
  } else g.fill('nonzero');
  g.restore();
}

/**
 * Desenha um recipiente.
 * @param {CanvasRenderingContext2D} g @param {Vista} v @param {ArteFrasco} arte
 */
export function desenharVaso(g, v, arte) {
  const pmundo = poligonoMundo(v);
  const lw = Math.max(2, v.w * 0.075);
  // suporte de ferro do caldeirao (atras)
  if (v.caldeirao && arte.suporte && v.ang === 0) {
    const s = arte.suporte;
    const sw = v.w * 1.25;
    const sh = sw * (s.height / s.width);
    g.drawImage(s, v.x - sw / 2, v.y + v.h - sh * 0.62, sw, sh);
  }
  // brilho da pocao pronta / dourado (atras do vidro)
  if (v.pronto >= 0 || v.dourado || v.brilho > 0) {
    const cor = v.pronto >= 0 ? ESSENCIAS[v.pronto].cor : '#ffd56b';
    const k = v.pronto >= 0 ? 0.55 + 0.25 * Math.sin(v.t * 3) : v.dourado ? 0.45 + 0.2 * Math.sin(v.t * 4) : v.brilho;
    const cx = v.x;
    const cy = v.y + v.h * 0.55;
    const rad = g.createRadialGradient(cx, cy, v.w * 0.2, cx, cy, v.w * 1.6);
    rad.addColorStop(0, hexA(cor, 0.5 * k));
    rad.addColorStop(1, hexA(cor, 0));
    g.fillStyle = rad;
    g.fillRect(cx - v.w * 1.8, cy - v.h * 0.9, v.w * 3.6, v.h * 1.8);
  }
  // vidro (fundo)
  caminho(g, pmundo);
  g.fillStyle = 'rgba(160, 230, 240, 0.12)';
  g.fill();

  // liquido
  const tot = v.camadas.reduce((s, c) => s + c.q, 0);
  if (tot > 0.001) {
    g.save();
    caminho(g, pmundo);
    g.clip();
    const fr = [];
    let acum = 0;
    for (const c of v.camadas) { acum += c.q; fr.push(acum / v.cap); }
    const ys = niveis(pmundo, fr);
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [px, py] of pmundo) { minX = Math.min(minX, px); maxX = Math.max(maxX, px); maxY = Math.max(maxY, py); }
    minX -= 4; maxX += 4;
    // de cima para baixo: cada camada pinta da sua fronteira de cima ate o fundo
    for (let i = v.camadas.length - 1; i >= 0; i--) {
      const c = v.camadas[i];
      if (c.q <= 0.001) continue;
      const yTopo = ys[i];
      const ess = ESSENCIAS[c.cor] || ESSENCIAS[0];
      g.beginPath();
      if (i === v.camadas.length - 1) {
        // superficie ondulante
        const amp = Math.min(v.w * 0.08, 1.2 + v.onda * v.w * 0.09);
        const n = 10;
        for (let k = 0; k <= n; k++) {
          const x = minX + ((maxX - minX) * k) / n;
          const y = yTopo + Math.sin(v.t * 5 + k * 0.9 + v.x * 0.05) * amp;
          if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
      } else {
        g.moveTo(minX, yTopo);
        g.lineTo(maxX, yTopo);
      }
      g.lineTo(maxX, maxY + 4);
      g.lineTo(minX, maxY + 4);
      g.closePath();
      if (c.oculta) {
        g.fillStyle = '#3a2d55';
        g.fill();
      } else {
        const grad = g.createLinearGradient(minX, 0, maxX, 0);
        grad.addColorStop(0, ess.clara);
        grad.addColorStop(0.35, ess.cor);
        grad.addColorStop(1, ess.escura);
        g.fillStyle = grad;
        g.fill();
      }
      // linha entre camadas
      if (i < v.camadas.length - 1) {
        g.strokeStyle = 'rgba(42, 26, 58, 0.35)';
        g.lineWidth = Math.max(1, v.w * 0.03);
        g.beginPath();
        g.moveTo(minX, yTopo);
        g.lineTo(maxX, yTopo);
        g.stroke();
      }
    }
    // simbolos e "?" (so com o frasco em pe)
    if (Math.abs(v.ang) < 0.05) {
      for (let i = 0; i < v.camadas.length; i++) {
        const c = v.camadas[i];
        if (c.q < 0.6) continue;
        const ym = (ys[i] + (i ? ys[i - 1] : maxY)) / 2;
        if (c.oculta) {
          g.fillStyle = 'rgba(255, 241, 214, 0.85)';
          g.font = `700 ${Math.round(v.w * 0.55)}px Fredoka, sans-serif`;
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText('?', v.x, ym + 1);
        } else if (v.simbolos) {
          const ess = ESSENCIAS[c.cor];
          g.fillStyle = c.cor === 8 ? 'rgba(80, 70, 120, 0.45)' : 'rgba(255, 255, 255, 0.42)';
          g.strokeStyle = g.fillStyle;
          simbolo(g, ess.simbolo, v.x, ym, v.w * 0.36);
        }
      }
    }
    g.restore();
  }

  // gelo sobre as camadas presas
  if (v.gelo > 0 && v.geloFalta > 0) {
    const fr = Math.min(v.gelo, v.camadas.length || v.gelo) / v.cap;
    const [yG] = niveis(pmundo, [fr]);
    g.save();
    caminho(g, pmundo);
    g.clip();
    let maxY = -Infinity;
    for (const [, py] of pmundo) maxY = Math.max(maxY, py);
    g.fillStyle = 'rgba(210, 245, 255, 0.45)';
    g.fillRect(v.x - v.w, yG, v.w * 2, maxY - yG + 2);
    if (arte.gelo) {
      g.globalAlpha = 0.85;
      const s = v.w * 1.15;
      g.drawImage(arte.gelo, v.x - s / 2, yG + (maxY - yG) / 2 - s / 2, s, s);
      g.globalAlpha = 1;
    }
    g.restore();
    // contador de despejos
    const r = v.w * 0.32;
    const cy = yG - r * 0.2;
    g.fillStyle = '#e8fbff';
    g.strokeStyle = CONTORNO;
    g.lineWidth = Math.max(1.5, lw * 0.6);
    g.beginPath();
    g.arc(v.x + v.w * 0.42, cy, r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = '#1b5a8a';
    g.font = `700 ${Math.round(r * 1.3)}px Fredoka, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(v.geloFalta), v.x + v.w * 0.42, cy + 1);
  }

  // reflexo do vidro
  g.save();
  caminho(g, pmundo);
  g.clip();
  g.translate(v.x, v.y);
  g.rotate(v.ang);
  const rx = -v.w * (v.caldeirao ? 0.3 : 0.28);
  g.fillStyle = 'rgba(255, 255, 255, 0.28)';
  g.beginPath();
  g.ellipse(rx, v.h * 0.45, v.w * 0.07, v.h * 0.3, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.16)';
  g.beginPath();
  g.ellipse(-rx * 0.9, v.h * 0.55, v.w * 0.04, v.h * 0.18, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // contorno e boca
  caminho(g, pmundo);
  g.strokeStyle = v.selecionado ? '#fff1d6' : CONTORNO;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  g.stroke();
  if (v.selecionado) {
    g.save();
    g.shadowColor = '#ffd56b';
    g.shadowBlur = 18;
    g.strokeStyle = 'rgba(255, 213, 107, 0.9)';
    g.lineWidth = lw * 0.6;
    g.stroke();
    g.restore();
  }
  g.save();
  g.translate(v.x, v.y);
  g.rotate(v.ang);
  const bocaW = v.caldeirao ? v.w * 0.34 : v.w / 2;
  const aba = lw * 1.1;
  g.fillStyle = 'rgba(190, 240, 245, 0.55)';
  g.strokeStyle = v.selecionado ? '#fff1d6' : CONTORNO;
  g.lineWidth = lw * 0.8;
  arredondado(g, -bocaW - aba, v.h * 0.05, (bocaW + aba) * 2, Math.max(4, v.h * 0.06), 3);
  g.fill();
  g.stroke();
  // rolha: pocao pronta (rolha de cortica) ou fechada com selo da cor
  if (v.pronto >= 0 || v.rolha >= 0) {
    const rw = bocaW * 2.1;
    const rh = rw * 0.75;
    if (arte.rolha) g.drawImage(arte.rolha, -rw / 2, v.h * 0.06 - rh * 0.8, rw, rh);
    else {
      g.fillStyle = '#c08a52';
      g.strokeStyle = CONTORNO;
      g.lineWidth = lw * 0.7;
      arredondado(g, -rw * 0.4, v.h * 0.06 - rh * 0.75, rw * 0.8, rh * 0.85, 4);
      g.fill();
      g.stroke();
    }
    if (v.rolha >= 0 && v.pronto < 0) {
      const ess = ESSENCIAS[v.rolha];
      const r = bocaW * 0.95;
      const cy = v.h * 0.06 - rh * 0.9;
      g.fillStyle = ess.cor;
      g.strokeStyle = CONTORNO;
      g.lineWidth = lw * 0.7;
      g.beginPath();
      g.arc(0, cy, r, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.75)';
      simbolo(g, ess.simbolo, 0, cy, r * 1.1);
    }
  }
  g.restore();

  // brilhos do frasco dourado
  if (v.dourado && v.pronto < 0) {
    for (let i = 0; i < 4; i++) {
      const a = v.t * 1.5 + (i * Math.PI) / 2;
      const px = v.x + Math.cos(a) * v.w * 0.8;
      const py = v.y + v.h * 0.5 + Math.sin(a * 1.3) * v.h * 0.4;
      estrelinha(g, px, py, v.w * (0.12 + 0.05 * Math.sin(v.t * 6 + i)), '#ffe27a');
    }
  }
}

/** @param {CanvasRenderingContext2D} g */
export function arredondado(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** @param {CanvasRenderingContext2D} g */
export function estrelinha(g, x, y, s, cor) {
  g.fillStyle = cor;
  g.beginPath();
  g.moveTo(x, y - s);
  g.quadraticCurveTo(x, y, x + s, y);
  g.quadraticCurveTo(x, y, x, y + s);
  g.quadraticCurveTo(x, y, x - s, y);
  g.quadraticCurveTo(x, y, x, y - s);
  g.fill();
}

/** '#rrggbb' + alfa -> rgba(). @param {string} hex @param {number} a */
export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}
