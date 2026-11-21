#!/usr/bin/env node
// Processa a arte bruta do Grok (arte/bruto/) para o jogo (src/arte/, WebP), sempre do mesmo jeito:
// cenarios reduzidos, sprites recortados (sprite.mjs --separar), 5 garrafinhas escolhidas por essencia
// (uma por tomo do Grimorio), enfeites, tabua de madeira e papel do Grimorio.
// Uso: node tools/processar-arte.mjs
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const B = (n) => join(RAIZ, 'arte/bruto', n);
const S = (n) => join(RAIZ, 'src/arte', n);
const TMP = join(RAIZ, '.tmp/processar');

function sprite(...a) {
  const r = spawnSync('node', [join(RAIZ, 'tools/sprite.mjs'), ...a], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`sprite.mjs ${a.join(' ')}: ${r.stderr}`);
  return r.stdout.trim().split('\n').at(-1);
}
function ffmpeg(...a) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...a], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
}

/** Garrafinha escolhida por essencia para os tomos I..V (indice na folha recortada, ordem de leitura). */
export const ESCOLHA_POCOES = {
  dragao: [1, 2, 4, 5, 6],
  sereia: [1, 2, 7, 8, 3],
  fada: [1, 2, 7, 8, 3],
  sapo: [1, 2, 4, 5, 3],
  bruxa: [1, 2, 7, 8, 4],
  abobora: [1, 2, 9, 11, 3],
  unicornio: [1, 2, 9, 11, 3],
  lagoa: [1, 2, 7, 8, 4],
  nuvem: [1, 2, 6, 8, 4],
  troll: [1, 2, 9, 11, 7],
  cacto: [1, 2, 9, 10, 3],
  corvo: [1, 2, 7, 8, 3],
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

// cenarios (retrato 720x1280, paisagem 1280x720)
mkdirSync(S('cenarios'), { recursive: true });
for (const c of ['torre', 'porao', 'estufa']) {
  for (const o of ['retrato', 'paisagem']) {
    sprite('reduzir', B(`cenario-${c}-${o}.jpg`), S(`cenarios/${c}-${o}.webp`), '--q=78');
  }
}

// gato (fundo verde; tolerancia baixa para nao comer o cachecol turquesa) e icones (magenta)
rmSync(S('gato'), { recursive: true, force: true });
console.log('gato', sprite('recortar', B('gato-poses.jpg'), `${S('gato')}/`, '--separar', '--nome=gato', '--largura=256', '--ext=webp', '--tol=0.10', '--suave=0.06'));
rmSync(S('icones'), { recursive: true, force: true });
console.log('icones', sprite('recortar', B('icones.jpg'), `${S('icones')}/`, '--separar', '--nome=icone', '--largura=160', '--ext=webp'));

// enfeites (duas folhas de 9)
rmSync(S('enfeites'), { recursive: true, force: true });
for (const k of ['a', 'b']) console.log(`enfeites-${k}`, sprite('recortar', B(`enfeites-${k}.jpg`), `${S('enfeites')}/`, '--separar', `--nome=enfeite-${k}`, '--largura=128', '--ext=webp', '--tol=0.12', '--suave=0.06'));

// pocoes: recorta cada folha e copia as 5 escolhidas como <essencia>-01..05
rmSync(S('pocoes'), { recursive: true, force: true });
mkdirSync(S('pocoes'), { recursive: true });
for (const [k, idx] of Object.entries(ESCOLHA_POCOES)) {
  const d = join(TMP, k);
  const fundoVerde = k === 'bruxa' || k === 'unicornio';
  console.log(`pocoes-${k}`, sprite('recortar', B(`pocoes-${k}.jpg`), `${d}/`, '--separar', `--nome=${k}`, '--largura=128', '--ext=webp', '--tol=0.12', '--suave=0.06', ...(fundoVerde ? [] : [])));
  const n = readdirSync(d).length;
  idx.forEach((i, tomo) => {
    if (i > n) throw new Error(`${k}: a folha tem ${n} garrafas, pedi a ${i}`);
    cpSync(join(d, `${k}-${String(i).padStart(2, '0')}.webp`), S(`pocoes/${k}-${String(tomo + 1).padStart(2, '0')}.webp`));
  });
}

// texturas: uma tabua (faixa do meio da folha de madeira) sem emenda, e o papel do Grimorio inteiro
mkdirSync(S('texturas'), { recursive: true });
ffmpeg('-i', B('textura-madeira.jpg'), '-vf', 'crop=1024:176:0:396', join(TMP, 'tabua.png'));
sprite('costurar', join(TMP, 'tabua.png'), S('texturas/madeira.webp'), '--banda=0.2');
sprite('reduzir', B('textura-papel.jpg'), S('texturas/papel.webp'), '--largura=640', '--q=76');

if (!existsSync(S('texturas/madeira.webp'))) throw new Error('faltou a madeira');
console.log('ok');
