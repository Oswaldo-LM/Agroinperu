export type TipoDaltonismo =
  | 'normal'
  | 'deuteranopia'
  | 'protanopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'high-contrast';

export type ModoDaltonismo = 'asistencia' | 'simulacion';

export interface InfoDaltonismo {
  id: TipoDaltonismo;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  prevalencia: string;
  conoAfectado: string;
  icono: string;
  colorMuestra: string;
  badgeTexto: string;
  recomendacion: string;
}

export const LISTA_DALTONISMO: InfoDaltonismo[] = [
  {
    id: 'normal',
    nombre: 'Visión Estándar',
    subtitulo: 'Tricromática normal',
    descripcion: 'Percepción completa de los tres colores primarios de luz (rojo, verde y azul).',
    prevalencia: 'Mayoría de la población',
    conoAfectado: 'Ninguno (conos L, M y S activos)',
    icono: 'bi-eye',
    colorMuestra: '#079B70',
    badgeTexto: 'Estándar',
    recomendacion: 'Paleta original de AGROINPERU con verde esmeralda corporativo.',
  },
  {
    id: 'deuteranopia',
    nombre: 'Deuteranopía',
    subtitulo: 'Deficiencia en verde (Cono M)',
    descripcion: 'Dificultad o incapacidad para percibir el color verde. Es el tipo más común de daltonismo.',
    prevalencia: '~5% en hombres, ~0.35% en mujeres',
    conoAfectado: 'Conos M (Luz verde ausente o mutada)',
    icono: 'bi-flower1',
    colorMuestra: '#0072B2',
    badgeTexto: 'Verde débil',
    recomendacion: 'Se sustituyen tonos verdes por azul cobalto accesible (#0072B2) y acentos ámbar contrastantes.',
  },
  {
    id: 'protanopia',
    nombre: 'Protanopía',
    subtitulo: 'Deficiencia en rojo (Cono L)',
    descripcion: 'Dificultad o incapacidad para percibir el color rojo. El rojo se percibe muy oscuro o amarronado.',
    prevalencia: '~1% en hombres, ~0.02% en mujeres',
    conoAfectado: 'Conos L (Luz roja ausente o mutada)',
    icono: 'bi-sun',
    colorMuestra: '#D55E00',
    badgeTexto: 'Rojo débil',
    recomendacion: 'Rojos críticos sustituidos por bermellón vibrante (#D55E00) con bordes reforzados y turquesa puro.',
  },
  {
    id: 'tritanopia',
    nombre: 'Tritanopía',
    subtitulo: 'Deficiencia en azul (Cono S)',
    descripcion: 'Dificultad para distinguir azul de verde y amarillo de violeta o rosa.',
    prevalencia: '~0.01% (muy infrecuente)',
    conoAfectado: 'Conos S (Luz azul ausente)',
    icono: 'bi-droplet-half',
    colorMuestra: '#CC79A7',
    badgeTexto: 'Azul/Amarillo débil',
    recomendacion: 'Paleta balanceada en magenta brillante (#CC79A7), verde menta puro y tonos cálidos bien diferenciados.',
  },
  {
    id: 'achromatopsia',
    nombre: 'Acromatopsia',
    subtitulo: 'Monocromatismo total',
    descripcion: 'Ausencia total de percepción del color. El usuario percibe el mundo exclusivamente en escala de grises y luminosidad.',
    prevalencia: '~0.003% (1 de cada 30,000 personas)',
    conoAfectado: 'Todos los conos inactivos (solo bastones)',
    icono: 'bi-circle-half',
    colorMuestra: '#475569',
    badgeTexto: 'Escala de grises',
    recomendacion: 'Máxima relación de contraste blanco/negro con texturas, subrayados e iconografía obligatoria en cada estado.',
  },
  {
    id: 'high-contrast',
    nombre: 'Alto Contraste',
    subtitulo: 'Daltonismo severo / Baja visión',
    descripcion: 'Diseño reforzado con contraste superior a 7:1 (WCAG AAA), bordes gruesos y acentos amarillos de alta luminosidad.',
    prevalencia: 'Accesibilidad universal',
    conoAfectado: 'Recomendado para visión reducida y fatiga visual',
    icono: 'bi-brightness-high-fill',
    colorMuestra: '#F59E0B',
    badgeTexto: 'WCAG AAA',
    recomendacion: 'Fondo de alto contraste con tipografía ultra nítida, líneas de división reforzadas y bordes notorios.',
  },
];
