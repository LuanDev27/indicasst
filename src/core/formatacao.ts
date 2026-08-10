/**
 * ÚNICA fonte de arredondamento e de formato numérico do projeto.
 *
 * Princípio VI: cálculos internos em precisão total; arredondamento apenas na
 * exibição. Princípio VIII: formato numérico brasileiro.
 *
 * Nenhum outro arquivo de `src/core/` pode chamar `toFixed` ou
 * `Intl.NumberFormat` — `arquitetura.test.ts` falha se algum chamar.
 */

import type { ErroCalculo } from './tipos';

const CASAS_PADRAO = 2;

function formatador(casas: number): Intl.NumberFormat {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** `1785.714285` → `"1.785,71"` */
export function formatarNumero(valor: number, casas: number = CASAS_PADRAO): string {
  return formatador(casas).format(valor);
}

/** `403200` → `"403.200"` */
export function formatarInteiro(valor: number): string {
  return formatarNumero(valor, 0);
}

/** `41.6` → `"42%"`. Percentuais de composição são inteiros (FR-042). */
export function formatarPercentual(valor: number, casas = 0): string {
  return `${formatarNumero(valor, casas)}%`;
}

/** Mensagem em pt-BR derivada do tipo do erro. Princípio VIII. */
export function mensagemDeErro(erro: ErroCalculo): string {
  switch (erro.tipo) {
    case 'divisao-por-zero':
      return `Não dá para calcular: ${erro.denominador} é zero. Sem esse valor, a taxa não é definível — não é zero, é indefinida.`;
    case 'amostra-insuficiente':
      return `São necessários pelo menos ${formatarInteiro(erro.minimo)} valores para este cálculo; foram informados ${formatarInteiro(erro.recebido)}.`;
    case 'entrada-invalida':
      return `O campo "${erro.campo}" ${erro.motivo}.`;
  }
}
