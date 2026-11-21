# Purr & Pour: documento de design

**Título:** Purr & Pour (o mesmo nos três idiomas). **Slug interno:** `potion-pour` (pasta, porta 5470, prefixo
`potionpour.`). **Gênero:** sort de líquidos (da referência Family Sort vem só a mecânica de gênero).
**Plataformas:** Poki, CrazyGames (Full e Basic Launch), californiagames.io e Y8, um código só pelo kit multiportal.
**Orientação:** retrato no celular, paisagem no desktop (o layout se adapta; nada é cortado em 640×360).

## Nome

"Potion Pour", o nome provisório, **colide**: já existe um *Potion Pour* (Niko Games, Playgama, out/2026) do mesmo
gênero e tema, com camadas "?" e frascos congelados. O espaço "potion sort" está lotado (Fizz Sort, Potion Sorting:
Elixir Harvest, Cork & Cauldron, Magic Potion Sort...). Pesquisa de 2026-11-20 (busca na web, Poki, CrazyGames,
App Store): nada com "Purr & Pour", "Purr and Pour" ou "Purr n Pour". O nome junta a ação do jogo (despejar) ao
gato-ajudante, que é a cara do jogo. O slug interno ficou `potion-pour` para não mexer em pastas, porta e notas
que outras sessões já conhecem; o jogador nunca vê o slug.

## O jogo em uma frase

Num laboratório de alquimia, você despeja camadas de líquido entre frascos até cada um ter uma cor só; cada frasco
pronto vira uma poção com nome engraçado que voa para o **Grimório**, e o gato **Miso** ajuda quando você trava.

## Loop

1. Toque (ou clique) num frasco: ele sobe um pouco e brilha.
2. Toque noutro: o frasco de origem inclina e a camada de cima escorre num fio ondulante para o destino.
   - Pode despejar se o destino estiver **vazio** ou com a **mesma cor no topo** e tiver espaço.
   - Vai toda a sequência de mesma cor do topo que couber (2 camadas azuis no topo descem juntas se houver 2 vagas).
   - Toque inválido: o frasco treme, som surdo, nada se perde.
3. Um recipiente com **todas as 4 camadas de uma cor e nada mais** vira **poção**: a rolha estala, o líquido
   borbulha e brilha, e uma garrafinha voa num arco até o Grimório (contador `7/60` pula). Poção pronta não volta
   no desfazer.
4. Todas as cores prontas: festa de 1,8 s sem véu (o gato comemora) e a próxima fase já cai na prateleira.

Sem derrota em nenhum momento: não há limite de jogadas. Travou? Desfazer, frasco extra, dica do gato ou recomeçar.

## Controles

- **Toque / mouse:** tocar origem e destino. Tocar de novo a origem a solta. Arrastar de um frasco a outro também
  funciona (solta em cima do destino).
- **Teclado (desktop):** `1`–`9`, `0`, `-`, `=` escolhem frascos pela ordem; `Z` ou `Backspace` desfaz; `X` frasco
  extra; `H` dica; `G` Grimório; `Esc`, `Espaço` ou `P` pausam.
- Botões da barra: **Desfazer** (com contador, 5 grátis por fase), **Frasco extra** (1 grátis por fase; o 2º por
  vídeo premiado, por escolha), **Dica** (pata do gato, ilimitada, com 6 s de recarga).

## Mecânicas e novidades (uma a cada ~2 min)

| Fase | Tempo (bot, ritmo humano) | Novidade |
|---|---|---|
| 1 | 0:00 | Despejar. Fase roteirizada: 2 cores, 3 frascos; a 1ª poção sai na 2ª jogada (~6 s) e voa para o Grimório. Mão-guia. Miso dorme na prateleira e acorda para comemorar. |
| 2–3 | 0:15 | 3 cores. Frase curta só nas 3 primeiras fases. Na 3, o **Desfazer** acende com a mão-guia. |
| 4 | ~1:10 | **Camada oculta "?"**: só o topo aparece; as de baixo surgem quando viram topo. Abre o **Tomo II (Névoa)**. |
| 5–8 | | Cores novas (cada uma é uma "essência" nova e uma página nova do Grimório). Na 7, **frasco extra** com mão-guia. |
| 9 | ~3:40 | **Frasco com rolha** colorida: fechado até a poção daquela cor ficar pronta. Abre o **Tomo III (Selado)**. |
| 12 | ~5:30 | Laboratório muda: **Porão de Cristais** (2º cenário). Enfeites do laboratório começam a aparecer. |
| 14 | ~6:40 | **Camada congelada**: o gelo prende as camadas de baixo e derrete depois de N despejos (número no gelo). Abre o **Tomo IV (Gelo)**. |
| 18 | ~9:10 | **Caldeirão** de vidro: capacidade 6 (poção pronta com as 4 da cor). Abre o **Tomo V (Caldeirão)**. |
| 22 | ~11:30 | 3º cenário: **Estufa Encantada**. Depois os cenários giram a cada 10 fases. |
| 25+ | | Mistura das mecânicas; até 12 cores (todas por volta da fase 28); fase de respiro a cada 5. |

