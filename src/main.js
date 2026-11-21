// Purr & Pour: montagem do jogo. O UNICO modulo que toca portal, DOM, audio e salvamento
// (test/estilo.test.js). Ciclo do portal como no kit multiportal (../distribuicao/kit/src/main.js):
//
//  1. ganchos do portal ANTES do init (anuncio cala o audio e congela o laco; mudo e pausa do portal);
//  2. portal.init() primeiro, sem nada pesado antes (o handshake do californiagames.io dura 1,5 s);
//  3. carregar a arte com gameLoadingProgress; o laco so comeca depois do init;
//  4. idioma do portal (Poki: vazio, vale o navegador); progresso da nuvem do portal quando existe;
//  5. gameLoadingFinished no primeiro quadro; gameplayStart SO em jogadorAgiu() (gesto real);
//  6. commercialBreak SO na troca de fase, a partir da FASE_PRIMEIRO_INTERVALO e de 3 min de jogo;
//  7. video premiado so no 2o frasco extra, por escolha, num painel fora do jogo ativo, com "Recomecar a
//     fase" gratis do mesmo tamanho e cor;
//  8. ESC, espaco ou P pausam; aba oculta pausa; o mudo do portal nao desfaz o do jogador;
//  9. portal.intervaloSoNoClique (Y8): o intervalo so sai depois de um clique em "Continuar";
//     portal.pausaNoBlur (Y8): perder o foco abre a pausa.
import { portal, PLATAFORMA } from './core/plataforma.js';
import { criarArmazem } from './core/armazenamento.js';
import { criarAudio } from './core/audio.js';
import { criarHaptico } from './core/haptico.js';
import { criarLaco } from './core/laco.js';
import { criarEntrada } from './core/entrada.js';
import { lerDepuracao } from './core/depuracao.js';
import { criarTelemetria } from './core/telemetria.js';
import { escolherIdioma, definirIdioma, aplicarTextos, t, idioma } from './i18n/textos.js';
import { nomePocao, nomeEssencia, nomeTomo } from './i18n/pocoes.js';
import { criarMao, celebrar, botaoPremiado } from './ui/kit.js';
import { criarGrimorioUI } from './ui/grimorio.js';
import { SONS } from './som/sons.js';
import { gerarFase, coresConhecidas, cenarioDaFase } from './jogo/gerador.js';
import { criarPartida, jogar, desfazer, usarExtra, recomecar, podeDesfazer, podeExtra, DESFAZER_POR_FASE, EXTRAS_POR_FASE } from './jogo/partida.js';
import { quantidade, completa, presas, geloFalta, fechado, corrida } from './jogo/regras.js';
import { dica as dicaSolver } from './jogo/solver.js';
import { motivo as motivoGato, sugerir } from './jogo/gato.js';
import * as grim from './jogo/grimorio.js';
import { ESSENCIAS } from './jogo/essencias.js';
import { calcularLayout, vasoEm } from './render/layout.js';
import { desenharVaso, poligonoMundo } from './render/frascos.js';
import { niveis } from './render/forma.js';
import { desenharFundo, desenharPrateleiras, desenharEnfeites, desenharGato, desenharFio, desenharParticulas, moverParticulas, desenharVoos } from './render/cena.js';
import { criarArte, listaInicial, listaResto, CENARIOS, ENFEITES_ARQ, nomePocaoArte, caminho } from './render/arte.js';

/** Sem intervalo comercial antes desta fase nem antes de MIN_JOGO_INTERVALO s de jogo. */
const FASE_PRIMEIRO_INTERVALO = 8;
const MIN_JOGO_INTERVALO = 180;
/** Fase em que o frasco extra e apresentado com a mao-guia. */
const FASE_EXTRA = 7;
/** Tempos da animacao do despejo (s). */
const T_IR = 0.18;
const T_VOLTA = 0.18;
const tDespejo = (q) => 0.26 + 0.07 * q;

const dbg = lerDepuracao(['grimorio', 'pocoes']);
const armazem = criarArmazem({ prefixo: 'potionpour.' });
const audio = criarAudio();
const haptico = criarHaptico();
const tele = criarTelemetria(portal);
const arte = criarArte();

const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const tela = /** @type {HTMLCanvasElement} */ ($('tela'));
const g = /** @type {CanvasRenderingContext2D} */ (tela.getContext('2d'));
const camada = $('camada');
const mao = criarMao(camada);

// ------------------------------------------------------------------ estado
/**
 * @typedef {{ a: number, b: number, r: import('./jogo/regras.js').Resultado, antes: import('./jogo/regras.js').Estado, t: number, dur: number, dir: number }} Anim
 */
const E = {
  fase: 1,
  semente: dbg.semente || 7,
  /** @type {import('./jogo/gerador.js').Fase} */
  def: /** @type {any} */ (null),
  /** @type {import('./jogo/partida.js').Partida} */
  P: /** @type {any} */ (null),
  G: grim.novoGrimorio(),
  t: 0,
  tempoJogo: 0,
  parado: 0,
  emFesta: false,
  pausado: false,
  pausaPortal: false,
  menu: false,
  jogou: false,
  sel: -1,
  /** @type {Anim|null} */
  anim: null,
  /** @type {number[]} toques na fila durante a animacao */
  fila: [],
  /** @type {import('./render/cena.js').Particula[]} */
  particulas: [],
  /** @type {import('./render/cena.js').Voo[]} */
  voos: [],
  /** @type {number[]} */
  onda: [],
  /** @type {number[]} */
  tremor: [],
  /** @type {number[]} brilho de pocao recem-pronta */
  brilho: [],
  entrada: 1,
  gatoPose: 'sentado',
  gatoAte: 0,
  fala: '',
  falaAte: 0,
  /** @type {import('./jogo/gato.js').Ajuda | null} */
  ajuda: null,
  ajudaEspera: 0,
  dia: '',
  diaCor: -1,
  enfeiteNovo: -1,
  enfeiteAte: 0,
  pocoesNaFase: 0,
  /** @type {Record<string, boolean>} */
  vistos: {},
};

