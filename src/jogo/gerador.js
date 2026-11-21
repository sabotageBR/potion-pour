// Gerador de fases do Purr & Pour (puro e deterministico: a mesma semente e fase dao a mesma fase).
//
// parametros(n): quantas cores e vazios, quais mecanicas (oculta, rolha, gelo, caldeirao), e se a fase
// estreia uma mecanica. gerarFase(n, semente): sorteia candidatos com o RNG da semente+fase, descarta os
// sem solucao (solver), mede cada um pelo numero minimo de jogadas (A*) e por quao traicoeiro e (nos que
// o DFS guloso gasta), descarta a metade mais traicoeira e escolhe pelo minimo de jogadas (estreia e
// respiro: o mais curto; o resto: o mais longo dos mansos). A fase 1 e roteirizada (a 1a pocao sai na
// 2a jogada).
import { criarRng, hashTexto, embaralhar } from '../core/rng.js';
import { criarEstado, conferir, CAP_FRASCO } from './regras.js';
import { resolver, minimo } from './solver.js';
import { NUM_ESSENCIAS } from './essencias.js';

export const OCULTA_DESDE = 4;
export const ROLHA_DESDE = 9;
export const GELO_DESDE = 14;
export const CALDEIRAO_DESDE = 18;
/** Fases que trocam o cenario do laboratorio (0, 1, 2 e depois em rodizio a cada 10 fases). */
export const CENARIO_DESDE = [1, 12, 22];

/** @typedef {'oculta'|'rolha'|'gelo'|'caldeirao'} Mecanica */
/**
 * @typedef {{
 *   fase: number, cores: number, vazios: number, ocultas: number, rolhas: number, gelos: number,
 *   caldeirao: boolean, estreia: Mecanica | null, respiro: boolean, cenario: number
 * }} Parametros
 */

/** Quantas essencias o jogador ja conhece ao chegar na fase n (uma nova a cada 3 fases ate as 12). @param {number} n */
export function coresConhecidas(n) {
  if (n <= 1) return 2;
  return Math.min(NUM_ESSENCIAS, 3 + Math.floor((n - 2) / 3));
}

/** Cores da fase n (antes de estreia e respiro). @param {number} n */
function coresBase(n) {
  if (n <= 1) return 2;
  if (n <= 25) return Math.min(10, coresConhecidas(n));
  return [9, 10, 11, 8, 10][n % 5];
}

/** Cenario do laboratorio na fase n. @param {number} n */
export function cenarioDaFase(n) {
  if (n < CENARIO_DESDE[1]) return 0;
  if (n < CENARIO_DESDE[2]) return 1;
  return Math.floor((n - CENARIO_DESDE[2]) / 10 + 2) % 3;
}

/**
 * @param {number} n fase (1..)
 * @returns {Parametros}
 */
export function parametros(n) {
  const r = criarRng(hashTexto(`param:${n}`));
  /** @type {Mecanica | null} */
  const estreia = n === OCULTA_DESDE ? 'oculta' : n === ROLHA_DESDE ? 'rolha' : n === GELO_DESDE ? 'gelo' : n === CALDEIRAO_DESDE ? 'caldeirao' : null;
  const respiro = n >= 10 && n % 5 === 0 && !estreia;
  let cores = coresBase(n);
  if (estreia) cores = Math.max(3, cores - 1);
  if (respiro) cores = Math.max(4, cores - 2);
  const p = { fase: n, cores, vazios: n === 1 ? 1 : cores >= 10 ? 3 : 2, ocultas: 0, rolhas: 0, gelos: 0, caldeirao: false, estreia, respiro, cenario: cenarioDaFase(n) };
  if (estreia === 'oculta') p.ocultas = 2;
  else if (estreia === 'rolha') p.rolhas = 1;
  else if (estreia === 'gelo') p.gelos = 1;
  else if (estreia === 'caldeirao') p.caldeirao = true;
  else if (!respiro && n > OCULTA_DESDE) {
    // mistura das mecanicas ja vistas, no maximo duas por fase
    /** @type {Mecanica[]} */
    const vistas = ['oculta'];
    if (n > ROLHA_DESDE) vistas.push('rolha');
    if (n > GELO_DESDE) vistas.push('gelo');
    if (n > CALDEIRAO_DESDE) vistas.push('caldeirao');
    const chance = { oculta: 0.5, rolha: 0.4, gelo: 0.35, caldeirao: 0.3 };
    let usadas = 0;
    for (const m of embaralhar(vistas.slice(), r)) {
      if (usadas >= 2 || r() > chance[m]) continue;
      usadas++;
      if (m === 'oculta') p.ocultas = Math.min(cores, 2 + Math.floor(r() * (cores - 1)));
      if (m === 'rolha') p.rolhas = n > 24 && r() < 0.35 ? 2 : 1;
      if (m === 'gelo') p.gelos = 1;
      if (m === 'caldeirao') p.caldeirao = true;
    }
  }
  return p;
}

/**
 * @typedef {{ fase: number, semente: number, param: Parametros, vasos: import('./regras.js').VasoEntrada[], minimo: number, exato: boolean, coresDaFase: number[] }} Fase
 */

/** Fase 1 roteirizada: A = [R,R,R,B], B = [B,B,B,R], C vazio. */
function faseUm() {
  return [{ c: [0, 0, 0, 1] }, { c: [1, 1, 1, 0] }, { c: [] }];
}

