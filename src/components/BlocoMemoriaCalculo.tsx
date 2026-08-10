/**
 * A memória de cálculo na tela — princípio II.
 *
 * Só renderiza a string que o núcleo já montou. Nenhuma formatação acontece
 * aqui: se este componente precisasse formatar alguma coisa, o número teria
 * escapado de `core/formatacao.ts`.
 */

export interface PropsBlocoMemoriaCalculo {
  readonly memoria: string;
}

export default function BlocoMemoriaCalculo({
  memoria,
}: PropsBlocoMemoriaCalculo) {
  return (
    <p className="overflow-x-auto rounded-md bg-slate-900 px-3 py-2 font-mono text-sm text-slate-50">
      {memoria}
    </p>
  );
}
