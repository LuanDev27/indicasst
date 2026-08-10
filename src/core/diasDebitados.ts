/**
 * Quadro 1 da ABNT NBR 14280:2001 — dias a debitar.
 *
 * Fonte dos valores: `docs/nbr-14280-extracao.md`, extraído da camada de texto de
 * um PDF público da norma e conferido contra o caso de aceite do projeto. **Não**
 * foi conferido contra exemplar adquirido da ABNT — por isso toda entrada nasce
 * com `confirmado: false` e a interface precisa dizer isso ao usuário
 * (princípio III). A tabela aqui é dado editável, não redistribuição da norma.
 *
 * Nota do próprio quadro: se o osso não é atingido, não há dias a debitar —
 * conta-se só o tempo perdido e a lesão é incapacidade temporária.
 *
 * Duas regras da norma são lógica, não tabela, e vivem em `somarDias`:
 * - **3.4.3.1** — no mesmo dedo conta-se só o osso de maior valor; dedos
 *   diferentes somam-se.
 * - **3.4.3.5** — o que a soma passar de 6 000 dias é desprezado.
 */

import { formatarInteiro } from './formatacao';
import { montarMemoria } from './memoria';
import { falha, ok, type Dias, type Result } from './tipos';

/* -------------------------------------------------------------------------- */
/* Tipos                                                                       */
/* -------------------------------------------------------------------------- */

export interface EntradaDiasDebitados {
  /** Identificador estável. É por ela que a tabela do usuário sobrescreve a padrão. */
  readonly chave: string;
  readonly grupo: string;
  readonly descricao: string;
  readonly dias: number;
  readonly fonte: string;
  /** `false` enquanto ninguém conferiu o valor num exemplar legítimo da norma. */
  readonly confirmado: boolean;
  /**
   * Dedo a que a lesão pertence. Duas entradas com o mesmo `dedo` disputam entre
   * si: só a de maior valor entra na soma (3.4.3.1).
   */
  readonly dedo?: string;
}

export type TabelaDiasDebitados = readonly EntradaDiasDebitados[];

export interface SomaDiasDebitados {
  readonly dias: Dias;
  /** As entradas que efetivamente entraram na conta. */
  readonly consideradas: TabelaDiasDebitados;
  /** As que a norma manda ignorar — repetidas ou vencidas por 3.4.3.1. */
  readonly desprezadas: TabelaDiasDebitados;
  /** Texto em pt-BR explicando cada descarte e o teto, quando houver. */
  readonly avisos: readonly string[];
  readonly memoria: string;
  /** Verdadeiro se alguma parcela veio de entrada ainda não conferida na ABNT. */
  readonly temEntradaNaoConfirmada: boolean;
}

/** Item 3.4.3.5 — o excesso é desprezado. */
export const TETO_DIAS = 6_000;

const FONTE_QUADRO_1 = 'ABNT NBR 14280:2001, quadro 1 (item 3.4.4)';
const FONTE_RODAPE = 'ABNT NBR 14280:2001, quadro 1, nota de rodapé';
const FONTE_IMPORTADA = 'Informado pelo usuário';
const GRUPO_IMPORTADO = 'Importado';

/* -------------------------------------------------------------------------- */
/* Construção da tabela padrão                                                 */
/* -------------------------------------------------------------------------- */

interface OpcoesEntrada {
  readonly dedo?: string;
  readonly fonte?: string;
}

function entrada(
  chave: string,
  grupo: string,
  descricao: string,
  dias: number,
  opcoes: OpcoesEntrada = {},
): EntradaDiasDebitados {
  return {
    chave,
    grupo,
    descricao,
    dias,
    fonte: opcoes.fonte ?? FONTE_QUADRO_1,
    confirmado: false,
    ...(opcoes.dedo === undefined ? {} : { dedo: opcoes.dedo }),
  };
}