/**
 * Cores da fase: a essencia mais nova entra sempre que acabou de ser conhecida; o resto e sorteado entre
 * as conhecidas.
 * @param {number} n @param {number} quantas @param {() => number} r
 */
function escolherCores(n, quantas, r) {
  const conhecidas = coresConhecidas(n);
  const antes = n > 1 ? coresConhecidas(n - 1) : 0;
  /** @type {number[]} */
  const fixas = [];
  for (let x = antes; x < conhecidas; x++) fixas.push(x);
  const resto = embaralhar(Array.from({ length: conhecidas }, (_, i) => i).filter((x) => !fixas.includes(x)), r);
  return fixas.concat(resto).slice(0, quantas).sort((a, b) => a - b);
}

/**
 * Um candidato sorteado (sem validar a solucao).
 * @param {Parametros} p @param {number[]} cores @param {() => number} r
 * @returns {import('./regras.js').VasoEntrada[]}
 */
function sortear(p, cores, r) {
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const pool = embaralhar(cores.flatMap((x) => [x, x, x, x]), r);
    /** @type {number[][]} */
    const cheios = [];
    for (let i = 0; i < cores.length; i++) cheios.push(pool.slice(i * 4, i * 4 + 4));
    // nada pronto e nada de 3 iguais seguidos (fica sem graca)
    if (cheios.some((v) => v[0] === v[1] && v[1] === v[2] && (v[2] === v[3] || v[0] === v[3]))) continue;
    if (cheios.some((v) => (v[0] === v[1] && v[1] === v[2]) || (v[1] === v[2] && v[2] === v[3]))) continue;
    /** @type {import('./regras.js').VasoEntrada[]} */
    const vasos = cheios.map((c) => ({ c }));
    const idx = embaralhar(vasos.map((_, i) => i), r);
    let k = 0;
    for (let i = 0; i < p.ocultas && k < idx.length; i++, k++) {
      const v = vasos[idx[k]];
      v.o = (v.c || []).map((_, j, a) => j < a.length - 1);
    }
    for (let i = 0; i < p.rolhas && k < idx.length; i++, k++) {
      const v = vasos[idx[k]];
      const fora = cores.filter((x) => !(v.c || []).includes(x));
      v.rolha = fora[Math.floor(r() * fora.length)];
    }
    for (let i = 0; i < p.gelos && k < idx.length; i++, k++) {
      const v = vasos[idx[k]];
      v.geloK = 2;
      v.geloAte = 3 + Math.floor(r() * 4);
    }
    const vazios = p.caldeirao ? Math.max(1, p.vazios - 1) : p.vazios;
    for (let i = 0; i < vazios; i++) vasos.push({ c: [] });
    if (p.caldeirao) vasos.push({ c: [], caldeirao: true });
    return vasos;
  }
  throw new Error('gerador: sem candidato');
}

/** Tetos do solver (o jogo gera no navegador entre uma fase e outra). */
const TETO_DFS = 40000;
const TETO_A = 25000;

/**
 * @param {number} n fase (1..)
 * @param {number} semente
 * @param {{ candidatos?: number }} [o]
 * @returns {Fase}
 */
export function gerarFase(n, semente, o = {}) {
  const p = parametros(n);
  if (n === 1) {
    const vasos = faseUm();
    return { fase: 1, semente, param: p, vasos, minimo: 3, exato: true, coresDaFase: [0, 1] };
  }
  const r = criarRng(hashTexto(`fase:${semente}:${n}`));
  const cores = escolherCores(n, p.cores, r);
  const quer = o.candidatos || 4;
  /** @type {{ vasos: import('./regras.js').VasoEntrada[], min: number, exato: boolean, nos: number }[]} */
  const bons = [];
  for (let t = 0; t < 40 && bons.length < quer; t++) {
    const vasos = sortear(p, cores, r);
    const E = criarEstado(vasos);
    if (conferir(E)) continue;
    const info = { nos: 0, estourou: false };
    const sol = resolver(E, { teto: TETO_DFS, info });
    if (!sol) continue;
    const m = minimo(E, { teto: TETO_A });
    bons.push({ vasos, min: m.exato ? m.jogadas : sol.length, exato: m.exato, nos: info.nos });
  }
  if (!bons.length) {
    // rede de seguranca: sem mecanicas, com um vazio a mais (sempre tem solucao na pratica)
    const vasos = sortear({ ...p, ocultas: 0, rolhas: 0, gelos: 0, caldeirao: false, vazios: p.vazios + 1 }, cores, r);
    const sol = resolver(criarEstado(vasos), { teto: TETO_DFS * 4 });
    return { fase: n, semente, param: p, vasos, minimo: sol ? sol.length : -1, exato: false, coresDaFase: cores };
  }
  // traicoeira = o DFS guloso (a mesma preferencia de quem joga por intuicao) da muitas voltas antes de
  // achar a saida: fica so a metade menos traicoeira, e dela o minimo de jogadas decide
  bons.sort((a, b) => a.nos - b.nos);
  const mansos = bons.slice(0, Math.max(1, Math.ceil(bons.length / 2)));
  mansos.sort((a, b) => a.min - b.min);
  const escolhido = p.estreia || p.respiro || n <= 3 ? mansos[0] : mansos[mansos.length - 1];
  return { fase: n, semente, param: p, vasos: escolhido.vasos, minimo: escolhido.min, exato: escolhido.exato, coresDaFase: cores };
}

export { CAP_FRASCO };
