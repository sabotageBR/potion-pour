// Nomes das 12 essencias, dos 5 tomos e das 60 pocoes do Grimorio (pt, en, es). A pocao (cor, tomo) fica
// em POCOES[cor][tomo]. Nomes de brincadeira, para toda a familia.
import { idioma } from './textos.js';

/** @typedef {[string, string, string]} Tri pt, en, es */

/** @type {Tri[]} */
export const ESSENCIA_NOME = [
  ['Fogo de Dragão', 'Dragon Fire', 'Fuego de Dragón'],
  ['Lágrima de Sereia', 'Mermaid Tear', 'Lágrima de Sirena'],
  ['Mel de Fada', 'Fairy Honey', 'Miel de Hada'],
  ['Gosma de Sapo', 'Frog Goo', 'Baba de Sapo'],
  ['Pó de Bruxa', 'Witch Dust', 'Polvo de Bruja'],
  ['Suco de Abóbora', 'Pumpkin Juice', 'Jugo de Calabaza'],
  ['Algodão de Unicórnio', 'Unicorn Fluff', 'Algodón de Unicornio'],
  ['Lagoa Encantada', 'Enchanted Pond', 'Laguna Encantada'],
  ['Leite de Nuvem', 'Cloud Milk', 'Leche de Nube'],
  ['Chocolate de Troll', 'Troll Cocoa', 'Chocolate de Trol'],
  ['Suco de Cacto', 'Cactus Juice', 'Jugo de Cactus'],
  ['Fumaça de Corvo', 'Raven Smoke', 'Humo de Cuervo'],
];

/** @type {Tri[]} */
export const TOMO_NOME = [
  ['Tomo I · Básico', 'Tome I · Basics', 'Tomo I · Básico'],
  ['Tomo II · Névoa', 'Tome II · Mist', 'Tomo II · Niebla'],
  ['Tomo III · Selado', 'Tome III · Sealed', 'Tomo III · Sellado'],
  ['Tomo IV · Gelo', 'Tome IV · Ice', 'Tomo IV · Hielo'],
  ['Tomo V · Caldeirão', 'Tome V · Cauldron', 'Tomo V · Caldero'],
];

