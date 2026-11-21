// Sons de acerto sem "catraca": nada de cliques rapidos em sequencia tocando junto (pedido do usuario,
// 2026-11-20). Criterio: dois ataques seguidos do mesmo som ou se fundem (< 25 ms, um acorde) ou ficam
// bem separados (>= 120 ms, notas distintas). Entre 25 e 120 ms o ouvido escuta tique-tique / trrr.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SONS } from '../src/som/sons.js';

/** Contexto de audio falso: so anota quando cada fonte comeca. */
function ctxFalso() {
  const inicios = [];
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
  });
  const no = () => ({ connect() {} });
  const ctx = {
    sampleRate: 8000,
    currentTime: 0,
    createOscillator: () => ({ ...no(), type: 'sine', frequency: param(), setPeriodicWave() {}, start: (t) => inicios.push(t), stop() {} }),
    createGain: () => ({ ...no(), gain: param() }),
    createBiquadFilter: () => ({ ...no(), type: 'lowpass', frequency: param(), Q: param() }),
    createBufferSource: () => ({ ...no(), buffer: null, loop: false, start: (t) => inicios.push(t), stop() {} }),
    createBuffer: (_c, n) => ({ getChannelData: () => new Float32Array(n) }),
  };
  return { v: { ctx, destino: no(), ruido: /** @type {any} */ ({}) }, inicios };
}

/** @param {number[]} inicios @returns {number[]} intervalos entre ataques distintos */
function intervalos(inicios) {
  const ts = [...inicios].sort((a, b) => a - b);
  const r = [];
  for (let i = 1; i < ts.length; i++) {
    const g = ts[i] - ts[i - 1];
    if (g > 1e-6) r.push(g);
  }
  return r;
}

// os sons que tocam quando a jogada da certo: despejo, gelo soltando, rolha, pocao, pagina nova, fase completa
const CASOS = [];
for (let q = 1; q <= 4; q++) for (const nivel of [0, 0.25, 0.5, 0.75]) CASOS.push(['despejo', { q, nivel }]);
for (let k = 0; k <= 6; k++) CASOS.push(['pocao', { k }]);
CASOS.push(['gelo', {}], ['rolha', {}], ['novaPocao', {}], ['festa', {}]);

test('sons de acerto: sem cliques rapidos em sequencia (catraca)', () => {
  for (const [nome, p] of CASOS) {
    const { v, inicios } = ctxFalso();
    const dur = SONS[nome](v, 1, p);
    assert.ok(dur > 0 && dur < 2, `${nome}: duracao ${dur}`);
    for (const g of intervalos(inicios)) {
      assert.ok(g < 0.025 || g >= 0.12, `${nome} ${JSON.stringify(p)}: ataques a ${(g * 1000).toFixed(0)} ms um do outro`);
    }
    // no maximo 3 toques distintos (acordes contam como um)
    const toques = 1 + intervalos(inicios).filter((g) => g >= 0.025).length;
    assert.ok(toques <= 3, `${nome}: ${toques} toques`);
  }
});

test('todo som tem receita que roda no contexto falso', () => {
  for (const nome of Object.keys(SONS)) {
    const { v } = ctxFalso();
    const dur = SONS[/** @type {keyof typeof SONS} */ (nome)](v, 0, { k: 2, q: 2, nivel: 0.5 });
    assert.ok(Number.isFinite(dur) && dur > 0, nome);
  }
});
