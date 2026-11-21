// Regras do Purr & Pour (puro: sem DOM, relogio nem Math.random; ASCII).
//
// Uma fase tem vasos (frascos de 4 camadas ou caldeirao de 6) com camadas de cor (0..11, de baixo para
// cima). Cada cor tem exatamente 4 camadas na fase. Despejar: a sequencia de mesma cor do topo da origem
// vai para o destino se ele estiver vazio ou com a mesma cor no topo, ate onde couber. Um vaso com as 4
// camadas de uma cor e nada mais vira pocao (pronto): fica selado.
//
// Mecanicas:
// - oculta: camada que o jogador nao ve ate virar topo (so a interface liga para isso; as regras nao);
// - rolha: vaso fechado (nada entra nem sai) ate a pocao da cor da rolha ficar pronta;
// - gelo: as geloK camadas de baixo ficam presas enquanto jogadas < geloAte (o gelo derrete com os
//   despejos); preso, nada sai abaixo da linha do gelo, mas pode entrar por cima;
// - caldeirao: capacidade 6.
//
// Estado (imutavel para o solver; a partida clona antes de mexer):
//   def: VasoDef[]  (estatico; a partida pode acrescentar o frasco extra)
//   c:   number[][] (camadas por vaso)
//   o:   boolean[][] (oculta por camada; anda junto com a camada)
//   pronto: number[] (cor da pocao pronta no vaso, ou -1)
//   pr:  bitmask das cores prontas
//   j:   jogadas feitas
//   ncores: numero de cores da fase

export const CAP_FRASCO = 4;
export const CAP_CALDEIRAO = 6;
export const UNIDADES = 4;

/**
 * @typedef {{ cap: number, rolha: number, geloK: number, geloAte: number, caldeirao: boolean, extra: boolean }} VasoDef
 * @typedef {{ def: VasoDef[], c: number[][], o: boolean[][], pronto: number[], pr: number, j: number, ncores: number }} Estado
 * @typedef {{ cap?: number, rolha?: number, geloK?: number, geloAte?: number, caldeirao?: boolean, extra?: boolean, c?: number[], o?: boolean[] }} VasoEntrada
 */

/** @param {VasoEntrada} v @returns {VasoDef} */
export function defVaso(v) {
  const caldeirao = !!v.caldeirao;
  return {
    cap: v.cap || (caldeirao ? CAP_CALDEIRAO : CAP_FRASCO),
    rolha: v.rolha === undefined ? -1 : v.rolha,
    geloK: v.geloK || 0,
    geloAte: v.geloAte || 0,
    caldeirao,
    extra: !!v.extra,
  };
}

/**
 * @param {VasoEntrada[]} vasos
 * @returns {Estado}
 */
export function criarEstado(vasos) {
  const def = vasos.map(defVaso);
  const c = vasos.map((v) => (v.c || []).slice());
  const o = vasos.map((v, i) => (v.o ? v.o.slice() : c[i].map(() => false)));
  const cores = new Set();
  for (const lista of c) for (const x of lista) cores.add(x);
  /** @type {Estado} */
  const E = { def, c, o, pronto: c.map(() => -1), pr: 0, j: 0, ncores: cores.size };
  for (let i = 0; i < c.length; i++) {
    if (o[i].length) o[i][o[i].length - 1] = false; // o topo sempre aparece
  }
  return E;
}

/** @param {Estado} E @returns {Estado} */
export function clonar(E) {
  return {
    def: E.def.slice(),
    c: E.c.map((x) => x.slice()),
    o: E.o.map((x) => x.slice()),
    pronto: E.pronto.slice(),
    pr: E.pr,
    j: E.j,
    ncores: E.ncores,
  };
}

/** @param {Estado} E @param {number} i */
export const fechado = (E, i) => E.def[i].rolha >= 0 && !(E.pr & (1 << E.def[i].rolha));

