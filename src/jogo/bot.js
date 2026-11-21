// Bot "jogador razoavel" (puro): ve so o que o jogador ve (camada oculta e um coringa desconhecido),
// escolhe pela ordem visivel com um passo de previsao, erra de vez em quando (ruido), evita repetir
// estados, usa o desfazer quando se ve preso e o frasco extra gratis uma vez, e segue a dica automatica do
// gato (que o jogo mostra sozinho) com 70% de chance; com gato=0 joga sem ela. Desiste depois de 3x o
// minimo + 25 despejos ou quando fica sem saida.
// Mede a conclusao por fase (test/bot.test.js) e o tempo de sessao (tools/medir.mjs).
import { jogadas, completa, chave, quantidade, despejar } from './regras.js';
import { criarPartida, jogar, desfazer, usarExtra, podeDesfazer, recomecar } from './partida.js';
import { motivo, sugerir } from './gato.js';

/** @typedef {import('./regras.js').Estado} Estado */

/**
 * Ordem do tabuleiro como o jogador ve: camada oculta quebra a sequencia e conta como desordem.
 * @param {Estado} E
 */
export function ordemVisivel(E) {
  /** @type {Map<number, number>} */
  const seq = new Map();
  const fundo = new Set();
  let ocultas = 0;
  for (let i = 0; i < E.c.length; i++) {
    const v = E.c[i];
    if (E.pronto[i] >= 0) continue;
    let ant = -1;
    for (let k = 0; k < v.length; k++) {
      if (E.o[i][k]) { ocultas++; ant = -1; continue; }
      if (v[k] !== ant) {
        seq.set(v[k], (seq.get(v[k]) || 0) + 1);
        if (k === 0) fundo.add(v[k]);
      }
      ant = v[k];
    }
  }
  let h = ocultas;
  for (const [x, n] of seq) h += n - 1 + (fundo.has(x) ? 0 : 1);
  return h;
}

/**
 * Nota de uma jogada pelo que se ve (maior e melhor).
 * @param {Estado} E @param {number} a @param {number} b
 */
function notaVisivel(E, a, b) {
  const va = E.c[a];
  const vb = E.c[b];
  const cor = va[va.length - 1];
  // sequencia visivel do topo
  let run = 0;
  for (let k = va.length - 1; k >= 0 && !E.o[a][k] && va[k] === cor; k--) run++;
  const q = Math.min(run, E.def[b].cap - vb.length, quantidade(E, a, b));
  let nota = 0;
  if (vb.length) nota += 30 + q * 4;
  if (vb.length && vb.length + q === 4 && vb.every((x, k) => x === cor && !E.o[b][k])) nota += 200;
  if (q === va.length) nota += 12; // esvazia a origem
  if (!vb.length) {
    const uniforme = va.every((x, k) => x === cor && !E.o[a][k]);
    nota += uniforme ? -40 : 4 - (q < run ? 15 : 0);
  }
  // revela uma camada oculta
  if (va.length > q && E.o[a][va.length - q - 1]) nota += 8;
  return nota;
}

/**
 * Melhor nota visivel da jogada seguinte (previsao de 1 passo), sem espiar a camada que a jogada revelaria.
 * @param {Estado} antes @param {Estado} depois @param {number} a @param {number} q
 */
function previsao(antes, depois, a, q) {
  let S = depois;
  const ia = antes.c[a].length - q - 1;
  if (ia >= 0 && antes.o[a][ia]) {
    S = { ...depois, o: depois.o.slice() };
    S.o[a] = depois.o[a].slice();
    S.o[a][S.o[a].length - 1] = true;
  }
  if (completa(S)) return 300;
  let melhor = -100;
  for (const [x, y] of jogadas(S)) melhor = Math.max(melhor, notaVisivel(S, x, y));
  return melhor;
}

