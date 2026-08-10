/**
 * Índices estatísticos de segurança do trabalho — ABNT NBR 14280.
 *
 * Funções puras. Nenhum import de React. Nenhum arredondamento: o campo `valor`
 * de cada `Indice` sai em precisão total e só é arredondado em `formatacao.ts`,
 * na hora de exibir.
 *
 * Toda divisão cujo denominador pode ser zero devolve `Result` com erro — nunca
 * `Infinity`, nunca `NaN`, nunca zero silencioso (princípio VI, FR-005).
 */

import { formatarInteiro } from './formatacao';
import { montarMemoria } from './memoria';
import {
  falha,
  ok,
  type Acidentes,
  type Dias,
  type Horas,
  type Indice,
  type Obitos,
  type Periodo,
  type Result,
  type Trabalhadores,
} from './tipos';

/**
 * Itens conferidos no texto da norma e registrados em
 * `docs/nbr-14280-extracao.md`. Três índices deste módulo **não** são da NBR
 * 14280 — dizer que são seria a precisão falsa que o princípio III existe para
 * impedir, então eles citam a origem real e carregam `nota`.
 */
const NBR = 'ABNT NBR 14280:2001';

const FONTE_HHT = `${NBR}, itens 2.10 (definição) e 3.2 (cálculo)`;
const FONTE_TC = `${NBR}, itens 2.9.8 e 3.5`;
const FONTE_TF = `${NBR}, item 3.6.1.2 — taxa de frequência de acidentados com lesão com afastamento`;
const FONTE_TG = `${NBR}, item 3.6.2`;
const FONTE_MDP = `${NBR}, itens 3.6.3.1 a 3.6.3.3 — medidas optativas de avaliação da gravidade`;
const FONTE_PREVIDENCIA =
  'Indicador da Previdência Social (Anuário Estatístico de Acidentes do Trabalho) — não consta da ABNT NBR 14280';
const FONTE_EPIDEMIOLOGICA =
  'Indicador epidemiológico e previdenciário de uso corrente — não consta da ABNT NBR 14280';

const NOTA_FORA_DA_NORMA =
  'Este índice não está na NBR 14280, que trata de frequência e gravidade. ' +
  'Serve para comparar com dados da Previdência Social — não o apresente como índice normalizado da ABNT.';

/**
 * A norma manda contar, num mesmo acidente com morte ou incapacidade permanente,
 * só o tempo debitado (3.5 e nota de 3.6.2). Somar aqui é correto porque este é o
 * total de um período: os dias perdidos costumam vir de outros acidentes. Quando
 * vierem do mesmo, use `valorTempoComputadoDoAcidente`.
 */
const NOTA_TC =
  'Itens 3.5 e nota de 3.6.2: dentro de um mesmo acidente com morte ou incapacidade permanente, ' +
  'conta-se apenas o tempo debitado — a menos que os dias perdidos o excedam. ' +
  'Esta soma é do período inteiro e pressupõe que perdidos e debitados vêm de acidentes distintos.';

const NOTA_TF =
  'A norma distingue a taxa de frequência de acidentes (3.6.1.1) da taxa de acidentados com lesão ' +
  'com afastamento (3.6.1.2). Este cálculo é a segunda. Acidentes sem afastamento têm taxa própria ' +
  '(3.6.1.3) e devem ser apresentados em separado.';

const MILHAO = 1_000_000;
const CEM_MIL = 100_000;
const MIL = 1_000;

/** Casas decimais de exibição por natureza do índice. */
const CASAS_CONTAGEM = 0;
const CASAS_TAXA = 2;

function dividir(
  numerador: number,
  denominador: number,
  nomeDenominador: string,
): Result<number> {
  if (denominador === 0) {
    return falha({ tipo: 'divisao-por-zero', denominador: nomeDenominador });
  }
  return ok(numerador / denominador);
}

/* -------------------------------------------------------------------------- */
/* HHT — homem-hora de exposição ao risco                                      */
/* -------------------------------------------------------------------------- */

export interface EntradaHht {
  readonly trabalhadores: Trabalhadores;
  readonly horasPorDia: Horas;
  readonly diasTrabalhados: Dias;
  readonly horasExtras: Horas;
}

/** Valor cru do HHT, sem embrulho. Usado internamente por `calcularPeriodo`. */
export function valorHht(p: EntradaHht): number {
  return p.trabalhadores * p.horasPorDia * p.diasTrabalhados + p.horasExtras;
}

export function hht(p: EntradaHht): Result<Indice> {
  const valor = valorHht(p);
  const expressao =
    `(${formatarInteiro(p.trabalhadores)} × ${formatarInteiro(p.horasPorDia)}` +
    ` × ${formatarInteiro(p.diasTrabalhados)}) + ${formatarInteiro(p.horasExtras)}`;

  return ok({
    nome: 'Homem-hora trabalhado',
    sigla: 'HHT',
    valor,
    unidade: 'homem-hora',
    casas: CASAS_CONTAGEM,
    memoria: montarMemoria({
      sigla: 'HHT',
      expressao,
      resultado: valor,
      casas: CASAS_CONTAGEM,
    }),
    fonte: FONTE_HHT,
  });
}

