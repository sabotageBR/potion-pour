// [kit multiportal] Textos em pt (pt-BR), en e es. O idioma vem do portal (portal.idioma: 'pt-BR' | 'en'
// | 'es'; vazio na Poki, e ai vale o do navegador), nunca so do navegador no californiagames.io. Ingles e
// obrigatorio na CrazyGames: na duvida, en.
// No HTML, data-t="chave" troca o textContent e data-t-aria="chave" o aria-label.
// Nomes das pocoes, essencias e tomos: src/i18n/pocoes.js.

/** @typedef {'pt'|'en'|'es'} Idioma */

export const TEXTOS = {
  pt: {
    titulo: 'Purr & Pour',
    continuar: 'Continuar',
    seguir: 'Continuar ▶',
    pausa: 'Pausa',
    som: 'Som',
    recomecar: 'Recomeçar a fase',
    fase: 'Fase {n}',
    muitoBem: 'Muito bem!',
    perfeito: 'Perfeito!',
    incrivel: 'Incrível!',
    desfazer: 'Desfazer',
    extra: 'Frasco extra',
    dica: 'Dica do Miso',
    grimorio: 'Grimório',
    fechar: 'Fechar',
    novaPocao: 'Nova poção!',
    novaEssencia: 'Nova essência: {nome}',
    novoEnfeite: 'Enfeite novo no laboratório!',
    novoTomo: 'Página nova no Grimório: {nome}',
    proxima: 'Próxima',
    pocoesN: '{n}/{t} poções',
    feitasN: 'feita {n}×',
    falta: 'faltam {n}',
    diaria: 'Poção do Dia!',
    diariaDica: 'Complete o frasco dourado para carimbar o dia',
    selos: 'Selos do dia: {n}',
    tut1: 'Toque num frasco e depois noutro',
    tut2: 'Só cai em cima da mesma cor ou no vazio',
    tut3: 'Errou? Desfaça!',
    tutOculta: 'O "?" aparece quando fica no topo',
    tutRolha: 'A rolha abre quando a poção dessa cor fica pronta',
    tutGelo: 'O gelo derrete depois de alguns despejos',
    tutCaldeirao: 'O caldeirão cabe 6 camadas',
    tutExtra: 'Ganhe um frasco vazio',
    extraTitulo: 'Mais um frasco?',
    extraTexto: 'Assista a um vídeo para ganhar outro frasco vazio, ou recomece a fase de graça.',
    extraVideo: 'Mais um frasco',
    semVideo: 'Sem vídeo agora',
    miau: 'Miau!',
    semSaida: 'Ops, sem saída por aqui',
    voltando: 'Bem-vindo de volta!',
    fim: 'Grimório completo! Você é mestre alquimista.',
    abreNaFase: 'abre na fase {n}',
    enfeitesN: '{n}/{t} enfeites',
    semDesfazer: 'Sem desfazer nesta fase',
  },
  en: {
    titulo: 'Purr & Pour',
    continuar: 'Continue',
    seguir: 'Continue ▶',
    pausa: 'Paused',
    som: 'Sound',
    recomecar: 'Restart level',
    fase: 'Level {n}',
    muitoBem: 'Great!',
    perfeito: 'Perfect!',
    incrivel: 'Amazing!',
    desfazer: 'Undo',
    extra: 'Extra flask',
    dica: "Miso's hint",
    grimorio: 'Grimoire',
    fechar: 'Close',
    novaPocao: 'New potion!',
    novaEssencia: 'New essence: {nome}',
    novoEnfeite: 'New decoration in the lab!',
    novoTomo: 'New Grimoire chapter: {nome}',
    proxima: 'Next',
    pocoesN: '{n}/{t} potions',
    feitasN: 'brewed {n}×',
    falta: '{n} to go',
    diaria: 'Potion of the Day!',
    diariaDica: 'Fill the golden flask to stamp today',
    selos: 'Daily stamps: {n}',
    tut1: 'Tap a flask, then another',
    tut2: 'It only pours onto the same color or into an empty flask',
    tut3: 'Oops? Undo!',
    tutOculta: 'The "?" shows up when it reaches the top',
    tutRolha: 'The cork pops when that color is brewed',
    tutGelo: 'The ice melts after a few pours',
    tutCaldeirao: 'The cauldron holds 6 layers',
    tutExtra: 'Get an empty flask',
    extraTitulo: 'One more flask?',
    extraTexto: 'Watch a video to get another empty flask, or restart the level for free.',
    extraVideo: 'One more flask',
    semVideo: 'No video right now',
    miau: 'Meow!',
    semSaida: 'Oops, no way out here',
    voltando: 'Welcome back!',
    fim: 'Grimoire complete! You are a master alchemist.',
    abreNaFase: 'opens at level {n}',
    enfeitesN: '{n}/{t} decorations',
    semDesfazer: 'No undos left this level',
  },
  es: {
    titulo: 'Purr & Pour',
    continuar: 'Continuar',
    seguir: 'Continuar ▶',
    pausa: 'Pausa',
    som: 'Sonido',
    recomecar: 'Reiniciar nivel',
    fase: 'Nivel {n}',
    muitoBem: '¡Muy bien!',
    perfeito: '¡Perfecto!',
    incrivel: '¡Increíble!',
    desfazer: 'Deshacer',
    extra: 'Frasco extra',
    dica: 'Pista de Miso',
    grimorio: 'Grimorio',
    fechar: 'Cerrar',
    novaPocao: '¡Nueva poción!',
    novaEssencia: 'Nueva esencia: {nome}',
    novoEnfeite: '¡Nuevo adorno en el laboratorio!',
    novoTomo: 'Capítulo nuevo del Grimorio: {nome}',
    proxima: 'Próxima',
    pocoesN: '{n}/{t} pociones',
    feitasN: 'hecha {n}×',
    falta: 'faltan {n}',
    diaria: '¡Poción del Día!',
    diariaDica: 'Completa el frasco dorado para sellar el día',
    selos: 'Sellos del día: {n}',
    tut1: 'Toca un frasco y luego otro',
    tut2: 'Solo cae sobre el mismo color o en un frasco vacío',
    tut3: '¿Fallaste? ¡Deshaz!',
    tutOculta: 'El "?" aparece cuando queda arriba',
    tutRolha: 'El corcho salta cuando esa poción está lista',
    tutGelo: 'El hielo se derrite tras unos vertidos',
    tutCaldeirao: 'El caldero tiene 6 capas',
    tutExtra: 'Consigue un frasco vacío',
    extraTitulo: '¿Un frasco más?',
    extraTexto: 'Mira un video para ganar otro frasco vacío, o reinicia el nivel gratis.',
    extraVideo: 'Un frasco más',
    semVideo: 'Sin video ahora',
    miau: '¡Miau!',
    semSaida: 'Uy, no hay salida por aquí',
    voltando: '¡Bienvenido de nuevo!',
    fim: '¡Grimorio completo! Eres maestro alquimista.',
    abreNaFase: 'se abre en el nivel {n}',
    enfeitesN: '{n}/{t} adornos',
    semDesfazer: 'Sin deshacer en este nivel',
  },
};