type DedoMao = 'polegar' | 'indicador' | 'medio' | 'anular' | 'minimo';
type DedoPe = 'halux' | 'segundo' | 'terceiro' | 'quarto' | 'quinto';

/**
 * Nomes escritos como união de literais, não como `Record<string, …>`: assim o
 * compilador garante que todo dedo citado numa linha do quadro tem nome, e não
 * sobra caminho de fallback sem teste possível.
 */
const NOMES_DE_DEDO: Readonly<Record<DedoMao | DedoPe, string>> = {
  polegar: '1º quirodáctilo (polegar)',
  indicador: '2º quirodáctilo (indicador)',
  medio: '3º quirodáctilo (médio)',
  anular: '4º quirodáctilo (anular)',
  minimo: '5º quirodáctilo (mínimo)',
  halux: '1º pododáctilo (hálux)',
  segundo: '2º pododáctilo',
  terceiro: '3º pododáctilo',
  quarto: '4º pododáctilo',
  quinto: '5º pododáctilo',
};

/** Uma linha do quadro: um osso, com o valor de cada dedo que o possui. */
interface LinhaOsso {
  readonly osso: string;
  readonly rotulo: string;
  readonly valores: readonly (readonly [dedo: DedoMao | DedoPe, dias: number])[];
}

const GRUPO_MAO = 'Perda de membro — quirodáctilos';
const GRUPO_PE = 'Perda de membro — pododáctilos';

/**
 * O polegar não tem 3ª falange — por isso a linha `falange-distal` não o inclui,
 * e para ele é a 2ª falange que fica na ponta do dedo.
 */
const OSSOS_MAO: readonly LinhaOsso[] = [
  {
    osso: 'falange-distal',
    rotulo: '3ª falange (distal)',
    valores: [
      ['indicador', 100],
      ['medio', 75],
      ['anular', 60],
      ['minimo', 50],
    ],
  },
  {
    osso: 'falange-medial',
    rotulo: '2ª falange (medial)',
    valores: [
      ['polegar', 300],
      ['indicador', 200],
      ['medio', 150],
      ['anular', 120],
      ['minimo', 100],
    ],
  },
  {
    osso: 'falange-proximal',
    rotulo: '1ª falange (proximal)',
    valores: [
      ['polegar', 600],
      ['indicador', 400],
      ['medio', 300],
      ['anular', 240],
      ['minimo', 200],
    ],
  },
  {
    osso: 'metacarpiano',
    rotulo: 'metacarpiano',
    valores: [
      ['polegar', 900],
      ['indicador', 600],
      ['medio', 500],
      ['anular', 450],
      ['minimo', 400],
    ],
  },
];

const DEMAIS_PODODATILOS: readonly DedoPe[] = [
  'segundo',
  'terceiro',
  'quarto',
  'quinto',
];

/**
 * "Cada um dos demais" do quadro vira uma entrada por dedo. Não é invenção de
 * valor: é a mesma linha aplicada a cada dedo, como a norma manda — e é o que
 * permite a 3.4.3.1 funcionar, já que ela raciocina dedo a dedo.
 */
function demais(dias: number): readonly (readonly [DedoPe, number])[] {
  return DEMAIS_PODODATILOS.map((dedo) => [dedo, dias] as const);
}

const OSSOS_PE: readonly LinhaOsso[] = [
  {
    osso: 'falange-distal',
    rotulo: '3ª falange (distal)',
    valores: demais(35),
  },
  {
    osso: 'falange-medial',
    rotulo: '2ª falange (medial)',
    valores: [['halux', 150], ...demais(75)],
  },
  {
    osso: 'falange-proximal',
    rotulo: '1ª falange (proximal)',
    valores: [['halux', 300], ...demais(150)],
  },
  {
    osso: 'metatarsiano',
    rotulo: 'metatarsiano',
    valores: [['halux', 600], ...demais(350)],
  },
];

