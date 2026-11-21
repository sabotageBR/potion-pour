// Logica pura do Purr & Pour: regras do despejo e das mecanicas, solver, gerador, partida (desfazer e
// frasco extra), Grimorio e o gato-ajudante.
import test from 'node:test';
import assert from 'node:assert/strict';
import { criarEstado, despejar, quantidade, completa, chave, ordem, conferir, comExtra, presas, geloFalta, fechado } from '../src/jogo/regras.js';
import { resolver, minimo, dica } from '../src/jogo/solver.js';
import { gerarFase, parametros, coresConhecidas, OCULTA_DESDE, ROLHA_DESDE, GELO_DESDE, CALDEIRAO_DESDE } from '../src/jogo/gerador.js';
import { criarPartida, jogar, desfazer, usarExtra, recomecar, DESFAZER_POR_FASE } from '../src/jogo/partida.js';
import * as grim from '../src/jogo/grimorio.js';
import { motivo, sugerir, LIMITE_SEM_MELHORA } from '../src/jogo/gato.js';

const R = 0, A = 1, Y = 2, V = 3;

test('despejo: vazio ou mesma cor no topo, ate onde cabe; cor diferente nao', () => {
  const E = criarEstado([{ c: [R, A, A] }, { c: [A] }, { c: [] }, { c: [R] }]);
  assert.equal(quantidade(E, 0, 1), 2, 'as duas azuis descem juntas');
  assert.equal(quantidade(E, 0, 2), 2, 'no vazio');
  assert.equal(quantidade(E, 0, 3), 0, 'azul sobre vermelho nao');
  const cheio = criarEstado([{ c: [A, A] }, { c: [R, A, A, A] }]);
  assert.equal(quantidade(cheio, 0, 1), 0, 'destino cheio');
  const meio = criarEstado([{ c: [R, A, A] }, { c: [Y, Y, A] }]);
  assert.equal(quantidade(meio, 0, 1), 1, 'so cabe uma');
  const d = despejar(meio, 0, 1);
  assert.ok(d);
  assert.deepEqual(d.E.c[0], [R, A]);
  assert.deepEqual(d.E.c[1], [Y, Y, A, A]);
  assert.deepEqual(meio.c[0], [R, A, A], 'o estado de origem nao muda');
});

test('pocao: 4 camadas de uma cor selam o vaso; fase completa com todas as cores', () => {
  const E = criarEstado([{ c: [R, R, R, A] }, { c: [A, A, A, R] }, { c: [] }]);
  assert.equal(conferir(E), '');
  let d = despejar(E, 0, 2);
  d = despejar(d.E, 1, 0);
  assert.deepEqual(d.r.prontos, [0]);
  assert.equal(d.E.pronto[0], R);
  assert.equal(quantidade(d.E, 0, 2), 0, 'pocao pronta nao sai');
  assert.equal(quantidade(d.E, 2, 0), 0, 'nem entra');
  d = despejar(d.E, 2, 1);
  assert.ok(completa(d.E));
});

test('camada oculta aparece quando vira topo e anda junto com a cor', () => {
  const E = criarEstado([{ c: [R, A, Y], o: [true, true, false] }, { c: [] }, { c: [] }]);
  assert.deepEqual(E.o[0], [true, true, false]);
  const d = despejar(E, 0, 1);
  assert.deepEqual(d.E.o[0], [true, false], 'o azul apareceu');
  assert.equal(d.r.revelados, 1);
});

test('rolha: nada entra nem sai ate a pocao da cor ficar pronta', () => {
  const E = criarEstado([{ c: [Y, Y], rolha: R }, { c: [R, R, R] }, { c: [R, Y, Y] }, { c: [] }]);
  assert.ok(fechado(E, 0));
  assert.equal(quantidade(E, 0, 3), 0);
  assert.equal(quantidade(E, 2, 0), 0);
  let d = despejar(E, 2, 3);
  d = despejar(d.E, 2, 1);
  assert.equal(d.E.pronto[1], R);
  assert.ok(!fechado(d.E, 0), 'a rolha saltou');
  assert.equal(quantidade(d.E, 3, 0), 2);
});

