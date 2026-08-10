import type { UseFormRegisterReturn } from 'react-hook-form';

/**
 * Campo numérico do formulário.
 *
 * Aceita o que o teclado brasileiro produz — `interpretarNumero` em
 * `core/formatacao.ts` é quem lê. O `inputMode` abre o teclado numérico no
 * celular sem impedir a digitação de vírgula, que `type="number"` impediria.
 *
 * Altura mínima de 44px: é o alvo de toque confortável a 360px de largura
 * (FR-009). O erro é ligado ao input por `aria-describedby`, não só por cor.
 */

export interface PropsCampoNumerico {
  readonly id: string;
  readonly rotulo: string;
  readonly registro: UseFormRegisterReturn;
  readonly unidade?: string;
  readonly ajuda?: string;
  readonly erro?: string | undefined;
  readonly decimal?: boolean;
  readonly somenteLeitura?: boolean;
}

export default function CampoNumerico({
  id,
  rotulo,
  registro,
  unidade,
  ajuda,
  erro,
  decimal = false,
  somenteLeitura = false,
}: PropsCampoNumerico) {
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;

  const descritores = [ajuda ? idAjuda : null, erro ? idErro : null]
    .filter((s): s is string => s !== null)
    .join(' ');

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {rotulo}
        {unidade ? (
          <span className="ml-1 font-normal text-slate-500">({unidade})</span>
        ) : null}
      </label>

      <input
        {...registro}
        id={id}
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        readOnly={somenteLeitura}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritores === '' ? undefined : descritores}
        className={[
          'mt-1 block min-h-11 w-full rounded-lg border px-3 py-2 text-base tabular-nums',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          somenteLeitura ? 'bg-slate-100 text-slate-600' : 'bg-white',
          erro
            ? 'border-red-400 focus:ring-red-500'
            : 'border-slate-300 focus:ring-slate-800',
        ].join(' ')}
      />

      {ajuda ? (
        <p id={idAjuda} className="mt-1 text-xs text-slate-500">
          {ajuda}
        </p>
      ) : null}

      {erro ? (
        <p id={idErro} role="alert" className="mt-1 text-xs font-medium text-red-700">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