Novidades menores entre essas: cada **cor nova** ("Nova essência!"), cada **poção nova** (nome engraçado), um
**enfeite** novo no laboratório a cada 4 poções.

### Regras finas

- **Oculta:** cada camada tem a marca `oculta`; vira visível para sempre quando fica no topo do seu frasco.
- **Rolha:** frasco `rolha = cor`; não entra nem sai nada até alguma poção dessa cor ficar pronta (a rolha salta).
- **Gelo:** `gelo = { camadas: k, despejos: n }`: as `k` camadas de baixo estão presas; enquanto houver gelo, se o
  topo do frasco for gelo nada sai (pode entrar por cima, mesma regra de cor). Cada despejo em qualquer frasco
  diminui `n`; em 0 o gelo racha e some. O desfazer devolve o contador.
- **Caldeirão:** capacidade 6; pronto quando tem exatamente as 4 camadas de uma cor.
- **Frasco extra:** um frasco vazio de 4 entra na prateleira (máximo 2 por fase).

## Os 3 primeiros minutos, passo a passo

- **0 s:** sem menu nem splash: a prateleira com 3 frascos já está na tela. Frasco A = [vermelho, vermelho,
  vermelho, azul↑], B = [azul, azul, azul, vermelho↑], C vazio. A mão-guia arrasta de A para C. Frase curta:
  "Toque num frasco e depois noutro".
- **~3 s:** A despeja o azul em C. A mão vai de B para A.
- **~6 s:** B despeja o vermelho em A: **4 vermelhos = poção**. Rolha estala, bolhas, a garrafinha "Elixir do
  Espirro de Dragão" voa para o Grimório (`1/60`), Miso acorda e bate palmas, toast com o nome. **Este é o "uau".**
- **~9 s:** a mão mostra C → B: segunda poção. Festa curta, fase 2 cai na prateleira.
- **0:15–1:00:** fases 2 e 3 (3 cores, 4–5 frascos), mão-guia só se travar; desfazer apresentado na 3.
- **~1:10:** fase 4 traz a camada "?" (novidade 1, antes do minuto 2) e abre o Tomo II no Grimório.
- **1:30–3:00:** cores novas (laranja, roxo), frasco extra na 7, poções novas quase a cada fase. Nenhuma derrota
  possível; o gato dá dica sozinho se o jogador repetir jogadas ou ficar sem jogada útil.

## Gato-ajudante (Miso)

Miso fica no canto da prateleira (retrato: embaixo à esquerda; paisagem: à esquerda). Poses: dormindo, sentado,
apontando, feliz, surpreso, lambendo a pata, bocejando, acenando, pensando. Ele dá a dica **sozinho** quando o
jogador **não progride**, não só quando para:

- **Ciclo:** o estado do tabuleiro repete um estado já visto nesta fase.
- **Sem progresso:** 6 despejos seguidos sem melhorar a melhor "ordem" da fase (menos quebras de cor, ou poção nova).
- **Sem saída:** o solver diz que o estado atual não tem solução → Miso aponta o Desfazer (ou o frasco extra).
- **Parado:** 10 s sem tocar (4 s nas fases 1–3).

A dica é a primeira jogada do solver a partir do estado atual (o gato "sabe" o que há nas camadas ocultas): Miso
aponta e a mão-guia arrasta da origem ao destino. Telemetria `ajuda/<fase>`.

## Gerador e solver

- `src/jogo/regras.js`: estado, despejo, poção pronta, oculta, rolha, gelo, caldeirão, desfazer. Puro.
- `src/jogo/solver.js`: DFS com memória e ordem de jogadas (acha solução rápido, para a dica e para validar) e
  A\* com heurística admissível e teto de nós (número mínimo de jogadas, a medida de dificuldade).
- `src/jogo/gerador.js`: `parametros(fase)` (cores, frascos vazios, ocultas, rolhas, gelo, caldeirão) e
  `gerarFase(fase, semente)`: sorteia 4 candidatos com o RNG da semente+fase (sem frasco pronto, sem 3 iguais
  seguidos), descarta os sem solução, mede cada um pelo mínimo de jogadas (A\*) e por quão traiçoeiro é (nós que o
  DFS guloso gasta), fica com a metade menos traiçoeira e escolhe pelo mínimo (estreia e respiro: o mais curto; o
  resto: o mais longo). A fase 1 é roteirizada. Cores: 2 na fase 1, +1 a cada 3 fases até 10, depois um rodízio
  de 8 a 11 (as 12 essências ficam conhecidas na fase 29); vazios: 2, ou 3 com 10 cores ou mais.
