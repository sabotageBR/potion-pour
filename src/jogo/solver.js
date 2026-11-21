// Solver do Purr & Pour (puro). Dois modos:
// - resolver(E): DFS com memoria e boa ordem de jogadas. Acha uma solucao rapido (dica do gato, validar
//   fase, saber se o jogador entrou num beco). Nao e a menor.
// - minimo(E): A* com a heuristica admissivel regras.ordem() e teto de nos: o numero minimo de jogadas
//   (a medida de dificuldade do gerador). Sem teto estourado o resultado e exato.
// O solver ve tudo (inclusive as camadas ocultas): o gato "sabe" o que ha embaixo.
import { despejar, jogadas, chave, completa, ordem, quantidade } from './regras.js';

/** @typedef {import('./regras.js').Estado} Estado */

/**
 * Jogadas uteis em ordem de preferencia (as que fecham pocao e juntam cores primeiro), sem as que
 * nunca ajudam: mover um vaso de cor unica inteiro para um vazio igual a ele, e repetir o mesmo vazio.
 * @param {Estado} E
 * @returns {[number, number, number][]} [a, b, nota]
 */
export function jogadasUteis(E) {
  /** @type {[number, number, number][]} */
  const r = [];
  for (const [a, b] of jogadas(E)) {
    const va = E.c[a];
    const vb = E.c[b];
    const q = quantidade(E, a, b);
    let nota = 0;
    if (!vb.length) {
      // tudo de uma cor so indo para um vazio: so vale se muda a capacidade (caldeirao <-> frasco)
      const uniforme = va.every((x) => x === va[0]);
      if (uniforme && q === va.length && E.def[a].cap === E.def[b].cap) continue;
      // varios vazios iguais: so o primeiro
      let repetido = false;
      for (let k = 0; k < b; k++) {
        if (k !== a && !E.c[k].length && E.pronto[k] < 0 && E.def[k].cap === E.def[b].cap && E.def[k].rolha === E.def[b].rolha
          && E.def[k].geloK === E.def[b].geloK && quantidade(E, a, k)) { repetido = true; break; }
      }
      if (repetido) continue;
      nota = 10 + (va.length - q) * 2;
      // partir uma sequencia no vazio quase nunca ajuda
      if (q < va.length && va.length - q < q) nota -= 5;
    } else {
      nota = 100 + q * 10;
      if (vb.length + q === 4 && vb.every((x) => x === vb[0])) nota += 1000;
      // esvaziar a origem e bom
      if (q === va.length) nota += 20;
    }
    r.push([a, b, nota]);
  }
  r.sort((x, y) => y[2] - x[2]);
  return r;
}

/**
 * DFS com memoria. Devolve a lista de jogadas ate o fim, [] se ja esta completa, ou null se nao ha
 * solucao (ou o teto de nos estourou: `info.estourou`).
 * @param {Estado} E
 * @param {{ teto?: number, info?: { nos: number, estourou: boolean } }} [o]
 * @returns {[number, number][] | null}
 */
export function resolver(E, o = {}) {
  const teto = o.teto || 200000;
  const info = o.info || { nos: 0, estourou: false };
  info.nos = 0;
  info.estourou = false;
  const vistos = new Set();
  /** @type {[number, number][]} */
  const caminho = [];
  /** @param {Estado} S @param {number} prof */
  const dfs = (S, prof) => {
    if (completa(S)) return true;
    if (info.nos++ > teto) { info.estourou = true; return false; }
    if (prof > 400) return false;
    const k = chave(S);
    if (vistos.has(k)) return false;
    vistos.add(k);
    for (const [a, b] of jogadasUteis(S)) {
      const d = despejar(S, a, b);
      if (!d) continue;
      caminho.push([a, b]);
      if (dfs(d.E, prof + 1)) return true;
      caminho.pop();
      if (info.estourou) return false;
    }
    return false;
  };
  return dfs(E, 0) ? caminho.slice() : null;
}

/** Fila de prioridade (heap binario) por f. */
class Heap {
  constructor() { /** @type {{ f: number, g: number, h: number, S: Estado, pai: any, jog: [number, number] | null }[]} */ this.a = []; }
  get tamanho() { return this.a.length; }
  /** @param {any} x */
  por(x) {
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (Heap.menor(a[p], a[i])) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  tirar() {
    const a = this.a;
    const topo = a[0];
    const ult = a.pop();
    if (a.length && ult) {
      a[0] = ult;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && Heap.menor(a[l], a[m])) m = l;
        if (r < a.length && Heap.menor(a[r], a[m])) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return topo;
  }
  /** desempate: mais fundo primeiro (chega antes ao fim) */
  static menor(x, y) { return x.f < y.f || (x.f === y.f && x.g > y.g); }
}

/**
 * Numero minimo de jogadas (A*). `exato` falso quando o teto estourou (aí `jogadas` e a melhor cota que
 * se achou pelo DFS, ou -1).
 * @param {Estado} E
 * @param {{ teto?: number }} [o]
 * @returns {{ jogadas: number, exato: boolean, caminho: [number, number][] | null, nos: number }}
 */
export function minimo(E, o = {}) {
  const teto = o.teto || 150000;
  const heap = new Heap();
  /** @type {Map<string, number>} */
  const melhorG = new Map();
  heap.por({ f: ordem(E), g: 0, h: ordem(E), S: E, pai: null, jog: null });
  melhorG.set(chave(E), 0);
  let nos = 0;
  while (heap.tamanho) {
    const n = heap.tirar();
    if (completa(n.S)) {
      /** @type {[number, number][]} */
      const cam = [];
      for (let x = n; x && x.jog; x = x.pai) cam.push(x.jog);
      cam.reverse();
      return { jogadas: n.g, exato: true, caminho: cam, nos };
    }
    if (++nos > teto) break;
    if ((melhorG.get(chave(n.S)) ?? Infinity) < n.g) continue;
    for (const [a, b] of jogadasUteis(n.S)) {
      const d = despejar(n.S, a, b);
      if (!d) continue;
      const g = n.g + 1;
      const k = chave(d.E);
      if ((melhorG.get(k) ?? Infinity) <= g) continue;
      melhorG.set(k, g);
      const h = ordem(d.E);
      heap.por({ f: g + h, g, h, S: d.E, pai: n, jog: [a, b] });
    }
  }
  const dfs = resolver(E, { teto: 100000 });
  return { jogadas: dfs ? dfs.length : -1, exato: false, caminho: dfs, nos };
}

/**
 * Primeira jogada de uma solucao a partir de E (a dica do gato): a do caminho minimo (A*) quando cabe no
 * teto, senao a do DFS. Devolve null se nao ha saida.
 * @param {Estado} E
 * @param {number} [teto]
 * @returns {{ jogada: [number, number] | null, semSaida: boolean }}
 */
export function dica(E, teto = 60000) {
  if (completa(E)) return { jogada: null, semSaida: false };
  const m = minimo(E, { teto: Math.min(teto, 20000) });
  if (m.exato && m.caminho && m.caminho.length) return { jogada: m.caminho[0], semSaida: false };
  if (m.exato) return { jogada: null, semSaida: true };
  const info = { nos: 0, estourou: false };
  const sol = resolver(E, { teto, info });
  if (sol && sol.length) return { jogada: sol[0], semSaida: false };
  if (info.estourou) {
    // sem certeza: sugere a melhor jogada pela ordem de preferencia
    const u = jogadasUteis(E);
    return { jogada: u.length ? [u[0][0], u[0][1]] : null, semSaida: !u.length };
  }
  return { jogada: null, semSaida: true };
}