/** @type {Tri[][]} */
export const POCOES = [
  [
    ['Elixir do Espirro de Fogo', 'Fire Sneeze Elixir', 'Elixir del Estornudo de Fuego'],
    ['Névoa do Bafo Quentinho', 'Warm Breath Mist', 'Niebla del Aliento Calentito'],
    ['Tônico do Cabelo em Chamas', 'Flaming Hair Tonic', 'Tónico del Pelo en Llamas'],
    ['Sorvete de Lava', 'Lava Sorbet', 'Helado de Lava'],
    ['Sopa do Vulcão Rabugento', 'Grumpy Volcano Soup', 'Sopa del Volcán Gruñón'],
  ],
  [
    ['Gotas do Choro Cantado', 'Singing Sob Drops', 'Gotas del Llanto Cantado'],
    ['Neblina de Maré Baixa', 'Low Tide Haze', 'Bruma de Marea Baja'],
    ['Elixir de Guelras Temporárias', 'Temporary Gills Elixir', 'Elixir de Branquias Temporales'],
    ['Raspadinha de Iceberg', 'Iceberg Slushie', 'Granizado de Iceberg'],
    ['Caldo do Polvo Dançarino', 'Dancing Octopus Broth', 'Caldo del Pulpo Bailarín'],
  ],
  [
    ['Xarope do Brilho Instantâneo', 'Instant Sparkle Syrup', 'Jarabe del Brillo Instantáneo'],
    ['Poeira de Asa Sonolenta', 'Sleepy Wing Dust', 'Polvo de Ala Dormilona'],
    ['Mel do Riso sem Fim', 'Endless Giggle Honey', 'Miel de la Risa sin Fin'],
    ['Picolé de Raio de Sol', 'Sunbeam Popsicle', 'Paleta de Rayo de Sol'],
    ['Ensopado de Purpurina', 'Glitter Stew', 'Guiso de Purpurina'],
  ],
  [
    ['Gosma do Pulo Alto', 'High Jump Goo', 'Baba del Salto Alto'],
    ['Vapor de Brejo Perfumado', 'Perfumed Swamp Vapor', 'Vapor de Pantano Perfumado'],
    ['Tônico do Coaxar Afinado', 'In-Tune Croak Tonic', 'Tónico del Croar Afinado'],
    ['Raspadinha de Vitória-Régia', 'Lily Pad Slushie', 'Granizado de Nenúfar'],
    ['Sopa da Língua Comprida', 'Long Tongue Soup', 'Sopa de la Lengua Larga'],
  ],
  [
    ['Pó do Chapéu Falante', 'Talking Hat Powder', 'Polvo del Sombrero Parlante'],
    ['Névoa do Sumiço Parcial', 'Partial Vanish Fog', 'Niebla de la Desaparición Parcial'],
    ['Elixir da Vassoura Turbo', 'Turbo Broom Elixir', 'Elixir de la Escoba Turbo'],
    ['Cubos do Feitiço Gelado', 'Frosty Hex Cubes', 'Cubitos del Hechizo Helado'],
    ['Ensopado de Estrela Cadente', 'Shooting Star Stew', 'Guiso de Estrella Fugaz'],
  ],
  [
    ['Suco do Sorriso Torto', 'Crooked Grin Juice', 'Jugo de la Sonrisa Torcida'],
    ['Névoa do Halloween Adiantado', 'Early Halloween Mist', 'Niebla del Halloween Adelantado'],
    ['Tônico da Carruagem da Meia-Noite', 'Midnight Carriage Tonic', 'Tónico del Carruaje de Medianoche'],
    ['Sorvete de Torta Mágica', 'Magic Pie Ice Cream', 'Helado de Tarta Mágica'],
    ['Sopa do Espantalho Feliz', 'Happy Scarecrow Soup', 'Sopa del Espantapájaros Feliz'],
  ],
  [
    ['Algodão do Arco-Íris Fofo', 'Fluffy Rainbow Floss', 'Algodón del Arcoíris Esponjoso'],
    ['Névoa da Bochecha Corada', 'Blushing Cheek Mist', 'Niebla de Mejillas Sonrojadas'],
    ['Elixir do Chifre Brilhante', 'Shiny Horn Elixir', 'Elixir del Cuerno Brillante'],
    ['Sorvete de Nuvem Rosa', 'Pink Cloud Gelato', 'Helado de Nube Rosa'],
    ['Calda do Galope Saltitante', 'Bouncy Gallop Syrup', 'Almíbar del Galope Saltarín'],
  ],
  [
    ['Água do Reflexo Piscante', 'Winking Reflection Water', 'Agua del Reflejo Guiñador'],
    ['Bruma do Peixe Fantasma', 'Ghost Fish Mist', 'Bruma del Pez Fantasma'],
    ['Elixir do Nado de Pato', 'Duck Paddle Elixir', 'Elixir del Nado de Pato'],
    ['Cristais de Orvalho', 'Dewdrop Crystals', 'Cristales de Rocío'],
    ['Caldo da Bolha Gigante', 'Giant Bubble Broth', 'Caldo de la Burbuja Gigante'],
  ],
  [
    ['Leite do Cochilo Flutuante', 'Floating Nap Milk', 'Leche de la Siesta Flotante'],
    ['Névoa do Travesseiro', 'Pillow Fog', 'Niebla de Almohada'],
    ['Elixir da Leveza Total', 'Total Lightness Elixir', 'Elixir de Ligereza Total'],
    ['Neve de Bigode de Gato', 'Cat Whisker Snow', 'Nieve de Bigote de Gato'],
    ['Mingau do Céu Nublado', 'Cloudy Sky Porridge', 'Gachas del Cielo Nublado'],
  ],
  [
    ['Chocolate do Arroto Educado', 'Polite Burp Cocoa', 'Chocolate del Eructo Educado'],
    ['Fumaça da Ponte Velha', 'Old Bridge Fumes', 'Humo del Puente Viejo'],
    ['Tônico da Força de Pedra', 'Stone Strength Tonic', 'Tónico de Fuerza de Piedra'],
    ['Picolé de Lama Doce', 'Sweet Mud Popsicle', 'Paleta de Barro Dulce'],
    ['Sopa da Meia Perdida', 'Lost Sock Soup', 'Sopa del Calcetín Perdido'],
  ],
  [
    ['Suco do Espinho Risonho', 'Giggling Spike Juice', 'Jugo de la Espina Risueña'],
    ['Miragem Engarrafada', 'Bottled Mirage', 'Espejismo Embotellado'],
    ['Elixir da Flor do Deserto', 'Desert Bloom Elixir', 'Elixir de la Flor del Desierto'],
    ['Raspadinha de Oásis', 'Oasis Slushie', 'Granizado de Oasis'],
    ['Sopa do Coiote Cansado', 'Tired Coyote Soup', 'Sopa del Coyote Cansado'],
  ],
  [
    ['Fumaça do Grasnado Grave', 'Deep Caw Smoke', 'Humo del Graznido Grave'],
    ['Sombra de Bolso', 'Pocket Shadow', 'Sombra de Bolsillo'],
    ['Elixir das Penas Brilhosas', 'Glossy Feather Elixir', 'Elixir de Plumas Brillantes'],
    ['Granizo da Meia-Noite', 'Midnight Hail', 'Granizo de Medianoche'],
    ['Caldo do Segredo Sussurrado', 'Whispered Secret Broth', 'Caldo del Secreto Susurrado'],
  ],
];

/** @param {Tri} tri */
const no = (tri) => tri[{ pt: 0, en: 1, es: 2 }[idioma()] ?? 1];

/** @param {number} cor @param {number} tomo */
export const nomePocao = (cor, tomo) => no(POCOES[cor][tomo]);
/** @param {number} cor */
export const nomeEssencia = (cor) => no(ESSENCIA_NOME[cor]);
/** @param {number} tomo */
export const nomeTomo = (tomo) => no(TOMO_NOME[tomo]);
