// As 12 essencias (cores dos liquidos), na ordem em que aparecem no jogo. O nome de cada uma fica em
// src/i18n/pocoes.js. Cada cor tem um simbolo desenhado na camada (ajuda quem nao distingue cores).
// Puro e ASCII.

/** @typedef {{ id: number, chave: string, cor: string, clara: string, escura: string, simbolo: string }} Essencia */

/** @type {Essencia[]} */
export const ESSENCIAS = [
  { id: 0, chave: 'dragao', cor: '#ef3e4a', clara: '#ff8a8f', escura: '#a3162a', simbolo: 'chama' },
  { id: 1, chave: 'sereia', cor: '#3b7bff', clara: '#8fb4ff', escura: '#1b3fa8', simbolo: 'gota' },
  { id: 2, chave: 'fada', cor: '#ffcb2e', clara: '#ffe68a', escura: '#c98a00', simbolo: 'sol' },
  { id: 3, chave: 'sapo', cor: '#3cc45a', clara: '#8ee89d', escura: '#1d7a34', simbolo: 'folha' },
  { id: 4, chave: 'bruxa', cor: '#9d4dff', clara: '#c79bff', escura: '#5b1fb0', simbolo: 'estrela' },
  { id: 5, chave: 'abobora', cor: '#ff8a26', clara: '#ffbe80', escura: '#b5520a', simbolo: 'lua' },
  { id: 6, chave: 'unicornio', cor: '#ff6db8', clara: '#ffb0d9', escura: '#c02f7c', simbolo: 'coracao' },
  { id: 7, chave: 'lagoa', cor: '#22d3cf', clara: '#8ff0ed', escura: '#0d8986', simbolo: 'onda' },
  { id: 8, chave: 'nuvem', cor: '#f4f1ff', clara: '#ffffff', escura: '#b9b2d9', simbolo: 'nuvem' },
  { id: 9, chave: 'troll', cor: '#8c5a3a', clara: '#c28c66', escura: '#55321d', simbolo: 'losango' },
  { id: 10, chave: 'cacto', cor: '#b6ee34', clara: '#dcff8f', escura: '#6f9c0a', simbolo: 'raio' },
  { id: 11, chave: 'corvo', cor: '#4c4560', clara: '#8a82a3', escura: '#26213a', simbolo: 'espiral' },
];

export const NUM_ESSENCIAS = ESSENCIAS.length;