/** Nos dedos sem 3ª falange, a 2ª é que fica na ponta. Dizer isso evita erro de seleção. */
function rotuloDoOsso(linha: LinhaOsso, dedo: DedoMao | DedoPe): string {
  const semTerceiraFalange = dedo === 'polegar' || dedo === 'halux';
  if (linha.osso === 'falange-medial' && semTerceiraFalange) {
    return `${linha.rotulo}, que neste dedo é a falange da ponta`;
  }
  return linha.rotulo;
}

function linhasDeDedos(
  prefixo: string,
  grupo: string,
  ossos: readonly LinhaOsso[],
): TabelaDiasDebitados {
  return ossos.flatMap((linha) =>
    linha.valores.map(([dedo, dias]) =>
      entrada(
        `${prefixo}.${dedo}.${linha.osso}`,
        grupo,
        `Amputação — ${NOMES_DE_DEDO[dedo]}, ${rotuloDoOsso(linha, dedo)}`,
        dias,
        { dedo: `${prefixo}.${dedo}` },
      ),
    ),
  );
}

/**
 * Subconjunto do quadro 1 suficiente para o Módulo 1. Nenhum valor foi inferido:
 * o que não está na extração não está aqui.
 */
export const TABELA_PADRAO: TabelaDiasDebitados = [
  entrada('morte', 'Morte', 'Morte', 6_000, {
    fonte: 'ABNT NBR 14280:2001, quadro 1 (item 3.4.1)',
  }),
  entrada(
    'incapacidade-permanente-total',
    'Incapacidade permanente total',
    'Incapacidade permanente total',
    6_000,
    { fonte: 'ABNT NBR 14280:2001, quadro 1 (item 3.4.2)' },
  ),

  entrada(
    'braco.acima-do-punho-ate-o-cotovelo',
    'Perda de membro — membro superior',
    'Acima do punho até o cotovelo, exclusive',
    3_600,
  ),
  entrada(
    'braco.do-cotovelo-ate-o-ombro',
    'Perda de membro — membro superior',
    'Do cotovelo até a articulação do ombro, inclusive',
    4_500,
  ),
  entrada(
    'mao.no-punho',
    'Perda de membro — membro superior',
    'Mão, no punho (carpo)',
    3_000,
  ),

  ...linhasDeDedos('mao', GRUPO_MAO, OSSOS_MAO),

  entrada(
    'perna.acima-do-joelho',
    'Perda de membro — membro inferior',
    'Acima do joelho',
    4_500,
  ),
  entrada(
    'perna.acima-do-tornozelo-ate-o-joelho',
    'Perda de membro — membro inferior',
    'Acima do tornozelo até a articulação do joelho, exclusive',
    3_000,
  ),
  entrada(
    'pe.no-tornozelo',
    'Perda de membro — membro inferior',
    'Pé, no tornozelo (tarso)',
    2_400,
  ),

  ...linhasDeDedos('pe', GRUPO_PE, OSSOS_PE),

  entrada(
    'visao.um-olho',
    'Perturbação funcional',
    'Perda de visão de um olho, haja ou não visão no outro',
    1_800,
  ),
  entrada(
    'visao.ambos-os-olhos',
    'Perturbação funcional',
    'Perda de visão de ambos os olhos em um só acidente',
    6_000,
  ),
  entrada(
    'audicao.um-ouvido',
    'Perturbação funcional',
    'Perda de audição de um ouvido, haja ou não audição no outro',
    600,
  ),
  entrada(
    'audicao.ambos-os-ouvidos',
    'Perturbação funcional',
    'Perda de audição de ambos os ouvidos em um só acidente',
    3_000,
  ),

  entrada(
    'hernia-inguinal-nao-reparada',
    'Casos especiais',
    'Hérnia inguinal não reparada (reclassificar depois de reparada)',
    50,
    { fonte: FONTE_RODAPE },
  ),
];

/* -------------------------------------------------------------------------- */
/* Consulta e mesclagem                                                        */
/* -------------------------------------------------------------------------- */

