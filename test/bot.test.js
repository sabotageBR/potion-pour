// Meta de conclusao do GDD: o bot "jogador razoavel" (src/jogo/bot.js: ve so o que o jogador ve, usa o
// desfazer e o frasco extra gratis, segue a dica automatica do gato) conclui >= 82% das sementes em toda
// fase de 1 a 60. Sem a dica do gato, a media continua alta (a dica e rede de seguranca, nao muleta).
import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarFase } from '../src/jogo/gerador.js';
import { jogarFase } from '../src/jogo/bot.js';
import { criarRng } from '../src/core/rng.js';

const SEMENTES = 25;
const FASES = 60;

test(`bot conclui >= 82% em cada fase 1..${FASES} (${SEMENTES} sementes, com a dica do gato)`, () => {
  const ruins = [];
  for (let n = 1; n <= FASES; n++) {
    let ok = 0;
    for (let s = 1; s <= SEMENTES; s++) if (jogarFase(gerarFase(n, s), criarRng(s * 31 + n), { gato: 0.7 }).concluiu) ok++;
    if (ok / SEMENTES < 0.82) ruins.push(`fase ${n}: ${Math.round((ok / SEMENTES) * 100)}%`);
  }
  assert.deepEqual(ruins, []);
});

test('sem a dica do gato o bot ainda conclui >= 85% na media das fases 1..30', () => {
  let ok = 0;
  let total = 0;
  for (let n = 1; n <= 30; n++) {
    for (let s = 1; s <= 10; s++) {
      total++;
      if (jogarFase(gerarFase(n, s + 100), criarRng(s * 17 + n), { gato: 0 }).concluiu) ok++;
    }
  }
  assert.ok(ok / total >= 0.85, `media ${(ok / total).toFixed(2)}`);
});

test('a semente do jogo (7): cada fase 1..60 com >= 82% do bot (a fase que o jogador ve de verdade)', () => {
  const ruins = [];
  for (let n = 1; n <= FASES; n++) {
    const F = gerarFase(n, 7);
    let ok = 0;
    for (let b = 1; b <= 20; b++) if (jogarFase(F, criarRng(b * 101 + n), { gato: 0.7 }).concluiu) ok++;
    if (ok / 20 < 0.82) ruins.push(`fase ${n}: ${ok * 5}%`);
  }
  assert.deepEqual(ruins, []);
});
