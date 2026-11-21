// Sons do Purr & Pour, sintetizados (src/som/receitas.js). Contrato de cada receita: (v, t0, p) =>
// duracao em s, sem sorteio (o "acaso" vem de p.k, que o jogo passa).
import { tom, sopro, hz } from './receitas.js';

export const SONS = {
  /** toque de vidro ao pegar um frasco */
  pegar(v, t0, p) {
    const k = (p && p.k) || 0;
    return tom(v, t0, { f: 1760 + (k % 4) * 90, vol: 0.06, ataque: 0.002, queda: 0.12, tipo: 'sine' }) - t0;
  },
  /**
   * despejo: um jorro so, liso, que sobe de tom conforme o destino enche (o tempo do fio na tela).
   * Sem trem de bolhas: cliques rapidos em sequencia soavam como catraca. p.q = camadas, p.nivel = 0..1
   */
  despejo(v, t0, p) {
    const q = Math.max(1, (p && p.q) || 1);
    const nivel = (p && p.nivel) || 0;
    const t = t0 + 0.14;
    const dur = 0.26 + 0.07 * q;
    const f = 300 + nivel * 380;
    const f2 = 300 + Math.min(1, nivel + q * 0.25) * 380 + 120;
    sopro(v, t, { f: f * 2.2, f2: f2 * 2.2, glide: dur, q: 1.4, vol: 0.03, ataque: 0.06, segurar: dur - 0.1, queda: 0.16 });
    return tom(v, t, { f, f2, glide: dur, vol: 0.05, ataque: 0.06, segurar: dur - 0.1, queda: 0.16, tipo: 'sine' }) - t0;
  },
  /** rolha estalando */
  rolha(v, t0) {
    sopro(v, t0, { f: 2400, q: 2, vol: 0.12, ataque: 0.001, queda: 0.03 });
    return tom(v, t0, { f: 900, f2: 380, glide: 0.06, vol: 0.18, ataque: 0.001, queda: 0.09, tipo: 'sine' }) - t0;
  },
  /** pocao pronta: um acorde de sino so, notas juntas (p.k = quantas pocoes ja sairam nesta fase, sobe o tom) */
  pocao(v, t0, p) {
    const k = Math.min(6, (p && p.k) || 0);
    let fim = t0;
    [72, 76, 79].forEach((m, i) => {
      fim = Math.max(fim, tom(v, t0 + i * 0.012, { f: hz(m + k), vol: 0.055, ataque: 0.006, queda: 0.45, tipo: i ? 'sine' : 'triangle' }));
    });
    return fim - t0;
  },
  /** pagina nova no Grimorio: acorde de sino e uma nota mais alta depois (dois toques, sem carrilhao rapido) */
  novaPocao(v, t0) {
    let fim = t0;
    for (const m of [79, 83, 86]) fim = Math.max(fim, tom(v, t0, { f: hz(m), vol: 0.04, ataque: 0.004, queda: 0.6, tipo: 'sine' }));
    fim = Math.max(fim, tom(v, t0 + 0.2, { f: hz(91), vol: 0.05, ataque: 0.004, queda: 0.7, tipo: 'sine' }));
    return fim - t0;
  },
  /** jogada invalida: tunc de vidro grosso */
  erro(v, t0) {
    return tom(v, t0, { f: 180, f2: 140, vol: 0.12, ataque: 0.003, queda: 0.12, tipo: 'triangle', filtro: { f: 900 } }) - t0;
  },
  /** miado curto: dente de serra com formante que sobe e desce */
  miau(v, t0) {
    return tom(v, t0, {
      curva: [[0, 520], [0.12, 820], [0.32, 560]], vol: 0.07, ataque: 0.03, segurar: 0.12, queda: 0.18, tipo: 'sawtooth',
      filtro: { tipo: 'bandpass', curva: [[0, 900], [0.12, 1700], [0.32, 1000]], q: 3 }, vib: { f: 7, prof: 10, atraso: 0.12 },
    }) - t0;
  },
  /** gelo soltando: um estalo so e um brilho descendo (sem crepitar em sequencia) */
  gelo(v, t0) {
    sopro(v, t0, { f: 2800, q: 4, vol: 0.07, ataque: 0.002, queda: 0.07 });
    return tom(v, t0, { f: 2600, f2: 1800, vol: 0.045, ataque: 0.002, queda: 0.22, tipo: 'sine' }) - t0;
  },
  /** desfazer: assobio descendo */
  desfazer(v, t0) {
    return tom(v, t0, { f: 900, f2: 450, vol: 0.06, ataque: 0.005, queda: 0.16, tipo: 'triangle' }) - t0;
  },
  /** frasco extra chegando */
  extra(v, t0) {
    let fim = t0;
    [67, 74, 79].forEach((m, i) => { fim = tom(v, t0 + i * 0.07, { f: hz(m), vol: 0.07, ataque: 0.004, queda: 0.2, tipo: 'triangle' }); });
    return fim - t0;
  },
  /** fase completa: tres acordes espacados (ta-ta-taaa) e o baixo no ultimo, sem escala corrida */
  festa(v, t0) {
    let fim = t0;
    [[60, 64, 67], [64, 67, 72], [67, 72, 76, 84]].forEach((ac, i) => {
      for (const m of ac) {
        fim = Math.max(fim, tom(v, t0 + i * 0.18, { f: hz(m), vol: 0.045, ataque: 0.008, queda: i === 2 ? 0.7 : 0.28, tipo: 'triangle' }));
      }
    });
    tom(v, t0 + 0.36, { f: hz(48), vol: 0.08, ataque: 0.01, queda: 0.7, tipo: 'sine' });
    return fim - t0;
  },
  /** virar pagina do Grimorio */
  pagina(v, t0) {
    return sopro(v, t0, { f: 1800, f2: 700, q: 0.8, vol: 0.06, ataque: 0.01, queda: 0.18 }) - t0;
  },
  /** novidade (mecanica nova, essencia nova) */
  novidade(v, t0) {
    let fim = t0;
    [76, 72, 79, 88].forEach((m, i) => { fim = tom(v, t0 + i * 0.09, { f: hz(m), vol: 0.06, ataque: 0.004, queda: 0.35, tipo: 'sine' }); });
    return fim - t0;
  },
};