export function buscar(
  tabela: TabelaDiasDebitados,
  chave: string,
): EntradaDiasDebitados | undefined {
  return tabela.find((e) => e.chave === chave);
}

/**
 * A tabela do usuário vence a padrão, chave a chave, sem perder a ordem de
 * exibição. Chaves que só existem na do usuário entram no fim.
 */
export function mesclar(
  padrao: TabelaDiasDebitados,
  usuario: TabelaDiasDebitados,
): TabelaDiasDebitados {
  const sobrescritas = new Map(usuario.map((e) => [e.chave, e]));
  const chavesDoPadrao = new Set(padrao.map((e) => e.chave));

  return [
    ...padrao.map((e) => sobrescritas.get(e.chave) ?? e),
    ...usuario.filter((e) => !chavesDoPadrao.has(e.chave)),
  ];
}

/* -------------------------------------------------------------------------- */
/* Soma — onde vivem 3.4.3.1 e 3.4.3.5                                         */
/* -------------------------------------------------------------------------- */

export function somarDias(entradas: TabelaDiasDebitados): SomaDiasDebitados {
  const avisos: string[] = [];
  const desprezadas: EntradaDiasDebitados[] = [];

  const jaVistas = new Set<string>();
  const unicas: EntradaDiasDebitados[] = [];
  for (const e of entradas) {
    if (jaVistas.has(e.chave)) {
      desprezadas.push(e);
      avisos.push(
        `"${e.descricao}" foi selecionada mais de uma vez; contamos uma só.`,
      );
      continue;
    }
    jaVistas.add(e.chave);
    unicas.push(e);
  }

  // 3.4.3.1 — por dedo, somente o osso de maior valor.
  const maiorPorDedo = new Map<string, EntradaDiasDebitados>();
  for (const e of unicas) {
    if (e.dedo === undefined) continue;
    const atual = maiorPorDedo.get(e.dedo);
    if (atual === undefined || e.dias > atual.dias) maiorPorDedo.set(e.dedo, e);
  }

  const consideradas: EntradaDiasDebitados[] = [];
  for (const e of unicas) {
    if (e.dedo !== undefined && maiorPorDedo.get(e.dedo) !== e) {
      desprezadas.push(e);
      avisos.push(
        `Item 3.4.3.1: no mesmo dedo conta-se só o osso de maior valor. ` +
          `"${e.descricao}" (${formatarInteiro(e.dias)} dias) fica de fora da soma.`,
      );
      continue;
    }
    consideradas.push(e);
  }

  const bruto = consideradas.reduce((soma, e) => soma + e.dias, 0);
  const excedeuTeto = bruto > TETO_DIAS;
  const total = excedeuTeto ? TETO_DIAS : bruto;

  if (excedeuTeto) {
    avisos.push(
      `Item 3.4.3.5: a soma chegou a ${formatarInteiro(bruto)} dias; ` +
        `o que passa de ${formatarInteiro(TETO_DIAS)} é desprezado.`,
    );
  }

  const parcelas = consideradas.map((e) => formatarInteiro(e.dias));
  const soma = parcelas.length === 0 ? '0' : parcelas.join(' + ');

  return {
    dias: total as Dias,
    consideradas,
    desprezadas,
    avisos,
    memoria: montarMemoria({
      sigla: 'Dias debitados',
      expressao: excedeuTeto
        ? `mín(${formatarInteiro(TETO_DIAS)}; ${soma})`
        : soma,
      resultado: total,
      casas: 0,
    }),
    temEntradaNaoConfirmada: consideradas.some((e) => !e.confirmado),
  };
}

/* -------------------------------------------------------------------------- */
/* Tabela do usuário                                                           */
/* -------------------------------------------------------------------------- */

function textoObrigatorio(valor: unknown, campo: string): Result<string> {
  if (typeof valor !== 'string' || valor.trim() === '') {
    return falha({
      tipo: 'entrada-invalida',
      campo,
      motivo: 'deve ser um texto não vazio',
    });
  }
  return ok(valor);
}

