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
 * TODO(NBR_14280_ITENS): preencher o item de cada índice a partir da norma
 * vigente. Enquanto a NBR 14280 completa não for consultada em fonte primária,
 * citamos apenas a norma — inventar número de item seria exatamente o tipo de
 * precisão falsa que o princípio III existe para impedir.
 */
const FONTE = 'ABNT NBR 14280';

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
    fonte: FONTE,
  });
}

/* -------------------------------------------------------------------------- */
/* Tempo computado — dias perdidos + dias debitados                            */
/* -------------------------------------------------------------------------- */

export interface EntradaTempoComputado {
  readonly diasPerdidos: Dias;
  readonly diasDebitados: Dias;
}

/** Valor cru do tempo computado. Usado internamente por `calcularPeriodo`. */
export function valorTempoComputado(p: EntradaTempoComputado): number {
  return p.diasPerdidos + p.diasDebitados;
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
    fonte: FONTE,
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
    fonte: FONTE,
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
    fonte: FONTE,
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
    fonte: FONTE,
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
    fonte: FONTE,
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
    fonte: FONTE,
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
    fonte: FONTE,
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