/** @type {import('./render/layout.js').Layout} */
let L = /** @type {any} */ (null);
let W = 0;
let H = 0;

// ------------------------------------------------------------------ salvamento
function carregarProgresso() {
  const p = dbg.novo ? null : armazem.ler('progresso', null);
  E.fase = dbg.fase || (p && Number(p.fase)) || 1;
  E.G = grim.lerGrimorio(p && p.grimorio);
  E.vistos = (p && p.vistos && typeof p.vistos === 'object') ? p.vistos : {};
  if (dbg.extras.pocoes) fingirPocoes(Number(dbg.extras.pocoes) || 0);
}
function salvar() {
  armazem.gravar('progresso', { v: 1, fase: E.fase, grimorio: E.G, vistos: E.vistos });
}
/** So para prints e provas (?pocoes=N): descobre as N primeiras paginas. @param {number} n */
function fingirPocoes(n) {
  let k = 0;
  for (let tomo = 0; tomo < grim.TOMOS && k < n; tomo++) {
    for (let c = 0; c < ESSENCIAS.length && k < n; c++, k++) {
      E.G.achadas[c] |= 1 << tomo;
      E.G.feitas[c] = Math.max(E.G.feitas[c], grim.REQ[tomo]);
    }
  }
}

// ------------------------------------------------------------------ portal: ganchos antes do init
const laco = criarLaco({ passo, desenhar });
portal.onAdStart = () => {
  audio.mudoParaAnuncio();
  laco.pausar(true);
};
portal.onAdEnd = () => {
  audio.voltarDoAnuncio();
  if (!congelado()) laco.pausar(false);
};
portal.onMudoPlataforma = (m) => audio.definirMudoPlataforma(m);
portal.onPausaPlataforma = (p) => {
  E.pausaPortal = p;
  if (p) portal.gameplayStop();
  laco.pausar(congelado() || portal.emAnuncio);
};
portal.onSemAnuncios = () => atualizarBarra();

const congelado = () => E.pausado || E.pausaPortal || E.menu;

/** Unico lugar com gameplayStart: gesto real do jogador, fora de pausa e de anuncio. */
function jogadorAgiu() {
  if (congelado() || portal.emAnuncio) return;
  E.jogou = true;
  portal.gameplayStart();
}

// ------------------------------------------------------------------ fases
function novaFase() {
  E.def = gerarFase(E.fase, E.semente);
  E.P = criarPartida(E.def);
  E.sel = -1;
  E.anim = null;
  E.fila = [];
  E.ajuda = null;
  E.ajudaEspera = 1.2;
  E.parado = 0;
  E.entrada = 0;
  E.pocoesNaFase = 0;
  mao.esconder();
  // Pocao do Dia so depois do ensino (fase 4 em diante)
  E.diaCor = E.fase >= 4 ? grim.corDoDia(E.G, E.dia, E.def.coresDaFase) : -1;
  refazerLayout();
  atualizarHud();
  atualizarBarra();
  mostrarEnsino();
  anunciarNovidades();
}

/** Texto curto so nas 3 primeiras fases e nas estreias de mecanica. */
function mostrarEnsino() {
  const est = E.def.param.estreia;
  /** @type {string} */
  let chave = '';
  if (E.fase === 1) chave = 'tut1';
  else if (E.fase === 2) chave = 'tut2';
  else if (E.fase === 3) chave = 'tut3';
  else if (est) chave = { oculta: 'tutOculta', rolha: 'tutRolha', gelo: 'tutGelo', caldeirao: 'tutCaldeirao' }[est];
  else if (E.fase === FASE_EXTRA) chave = 'tutExtra';
  const el = $('dicaTexto');
  if (chave && !dbg.limpo) {
    el.textContent = t(chave);
    el.hidden = false;
  } else el.hidden = true;
  $('btDesfazer').classList.toggle('chama', E.fase === 3);
  $('btExtra').classList.toggle('chama', E.fase === FASE_EXTRA);
}

/** Toasts de novidade: essencia nova, tomo novo do Grimorio, Pocao do Dia. */
function anunciarNovidades() {
  const n = E.fase;
  const est = E.def.param.estreia;
  if (est) {
    tele.evento(`novidade-${est}`, 'viu');
    gatoFaz('surpreso', 1.6);
    tocar('novidade');
  }
  const tomo = grim.TOMO_DESDE.indexOf(n);
  if (tomo > 0 && !E.vistos[`tomo${tomo}`]) {
    E.vistos[`tomo${tomo}`] = true;
    aviso(t('novoTomo', { nome: nomeTomo(tomo) }), caminho('icone-01'));
  }
  if (n > 1 && coresConhecidas(n) > coresConhecidas(n - 1)) {
    const cor = coresConhecidas(n) - 1;
    if (!E.vistos[`cor${cor}`]) {
      E.vistos[`cor${cor}`] = true;
      aviso(t('novaEssencia', { nome: nomeEssencia(cor) }), caminho(nomePocaoArte(cor, 0)), ESSENCIAS[cor].cor);
    }
  }
  if (E.diaCor >= 0) aviso(t('diariaDica'), caminho('icone-06'), '', t('diaria'));
}

// ------------------------------------------------------------------ layout e HUD
function medir() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  tela.width = Math.round(W * dpr);
  tela.height = Math.round(H * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (E.P) refazerLayout();
}
function refazerLayout() {
  L = calcularLayout(W, H, E.P.E.def);
  const n = E.P.E.c.length;
  while (E.onda.length < n) E.onda.push(0);
  while (E.tremor.length < n) E.tremor.push(0);
  while (E.brilho.length < n) E.brilho.push(0);
  document.documentElement.style.setProperty('--botao', `${L.botao}px`);
  // retrato: barra a direita do gato; paisagem: centro
  $('barra').classList.toggle('desvio', L.retrato && W < 520);
  const dt = $('dicaTexto');
  dt.style.top = `${L.topo + 4}px`;
  $('toasts').style.top = `${L.topo + (dt.hidden ? 6 : 52)}px`;
}

