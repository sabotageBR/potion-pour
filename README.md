# Purr & Pour

Puzzle de despejar poções num laboratório de alquimia (sort de líquidos). Toque num frasco e depois noutro: a
camada de cima escorre para o destino se ele estiver vazio ou com a mesma cor no topo. Frasco com as 4 camadas de
uma cor vira poção, ganha rolha e voa para o **Grimório** (60 poções com nomes engraçados em 5 tomos). O gato
**Miso** dá dica sozinho quando você não progride. Camadas ocultas, rolhas, gelo e caldeirão aparecem ao longo
das fases; a Poção do Dia carimba um selo por dia.

Jogo original do estúdio para Poki, CrazyGames, californiagames.io e Y8, feito a partir do kit multiportal
(`../distribuicao/kit`). Slug interno `potion-pour`. Design em `docs/GDD.md`, arte em `docs/autoria.md`,
orientação para o Claude Code em `CLAUDE.md`.

```bash
npm run servir      # http://127.0.0.1:5470/
npm test            # regras, solver, gerador, bot (>= 82% por fase), portais e fronteiras do código
npm run medir       # ritmo da sessão medido pelo bot
npm run empacotar   # poki, crazygames, crazygames-basic, californiagames, y8
npm run verificar
node tools/processar-arte.mjs   # arte/bruto (Grok) -> src/arte (WebP)
```