/** Camadas presas no gelo agora (0 se derreteu). @param {Estado} E @param {number} i */
export const presas = (E, i) => (E.def[i].geloK > 0 && E.j < E.def[i].geloAte ? Math.min(E.def[i].geloK, E.c[i].length) : 0);

/** Despejos que faltam para o gelo do vaso derreter (0 se nao tem). @param {Estado} E @param {number} i */
export const geloFalta = (E, i) => (E.def[i].geloK > 0 && E.j < E.def[i].geloAte ? E.def[i].geloAte - E.j : 0);

/** @param {Estado} E @param {number} i */
export const topo = (E, i) => (E.c[i].length ? E.c[i][E.c[i].length - 1] : -1);

/** Tamanho da sequencia de mesma cor no topo que pode sair (respeita o gelo). @param {Estado} E @param {number} i */
export function corrida(E, i) {
  const v = E.c[i];
  const base = presas(E, i);
  let n = 0;
  for (let k = v.length - 1; k >= base; k--) {
    if (v[k] !== v[v.length - 1]) break;
    n++;
  }
  return n;
}

/**
 * Quantas camadas iriam de a para b (0 = jogada invalida).
 * @param {Estado} E @param {number} a @param {number} b
 */
export function quantidade(E, a, b) {
  if (a === b || a < 0 || b < 0 || a >= E.c.length || b >= E.c.length) return 0;
  if (E.pronto[a] >= 0 || E.pronto[b] >= 0) return 0;
  if (fechado(E, a) || fechado(E, b)) return 0;
  const va = E.c[a];
  const vb = E.c[b];
  if (!va.length) return 0;
  const livre = E.def[b].cap - vb.length;
  if (livre <= 0) return 0;
  if (vb.length && vb[vb.length - 1] !== va[va.length - 1]) return 0;
  const n = corrida(E, a);
  return n ? Math.min(n, livre) : 0;
}

/** Um vaso com as 4 camadas de uma cor e nada mais. @param {number[]} v */
export const vasoCompleto = (v) => v.length === UNIDADES && v[0] === v[1] && v[1] === v[2] && v[2] === v[3];

/**
 * @typedef {{ qtd: number, cor: number, prontos: number[], revelados: number, gelos: number[] }} Resultado
 * @param {Estado} E estado de origem (nao muda)
 * @param {number} a @param {number} b
 * @returns {{ E: Estado, r: Resultado } | null}
 */
export function despejar(E, a, b) {
  const qtd = quantidade(E, a, b);
  if (!qtd) return null;
  const antesGelo = E.c.map((_, i) => geloFalta(E, i) > 0);
  const N = { def: E.def, c: E.c.slice(), o: E.o.slice(), pronto: E.pronto, pr: E.pr, j: E.j + 1, ncores: E.ncores };
  const cor = E.c[a][E.c[a].length - 1];
  N.c[a] = E.c[a].slice(0, E.c[a].length - qtd);
  N.o[a] = E.o[a].slice(0, E.o[a].length - qtd);
  N.c[b] = E.c[b].concat(Array(qtd).fill(cor));
  N.o[b] = E.o[b].concat(Array(qtd).fill(false));
  let revelados = 0;
  for (let k = E.o[a].length - qtd; k < E.o[a].length; k++) if (E.o[a][k]) revelados++;
  if (N.o[a].length && N.o[a][N.o[a].length - 1]) {
    N.o[a][N.o[a].length - 1] = false;
    revelados++;
  }
  /** @type {number[]} */
  const prontos = [];
  for (const i of [b, a]) {
    if (vasoCompleto(N.c[i])) {
      if (N.pronto === E.pronto) N.pronto = E.pronto.slice();
      N.pronto[i] = N.c[i][0];
      N.pr |= 1 << N.c[i][0];
      N.o[i] = N.o[i].map(() => false);
      prontos.push(i);
    }
  }
  /** @type {number[]} */
  const gelos = [];
  for (let i = 0; i < N.c.length; i++) if (antesGelo[i] && geloFalta(N, i) === 0) gelos.push(i);
  return { E: N, r: { qtd, cor, prontos, revelados, gelos } };
}

