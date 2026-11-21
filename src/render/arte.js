// Arte processada do Grok (src/arte/, WebP) e onde cada peca fica. Carga em duas levas: o minimo para o
// primeiro quadro (cenario atual, gato, icones, madeira) e o resto depois (outros cenarios, pocoes,
// enfeites, papel). Imagem que falha vira null: o desenho tem reserva para tudo.
import { ESSENCIAS } from '../jogo/essencias.js';

export const CENARIOS = ['torre', 'porao', 'estufa'];

/** Enfeites usados (15 de 18), na ordem em que o jogador ganha. */
export const ENFEITES_ARQ = ['a-01', 'a-03', 'b-05', 'a-02', 'b-06', 'a-04', 'a-07', 'b-02', 'a-08', 'b-09', 'a-05', 'b-01', 'a-09', 'b-03', 'a-06'];

const dois = (n) => String(n).padStart(2, '0');

/** @param {string} nome @returns {string} */
export function caminho(nome) {
  if (nome.startsWith('cenario-')) return `src/arte/cenarios/${nome.slice(8)}.webp`;
  if (nome.startsWith('gato-')) return `src/arte/gato/${nome}.webp`;
  if (nome.startsWith('icone-')) return `src/arte/icones/${nome}.webp`;
  if (nome.startsWith('enfeite-')) return `src/arte/enfeites/${nome}.webp`;
  if (nome.startsWith('pocao-')) return `src/arte/pocoes/${nome.slice(6)}.webp`;
  return `src/arte/texturas/${nome}.webp`;
}

/** Nome da garrafinha da pagina (cor, tomo): src/arte/pocoes/<essencia>-0<tomo+1>.webp (tools/processar-arte.mjs). */
export const nomePocaoArte = (cor, tomo) => `pocao-${ESSENCIAS[cor].chave}-${dois(tomo + 1)}`;

export function criarArte() {
  /** @type {Map<string, HTMLImageElement|null>} */
  const imgs = new Map();
  /** @type {Map<string, Promise<HTMLImageElement|null>>} */
  const pedidos = new Map();
  /** @param {string} nome */
  const um = (nome) => {
    let p = pedidos.get(nome);
    if (!p) {
      p = new Promise((ok) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => { imgs.set(nome, im); ok(im); };
        im.onerror = () => { imgs.set(nome, null); ok(null); };
        im.src = caminho(nome);
      });
      pedidos.set(nome, p);
    }
    return p;
  };
  return {
    /**
     * @param {string[]} nomes
     * @param {(f: number) => void} [progresso]
     */
    async carregar(nomes, progresso) {
      let feitos = 0;
      await Promise.all(nomes.map((n) => um(n).then(() => { feitos++; if (progresso) progresso(feitos / nomes.length); })));
    },
    /** @param {string} nome */
    img: (nome) => imgs.get(nome) || null,
    /** @param {string} nome */
    pedir: (nome) => { um(nome); return imgs.get(nome) || null; },
    caminho,
  };
}

/** Lista do primeiro quadro. @param {number} cenario @param {boolean} retrato */
export function listaInicial(cenario, retrato) {
  return [
    `cenario-${CENARIOS[cenario]}-${retrato ? 'retrato' : 'paisagem'}`,
    ...Array.from({ length: 9 }, (_, i) => `gato-${dois(i + 1)}`),
    ...[1, 2, 3, 4, 7, 8, 9].map((i) => `icone-${dois(i)}`),
    'madeira',
  ];
}

/** O resto (depois do primeiro quadro). */
export function listaResto() {
  const l = [];
  for (const c of CENARIOS) for (const o of ['retrato', 'paisagem']) l.push(`cenario-${c}-${o}`);
  for (let cor = 0; cor < ESSENCIAS.length; cor++) for (let t = 0; t < 5; t++) l.push(nomePocaoArte(cor, t));
  for (const e of ENFEITES_ARQ) l.push(`enfeite-${e}`);
  l.push('papel', 'icone-05', 'icone-06');
  return l;
}
