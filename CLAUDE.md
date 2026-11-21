# CLAUDE.md

Orientação para o Claude Code neste repositório.

## O que é

**Purr & Pour** (slug interno `potion-pour`): puzzle de sort de líquidos num laboratório de alquimia. Você despeja
camadas entre frascos até cada um ter uma cor só; cada frasco pronto vira uma poção com nome engraçado que voa para
o Grimório (60 poções em 5 tomos), e o gato Miso dá dica sozinho quando você não progride. Jogo original do estúdio
(nome, tema, personagens e arte próprios) para Poki, CrazyGames, californiagames.io e Y8, a partir do kit multiportal
(`../distribuicao/kit`, ver o README de lá). Catálogo no cofre: `../Nettools Games/Jogos/potion-pour.md`.
O nome provisório "Potion Pour" colidiu com um jogo do mesmo gênero (Playgama, 2026): o título público é
**Purr & Pour**; pasta, porta e prefixo continuam `potion-pour`.

## Rodar e testar

- `npm run servir` → http://127.0.0.1:5470/ (a PlataformaSDK em modo autônomo, anúncios simulados).
  Parâmetros só em localhost: `?novo`, `?fase=N`, `?semente=N`, `?auto`, `?filme=30`, `?semanuncio`, `?lang=pt|en|es`, `?limpo`, `?debug`,
  e os do jogo: `?grimorio` (abre o Grimório), `?pocoes=N` (finge N poções descobertas, para prints).
- `npm test`: regras, solver, gerador, bot (conclusão ≥ 82% por fase), Grimório, portais e as fronteiras do código.
- `npm run medir`: o bot joga as fases 1–60 em ritmo humano e mostra tempo por fase, novidades e poções no tempo.
- `npm run empacotar` (5 alvos: poki, crazygames, crazygames-basic, californiagames, y8) e `npm run verificar`; prova do California: de `../distribuicao`,
  `node ferramentas/provar.mjs potion-pour`.

## Arquitetura

- `src/main.js`: único módulo que toca portal, DOM, áudio e salvamento. Ciclo do portal como no kit.
- `src/jogo/`: lógica pura e determinística (sem DOM, relógio nem `Math.random`):
  `regras.js` (estado, despejo, poção, oculta, rolha, gelo, caldeirão), `solver.js` (DFS para dica e validação,
  A* para o mínimo de jogadas), `gerador.js` (parâmetros por fase e fases com solução garantida), `bot.js`
  (jogador razoável com informação limitada), `grimorio.js` (60 poções, tomos, enfeites, Poção do Dia),
  `gato.js` (quando e o que o Miso sugere), `essencias.js` (as 12 cores).
- `src/render/`: desenho (prateleira, frascos, líquido ondulante, despejo, gato, HUD, Grimório).
- `src/som/`: sons sintetizados. `src/i18n/textos.js` e `src/i18n/pocoes.js`: pt, en, es.
- `src/core/`: kit (não mexer sem motivo; correções voltam para `../distribuicao/kit`).
- `src/arte/`: arte processada (WebP). `arte/bruto/`: originais do Grok (fora do build). `docs/autoria.md`: prompts.

## Regras

- Código, comentários e docs em português; comentários ASCII em `src/jogo/`.
- Nenhum anúncio antes da fase 8 e de 3 min de jogo; intervalo só na troca de fase; premiado só no 2º frasco
  extra, por escolha, num painel fora do jogo ativo, com "Recomeçar a fase" grátis do mesmo tamanho.
- Y8: intersticial só depois do clique em "Continuar ▶" (`#btSeguir`, ≥ 180 s desde o anterior); `blur` pausa.
  Os ids do painel da Y8 vão em `package.json` → `kit.ids.y8` (sem eles o zip sai `-sem-id`, só para teste).
- Armazenamento só com o prefixo `potionpour.`; nunca `clear()`.
- Sons de acerto sem "catraca" (pedido do usuário): nada de cliques rápidos em sequência; acorde ou notas a ≥ 120 ms
  (`test/sons.test.js`).
- Toda arte nova pelo `tools/grok.mjs` com o bloco de estilo do `docs/GDD.md`; conferir a olho antes de usar.
- Não fazer commit sem o usuário pedir.
- Registrar atividade no cofre: linha em `Atividades/AAAA-MM-DD.md` e histórico em `Jogos/potion-pour.md`.