function atualizarHud() {
  $('hudFase').textContent = t('fase', { n: E.fase });
  $('contaPocoes').textContent = `${grim.total(E.G)}/${grim.TOTAL_POCOES}`;
  const px = grim.proxima(E.G, E.fase, coresConhecidas(E.fase));
  const el = $('proxima');
  if (px && !dbg.limpo) {
    el.hidden = false;
    /** @type {HTMLImageElement} */ ($('proximaImg')).src = caminho(nomePocaoArte(px.cor, px.tomo));
    $('proximaTxt').textContent = `${px.feitas}/${px.req}`;
    el.style.setProperty('--cor', ESSENCIAS[px.cor].cor);
  } else el.hidden = true;
  if (dbg.limpo) $('hud').style.visibility = 'hidden';
}

function atualizarBarra() {
  const P = E.P;
  if (!P) return;
  const bd = /** @type {HTMLButtonElement} */ ($('btDesfazer'));
  $('seloDesfazer').textContent = String(P.desfazerRestam);
  bd.disabled = !podeDesfazer(P);
  const be = /** @type {HTMLButtonElement} */ ($('btExtra'));
  const se = $('seloExtra');
  const temVideo = portal.temVideo;
  if (P.extras === 0) {
    se.textContent = '+1';
    se.className = 'selo';
    be.disabled = false;
  } else if (P.extras < EXTRAS_POR_FASE && temVideo) {
    se.textContent = '🎬';
    se.className = 'selo video';
    be.disabled = false;
  } else {
    se.textContent = '0';
    se.className = 'selo';
    be.disabled = true;
  }
  if (dbg.limpo) $('barra').style.visibility = 'hidden';
}

/**
 * Aviso curto no alto (nao bloqueia o toque).
 * @param {string} texto @param {string} [img] @param {string} [cor] @param {string} [titulo]
 */