/* -------------------------------------------------------------------------- */
/* Tempo computado — dias perdidos + dias debitados                            */
/* -------------------------------------------------------------------------- */

export interface EntradaTempoComputado {
  readonly diasPerdidos: Dias;
  readonly diasDebitados: Dias;
}

/** Valor cru do tempo computado do período. Usado internamente por `calcularPeriodo`. */
export function valorTempoComputado(p: EntradaTempoComputado): number {
  return p.diasPerdidos + p.diasDebitados;
}

/**
 * Tempo computado de **um** acidente, com a regra de 3.5 e da nota de 3.6.2: onde
 * houve morte ou incapacidade permanente, conta-se só o tempo debitado, salvo se
 * os dias perdidos o excederem. Sem dias debitados, é o tempo perdido puro.
 *
 * Não é o que `calcularPeriodo` usa — lá a soma é do período. Esta função existe
 * para quem lança acidente a acidente, e para que a regra seja código testado em
 * vez de comentário.
 */
export function valorTempoComputadoDoAcidente(p: EntradaTempoComputado): number {
  if (p.diasDebitados === 0) return p.diasPerdidos;
  return Math.max(p.diasDebitados, p.diasPerdidos);
}

export function tempoComputado(p: EntradaTempoComputado): Result<Indice> {
  const valor = valorTempoComputado(p);

  return ok({
    nome: 'Tempo computado',
    sigla: 'TC',
    valor,
    unidade: 'dias',
    casas: CASAS_CONTAGEM,
    memoria: montarMemoria({
      sigla: 'TC',
      expressao: `${formatarInteiro(p.diasPerdidos)} + ${formatarInteiro(p.diasDebitados)}`,
      resultado: valor,
      casas: CASAS_CONTAGEM,
    }),
    fonte: FONTE_TC,
    nota: NOTA_TC,
  });
}

/* -------------------------------------------------------------------------- */
/* Taxas                                                                       */
/* -------------------------------------------------------------------------- */

export function taxaFrequencia(p: {
  readonly acidentesComAfastamento: Acidentes;
  readonly hht: number;
}): Result<Indice> {
  const divisao = dividir(p.acidentesComAfastamento * MILHAO, p.hht, 'o HHT');
  if (!divisao.ok) return divisao;

  const expressao =
    `(${formatarInteiro(p.acidentesComAfastamento)} × ${formatarInteiro(MILHAO)})` +
    ` ÷ ${formatarInteiro(p.hht)}`;

  return ok({
    nome: 'Taxa de Frequência',
    sigla: 'TF',
    valor: divisao.valor,
    unidade: 'acidentes com afastamento por milhão de HHT',
    casas: CASAS_TAXA,
    memoria: montarMemoria({ sigla: 'TF', expressao, resultado: divisao.valor }),
    fonte: FONTE_TF,
    nota: NOTA_TF,
  });
}

export function taxaGravidade(p: {
  readonly tempoComputado: number;
  readonly hht: number;
}): Result<Indice> {
  const divisao = dividir(p.tempoComputado * MILHAO, p.hht, 'o HHT');
  if (!divisao.ok) return divisao;

  const expressao =
    `(${formatarInteiro(p.tempoComputado)} × ${formatarInteiro(MILHAO)})` +
    ` ÷ ${formatarInteiro(p.hht)}`;

  return ok({
    nome: 'Taxa de Gravidade',
    sigla: 'TG',
    valor: divisao.valor,
    unidade: 'dias computados por milhão de HHT',
    casas: CASAS_TAXA,
    memoria: montarMemoria({ sigla: 'TG', expressao, resultado: divisao.valor }),
    fonte: FONTE_TG,
    // Divergência real entre a norma e o critério de aceite do projeto (SC-001).
    // Mostramos as duas leituras em vez de escolher uma em silêncio.
    nota:
      `O item 3.6.2 manda expressar a taxa de gravidade em números inteiros: ` +
      `${formatarInteiro(divisao.valor)}. Exibimos duas casas porque é o critério ` +
      `acordado do projeto e o que o material didático usa — o valor da norma está aqui ao lado.`,
  });
}

export function taxaIncidencia(p: {
  readonly acidentes: Acidentes;
  readonly trabalhadores: Trabalhadores;
}): Result<Indice> {
  const divisao = dividir(
    p.acidentes * MIL,
    p.trabalhadores,
    'o número de trabalhadores',
  );
  if (!divisao.ok) return divisao;

  const expressao =
    `(${formatarInteiro(p.acidentes)} × ${formatarInteiro(MIL)})` +
    ` ÷ ${formatarInteiro(p.trabalhadores)}`;

  return ok({
    nome: 'Taxa de Incidência',
    sigla: 'TI',
    valor: divisao.valor,
    unidade: 'acidentes por mil trabalhadores',
    casas: CASAS_TAXA,
    memoria: montarMemoria({ sigla: 'TI', expressao, resultado: divisao.valor }),
    fonte: FONTE_PREVIDENCIA,
    nota: NOTA_FORA_DA_NORMA,
  });
}

