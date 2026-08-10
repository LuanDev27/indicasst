/**
 * Tipos de fundação do IndicaSST.
 *
 * Princípio IV da constituição: nenhum número circula sem unidade declarada.
 * As marcas abaixo somem na compilação — custo zero em runtime — mas fazem
 * `taxaGravidade(dias, horas)` com os argumentos trocados virar erro de tipo.
 */

declare const marca: unique symbol;

type Marcado<T, M extends string> = T & { readonly [marca]: M };

export type Horas = Marcado<number, 'Horas'>;
export type Dias = Marcado<number, 'Dias'>;
export type Acidentes = Marcado<number, 'Acidentes'>;
export type Trabalhadores = Marcado<number, 'Trabalhadores'>;
export type Obitos = Marcado<number, 'Obitos'>;

/* -------------------------------------------------------------------------- */
/* Result — princípio VI: falha é valor, nunca exceção nem NaN.                */
/* -------------------------------------------------------------------------- */

export type Result<T, E = ErroCalculo> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly erro: E };

export type ErroCalculo =
  | { readonly tipo: 'divisao-por-zero'; readonly denominador: string }
  | {
      readonly tipo: 'amostra-insuficiente';
      readonly minimo: number;
      readonly recebido: number;
    }
  | {
      readonly tipo: 'entrada-invalida';
      readonly campo: string;
      readonly motivo: string;
    };

export function ok<T>(valor: T): Result<T, never> {
  return { ok: true, valor };
}

export function falha<E>(erro: E): Result<never, E> {
  return { ok: false, erro };
}

/* -------------------------------------------------------------------------- */
/* Índice — o contrato central                                                 */
/* -------------------------------------------------------------------------- */

/**
 * `memoria` e `fonte` são obrigatórios no tipo: um índice sem memória de
 * cálculo ou sem referência normativa não compila (princípios II e III).
 *
 * `valor` carrega precisão total e NUNCA chega arredondado. Quem arredonda é
 * `formatacao.ts`, na fronteira de exibição (princípio VI). `casas` diz quantas
 * casas decimais fazem sentido para este índice — contagens de horas e dias são
 * inteiras; taxas usam duas.
 */
export interface Indice {
  readonly nome: string;
  readonly sigla: string;
  readonly valor: number;
  readonly unidade: string;
  readonly casas: number;
  readonly memoria: string;
  readonly fonte: string;
}

/* -------------------------------------------------------------------------- */
/* Entrada do Módulo 1                                                         */
/* -------------------------------------------------------------------------- */

export interface Periodo {
  readonly trabalhadores: Trabalhadores;
  readonly horasPorDia: Horas;
  readonly diasTrabalhados: Dias;
  readonly horasExtras: Horas;
  readonly acidentesComAfastamento: Acidentes;
  readonly acidentesSemAfastamento: Acidentes;
  readonly obitos: Obitos;
  readonly diasPerdidos: Dias;
  /** Já somado a partir das ocorrências. `core/indices.ts` não conhece a tabela. */
  readonly diasDebitados: Dias;
}

/* -------------------------------------------------------------------------- */
/* Construtores validadores                                                    */
/* -------------------------------------------------------------------------- */

interface RegraUnidade {
  readonly campo: string;
  readonly inteiro: boolean;
}

function validar<T extends number>(n: number, regra: RegraUnidade): Result<T> {
  if (!Number.isFinite(n)) {
    return falha({
      tipo: 'entrada-invalida',
      campo: regra.campo,
      motivo: 'não é um número finito',
    });
  }
  if (n < 0) {
    return falha({
      tipo: 'entrada-invalida',
      campo: regra.campo,
      motivo: 'não pode ser negativo',
    });
  }
  if (regra.inteiro && !Number.isInteger(n)) {
    return falha({
      tipo: 'entrada-invalida',
      campo: regra.campo,
      motivo: 'deve ser um número inteiro',
    });
  }
  return ok(n as T);
}

export function horas(n: number): Result<Horas> {
  return validar<Horas>(n, { campo: 'horas', inteiro: false });
}

export function dias(n: number): Result<Dias> {
  return validar<Dias>(n, { campo: 'dias', inteiro: false });
}

export function acidentes(n: number): Result<Acidentes> {
  return validar<Acidentes>(n, { campo: 'acidentes', inteiro: true });
}

export function trabalhadores(n: number): Result<Trabalhadores> {
  return validar<Trabalhadores>(n, { campo: 'trabalhadores', inteiro: true });
}

export function obitos(n: number): Result<Obitos> {
  return validar<Obitos>(n, { campo: 'óbitos', inteiro: true });
}