function aviso(texto, img, cor, titulo) {
  if (dbg.limpo) return;
  const el = document.createElement('div');
  el.className = 'toast';
  if (img) {
    const i = document.createElement('img');
    i.src = img;
    i.alt = '';
    el.appendChild(i);
  }
  const d = document.createElement('div');
  if (titulo) {
    const b = document.createElement('b');
    b.textContent = titulo;
    d.appendChild(b);
  }
  d.append(texto);
  el.appendChild(d);
  if (cor) el.style.boxShadow = `0 4px 0 ${cor}, 0 8px 18px #0008`;
  const caixa = $('toasts');
  while (caixa.children.length >= 2) caixa.firstChild?.remove();
  caixa.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ------------------------------------------------------------------ gato
/** @param {string} pose @param {number} s */
function gatoFaz(pose, s) {
  E.gatoPose = pose;
  E.gatoAte = E.t + s;
}
/** @param {string} texto @param {number} s */
function gatoFala(texto, s) {
  E.fala = texto;
  E.falaAte = E.t + s;
}
function poseDoGato() {
  if (E.t < E.gatoAte) return E.gatoPose;
  if (E.ajuda) return 'apontando';
  if (E.fase === 1 && E.P && E.P.pocoes === 0 && !E.jogou) return 'dormindo';
  if (E.parado > 6) return E.parado % 14 < 2.2 ? 'bocejo' : E.parado % 9 < 1.5 ? 'lambendo' : 'sentado';
  if (E.P && E.P.semMelhora >= 4) return 'pensando';
  return 'sentado';
}

// ------------------------------------------------------------------ laco
/** @param {number} dt */
function passo(dt) {
  if (congelado()) return;
  E.t += dt;
  if (portal.jogando) {
    tele.jogando(dt);
    E.tempoJogo += dt;
  }
  E.entrada = Math.min(1, E.entrada + dt * 2.6);
  if (!E.emFesta) E.parado += dt;
  for (let i = 0; i < E.onda.length; i++) {
    E.onda[i] *= Math.exp(-dt * 2.5);
    E.tremor[i] = Math.max(0, E.tremor[i] - dt);
    E.brilho[i] = Math.max(0, E.brilho[i] - dt * 0.8);
  }
  if (E.t > E.falaAte) E.fala = '';
  if (E.t > E.enfeiteAte) E.enfeiteNovo = -1;
  moverParticulas(E.particulas, dt);
  for (const v of E.voos) {
    v.t += dt;
    if (v.t >= v.dur && v.fim) { const f = v.fim; v.fim = undefined; f(); }
  }
  E.voos = E.voos.filter((v) => v.t < v.dur);
  // animacao do despejo
  if (E.anim) {
    const an = E.anim;
    const antesDespejo = an.t < T_IR + tDespejo(an.r.qtd);
    an.t += dt;
    if (antesDespejo && an.t >= T_IR + tDespejo(an.r.qtd)) chegou(an);
    if (an.t >= an.dur) {
      E.anim = null;
      if (E.fila.length && !E.emFesta) {
        const i = /** @type {number} */ (E.fila.shift());
        tocarVaso(i);
      }
    }
  }
  if (!E.emFesta && !E.anim) cuidarDaAjuda(dt);
  if (dbg.auto && !E.emFesta && !E.anim && E.t % dbg.ritmo < dt) jogadaDoBot();
}

/** Ajuda automatica do gato quando o jogador nao progride (e a mao-guia sempre na fase 1). */
function cuidarDaAjuda(dt) {
  E.ajudaEspera -= dt;
  if (E.ajuda || E.ajudaEspera > 0 || completa(E.P.E)) return;
  const m = E.fase === 1 ? 'parado' : motivoGato(E.P, E.parado);
  if (!m) return;
  mostrarAjuda(sugerir(E.P, m));
}

/** @param {import('./jogo/gato.js').Ajuda} a */
function mostrarAjuda(a) {
  E.ajuda = a;
  if (E.fase > 1) tele.ajuda(E.fase);
  if (a.acao === 'jogar' && a.jogada) {
    const de = centroVaso(a.jogada[0]);
    const para = centroVaso(a.jogada[1]);
    mao.mostrar(de.x, de.y, { ateX: para.x, ateY: para.y });
  } else {
    const alvo = a.acao === 'desfazer' ? 'btDesfazer' : a.acao === 'extra' ? 'btExtra' : 'btPausa';
    const r = $(alvo).getBoundingClientRect();
    mao.mostrar(r.x + r.width / 2, r.y + r.height / 2);
    if (a.motivo === 'sem-saida') aviso(t('semSaida'), caminho('icone-04'));
  }
  if (E.fase > 1) {
    gatoFala(t('miau'), 1.6);
    tocar('miau');
  }
}
function limparAjuda() {
  E.ajuda = null;
  E.ajudaEspera = 1.5;
  mao.esconder();
}

/** Centro (px CSS) de um recipiente, para a mao-guia e os roteiros. @param {number} i */
function centroVaso(i) {
  const p = L.lugares[i];
  return { x: p.x, y: p.y + p.h * 0.5 };
}

// ------------------------------------------------------------------ desenho
/** @param {number} x @returns {number} 0..1 com rebote */
const sair = (x) => 1 - (1 - x) ** 3;

/**
 * Camadas visuais de um vaso (une as de mesma cor visiveis; cada oculta e uma).
 * @param {number[]} c @param {boolean[]} o
 * @returns {import('./render/frascos.js').Camada[]}
 */
function camadasDe(c, o) {
  /** @type {import('./render/frascos.js').Camada[]} */
  const r = [];
  for (let k = 0; k < c.length; k++) {
    const ult = r[r.length - 1];
    if (ult && !o[k] && !ult.oculta && ult.cor === c[k]) ult.q += 1;
    else r.push({ cor: c[k], q: 1, oculta: !!o[k] });
  }
  return r;
}

/**
 * Posicao, angulo e conteudo de cada vaso neste quadro (com a animacao do despejo).
 * @param {number} i
 * @returns {import('./render/frascos.js').Vista}
 */
function vista(i) {
  const S = E.P.E;
  const p = L.lugares[i];
  let x = p.x;
  let y = p.y;
  let ang = 0;
  let camadas = camadasDe(S.c[i], S.o[i]);
  const an = E.anim;
  if (an && (i === an.a || i === an.b)) {
    const td = tDespejo(an.r.qtd);
    const k = Math.max(0, Math.min(1, (an.t - T_IR) / td));
    const A = an.antes;
    if (i === an.a) {
      const base = camadasDe(A.c[i], A.o[i]);
      const topo = base[base.length - 1];
      if (topo) topo.q -= an.r.qtd * k;
      if (topo && topo.q <= 0.001) base.pop();
      camadas = base;
      const pd = L.lugares[an.b];
      const lado = an.dir;
      const alvoX = pd.x - lado * (pd.w * 0.18 + 4);
      const alvoY = pd.y - p.w * 0.55;
      const encher = A.c[i].length / A.def[i].cap;
      const angMax = lado * (1.62 + (1 - encher) * 0.42);
      let u;
      if (an.t < T_IR) { u = sair(an.t / T_IR); ang = angMax * 0.55 * u; } else if (an.t < T_IR + td) { u = 1; ang = angMax * (0.55 + 0.45 * sair(k)); } else {
        u = 1 - sair((an.t - T_IR - td) / T_VOLTA);
        ang = angMax * u;
      }
      x = p.x + (alvoX - p.x) * u;
      y = (p.y - p.w * 0.45) + (alvoY - (p.y - p.w * 0.45)) * u;
    } else {
      const base = camadasDe(A.c[i], A.o[i]);
      if (k >= 1) camadas = camadasDe(S.c[i], S.o[i]);
      else {
        const ult = base[base.length - 1];
        if (ult && !ult.oculta && ult.cor === an.r.cor) ult.q += an.r.qtd * k;
        else if (k > 0) base.push({ cor: an.r.cor, q: an.r.qtd * k, oculta: false });
        camadas = base;
      }
    }
  } else if (i === E.sel) y -= p.w * 0.45;
  // entrada da fase: os vasos caem na prateleira um depois do outro
  const atraso = Math.min(0.6, i * 0.05);
  const e = Math.max(0, Math.min(1, (E.entrada - atraso) / (1 - atraso)));
  if (e < 1) y -= (1 - sair(e)) * (H * 0.7);
  if (E.tremor[i] > 0) x += Math.sin(E.tremor[i] * 60) * p.w * 0.12;
  const def = S.def[i];
  return {
    x, y, w: p.w, h: p.h, ang, caldeirao: def.caldeirao, cap: def.cap, camadas,
    pronto: S.pronto[i], rolha: fechado(S, i) ? def.rolha : -1, gelo: presas(S, i) ? def.geloK : 0, geloFalta: geloFalta(S, i),
    selecionado: i === E.sel, dourado: E.diaCor >= 0 && vasoDourado() === i, onda: E.onda[i] || 0, brilho: E.brilho[i] || 0, t: E.t + i * 0.7,
    extra: def.extra, simbolos: true,
  };
}

/** O vaso que tem mais camadas da cor do dia (brilha dourado). */
function vasoDourado() {
  const S = E.P.E;
  let melhor = -1;
  let n = 0;
  for (let i = 0; i < S.c.length; i++) {
    const k = S.c[i].filter((x, j) => x === E.diaCor && !S.o[i][j]).length;
    if (k > n) { n = k; melhor = i; }
  }
  return melhor;
}

function desenhar() {
  if (!L) return;
  const cen = E.def ? E.def.param.cenario : 0;
  const fundo = arte.img(`cenario-${CENARIOS[cen]}-${L.retrato ? 'retrato' : 'paisagem'}`);
  desenharFundo(g, L, fundo, cen);
  const madeira = arte.img('madeira');
  const nEnf = grim.enfeites(E.G);
  desenharEnfeites(g, L, ENFEITES_ARQ.map((n) => arte.img(`enfeite-${n}`)), nEnf, E.t, E.enfeiteNovo, madeira);
  desenharPrateleiras(g, L, madeira);
  const arteVaso = { rolha: arte.img('icone-07'), gelo: arte.img('icone-08'), suporte: arte.img('icone-09') };
  const n = E.P.E.c.length;
  // vaso do despejo por ultimo (fica na frente)
  const ordem = Array.from({ length: n }, (_, i) => i).filter((i) => !E.anim || i !== E.anim.a);
  if (E.anim) ordem.push(E.anim.a);
  for (const i of ordem) {
    const v = vista(i);
    desenharVaso(g, v, arteVaso);
    if (E.anim && i === E.anim.a) fio(v);
  }
  desenharParticulas(g, E.particulas);
  const poses = Array.from({ length: 9 }, (_, i) => arte.img(`gato-${String(i + 1).padStart(2, '0')}`));
  desenharGato(g, L.gato, poses, poseDoGato(), E.t, dbg.limpo ? '' : E.fala, W);
  desenharVoos(g, E.voos, Math.max(28, L.w * 0.9));
  if (dbg.debug) {
    g.fillStyle = '#fff';
    g.font = '12px sans-serif';
    g.textAlign = 'left';
    g.fillText(`${laco.medidas.fps.toFixed(0)} fps · ${laco.medidas.desenhoMs.toFixed(1)} ms · min ${E.def.minimo}`, 8, H - 8);
  }
  primeiroQuadro();
}

/** Fio de liquido durante o despejo. @param {import('./render/frascos.js').Vista} v */
function fio(v) {
  const an = /** @type {Anim} */ (E.anim);
  const td = tDespejo(an.r.qtd);
  const k = (an.t - T_IR) / td;
  if (k <= 0 || k >= 1) return;
  const vd = vista(an.b);
  const pol = poligonoMundo(vd);
  const tot = vd.camadas.reduce((s, c) => s + c.q, 0);
  const [yTopo] = niveis(pol, [tot / vd.cap]);
  const larg = Math.max(3, v.w * 0.22) * Math.min(1, k * 6, (1 - k) * 6);
  desenharFio(g, v.x, v.y + 2, vd.x, yTopo, an.r.cor, larg, E.t, 1);
}

let carregouJa = false;
function primeiroQuadro() {
  if (carregouJa) return;
  carregouJa = true;
  portal.gameLoadingFinished();
  $('carregando').classList.add('saindo');
  setTimeout(() => $('carregando').remove(), 400);
  // o resto da arte depois do primeiro quadro
  arte.carregar(listaResto());
}

// ------------------------------------------------------------------ jogo
/** Vaso de onde pode sair algo agora. @param {number} i */
function podeSair(i) {
  const S = E.P.E;
  return S.c[i].length > 0 && S.pronto[i] < 0 && !fechado(S, i) && corrida(S, i) > 0;
}

/** @param {keyof typeof SONS} nome @param {any} [p] */
function tocar(nome, p = {}) {
  audio.tocarReceita(SONS[nome], p, { chave: nome });
}

/** Toque num vaso (mouse, toque, teclado ou bot). @param {number} i */
function tocarVaso(i) {
  if (E.emFesta || congelado() || !E.P || i < 0 || i >= E.P.E.c.length) return;
  if (E.anim) {
    if (E.fila.length < 2) E.fila.push(i);
    return;
  }
  E.parado = 0;
  const S = E.P.E;
  if (E.sel < 0) {
    if (podeSair(i)) {
      E.sel = i;
      tocar('pegar', { k: i });
      haptico.vibrar(8);
    } else {
      E.tremor[i] = 0.3;
      tocar('erro');
    }
    return;
  }
  if (E.sel === i) {
    E.sel = -1;
    return;
  }
  if (quantidade(S, E.sel, i)) {
    const a = E.sel;
    E.sel = -1;
    despejarAnimado(a, i);
    return;
  }
  E.tremor[i] = 0.3;
  tocar('erro');
  haptico.vibrar(20);
  E.sel = podeSair(i) ? i : -1;
}

/** @param {number} a @param {number} b */
function despejarAnimado(a, b) {
  const antes = E.P.E;
  const r = jogar(E.P, a, b);
  if (!r) return;
  limparAjuda();
  E.ajudaEspera = 2;
  const dir = L.lugares[a].x <= L.lugares[b].x ? 1 : -1;
  E.anim = { a, b, r, antes, t: 0, dur: T_IR + tDespejo(r.qtd) + T_VOLTA, dir };
  tocar('despejo', { q: r.qtd, nivel: antes.c[b].length / antes.def[b].cap });
  if (E.fase <= 3 || E.def.param.estreia) setTimeout(() => { $('dicaTexto').hidden = true; }, 2500);
  atualizarBarra();
}

/** O liquido chegou: pocoes prontas, gelo, camadas reveladas. @param {Anim} an */
function chegou(an) {
  E.onda[an.b] = 1;
  if (an.r.revelados) {
    const p = L.lugares[an.a];
    for (let k = 0; k < 6; k++) particula('brilho', p.x, p.y + p.h * 0.5, '#e8d9ff');
  }
  for (const i of an.r.gelos) {
    tocar('gelo');
    const p = L.lugares[i];
    for (let k = 0; k < 10; k++) particula('gota', p.x, p.y + p.h * 0.7, '#d8f6ff');
  }
  an.r.prontos.forEach((i, k) => setTimeout(() => pocaoPronta(i, E.P.E.pronto[i]), k * 160));
  atualizarBarra();
}

/**
 * @param {'bolha'|'brilho'|'gota'} tipo @param {number} x @param {number} y @param {string} cor
 */
function particula(tipo, x, y, cor) {
  const a = (E.particulas.length * 2.399) % (Math.PI * 2);
  const v = 60 + ((E.particulas.length * 37) % 90);
  E.particulas.push({
    x, y, vx: Math.cos(a) * v * (tipo === 'bolha' ? 0.25 : 1), vy: tipo === 'bolha' ? -40 - v * 0.6 : Math.sin(a) * v - 60,
    vida: tipo === 'bolha' ? 1.4 : 0.8, max: tipo === 'bolha' ? 1.4 : 0.8, tipo, cor, s: tipo === 'bolha' ? 3 + (v % 5) : 6 + (v % 6),
  });
  if (E.particulas.length > 220) E.particulas.splice(0, 40);
}

/** Um vaso virou pocao. @param {number} i @param {number} cor */
function pocaoPronta(i, cor) {
  if (cor < 0) return;
  E.pocoesNaFase++;
  E.brilho[i] = 1;
  tocar('rolha');
  setTimeout(() => tocar('pocao', { k: E.pocoesNaFase }), 120);
  haptico.vibrar(25);
  const p = L.lugares[i];
  const ess = ESSENCIAS[cor];
  for (let k = 0; k < 14; k++) particula('bolha', p.x + ((k % 5) - 2) * p.w * 0.12, p.y + p.h * 0.4, ess.clara);
  for (let k = 0; k < 10; k++) particula('brilho', p.x, p.y, k % 2 ? '#ffe27a' : ess.clara);
  const primeira = grim.total(E.G) === 0;
  const res = grim.registrar(E.G, cor, E.fase);
  if (cor === E.diaCor && grim.carimbar(E.G, E.dia)) {
    E.diaCor = -1;
    tele.evento('diaria', 'carimbo');
    setTimeout(() => aviso(t('selos', { n: E.G.selos }), caminho('icone-06'), '#ffd56b', t('diaria')), 900);
  }
  gatoFaz('feliz', primeira ? 2.2 : 1.3);
  // a garrafinha voa ate o livro
  const tomo = res.nova ? res.nova.tomo : melhorTomo(cor);
  const nome = nomePocaoArte(cor, tomo);
  const r = $('btGrimorio').getBoundingClientRect();
  E.voos.push({
    img: arte.pedir(nome), cor: ess.cor, x0: p.x, y0: p.y, x1: r.x + 24, y1: r.y + r.height / 2, t: 0, dur: 0.95,
    fim: () => {
      const bt = $('btGrimorio');
      bt.classList.remove('pulo');
      void bt.offsetWidth;
      bt.classList.add('pulo');
      atualizarHud();
      if (res.nova) {
        tocar('novaPocao');
        aviso(nomePocao(cor, /** @type {number} */ (tomo)), caminho(nome), ess.cor, t('novaPocao'));
        tele.evento(`pocao-${cor}-${tomo}`, 'nova');
        if (primeira) gatoFala(t('miau'), 1.4);
      }
      if (res.enfeite >= 0) {
        E.enfeiteNovo = res.enfeite;
        E.enfeiteAte = E.t + 3;
        aviso(t('novoEnfeite'), caminho(`enfeite-${ENFEITES_ARQ[res.enfeite]}`));
      }
      if (grim.total(E.G) === grim.TOTAL_POCOES && res.nova) aviso(t('fim'), caminho('icone-01'));
    },
  });
  salvar();
  if (completa(E.P.E)) faseCompleta();
}

/** Tomo da pagina mais alta ja descoberta da cor (para a garrafinha que voa). @param {number} cor */
function melhorTomo(cor) {
  for (let k = grim.TOMOS - 1; k >= 0; k--) if (grim.achada(E.G, cor, k)) return k;
  return 0;
}

async function faseCompleta() {
  if (E.emFesta) return;
  E.emFesta = true;
  E.sel = -1;
  limparAjuda();
  $('dicaTexto').hidden = true;
  tele.fase(E.fase, 'complete');
  const P = E.P;
  const limpo = P.desfazerRestam === DESFAZER_POR_FASE && P.extras === 0;
  const texto = limpo && P.despejos <= E.def.minimo + 2 ? t('perfeito') : limpo ? t('incrivel') : t('muitoBem');
  setTimeout(() => tocar('festa'), 350);
  gatoFaz('feliz', 2.2);
  E.fase++;
  salvar();
  // festa curta, sem tela de "fase concluida": o jogo segue sozinho
  await celebrar(camada, texto, { sub: t('fase', { n: E.fase - 1 }), ms: 1900 });
  // pausa natural: o unico ponto do intervalo comercial
  await intervalo();
  novaFase();
  E.emFesta = false;
  tele.fase(E.fase, 'start');
}

/** s de jogo no ultimo intervalo pedido (so para o portal que exige clique) */
let ultimoIntervalo = -Infinity;
async function intervalo() {
  if (dbg.semAnuncio || !portal.temAnuncios || E.fase < FASE_PRIMEIRO_INTERVALO || E.tempoJogo < MIN_JOGO_INTERVALO) return;
  if (portal.intervaloSoNoClique) {
    // Y8: o intersticial so pode sair logo depois de um clique num botao (nunca automatico), e o portal
    // so exibe um a cada ~3 min: o botao "Continuar" aparece so quando o intervalo pode sair de fato.
    if (E.tempoJogo - ultimoIntervalo < 180) return;
    await esperarClique(/** @type {HTMLButtonElement} */ ($('btSeguir')));
  }
  ultimoIntervalo = E.tempoJogo;
  await portal.commercialBreak();
}
/** @param {HTMLButtonElement} bt */
function esperarClique(bt) {
  return new Promise((ok) => {
    bt.hidden = false;
    bt.addEventListener('click', () => { bt.hidden = true; ok(undefined); }, { once: true });
  });
}

/** O bot do ?auto (gravacoes): pega a origem e, no toque seguinte, despeja pela dica do solver. */
function jogadaDoBot() {
  if (completa(E.P.E)) return;
  if (E.sel >= 0 && E.ajuda && E.ajuda.jogada) { tocarVaso(E.ajuda.jogada[1]); return; }
  const d = dicaSolver(E.P.E);
  if (!d.jogada) {
    if (podeDesfazer(E.P)) acaoDesfazer();
    else if (podeExtra(E.P) && E.P.extras === 0) acaoExtra();
    else { recomecar(E.P); atualizarBarra(); }
    return;
  }
  E.ajuda = { motivo: 'parado', acao: 'jogar', jogada: d.jogada };
  tocarVaso(d.jogada[0]);
}

// ------------------------------------------------------------------ ferramentas
function acaoDesfazer() {
  if (E.emFesta || congelado() || !E.P) return;
  if (E.anim) { E.anim = null; E.fila = []; }
  if (!desfazer(E.P)) {
    const b = $('btDesfazer');
    b.classList.remove('tremer');
    void b.offsetWidth;
    b.classList.add('tremer');
    if (!E.P.desfazerRestam) aviso(t('semDesfazer'));
    tocar('erro');
    return;
  }
  E.sel = -1;
  E.parado = 0;
  limparAjuda();
  $('btDesfazer').classList.remove('chama');
  tocar('desfazer');
  tele.evento('desfazer', 'usou');
  atualizarBarra();
}

function acaoExtra() {
  if (E.emFesta || congelado() || !E.P) return;
  const P = E.P;
  if (P.extras === 0) {
    if (E.anim) return;
    usarExtra(P);
    E.parado = 0;
    limparAjuda();
    tocar('extra');
    tele.evento('frasco-extra', 'gratis');
    $('btExtra').classList.remove('chama');
    refazerLayout();
    atualizarBarra();
    return;
  }
  if (P.extras < EXTRAS_POR_FASE && portal.temVideo) abrirPainelExtra();
}

function acaoDica() {
  if (E.emFesta || congelado() || !E.P || E.anim || completa(E.P.E)) return;
  limparAjuda();
  mostrarAjuda(sugerir(E.P, 'parado'));
}

// ------------------------------------------------------------------ menus (pausam o jogo)
function congelar() {
  E.menu = true;
  portal.gameplayStop();
  laco.pausar(true);
  mao.esconder();
}
function descongelar() {
  E.menu = false;
  laco.pausar(congelado() || portal.emAnuncio);
  if (E.ajuda && E.ajuda.jogada) {
    const de = centroVaso(E.ajuda.jogada[0]);
    const para = centroVaso(E.ajuda.jogada[1]);
    mao.mostrar(de.x, de.y, { ateX: para.x, ateY: para.y });
  }
}
function abrirMenu() {
  if (E.menu) return;
  congelar();
  $('menu').hidden = false;
}
function fecharMenu() {
  if ($('menu').hidden) return;
  $('menu').hidden = true;
  descongelar();
}
function abrirPainelExtra() {
  if (E.menu) return;
  congelar();
  const bt = /** @type {HTMLButtonElement} */ ($('btExtraVideo'));
  bt.hidden = !portal.temVideo;
  $('painelExtra').hidden = false;
}
function fecharPainelExtra() {
  if ($('painelExtra').hidden) return;
  $('painelExtra').hidden = true;
  descongelar();
  atualizarBarra();
}
async function pedirFrascoVideo() {
  const ok = await portal.rewardedBreak('small');
  if (ok && E.P && podeExtra(E.P)) {
    usarExtra(E.P);
    tele.evento('frasco-extra', 'video');
    fecharPainelExtra();
    tocar('extra');
    refazerLayout();
  }
  atualizarBarra();
}
function recomecarFase() {
  if (!E.P) return;
  recomecar(E.P);
  E.sel = -1;
  E.anim = null;
  E.fila = [];
  limparAjuda();
  E.entrada = 0;
  tele.evento('recomecar', String(E.fase));
  atualizarBarra();
}

const grimorioUI = criarGrimorioUI($('grimorio'), {
  src: (cor, tomo) => caminho(nomePocaoArte(cor, tomo)),
  icone: (n) => caminho(n),
  aoFechar: () => fecharGrimorio(),
  aoAba: () => tocar('pagina'),
});
function abrirGrimorio() {
  if (E.menu) return;
  congelar();
  tele.evento('grimorio', 'abriu');
  tocar('pagina');
  grimorioUI.abrir(E.G, E.fase, coresConhecidas(E.fase));
}
function fecharGrimorio() {
  if (!grimorioUI.aberto) return;
  grimorioUI.fechar();
  descongelar();
}
function fecharTudo() {
  fecharMenu();
  fecharPainelExtra();
  fecharGrimorio();
}

// ------------------------------------------------------------------ entrada
/** @type {{ i: number, x: number, y: number } | null} */
let arrasto = null;
const TECLAS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'KeyQ', 'KeyW', 'KeyE', 'KeyR'];
criarEntrada(window, {
  primeiroGesto: () => audio.iniciar(),
  ponteiro: (fase, x, y, e) => {
    if (fase === 'baixo') {
      tele.gesto(e.pointerType === 'mouse' ? 'mouse' : 'toque');
      jogadorAgiu();
      if (congelado() || !L) return; // toque ainda na tela de carregamento: sem layout
      const i = vasoEm(L, x, y);
      arrasto = { i, x, y };
      if (i >= 0) tocarVaso(i);
      else if (E.sel >= 0 && !E.anim) E.sel = -1;
      return;
    }
    if (fase === 'cima' && arrasto) {
      // arrastar de um frasco ate outro tambem despeja
      const d = Math.hypot(x - arrasto.x, y - arrasto.y);
      const j = vasoEm(L, x, y);
      if (d > 24 && j >= 0 && j !== arrasto.i && E.sel === arrasto.i) tocarVaso(j);
      arrasto = null;
    }
  },
  tecla: (codigo, baixo) => {
    if (!baixo) return;
    if (codigo === 'Escape' || codigo === 'Space' || codigo === 'KeyP') {
      if (E.menu) fecharTudo();
      else abrirMenu();
      return;
    }
    if (E.menu) return;
    jogadorAgiu();
    const n = TECLAS.indexOf(codigo);
    if (n >= 0) tocarVaso(n);
    else if (codigo === 'KeyZ' || codigo === 'Backspace') acaoDesfazer();
    else if (codigo === 'KeyX') acaoExtra();
    else if (codigo === 'KeyH') acaoDica();
    else if (codigo === 'KeyG') abrirGrimorio();
  },
});
const clique = (/** @type {string} */ id, /** @type {() => void} */ f) => $(id).addEventListener('click', () => { f(); });
clique('btPausa', () => abrirMenu());
clique('btContinuar', () => { fecharMenu(); jogadorAgiu(); });
clique('btRecomecar', () => { fecharMenu(); recomecarFase(); });
clique('btSom', () => {
  audio.definirMudo(!audio.mudo);
  $('btSom').setAttribute('aria-pressed', String(!audio.mudo));
  armazem.gravar('mudo', audio.mudo);
});
clique('btGrimorio', () => abrirGrimorio());
clique('btDesfazer', () => { jogadorAgiu(); acaoDesfazer(); });
clique('btExtra', () => { jogadorAgiu(); acaoExtra(); });
clique('btDica', () => { jogadorAgiu(); acaoDica(); });
clique('btExtraVideo', () => pedirFrascoVideo());
clique('btExtraRecomecar', () => { fecharPainelExtra(); recomecarFase(); });
clique('btExtraFechar', () => fecharPainelExtra());
document.addEventListener('visibilitychange', () => {
  audio.pausarAba(document.hidden);
  if (document.hidden) {
    portal.gameplayStop();
    laco.pausar(true);
  } else laco.pausar(congelado() || portal.emAnuncio);
});
// Y8: pausar quando a janela perde o foco (requisito do portal)
window.addEventListener('blur', () => { if (portal.pausaNoBlur && carregouJa) abrirMenu(); });
// o iframe do portal precisa de foco para o teclado (espaco nao rola a pagina do portal)
window.addEventListener('pointerdown', () => { try { window.focus(); } catch { /* ignora */ } });
window.addEventListener('resize', medir);

