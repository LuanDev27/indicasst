import type { ReactNode } from 'react';

/**
 * Avisos de procedência — princípio III.
 *
 * Existem porque o produto deste app é a confiabilidade do número. Um valor de
 * tabela que ninguém conferiu na fonte primária pode aparecer, mas nunca sem
 * dizer que não foi conferido.
 */

export interface PropsAvisoNormativo {
  readonly titulo: string;
  readonly children: ReactNode;
  readonly tom?: 'atencao' | 'informacao';
}

export default function AvisoNormativo({
  titulo,
  children,
  tom = 'atencao',
}: PropsAvisoNormativo) {
  const cores =
    tom === 'atencao'
      ? 'border-amber-300 bg-amber-50 text-amber-950'
      : 'border-sky-300 bg-sky-50 text-sky-950';

  return (
    <div className={`rounded-lg border p-3 text-sm ${cores}`}>
      <p className="font-semibold">
        <span aria-hidden="true">⚠ </span>
        {titulo}
      </p>
      <div className="mt-1 space-y-1">{children}</div>
    </div>
  );
}

/**
 * Marca de uma entrada de tabela cuja procedência não foi confirmada (FR-022).
 * Traz texto, não só cor — quem não distingue as duas cores continua enxergando
 * a diferença.
 */
export function SeloNaoConferido() {
  return (
    <span
      title="Valor extraído de cópia pública da norma, não conferido em exemplar da ABNT."
      className="ml-2 shrink-0 rounded border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900"
    >
      não conferido
    </span>
  );
}