test('gelo: prende as camadas de baixo e derrete depois de N despejos (qualquer frasco)', () => {
  const E = criarEstado([{ c: [R, A, Y], geloK: 2, geloAte: 2 }, { c: [] }, { c: [V] }, { c: [] }]);
  assert.equal(presas(E, 0), 2);
  let d = despejar(E, 0, 1);
  assert.equal(quantidade(d.E, 0, 3), 0, 'topo e gelo: nada sai');
  assert.equal(geloFalta(d.E, 0), 1);
  d = despejar(d.E, 2, 3);
  assert.deepEqual(d.r.gelos, [0], 'derreteu neste despejo');
  assert.equal(quantidade(d.E, 0, 1), 0, 'azul sobre amarelo nao');
  assert.equal(quantidade(d.E, 0, 2), 1, 'agora sai');
});

test('caldeirao: cabe 6 e vira pocao com as 4 da cor', () => {
  const K = criarEstado([{ c: [Y, Y, Y, R], caldeirao: true }, { c: [R, R] }, { c: [Y] }]);
  assert.equal(K.def[0].cap, 6);
  assert.equal(quantidade(K, 1, 0), 2, 'cabem 6 camadas');
  const C = criarEstado([{ c: [R, A, A] }, { c: [R, A, A] }, { c: [], caldeirao: true }, { c: [R, R] }]);
  let d = despejar(C, 0, 2);
  assert.equal(d.E.pronto[2], -1);
  d = despejar(d.E, 1, 2);
  assert.equal(d.E.pronto[2], A, '4 azuis no caldeirao = pocao');
  assert.deepEqual(d.r.prontos, [2]);
});

test('chave canonica: vasos iguais em outra ordem dao a mesma chave; ordem() e cota inferior', () => {
  const a = criarEstado([{ c: [R, A] }, { c: [A, R] }, { c: [] }]);
  const b = criarEstado([{ c: [] }, { c: [A, R] }, { c: [R, A] }]);
  assert.equal(chave(a), chave(b));
  const F = gerarFase(12, 3);
  const E = criarEstado(F.vasos);
  assert.ok(ordem(E) <= minimo(E).jogadas);
});

test('solver: fase 1 em 3 jogadas; dica acha o beco', () => {
  const F = gerarFase(1, 1);
  const E = criarEstado(F.vasos);
  const m = minimo(E);
  assert.ok(m.exato);
  assert.equal(m.jogadas, 3);
  assert.equal(resolver(E).length >= 3, true);
  // beco: tudo cheio e nenhuma jogada
  const beco = criarEstado([{ c: [R, A, R, A] }, { c: [A, R, A, R] }]);
  assert.equal(resolver(beco), null);
  assert.equal(dica(beco).semSaida, true);
});

test('gerador: deterministico, sempre com solucao e cada cor com 4 camadas (fases 1 a 70)', () => {
  assert.deepEqual(gerarFase(9, 5).vasos, gerarFase(9, 5).vasos);
  for (let n = 1; n <= 70; n++) {
    for (const s of [1, 7]) {
      const F = gerarFase(n, s);
      const E = criarEstado(F.vasos);
      assert.equal(conferir(E), '', `fase ${n}`);
      assert.ok(resolver(E, { teto: 300000 }), `fase ${n} semente ${s} sem solucao`);
      assert.ok(F.minimo > 0);
    }
  }
});

test('gerador: estreias nas fases certas e uma novidade cedo (antes da fase 5)', () => {
  assert.equal(parametros(OCULTA_DESDE).estreia, 'oculta');
  assert.equal(parametros(ROLHA_DESDE).estreia, 'rolha');
  assert.equal(parametros(GELO_DESDE).estreia, 'gelo');
  assert.equal(parametros(CALDEIRAO_DESDE).estreia, 'caldeirao');
  assert.ok(OCULTA_DESDE <= 4);
  assert.equal(coresConhecidas(1), 2);
  assert.equal(coresConhecidas(40), 12);
  const F = gerarFase(GELO_DESDE, 2);
  assert.ok(F.vasos.some((v) => v.geloK), 'a estreia do gelo tem gelo');
});

test('partida: desfazer limitado, nao passa da pocao; frasco extra; recomecar', () => {
  const P = criarPartida(gerarFase(1, 1));
  jogar(P, 0, 2);
  assert.ok(desfazer(P));
  assert.equal(P.desfazerRestam, DESFAZER_POR_FASE - 1);
  jogar(P, 0, 2);
  jogar(P, 1, 0); // pocao vermelha
  assert.equal(P.hist.length, 0, 'pocao pronta apaga o historico');
  assert.equal(desfazer(P), false);
  const n = P.E.c.length;
  assert.ok(usarExtra(P));
  assert.equal(P.E.c.length, n + 1);
  recomecar(P);
  assert.equal(P.E.c.length, n + 1, 'o extra fica');
  assert.equal(P.E.pronto.filter((x) => x >= 0).length, 0);
});