export function mediaDiasPerdidos(p: {
  readonly tempoComputado: number;
  readonly acidentados: Acidentes;
}): Result<Indice> {
  const divisao = dividir(
    p.tempoComputado,
    p.acidentados,
    'o número de acidentados',
  );
  if (!divisao.ok) return divisao;

  const expressao = `${formatarInteiro(p.tempoComputado)} ÷ ${formatarInteiro(p.acidentados)}`;

  return ok({
    nome: 'Média de dias perdidos',
    sigla: 'MDP',
    valor: divisao.valor,
    unidade: 'dias por acidentado',
    casas: CASAS_TAXA,
    memoria: montarMemoria({ sigla: 'MDP', expressao, resultado: divisao.valor }),
    fonte: FONTE_MDP,
  });
}

export function mortalidade(p: {
  readonly obitos: Obitos;
  readonly trabalhadores: Trabalhadores;
}): Result<Indice> {
  const divisao = dividir(
    p.obitos * CEM_MIL,
    p.trabalhadores,
    'o número de trabalhadores',
  );
  if (!divisao.ok) return divisao;

  const expressao =
    `(${formatarInteiro(p.obitos)} × ${formatarInteiro(CEM_MIL)})` +
    ` ÷ ${formatarInteiro(p.trabalhadores)}`;

  return ok({
    nome: 'Taxa de Mortalidade',
    sigla: 'TM',
    valor: divisao.valor,
    unidade: 'óbitos por cem mil trabalhadores',
    casas: CASAS_TAXA,
    memoria: montarMemoria({ sigla: 'TM', expressao, resultado: divisao.valor }),
    fonte: FONTE_EPIDEMIOLOGICA,
    nota: NOTA_FORA_DA_NORMA,
  });
}

export function letalidade(p: {
  readonly obitos: Obitos;
  readonly acidentes: Acidentes;
}): Result<Indice> {
  const divisao = dividir(p.obitos * MIL, p.acidentes, 'o número de acidentes');
  if (!divisao.ok) return divisao;

  const expressao =
    `(${formatarInteiro(p.obitos)} × ${formatarInteiro(MIL)})` +
    ` ÷ ${formatarInteiro(p.acidentes)}`;

  return ok({
    nome: 'Taxa de Letalidade',
    sigla: 'TL',
    valor: divisao.valor,
    unidade: 'óbitos por mil acidentes',
    casas: CASAS_TAXA,
    memoria: montarMemoria({ sigla: 'TL', expressao, resultado: divisao.valor }),
    fonte: FONTE_EPIDEMIOLOGICA,
    nota: NOTA_FORA_DA_NORMA,
  });
}

/* -------------------------------------------------------------------------- */
/* Agregado                                                                    */
/* -------------------------------------------------------------------------- */

export interface ResultadoPeriodo {
  readonly hht: Result<Indice>;
  readonly tempoComputado: Result<Indice>;
  readonly taxaFrequencia: Result<Indice>;
  readonly taxaGravidade: Result<Indice>;
  readonly taxaIncidencia: Result<Indice>;
  readonly mediaDiasPerdidos: Result<Indice>;
  readonly mortalidade: Result<Indice>;
  readonly letalidade: Result<Indice>;
}

/**
 * Calcula os oito índices de um período.
 *
 * Quando o HHT falha, as taxas que dependem dele propagam o mesmo erro — a UI
 * exibe a explicação em vez de um número, e nenhum `NaN` alcança a tela.
 */
export function calcularPeriodo(p: Periodo): ResultadoPeriodo {
  const totalHht = valorHht(p);
  const totalTc = valorTempoComputado(p);

  const totalAcidentes = (p.acidentesComAfastamento +
    p.acidentesSemAfastamento) as Acidentes;

  return {
    hht: hht(p),
    tempoComputado: tempoComputado(p),
    taxaFrequencia: taxaFrequencia({
      acidentesComAfastamento: p.acidentesComAfastamento,
      hht: totalHht,
    }),
    taxaGravidade: taxaGravidade({ tempoComputado: totalTc, hht: totalHht }),
    taxaIncidencia: taxaIncidencia({
      acidentes: totalAcidentes,
      trabalhadores: p.trabalhadores,
    }),
    mediaDiasPerdidos: mediaDiasPerdidos({
      tempoComputado: totalTc,
      acidentados: p.acidentesComAfastamento,
    }),
    mortalidade: mortalidade({
      obitos: p.obitos,
      trabalhadores: p.trabalhadores,
    }),
    letalidade: letalidade({ obitos: p.obitos, acidentes: totalAcidentes }),
  };
}