function textoOpcional(
  valor: unknown,
  campo: string,
  padrao: string,
): Result<string> {
  if (valor === undefined) return ok(padrao);
  return textoObrigatorio(valor, campo);
}

function diasDaEntrada(valor: unknown, campo: string): Result<number> {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    return falha({
      tipo: 'entrada-invalida',
      campo,
      motivo: 'deve ser um número',
    });
  }
  if (valor < 0) {
    return falha({
      tipo: 'entrada-invalida',
      campo,
      motivo: 'não pode ser negativo',
    });
  }
  return ok(valor);
}

/**
 * Valida uma tabela já desserializada. Ou devolve a tabela inteira, ou devolve o
 * primeiro erro com o índice do item — nunca uma tabela meio válida, porque
 * mesclar metade de um arquivo é pior do que não mesclar nada.
 */
export function validarJson(json: unknown): Result<TabelaDiasDebitados> {
  if (!Array.isArray(json)) {
    return falha({
      tipo: 'entrada-invalida',
      campo: 'tabela',
      motivo: 'deve ser uma lista de entradas',
    });
  }

  const lista: readonly unknown[] = json;
  const validadas: EntradaDiasDebitados[] = [];
  const chaves = new Set<string>();

  for (const [posicao, bruto] of lista.entries()) {
    const onde = `tabela[${posicao}]`;

    if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto)) {
      return falha({
        tipo: 'entrada-invalida',
        campo: onde,
        motivo: 'deve ser um objeto',
      });
    }
    const item = bruto as Readonly<Record<string, unknown>>;

    const chave = textoObrigatorio(item['chave'], `${onde}.chave`);
    if (!chave.ok) return chave;
    if (chaves.has(chave.valor)) {
      return falha({
        tipo: 'entrada-invalida',
        campo: `${onde}.chave`,
        motivo: `repete "${chave.valor}", que já apareceu antes no arquivo`,
      });
    }
    chaves.add(chave.valor);

    const descricao = textoObrigatorio(item['descricao'], `${onde}.descricao`);
    if (!descricao.ok) return descricao;

    const dias = diasDaEntrada(item['dias'], `${onde}.dias`);
    if (!dias.ok) return dias;

    const grupo = textoOpcional(item['grupo'], `${onde}.grupo`, GRUPO_IMPORTADO);
    if (!grupo.ok) return grupo;

    const fonte = textoOpcional(item['fonte'], `${onde}.fonte`, FONTE_IMPORTADA);
    if (!fonte.ok) return fonte;

    const confirmadoBruto = item['confirmado'];
    if (confirmadoBruto !== undefined && typeof confirmadoBruto !== 'boolean') {
      return falha({
        tipo: 'entrada-invalida',
        campo: `${onde}.confirmado`,
        motivo: 'deve ser verdadeiro ou falso',
      });
    }

    const dedoBruto = item['dedo'];
    if (dedoBruto !== undefined) {
      const dedo = textoObrigatorio(dedoBruto, `${onde}.dedo`);
      if (!dedo.ok) return dedo;
    }

    validadas.push({
      chave: chave.valor,
      grupo: grupo.valor,
      descricao: descricao.valor,
      dias: dias.valor,
      fonte: fonte.valor,
      confirmado: confirmadoBruto === true,
      ...(typeof dedoBruto === 'string' ? { dedo: dedoBruto } : {}),
    });
  }

  return ok(validadas);
}

/** `validarJson` a partir do texto cru do arquivo. JSON quebrado vira `Result`, não exceção. */
export function lerJson(texto: string): Result<TabelaDiasDebitados> {
  let cru: unknown;
  try {
    cru = JSON.parse(texto);
  } catch {
    return falha({
      tipo: 'entrada-invalida',
      campo: 'arquivo',
      motivo: 'não é um JSON válido',
    });
  }
  return validarJson(cru);
}
