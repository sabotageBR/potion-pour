// Partida de uma fase (puro): estado atual, desfazer limitado, frasco extra, e o que o gato precisa saber
// (estados ja vistos, melhor ordem da fase, despejos sem melhora). Pocao pronta nao volta: completar uma
// pocao apaga o historico do desfazer.
import { criarEstado, despejar, comExtra, chave, ordem, jogadas, completa } from './regras.js';

export const DESFAZER_POR_FASE = 5;
export const EXTRAS_POR_FASE = 2;

/**
 * @typedef {import('./regras.js').Estado} Estado
 * @typedef {{
 *   fase: import('./gerador.js').Fase, E: Estado, inicio: Estado, hist: Estado[], desfazerRestam: number, extras: number,
 *   despejos: number, vistos: Set<string>, melhor: number, semMelhora: number, ciclo: boolean, pocoes: number
 * }} Partida
 */

/** @param {import('./gerador.js').Fase} fase @returns {Partida} */
export function criarPartida(fase) {
  const E = criarEstado(fase.vasos);
  return {
    fase, E, inicio: E, hist: [], desfazerRestam: DESFAZER_POR_FASE, extras: 0, despejos: 0,
    vistos: new Set([chave(E)]), melhor: ordem(E), semMelhora: 0, ciclo: false, pocoes: 0,
  };
}

/**
 * Despeja de a para b. Devolve o resultado das regras, ou null se a jogada e invalida.
 * @param {Partida} P @param {number} a @param {number} b
 */
export function jogar(P, a, b) {
  const d = despejar(P.E, a, b);
  if (!d) return null;
  P.hist.push(P.E);
  P.E = d.E;
  P.despejos++;
  const k = chave(P.E);
  P.ciclo = P.vistos.has(k);
  P.vistos.add(k);
  const h = ordem(P.E);
  if (d.r.prontos.length) {
    // pocao pronta: progresso de verdade, e o desfazer nao passa daqui
    P.pocoes += d.r.prontos.length;
    P.hist = [];
    P.melhor = h;
    P.semMelhora = 0;
    P.ciclo = false;
  } else if (h < P.melhor) {
    P.melhor = h;
    P.semMelhora = 0;
  } else P.semMelhora++;
  return d.r;
}

/** @param {Partida} P */
export const podeDesfazer = (P) => P.hist.length > 0 && P.desfazerRestam > 0;

/** @param {Partida} P @returns {boolean} */
export function desfazer(P) {
  if (!podeDesfazer(P)) return false;
  P.E = /** @type {Estado} */ (P.hist.pop());
  P.desfazerRestam--;
  P.ciclo = false;
  return true;
}

/** @param {Partida} P */
export const podeExtra = (P) => P.extras < EXTRAS_POR_FASE && !completa(P.E);

/** Acrescenta um frasco vazio (o historico ganha o frasco tambem, para o desfazer nao tira-lo). @param {Partida} P */
export function usarExtra(P) {
  if (!podeExtra(P)) return false;
  P.extras++;
  P.E = comExtra(P.E);
  P.hist = P.hist.map((S) => comExtra(S));
  P.semMelhora = 0;
  P.ciclo = false;
  return true;
}

/** Volta ao comeco da fase (mantem os frascos extras ja ganhos). @param {Partida} P */
export function recomecar(P) {
  let E = P.inicio;
  for (let i = 0; i < P.extras; i++) E = comExtra(E);
  P.E = E;
  P.hist = [];
  P.desfazerRestam = DESFAZER_POR_FASE;
  P.vistos = new Set([chave(E)]);
  P.melhor = ordem(E);
  P.semMelhora = 0;
  P.ciclo = false;
}

/** @param {Partida} P */
export const semJogada = (P) => !completa(P.E) && jogadas(P.E).length === 0;
