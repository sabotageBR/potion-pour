// O gato-ajudante Miso (puro): decide QUANDO ajudar e O QUE sugerir. Ajuda quando o jogador nao
// progride, nao so quando fica parado (licao do Clock Tinker, Conhecimento/Retencao.md):
// - ciclo: o tabuleiro voltou a um estado ja visto nesta fase;
// - sem progresso: LIMITE_SEM_MELHORA despejos sem melhorar a melhor ordem da fase;
// - sem saida: nenhuma jogada, ou o solver diz que daqui nao ha solucao;
// - parado: OCIOSO segundos sem tocar (o relogio fica no main.js, que passa os segundos).
// A sugestao e a primeira jogada do solver; num beco, desfazer (ate um estado com saida), frasco extra ou
// recomecar.
import { dica, resolver } from './solver.js';
import { comExtra, completa } from './regras.js';
import { podeExtra, semJogada } from './partida.js';

export const LIMITE_SEM_MELHORA = 6;

/** Segundos parado ate o gato ajudar. @param {number} fase */
export const ocioso = (fase) => (fase <= 3 ? 4 : 10);

/**
 * @typedef {'ciclo'|'sem-progresso'|'sem-saida'|'parado'} Motivo
 * @typedef {{ motivo: Motivo, acao: 'jogar'|'desfazer'|'extra'|'recomecar', jogada: [number, number] | null }} Ajuda
 */

/**
 * Motivo para ajudar agora (ou null).
 * @param {import('./partida.js').Partida} P
 * @param {number} parado segundos sem tocar
 * @returns {Motivo | null}
 */
export function motivo(P, parado) {
  if (completa(P.E)) return null;
  if (semJogada(P)) return 'sem-saida';
  if (P.ciclo) return 'ciclo';
  if (P.semMelhora >= LIMITE_SEM_MELHORA) return 'sem-progresso';
  if (parado >= ocioso(P.fase.fase)) return 'parado';
  return null;
}

/**
 * O que sugerir.
 * @param {import('./partida.js').Partida} P
 * @param {Motivo} m
 * @returns {Ajuda}
 */
export function sugerir(P, m) {
  const d = dica(P.E);
  if (d.jogada) return { motivo: m, acao: 'jogar', jogada: d.jogada };
  // beco: algum estado do historico (alcancavel com o desfazer que resta) tem saida?
  const n = Math.min(P.hist.length, P.desfazerRestam);
  for (let k = 1; k <= n; k++) {
    if (resolver(P.hist[P.hist.length - k], { teto: 20000 })) return { motivo: 'sem-saida', acao: 'desfazer', jogada: null };
  }
  if (podeExtra(P) && resolver(comExtra(P.E), { teto: 20000 })) return { motivo: 'sem-saida', acao: 'extra', jogada: null };
  return { motivo: 'sem-saida', acao: 'recomecar', jogada: null };
}
