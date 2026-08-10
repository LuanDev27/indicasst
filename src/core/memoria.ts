/**
 * Memória de cálculo — princípio II da constituição.
 *
 * Um resultado sem memória de cálculo é um bug. Esta é a única função que monta
 * a string exibida junto de cada índice.
 */

import { formatarNumero } from './formatacao';

export interface ParametrosMemoria {
  /** Sigla do índice: `"TF"`, `"TG"`, `"HHT"`. */
  readonly sigla: string;
  /** Expressão já com os valores do usuário substituídos e formatados. */
  readonly expressao: string;
  /** Resultado em precisão total. O arredondamento acontece aqui, na exibição. */
  readonly resultado: number;
  /** Casas decimais de exibição. Padrão 2. */
  readonly casas?: number;
}

/** `"TF = (5 × 1.000.000) ÷ 403.200 = 12,40"` */
export function montarMemoria(p: ParametrosMemoria): string {
  return `${p.sigla} = ${p.expressao} = ${formatarNumero(p.resultado, p.casas)}`;
}
