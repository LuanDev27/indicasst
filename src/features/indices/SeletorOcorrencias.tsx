import { useId, useState } from 'react';

import AvisoNormativo, { SeloNaoConferido } from '../../components/AvisoNormativo';
import BlocoMemoriaCalculo from '../../components/BlocoMemoriaCalculo';
import { formatarInteiro, mensagemDeErro } from '../../core/formatacao';
import {
  lerJson,
  mesclar,
  TABELA_PADRAO,
  type SomaDiasDebitados,
  type TabelaDiasDebitados,
} from '../../core/diasDebitados';

/**
 * Quadro 1 da NBR 14280 na tela: o usuário marca as ocorrências e o app soma os
 * dias debitados (FR-020).
 *
 * A soma não é uma adição ingênua — `somarDias` aplica 3.4.3.1 e 3.4.3.5 e
 * devolve os avisos, que aparecem aqui. Quando o app deixa de fora uma
 * ocorrência que o usuário marcou, ele diz qual e por quê.
 */

export interface PropsSeletorOcorrencias {
  readonly tabela: TabelaDiasDebitados;
  readonly selecao: readonly string[];
  readonly soma: SomaDiasDebitados;
  readonly aoMudarSelecao: (chaves: readonly string[]) => void;
  readonly aoTrocarTabela: (tabela: TabelaDiasDebitados) => void;
}

function agrupar(tabela: TabelaDiasDebitados): Map<string, TabelaDiasDebitados> {
  const grupos = new Map<string, TabelaDiasDebitados>();
  for (const entrada of tabela) {
    grupos.set(entrada.grupo, [...(grupos.get(entrada.grupo) ?? []), entrada]);
  }
  return grupos;
}

export default function SeletorOcorrencias({
  tabela,
  selecao,
  soma,
  aoMudarSelecao,
  aoTrocarTabela,
}: PropsSeletorOcorrencias) {
  const idBase = useId();
  const [erroImportacao, setErroImportacao] = useState<string | null>(null);

  const marcadas = new Set(selecao);

  function alternar(chave: string) {
    const novas = marcadas.has(chave)
      ? selecao.filter((c) => c !== chave)
      : [...selecao, chave];
    aoMudarSelecao(novas);
  }

  async function importar(arquivo: File) {
    const resultado = lerJson(await arquivo.text());

    if (!resultado.ok) {
      setErroImportacao(
        `${mensagemDeErro(resultado.erro)} A tabela em uso não foi alterada.`,
      );
      return;
    }

    setErroImportacao(null);
    aoTrocarTabela(mesclar(TABELA_PADRAO, resultado.valor));
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(tabela, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dias-debitados.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section aria-labelledby={`${idBase}-titulo`} className="space-y-3">
      <div>
        <h3 id={`${idBase}-titulo`} className="font-semibold text-slate-900">
          Ocorrências com dias debitados
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Marque as lesões do período. Os dias entram automaticamente no campo
          &ldquo;dias debitados&rdquo;.
        </p>
      </div>

      <AvisoNormativo titulo="Tabela não conferida em fonte primária">
        <p>
          Os valores vêm do quadro 1 da NBR 14280:2001, extraídos de cópia
          pública — <strong>não</strong> de exemplar adquirido da ABNT. Consulte a
          norma vigente antes de usar o resultado em documento oficial.
        </p>
        <p>
          Se você tem a norma, corrija a tabela e importe o JSON: os valores
          importados substituem os embarcados.
        </p>
      </AvisoNormativo>

      {[...agrupar(tabela)].map(([grupo, entradas]) => (
        <details
          key={grupo}
          className="rounded-lg border border-slate-200 bg-white"
        >
          <summary className="cursor-pointer px-3 py-3 text-sm font-medium text-slate-800">
            {grupo}
            <span className="ml-2 font-normal text-slate-500">
              ({formatarInteiro(entradas.length)})
            </span>
          </summary>

          <ul className="border-t border-slate-100 px-3 py-2">
            {entradas.map((entrada) => (
              <li key={entrada.chave}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={marcadas.has(entrada.chave)}
                    onChange={() => {
                      alternar(entrada.chave);
                    }}
                    className="size-5 shrink-0 rounded border-slate-400"
                  />
                  <span className="flex-1 text-slate-800">
                    {entrada.descricao}
                    {entrada.confirmado ? null : <SeloNaoConferido />}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-600">
                    {formatarInteiro(entrada.dias)} dias
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </details>
      ))}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-800">
          Dias debitados somados:{' '}
          <span className="tabular-nums">{formatarInteiro(soma.dias)}</span>
        </p>

        {/* Sem nenhuma marcada, "Dias debitados = 0 = 0" seria memória de nada. */}
        {soma.consideradas.length > 0 ? (
          <div className="mt-2">
            <BlocoMemoriaCalculo memoria={soma.memoria} />
          </div>
        ) : (
          <p className="mt-1 text-sm text-slate-600">
            Nenhuma ocorrência marcada. Lesão que não atinge o osso não gera dias
            debitados: conta só o tempo perdido, como incapacidade temporária.
          </p>
        )}

        {soma.avisos.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {soma.avisos.map((aviso) => (
              <li
                key={aviso}
                className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-950"
              >
                {aviso}
              </li>
            ))}
          </ul>
        ) : null}

        {soma.temEntradaNaoConfirmada ? (
          <p className="mt-2 text-xs text-amber-800">
            Esta soma usa valores ainda não conferidos em exemplar da ABNT.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-800">
            Importar tabela (JSON)
          </span>
          <input
            type="file"
            accept="application/json,.json"
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0];
              if (arquivo) void importar(arquivo);
            }}
            className="block text-sm text-slate-600 file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:text-sm"
          />
        </label>

        <button
          type="button"
          onClick={exportar}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800"
        >
          Exportar tabela (JSON)
        </button>
      </div>

      {erroImportacao ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {erroImportacao}
        </p>
      ) : null}
    </section>
  );
}