// ------------------------------------------------------------------ partida
/** Data local AAAA-MM-DD (Pocao do Dia). */
function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function iniciar() {
  medir();
  const pedidoInit = portal.init();
  const barra = /** @type {HTMLElement|null} */ (document.querySelector('#carregando .barra i'));
  const progresso = (/** @type {number} */ f) => {
    portal.gameLoadingProgress(f);
    if (barra) barra.style.width = `${f * 100}%`;
  };
  // a arte do primeiro quadro (cenario da fase salva; o resto vem depois)
  const salvo = armazem.ler('progresso', null);
  const faseSalva = dbg.fase || (!dbg.novo && salvo && Number(salvo.fase)) || 1;
  await arte.carregar(listaInicial(cenarioDaFase(faseSalva), H >= W * 1.05), progresso);
  await pedidoInit;
  armazem.usarFonte(await portal.fonteDados(), ['progresso', 'mudo']);
  definirIdioma(escolherIdioma(dbg.lang || portal.idioma || navigator.language));
  document.documentElement.lang = { pt: 'pt-BR', en: 'en', es: 'es' }[idioma()];
  aplicarTextos(document);
  botaoPremiado(/** @type {HTMLButtonElement} */ ($('btExtraVideo')), t('extraVideo'));
  audio.definirMudo(armazem.ler('mudo', false) === true);
  $('btSom').setAttribute('aria-pressed', String(!audio.mudo));
  E.dia = hoje();
  carregarProgresso();
  const voltou = E.fase > 1 && !dbg.filme;
  novaFase();
  if (voltou && !dbg.limpo) {
    gatoFaz('acenando', 2.4);
    aviso(t('voltando'), caminho('icone-01'));
  }
  tele.fase(E.fase, 'start');
  if (dbg.extras.grimorio !== undefined) setTimeout(() => abrirGrimorio(), 600);
  if (dbg.filme) {
    E.entrada = 1;
    desenhar();
    return;
  }
  laco.iniciar();
}