/**
 * Joga uma fase como um jogador razoavel. Com `gato` > 0, segue a dica automatica do Miso com essa
 * chance quando ela aparece (o jogo mostra a dica sozinho quando o jogador nao progride).
 * @param {import('./gerador.js').Fase} fase
 * @param {() => number} r RNG
 * @param {{ ruido?: number, teto?: number, gato?: number }} [o]
 * @returns {{ concluiu: boolean, despejos: number, desfeitos: number, extras: number, dicas: number, motivo: string }}
 */
export function jogarFase(fase, r, o = {}) {
  const ruido = o.ruido ?? 0.08;
  const segueGato = o.gato ?? 0.7;
  const P = criarPartida(fase);
  const teto = o.teto || 3 * Math.max(3, fase.minimo) + 25;
  /** @type {Set<string>} jogadas proibidas (estado + jogada que levou a beco) */
  const tabu = new Set();
  let desfeitos = 0;
  let presoSeguidas = 0;
  let total = 0;
  let dicas = 0;
  let gatoEspera = 0;
  const fim = (concluiu, motivoFim) => ({ concluiu, despejos: total, desfeitos, extras: P.extras, dicas, motivo: motivoFim });
  while (!completa(P.E)) {
    if (total >= teto) return fim(false, 'teto');
    // 1) o gato ajuda sozinho quando o jogador nao progride
    const m = segueGato > 0 && gatoEspera <= 0 ? motivo(P, 0) : null;
    gatoEspera--;
    if (m) {
      gatoEspera = 3;
      if (r() < segueGato) {
        const s = sugerir(P, m);
        dicas++;
        if (s.acao === 'jogar' && s.jogada) { jogar(P, s.jogada[0], s.jogada[1]); total++; continue; }
        if (s.acao === 'desfazer' && desfazer(P)) { desfeitos++; continue; }
        if (s.acao === 'extra' && P.extras < 1 && usarExtra(P)) continue;
        if (s.acao === 'recomecar') { recomecar(P); continue; }
      }
    }
    // 2) escolha propria pelo que se ve, com um passo de previsao nas melhores
    const k = chave(P.E);
    const cand = [];
    for (const [a, b] of jogadas(P.E)) {
      if (tabu.has(`${k}>${a},${b}`)) continue;
      let nota = notaVisivel(P.E, a, b);
      const d = despejar(P.E, a, b);
      if (d && P.vistos.has(chave(d.E))) nota -= 25;
      cand.push({ a, b, nota: nota + r() * 6, d });
    }
    cand.sort((x, y) => y.nota - x.nota);
    for (const c of cand.slice(0, 4)) if (c.d) c.nota += 0.5 * previsao(P.E, c.d.E, c.a, c.d.r.qtd);
    cand.sort((x, y) => y.nota - x.nota);
    const preso = !cand.length || (P.semMelhora >= 8) || (P.ciclo && presoSeguidas > 2);
    if (preso) {
      presoSeguidas++;
      // desfaz ate 3 passos e proibe a jogada que saiu dali
      if (podeDesfazer(P)) {
        const passos = Math.min(3, P.hist.length, P.desfazerRestam);
        for (let i = 0; i < passos; i++) desfazer(P);
        desfeitos += passos;
        P.semMelhora = 0;
        const k2 = chave(P.E);
        const prox = jogadas(P.E);
        if (prox.length) {
          const pior = prox.map(([a, b]) => ({ a, b, n: notaVisivel(P.E, a, b) })).sort((x, y) => y.n - x.n)[0];
          tabu.add(`${k2}>${pior.a},${pior.b}`);
        }
        continue;
      }
      if (P.extras < 1 && usarExtra(P)) continue;
      if (!cand.length) return fim(false, 'sem-saida');
    } else presoSeguidas = 0;
    let escolha = cand[0];
    if (r() < ruido && cand.length > 1) escolha = cand[1 + Math.floor(r() * (cand.length - 1))];
    jogar(P, escolha.a, escolha.b);
    total++;
  }
  return fim(true, '');
}
