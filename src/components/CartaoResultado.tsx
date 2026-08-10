import BlocoMemoriaCalculo from './BlocoMemoriaCalculo';
import { formatarNumero, mensagemDeErro } from '../core/formatacao';
import type { Indice, Result } from '../core/tipos';

/**
 * Um índice na tela: valor, unidade, memória de cálculo, fonte normativa e — se
 * houver — a ressalva.
 *
 * Quando o núcleo devolve erro, o cartão mostra a explicação **no lugar** do
 * número. Nunca `NaN`, nunca zero silencioso (FR-005): um número ausente com
 * motivo é informação; um zero inventado é mentira.
 */

export interface PropsCartaoResultado {
  readonly resultado: Result<Indice>;
  /** Usado como título quando o cálculo falha e não há `Indice` para nomear. */
  readonly nomeDeReserva: string;
}

export default function CartaoResultado({
  resultado,
  nomeDeReserva,
}: PropsCartaoResultado) {
  if (!resultado.ok) {
    return (
      <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-medium text-amber-950">{nomeDeReserva}</h3>
        <p className="mt-2 text-sm text-amber-900">
          {mensagemDeErro(resultado.erro)}
        </p>
      </article>
    );
  }

  const indice = resultado.valor;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-medium text-slate-900">
          {indice.nome}{' '}
          <span className="text-slate-500">({indice.sigla})</span>
        </h3>
        <p className="text-3xl font-semibold tabular-nums text-slate-900">
          {formatarNumero(indice.valor, indice.casas)}
        </p>
      </header>

      <p className="mt-0.5 text-xs text-slate-500">{indice.unidade}</p>

      <div className="mt-3">
        <BlocoMemoriaCalculo memoria={indice.memoria} />
      </div>

      {indice.nota ? (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          {indice.nota}
        </p>
      ) : null}

      <p className="mt-2 text-xs text-slate-500">Fonte: {indice.fonte}</p>
    </article>
  );
}