- **Meta de conclusão:** um bot "razoável" (vê só o que o jogador vê, escolhe por heurística com 1 passo de
  previsão, usa o desfazer e o frasco extra grátis, desiste depois de 3× o mínimo + 25 despejos) tem de concluir
  ≥ 82% das sementes em toda fase de 1 a 60 (`test/bot.test.js`, `tools/medir.mjs`).

## Meta longa: o Grimório

- 12 essências (cores), 5 tomos: **I Básico**, **II Névoa**, **III Selado**, **IV Gelo**, **V Caldeirão** = **60
  poções**, cada uma com nome engraçado em pt, en e es e a sua garrafinha (arte Grok).
- O tomo abre quando a mecânica dele aparece. A página (cor, tomo) é descoberta quando, com o tomo aberto, você
  completa a cor pela 1ª, 3ª, 6ª, 10ª e 15ª vez (tomos I a V). 180 poções completadas fecham o livro (~45 a 60
  fases).
- No HUD: botão do livro com `n/60` e, embaixo, a **próxima poção** (silhueta e "2/3").
- **Enfeites:** a cada 4 poções descobertas, um enfeite novo aparece nas prateleiras do fundo (vela, bola de
  cristal, planta, ampulheta, coruja de pedra...), 15 no total.

## Gancho diário (leve, sem FOMO)

**Poção do Dia:** na primeira fase de cada dia (a partir da fase 4, depois do ensino), o frasco com mais camadas da cor do dia tem brilho dourado. Completar aquela cor carimba o dia
no Grimório (selo com a data). Sem sequência que se perde, sem energia, sem segunda moeda. Na volta, o jogo
continua da fase salva e o toast mostra o que falta para a próxima poção.

## Anúncios (só nas pausas naturais)

- **Intervalo comercial:** só na troca de fase, a partir da **fase 8** e com ao menos 3 min de jogo. Nunca em
  botão de navegação (pausa, Grimório, recomeçar). O portal limita a frequência.
- **Y8** (`portal.intervaloSoNoClique`): o intersticial automático é proibido. Depois da festa aparece o botão
  "Continuar ▶" (só quando faz ≥ 180 s de jogo desde o anterior) e o anúncio sai no clique. Perder o foco da
  janela abre a pausa (`portal.pausaNoBlur`).
- **Premiado:** só o **2º frasco extra** da fase, por escolha, num painel fora do jogo ativo (o jogo pausa e manda
  `gameplayStop`): [🎬 Mais um frasco] (roxo) ao lado de [Recomeçar a fase] (grátis, mesmo tamanho). Some sem vídeo
  disponível e na Basic Launch. Prêmio só com `true`.

## Telemetria (kit)

`level/N/start|complete`, `game/toque|mouse`, `tempo/min-N`, `ajuda/<fase>`, e eventos próprios:
`evento/pocao-<cor>-<tomo>/nova`, `evento/novidade-<mecanica>/viu`, `evento/frasco-extra/gratis|video`,
`evento/desfazer/usou`, `evento/grimorio/abriu`, `evento/diaria/carimbo`.

## Telas

- **Jogo** (única tela de verdade): fundo do laboratório, prateleiras com frascos, Miso, HUD (fase, livro `n/60`,
  próxima poção, pausa) e barra de ferramentas.
- **Grimório** (sobre o jogo, pausa o jogo): abas dos 5 tomos, grade de 12 garrafinhas com nome (ou silhueta e "?"
  com o progresso), selos da Poção do Dia.
- **Pausa:** Continuar, Recomeçar a fase, Som.
- **Painel do frasco extra** (premiado), descrito acima.

## Som (WebAudio sintetizado)

Jorro do despejo (um tom liso com ruído filtrado, altura que sobe conforme enche), rolha (pop), acorde de sino da
poção pronta, acorde e nota alta da poção nova no Grimório, miado curto (onda com formante), toque inválido (tunc),
virar página, festa da fase em três acordes, gelo soltando (um estalo).

**Sem catraca (0.1.1, pedido do usuário):** nenhum som de acerto tem cliques rápidos em sequência (tique-tique,
trrr, contagem de moedas). Dois ataques seguidos do mesmo som ou se fundem (< 25 ms, acorde) ou ficam a 120 ms ou
mais (notas distintas); `test/sons.test.js` cobra isso de despejo, gelo, rolha, poção, poção nova e festa.