test('grimorio: 60 pocoes; tomo abre com a fase; paginas nas 1a, 3a, 6a, 10a e 15a pocoes da cor', () => {
  const G = grim.novoGrimorio();
  assert.equal(grim.TOTAL_POCOES, 60);
  let r = grim.registrar(G, R, 1);
  assert.deepEqual(r.nova, { cor: R, tomo: 0 });
  r = grim.registrar(G, R, 1);
  r = grim.registrar(G, R, 1);
  assert.equal(r.nova, null, 'tomo II fechado na fase 1');
  r = grim.registrar(G, R, OCULTA_DESDE);
  assert.deepEqual(r.nova, { cor: R, tomo: 1 }, 'na fase 4 a 4a pocao abre a pagina II');
  // ate o fim
  let novas = 2;
  for (let k = 0; k < 400; k++) for (let c = 0; c < 12; c++) if (grim.registrar(G, c, 99).nova) novas++;
  assert.equal(grim.total(G), 60);
  assert.equal(novas, 60);
  assert.equal(grim.enfeites(G), grim.ENFEITES);
  assert.equal(grim.proxima(G, 99, 12), null);
});

test('grimorio: enfeite a cada 4 pocoes; proxima pocao; Pocao do Dia uma vez por dia', () => {
  const G = grim.novoGrimorio();
  let enfeite = -1;
  for (let c = 0; c < 4; c++) enfeite = grim.registrar(G, c, 1).enfeite;
  assert.equal(enfeite, 0);
  const px = grim.proxima(G, 1, 6);
  assert.deepEqual(px, { cor: 4, tomo: 0, feitas: 0, req: 1 });
  const cor = grim.corDoDia(G, '2026-11-20', [0, 3, 5]);
  assert.ok([0, 3, 5].includes(cor));
  assert.ok(grim.carimbar(G, '2026-11-20'));
  assert.equal(grim.carimbar(G, '2026-11-20'), false);
  assert.equal(grim.corDoDia(G, '2026-11-20', [0, 3, 5]), -1);
  assert.equal(G.selos, 1);
  const lido = grim.lerGrimorio(JSON.parse(JSON.stringify(G)));
  assert.deepEqual(lido, G);
  assert.deepEqual(grim.lerGrimorio('lixo'), grim.novoGrimorio());
});

test('gato: ajuda por ciclo, sem progresso, sem saida e parado; a sugestao e uma jogada valida', () => {
  const P = criarPartida(gerarFase(10, 4));
  assert.equal(motivo(P, 0), null);
  assert.equal(motivo(P, 30), 'parado');
  const a = sugerir(P, 'parado');
  assert.equal(a.acao, 'jogar');
  assert.ok(a.jogada && quantidade(P.E, a.jogada[0], a.jogada[1]) > 0);
  P.semMelhora = LIMITE_SEM_MELHORA;
  assert.equal(motivo(P, 0), 'sem-progresso');
  P.semMelhora = 0;
  P.ciclo = true;
  assert.equal(motivo(P, 0), 'ciclo');
  // beco com historico: o gato manda desfazer
  const Q = criarPartida({ fase: 5, semente: 1, param: parametros(5), vasos: [{ c: [R, A, A, A] }, { c: [A, R, R] }, { c: [R] }], minimo: 3, exato: true, coresDaFase: [R, A] });
  jogar(Q, 2, 1); // R sobre R: [A,R,R,R] e o vaso 2 vazio... ainda ha saida
  assert.notEqual(sugerir(Q, 'parado').acao, 'recomecar');
  const beco = criarPartida({ fase: 5, semente: 1, param: parametros(5), vasos: [{ c: [R, A, R, A] }, { c: [A, R, A, R] }], minimo: 0, exato: false, coresDaFase: [R, A] });
  assert.equal(motivo(beco, 0), 'sem-saida');
  assert.equal(sugerir(beco, 'sem-saida').acao, 'extra');
  const extra = comExtra(beco.E);
  assert.equal(extra.c.length, 3);
});