/** @param {Estado} E */
export const completa = (E) => {
  let n = 0;
  for (let k = 0; k < 16; k++) if (E.pr & (1 << k)) n++;
  return n >= E.ncores;
};

/**
 * Todas as jogadas validas [a, b].
 * @param {Estado} E
 * @returns {[number, number][]}
 */
export function jogadas(E) {
  /** @type {[number, number][]} */
  const r = [];
  for (let a = 0; a < E.c.length; a++) {
    if (!E.c[a].length || E.pronto[a] >= 0 || fechado(E, a)) continue;
    for (let b = 0; b < E.c.length; b++) if (quantidade(E, a, b)) r.push([a, b]);
  }
  return r;
}

/**
 * Chave canonica (vasos com as mesmas propriedades sao intercambiaveis: a ordem nao importa).
 * @param {Estado} E
 */
export function chave(E) {
  /** @type {string[]} */
  const partes = [];
  for (let i = 0; i < E.c.length; i++) {
    if (E.pronto[i] >= 0) continue;
    const d = E.def[i];
    let s = String.fromCharCode(65 + d.cap) + (fechado(E, i) ? String.fromCharCode(97 + d.rolha) : '-');
    const g = geloFalta(E, i);
    s += g ? `${d.geloK}${g}` : '.';
    for (const x of E.c[i]) s += String.fromCharCode(97 + x);
    partes.push(s);
  }
  partes.sort();
  return `${E.pr}|${partes.join('/')}`;
}

/**
 * Ordem (quanto falta, por baixo): para cada cor, (sequencias da cor - 1) + 1 se nenhuma sequencia dela
 * esta no fundo de um vaso. Cada despejo baixa no maximo 1: e uma cota inferior do numero de jogadas
 * (heuristica admissivel do A*) e a medida de progresso do gato.
 * @param {Estado} E
 */
export function ordem(E) {
  const seq = new Array(16).fill(0);
  const fundo = new Array(16).fill(false);
  const tem = new Array(16).fill(false);
  for (let i = 0; i < E.c.length; i++) {
    const v = E.c[i];
    if (!v.length || E.pronto[i] >= 0) continue;
    for (let k = 0; k < v.length; k++) {
      tem[v[k]] = true;
      if (k === 0 || v[k] !== v[k - 1]) {
        seq[v[k]]++;
        if (k === 0) fundo[v[k]] = true;
      }
    }
  }
  let h = 0;
  for (let x = 0; x < 16; x++) if (tem[x]) h += seq[x] - 1 + (fundo[x] ? 0 : 1);
  return h;
}

/**
 * Acrescenta o frasco extra (vazio, 4 camadas).
 * @param {Estado} E
 * @returns {Estado}
 */
export function comExtra(E) {
  const N = clonar(E);
  N.def.push(defVaso({ extra: true }));
  N.c.push([]);
  N.o.push([]);
  N.pronto.push(-1);
  return N;
}

/**
 * Confere uma definicao de fase: cada cor com 4 camadas, nada acima da capacidade, nenhum vaso ja pronto.
 * @param {Estado} E
 * @returns {string} '' se ok
 */
export function conferir(E) {
  /** @type {Record<number, number>} */
  const conta = {};
  for (let i = 0; i < E.c.length; i++) {
    if (E.c[i].length > E.def[i].cap) return `vaso ${i} acima da capacidade`;
    if (vasoCompleto(E.c[i])) return `vaso ${i} ja comeca pronto`;
    for (const x of E.c[i]) conta[x] = (conta[x] || 0) + 1;
  }
  for (const [x, n] of Object.entries(conta)) if (n !== UNIDADES) return `cor ${x} com ${n} camadas`;
  return '';
}
