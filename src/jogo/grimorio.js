// Grimorio (puro): a meta longa. 12 essencias x 5 tomos = 60 pocoes. O tomo abre quando a mecanica dele
// aparece (fase). A pagina (cor, tomo) e descoberta quando, com o tomo aberto, a cor e completada pela
// REQ[tomo]-esima vez (ou depois). Um enfeite novo no laboratorio a cada POCOES_POR_ENFEITE pocoes.
// Pocao do Dia: o main passa a data (texto AAAA-MM-DD); aqui so a regra, sem relogio.
import { OCULTA_DESDE, ROLHA_DESDE, GELO_DESDE, CALDEIRAO_DESDE } from './gerador.js';
import { NUM_ESSENCIAS } from './essencias.js';
import { hashTexto } from '../core/rng.js';

export const TOMOS = 5;
export const TOTAL_POCOES = NUM_ESSENCIAS * TOMOS;
export const TOMO_DESDE = [1, OCULTA_DESDE, ROLHA_DESDE, GELO_DESDE, CALDEIRAO_DESDE];
export const REQ = [1, 3, 6, 10, 15];
export const POCOES_POR_ENFEITE = 4;
export const ENFEITES = TOTAL_POCOES / POCOES_POR_ENFEITE;

/**
 * @typedef {{ feitas: number[], achadas: number[], selos: number, ultimoSelo: string }} Grimorio
 *   feitas: quantas vezes cada cor foi completada; achadas: bits dos tomos descobertos por cor
 */

/** @returns {Grimorio} */
export function novoGrimorio() {
  return { feitas: Array(NUM_ESSENCIAS).fill(0), achadas: Array(NUM_ESSENCIAS).fill(0), selos: 0, ultimoSelo: '' };
}

/**
 * Le um grimorio salvo (tolerante a lixo).
 * @param {any} g
 * @returns {Grimorio}
 */
export function lerGrimorio(g) {
  const n = novoGrimorio();
  if (!g || typeof g !== 'object') return n;
  for (let i = 0; i < NUM_ESSENCIAS; i++) {
    n.feitas[i] = Math.max(0, Math.floor(Number(g.feitas && g.feitas[i]) || 0));
    n.achadas[i] = (Number(g.achadas && g.achadas[i]) || 0) & 31;
  }
  n.selos = Math.max(0, Math.floor(Number(g.selos) || 0));
  n.ultimoSelo = typeof g.ultimoSelo === 'string' ? g.ultimoSelo : '';
  return n;
}

/** Quantos tomos estao abertos na fase n. @param {number} fase */
export const tomosAbertos = (fase) => TOMO_DESDE.filter((d) => fase >= d).length;

/** @param {Grimorio} G @param {number} cor @param {number} tomo */
export const achada = (G, cor, tomo) => !!(G.achadas[cor] & (1 << tomo));

/** @param {Grimorio} G */
export function total(G) {
  let n = 0;
  for (const b of G.achadas) for (let t = 0; t < TOMOS; t++) if (b & (1 << t)) n++;
  return n;
}

/** Enfeites ganhos. @param {Grimorio} G */
export const enfeites = (G) => Math.min(ENFEITES, Math.floor(total(G) / POCOES_POR_ENFEITE));

/**
 * Uma pocao da cor ficou pronta na fase. Devolve a pagina descoberta (se houver) e o enfeite novo.
 * @param {Grimorio} G (muda)
 * @param {number} cor
 * @param {number} fase
 * @returns {{ nova: { cor: number, tomo: number } | null, enfeite: number }}
 */
export function registrar(G, cor, fase) {
  const antes = enfeites(G);
  G.feitas[cor]++;
  const abertos = tomosAbertos(fase);
  /** @type {{ cor: number, tomo: number } | null} */
  let nova = null;
  for (let t = 0; t < abertos; t++) {
    if (achada(G, cor, t)) continue;
    if (G.feitas[cor] >= REQ[t]) {
      G.achadas[cor] |= 1 << t;
      nova = { cor, tomo: t };
    }
    break; // uma pagina por pocao, na ordem dos tomos
  }
  const depois = enfeites(G);
  return { nova, enfeite: depois > antes ? depois - 1 : -1 };
}

/**
 * A proxima pagina mais perto de sair (meta da vez, no HUD), entre as cores ja conhecidas.
 * @param {Grimorio} G @param {number} fase @param {number} conhecidas
 * @returns {{ cor: number, tomo: number, feitas: number, req: number } | null}
 */
export function proxima(G, fase, conhecidas) {
  const abertos = tomosAbertos(fase);
  /** @type {{ cor: number, tomo: number, feitas: number, req: number } | null} */
  let melhor = null;
  let falta = Infinity;
  for (let c = 0; c < conhecidas; c++) {
    for (let t = 0; t < abertos; t++) {
      if (achada(G, c, t)) continue;
      const f = Math.max(1, REQ[t] - G.feitas[c]);
      if (f < falta) {
        falta = f;
        // progresso dentro do degrau (do requisito anterior ate este)
        const base = t ? REQ[t - 1] : 0;
        melhor = { cor: c, tomo: t, feitas: Math.max(0, Math.min(G.feitas[c], REQ[t]) - base), req: REQ[t] - base };
      }
      break;
    }
  }
  return melhor;
}

/**
 * Cor da Pocao do Dia entre as cores da fase (ou -1 se o dia ja foi carimbado).
 * @param {Grimorio} G @param {string} dia AAAA-MM-DD @param {number[]} coresDaFase
 */
export function corDoDia(G, dia, coresDaFase) {
  if (!dia || G.ultimoSelo === dia || !coresDaFase.length) return -1;
  return coresDaFase[hashTexto(`dia:${dia}`) % coresDaFase.length];
}

/** Carimba o dia (uma vez por dia). @param {Grimorio} G @param {string} dia */
export function carimbar(G, dia) {
  if (!dia || G.ultimoSelo === dia) return false;
  G.ultimoSelo = dia;
  G.selos++;
  return true;
}