// ------------------------------------------------------------------ ganchos de teste (so local)
if (dbg.ganchos) {
  /** @type {any} */ (window).__jogo = {
    E,
    portal,
    audio,
    plataforma: PLATAFORMA,
    get lang() { return idioma(); },
    get jogou() { return portal.jogando; },
    get emAnuncio() { return portal.emAnuncio; },
    get menuAberto() { return E.menu; },
    /** posicoes (px CSS) da proxima jogada do solver: tocar `de` e depois `para` */
    jogada() {
      if (!E.P || completa(E.P.E)) return null;
      const d = dicaSolver(E.P.E);
      if (!d.jogada) return null;
      return { de: centroVaso(d.jogada[0]), para: centroVaso(d.jogada[1]) };
    },
    /** posicao de um botao da barra */
    botao(/** @type {string} */ id) {
      const r = $(id).getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    },
    /** completa a fase atual na logica (prints e provas) */
    completar() {
      E.anim = null;
      for (let k = 0; k < 400 && E.P && !completa(E.P.E); k++) {
        const d = dicaSolver(E.P.E, 200000);
        if (!d.jogada) break;
        const r = jogar(E.P, d.jogada[0], d.jogada[1]);
        if (r) for (const i of r.prontos) pocaoPronta(i, E.P.E.pronto[i]);
      }
    },
    /** joga N jogadas do solver na hora (prints) */
    avancar(/** @type {number} */ n) {
      for (let k = 0; k < n && E.P && !completa(E.P.E); k++) {
        const d = dicaSolver(E.P.E);
        if (!d.jogada) break;
        const r = jogar(E.P, d.jogada[0], d.jogada[1]);
        if (r) for (const i of r.prontos) pocaoPronta(i, E.P.E.pronto[i]);
      }
    },
    abrirGrimorio,
    /** um quadro de video sem relogio real (?filme): avanca 1/fps e devolve o JPEG */
    quadro(fps = 30) {
      passo(1 / fps);
      desenhar();
      return tela.toDataURL('image/jpeg', 0.9);
    },
  };
}

iniciar();