/**
 * 'pt-BR', 'pt', 'es-419', 'en-US'... -> pt | en | es (o resto vira en).
 * @param {string} codigo
 * @returns {Idioma}
 */
export function escolherIdioma(codigo) {
  const c = String(codigo || '').toLowerCase();
  if (c.startsWith('pt')) return 'pt';
  if (c.startsWith('es')) return 'es';
  return 'en';
}

/** @type {Idioma} */
let atual = 'en';

/** @param {Idioma} i */
export function definirIdioma(i) {
  atual = TEXTOS[i] ? i : 'en';
}

export const idioma = () => atual;

/**
 * @param {string} chave
 * @param {Record<string, string|number>} [vars]
 */
export function t(chave, vars) {
  const tabela = /** @type {Record<string, string>} */ (TEXTOS[atual]);
  let s = tabela[chave] ?? /** @type {Record<string, string>} */ (TEXTOS.en)[chave] ?? chave;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** @param {ParentNode} raiz */
export function aplicarTextos(raiz) {
  for (const el of raiz.querySelectorAll('[data-t]')) el.textContent = t(/** @type {string} */ (el.getAttribute('data-t')));
  for (const el of raiz.querySelectorAll('[data-t-aria]')) el.setAttribute('aria-label', t(/** @type {string} */ (el.getAttribute('data-t-aria'))));
}
