// Grimorio na tela (DOM): abas dos 5 tomos, grade das 12 pocoes do tomo (garrafinha, nome e progresso,
// ou silhueta "?" quando falta), selos da Pocao do Dia e enfeites ganhos. So desenha: as regras ficam em
// src/jogo/grimorio.js e quem abre/fecha (e pausa o jogo) e o main.js.
import { TOMOS, REQ, TOMO_DESDE, TOTAL_POCOES, achada, total, enfeites, ENFEITES } from '../jogo/grimorio.js';
import { NUM_ESSENCIAS } from '../jogo/essencias.js';
import { nomePocao, nomeEssencia, nomeTomo } from '../i18n/pocoes.js';
import { t } from '../i18n/textos.js';

const ROMANOS = ['I', 'II', 'III', 'IV', 'V'];

/**
 * @param {HTMLElement} raiz elemento #grimorio (camada-ui)
 * @param {{ src: (cor: number, tomo: number) => string, icone: (n: string) => string, aoFechar: () => void, aoAba?: () => void }} o
 */
export function criarGrimorioUI(raiz, o) {
  raiz.innerHTML = `
    <div class="painel livro" role="dialog" aria-modal="true" aria-labelledby="grimTitulo">
      <header class="livro-topo">
        <img class="livro-icone" alt="" src="${o.icone('icone-01')}">
        <h2 id="grimTitulo"></h2>
        <span class="livro-conta"></span>
        <button class="botao-icone livro-fechar" type="button">✕</button>
      </header>
      <nav class="livro-abas" role="tablist"></nav>
      <h3 class="livro-tomo"></h3>
      <div class="livro-grade rolavel" role="tabpanel"></div>
      <footer class="livro-pe"></footer>
    </div>`;
  const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (raiz.querySelector(s));
  const abas = $('.livro-abas');
  const grade = $('.livro-grade');
  let aba = 0;
  /** @type {{ G: import('../jogo/grimorio.js').Grimorio, fase: number, conhecidas: number } | null} */
  let dados = null;

  $('.livro-fechar').addEventListener('click', () => o.aoFechar());
  raiz.addEventListener('pointerdown', (e) => { if (e.target === raiz) o.aoFechar(); });

  function desenhar() {
    if (!dados) return;
    const { G, fase, conhecidas } = dados;
    $('#grimTitulo').textContent = t('grimorio');
    $('.livro-conta').textContent = t('pocoesN', { n: total(G), t: TOTAL_POCOES });
    $('.livro-fechar').setAttribute('aria-label', t('fechar'));
    abas.innerHTML = '';
    for (let k = 0; k < TOMOS; k++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'livro-aba';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(k === aba));
      const aberto = fase >= TOMO_DESDE[k];
      const n = Array.from({ length: NUM_ESSENCIAS }, (_, c) => achada(G, c, k)).filter(Boolean).length;
      b.innerHTML = aberto ? `<b>${ROMANOS[k]}</b><small>${n}/12</small>` : `<img alt="" src="${o.icone('icone-05')}"><small>${ROMANOS[k]}</small>`;
      b.setAttribute('aria-label', nomeTomo(k));
      b.addEventListener('click', () => { aba = k; if (o.aoAba) o.aoAba(); desenhar(); });
      abas.appendChild(b);
    }
    const aberto = fase >= TOMO_DESDE[aba];
    $('.livro-tomo').textContent = aberto ? nomeTomo(aba) : `${nomeTomo(aba)} · ${t('abreNaFase', { n: TOMO_DESDE[aba] })}`;
    grade.innerHTML = '';
    for (let c = 0; c < NUM_ESSENCIAS; c++) {
      const carta = document.createElement('div');
      const tem = achada(G, c, aba);
      const conhecida = c < conhecidas;
      carta.className = `carta${tem ? ' achada' : ''}${!aberto || !conhecida ? ' fechada' : ''}`;
      const img = document.createElement('img');
      img.alt = '';
      img.src = o.src(c, aba);
      img.loading = 'lazy';
      const nome = document.createElement('b');
      const sub = document.createElement('small');
      if (tem) {
        nome.textContent = nomePocao(c, aba);
        sub.textContent = t('feitasN', { n: G.feitas[c] });
      } else if (aberto && conhecida) {
        nome.textContent = '???';
        const base = aba ? REQ[aba - 1] : 0;
        const feitas = Math.max(0, Math.min(G.feitas[c], REQ[aba]) - base);
        sub.textContent = `${nomeEssencia(c)} · ${feitas}/${REQ[aba] - base}`;
      } else {
        nome.textContent = '???';
        sub.textContent = conhecida ? nomeEssencia(c) : '';
      }
      carta.append(img, nome, sub);
      grade.appendChild(carta);
    }
    $('.livro-pe').textContent = `${t('selos', { n: G.selos })} · ${t('enfeitesN', { n: enfeites(G), t: ENFEITES })}`;
  }

  return {
    /**
     * @param {import('../jogo/grimorio.js').Grimorio} G @param {number} fase @param {number} conhecidas
     * @param {number} [tomo] aba inicial (padrao: o tomo mais novo aberto)
     */
    abrir(G, fase, conhecidas, tomo) {
      dados = { G, fase, conhecidas };
      aba = tomo ?? Math.max(0, TOMO_DESDE.filter((d) => fase >= d).length - 1);
      raiz.hidden = false;
      desenhar();
      /** @type {HTMLElement} */ ($('.livro-fechar')).focus({ preventScroll: true });
    },
    fechar() { raiz.hidden = true; },
    get aberto() { return !raiz.hidden; },
  };
}