## Bíblia de arte

**Direção:** livro ilustrado aconchegante, guache pintado à mão, formas gordinhas e arredondadas, contorno escuro
grosso cor de ameixa, luz de vela âmbar vindo do alto à esquerda e contraluz turquesa suave. Fundo escuro (ameixa e
índigo) para os líquidos brilharem. Nada de texto, letras, números, logos ou marca d'água em arte nenhuma.

**Paleta:**

| Papel | Cor |
|---|---|
| Fundo escuro (ameixa → índigo) | `#2b1840` → `#1a1030` |
| Contorno | `#2a1a3a` |
| Madeira | `#a0582c` / sombra `#5e2f1c` |
| Luz de vela | `#ffc46b` |
| Vidro / contraluz | `#7fe0d8` |
| Creme (papel, texto) | `#fff1d6` |
| Ação (laranja do kit) | `#ff8a1f` |

**Essências (líquidos, desenhados no código, com um símbolo cada para daltônicos):**

| # | Essência | Cor | Símbolo |
|---|---|---|---|
| 0 | Fogo de Dragão | `#ef3e4a` | chama |
| 1 | Lágrima de Sereia | `#3b7bff` | gota |
| 2 | Mel de Fada | `#ffcb2e` | sol |
| 3 | Gosma de Sapo | `#3cc45a` | folha |
| 4 | Pó de Bruxa | `#9d4dff` | estrela |
| 5 | Suco de Abóbora | `#ff8a26` | lua |
| 6 | Algodão de Unicórnio | `#ff6db8` | coração |
| 7 | Lagoa Encantada | `#22d3cf` | onda |
| 8 | Chocolate de Troll | `#8c5a3a` | losango |
| 9 | Leite de Nuvem | `#f4f1ff` | nuvem |
| 10 | Suco de Cacto | `#b6ee34` | raio |
| 11 | Fumaça de Corvo | `#4c4560` | espiral |

**Personagem:** Miso, um gato gordinho creme com manchas cor de gengibre, olhos grandes cor de âmbar, chapeuzinho
roxo de mago com uma estrela dourada e cachecol turquesa.

**Bloco de estilo (vai no fim de TODO prompt, sem mudar uma vírgula):**

> Style: cozy hand-painted storybook game art, soft gouache brush texture, chunky rounded shapes, thick dark plum outlines, warm amber candlelight from the upper left with a soft teal rim light, deep plum and indigo shadows, jewel-tone glowing liquids, clean readable silhouettes at small size. No text, no letters, no numbers, no logo, no watermark, no signature.

**Sprites:** acrescentar `isolated on a perfectly flat solid magenta (#FF00FF) background, no shadow, no gradient,
no ground` (objeto rosa ou roxo: fundo verde `#00FF00`). Grades: `a 3x3 grid of 9 separate ..., evenly spaced,
wide empty space between them`.

**O que é desenhado no código** (para casar líquido, recorte e animação): frascos de vidro, líquidos, ondas, fio
do despejo, bolhas, gelo (com textura Grok por cima), brilho. **O que vem do Grok:** cenários, Miso, rolhas,
caldeirão (suporte de ferro), garrafinhas das 60 poções, enfeites, ícones da barra, textura de madeira e de papel,
capas e thumbs.

## Medições (bot, 2026-11-20)

`npm run medir` (3 sessões, semente 7, ritmo humano: despejo 0,7 s de animação + 0,8 s para pensar + 0,06 s por
cor; desfazer 1 s; dica 1,5 s; festa e entrada 2,3 s):

- **Primeira poção aos 5 s** (o "uau"); 6 poções do Grimório no 1º minuto, 9 em 3 min, 15 em 5, 27 em 10, 40 em
  20, 50 em 30 e as 60 no fim das 60 fases (~67 min).
- **Ritmo:** fase 9 aos 3 min, 12 aos 5, 18 aos 10, 26 aos 20. Fases de 7 s (fase 1) a ~1:50 (10–11 cores).
- **Novidade:** o maior intervalo sem nenhuma novidade (mecânica, essência, cenário, poção nova ou enfeite) nos
  primeiros 15 min é de **1:30**. Grandes: oculta 0:39, rolha 2:49, porão 4:44, gelo 6:02, caldeirão 9:11,
  estufa 13:16, e uma essência nova a cada ~2 min até a 12ª.
- **Conclusão** (`test/bot.test.js`): o bot (só vê o que o jogador vê, desfaz, usa o frasco extra grátis e segue a
  dica automática do Miso em 70% das vezes) conclui ≥ 82% em toda fase 1–60 em 25 sementes e na semente do jogo
  (7); sem a dica, a média das fases 1–30 fica ≥ 85%.
