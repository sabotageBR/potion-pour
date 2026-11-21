#!/usr/bin/env node
// Mede o ritmo da sessao com o bot "jogador razoavel" (src/jogo/bot.js) em ritmo humano: quanto tempo
// cada fase leva, quando chega cada novidade (mecanica, essencia, tomo, enfeite) e quantas pocoes do
// Grimorio saem por minuto. Modelo de tempo (s): despejo = animacao 0,7 + pensar 0,8 + 0,06 por cor;
// desfazer 1,0; dica lida 1,5; festa e entrada da fase seguinte 2,3. Fase nao concluida = o jogador
// recomeca (outra semente de bot), ate 3 vezes.
// Uso: node tools/medir.mjs [fases=60] [semente=7] [--sementes=5]
import { gerarFase, coresConhecidas } from '../src/jogo/gerador.js';
import { jogarFase } from '../src/jogo/bot.js';
import { criarRng } from '../src/core/rng.js';
import * as grim from '../src/jogo/grimorio.js';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const FASES = Number(args[0] || 60);
const SEMENTE = Number(args[1] || 7);
const NS = Number((process.argv.find((a) => a.startsWith('--sementes=')) || '=5').split('=')[1]);

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** Uma sessao inteira com o RNG do bot b. */
function sessao(b) {
  const G = grim.novoGrimorio();
  let t = 0;
  /** @type {{ t: number, o: string }[]} */
  const novidades = [];
  /** @type {{ fase: number, t: number, dur: number, desp: number, tent: number }[]} */
  const fases = [];
  /** @type {number[]} */
  const pocoes = [];
  for (let n = 1; n <= FASES; n++) {
    const F = gerarFase(n, SEMENTE);
    if (F.param.estreia) novidades.push({ t, o: `mecanica ${F.param.estreia}` });
    if (n > 1 && coresConhecidas(n) > coresConhecidas(n - 1)) novidades.push({ t, o: `essencia ${coresConhecidas(n) - 1}` });
    if (F.param.cenario !== gerarFase(Math.max(1, n - 1), SEMENTE).param.cenario) novidades.push({ t, o: `cenario ${F.param.cenario}` });
    const ini = t;
    let tent = 0;
    let desp = 0;
    for (;;) {
      tent++;
      const r = jogarFase(F, criarRng(b * 7919 + n * 31 + tent), { gato: 0.7 });
      const porJogada = 0.7 + 0.8 + 0.06 * F.param.cores;
      t += r.despejos * porJogada + r.desfeitos * 1.0 + r.dicas * 1.5;
      desp += r.despejos;
      if (r.concluiu || tent >= 3) break;
    }
    // pocoes da fase (todas as cores)
    for (const cor of F.coresDaFase) {
      const res = grim.registrar(G, cor, n);
      if (res.nova) { pocoes.push(t); novidades.push({ t, o: `pocao ${cor}-${res.nova.tomo}` }); }
      if (res.enfeite >= 0) novidades.push({ t, o: `enfeite ${res.enfeite}` });
    }
    t += 2.3;
    fases.push({ fase: n, t: ini, dur: t - ini, desp, tent });
  }
  return { t, fases, novidades, pocoes, G };
}

const sessoes = Array.from({ length: NS }, (_, i) => sessao(i + 1));
const media = (f) => sessoes.reduce((s, x) => s + f(x), 0) / NS;

console.log(`Purr & Pour: ritmo medido pelo bot (${NS} sessoes, semente de fase ${SEMENTE})\n`);
console.log('fase  inicio  duracao  despejos  tentativas');
for (let i = 0; i < FASES; i++) {
  const ini = media((s) => s.fases[i].t);
  const dur = media((s) => s.fases[i].dur);
  const desp = media((s) => s.fases[i].desp);
  const tent = media((s) => s.fases[i].tent);
  if (i < 30 || i % 5 === 4) console.log(`${String(i + 1).padStart(4)}  ${mmss(ini).padStart(6)}  ${mmss(dur).padStart(7)}  ${desp.toFixed(1).padStart(8)}  ${tent.toFixed(2).padStart(10)}`);
}
const S = sessoes[0];
// maior intervalo sem novidade (mecanica, essencia, cenario, pocao nova ou enfeite) nos primeiros 15 min
const marcos = [0, ...S.novidades.map((x) => x.t).filter((x) => x <= 900), Math.min(900, S.t)].sort((a, b) => a - b);
let maiorBuraco = 0;
for (let i = 1; i < marcos.length; i++) maiorBuraco = Math.max(maiorBuraco, marcos[i] - marcos[i - 1]);
const mec = S.novidades.filter((x) => /mecanica|cenario|essencia/.test(x.o));
console.log('\nnovidades grandes (sessao 1):');
for (const m of mec.filter((x) => x.t < 1500)) console.log(`  ${mmss(m.t).padStart(6)}  ${m.o}`);
const ate = (min) => media((s) => s.pocoes.filter((x) => x <= min * 60).length);
const faseEm = (min) => media((s) => s.fases.filter((f) => f.t <= min * 60).length);
console.log(`\npocoes do Grimorio: ${ate(1).toFixed(1)} no 1o min, ${ate(3).toFixed(1)} em 3 min, ${ate(5).toFixed(1)} em 5, ${ate(10).toFixed(1)} em 10, ${ate(20).toFixed(1)} em 20, ${ate(30).toFixed(1)} em 30`);
console.log(`fase alcancada: ${faseEm(3).toFixed(1)} em 3 min, ${faseEm(5).toFixed(1)} em 5, ${faseEm(10).toFixed(1)} em 10, ${faseEm(20).toFixed(1)} em 20`);
console.log(`maior intervalo sem nenhuma novidade nos primeiros 15 min: ${mmss(maiorBuraco)}`);
console.log(`primeira pocao em ${mmss(S.pocoes[0])}; ${FASES} fases em ${mmss(media((s) => s.t))}; Grimorio com ${media((s) => grim.total(s.G)).toFixed(0)}/60 no fim`);
