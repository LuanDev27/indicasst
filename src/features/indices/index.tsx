import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import FormularioHHT from './FormularioHHT';
import PainelIndices from './PainelIndices';
import SeletorOcorrencias from './SeletorOcorrencias';
import {
  esquemaPeriodo,
  montarPeriodo,
  VALORES_INICIAIS,
  type ValoresFormulario,
} from './esquema';
import { mensagemDeErro } from '../../core/formatacao';
import {
  buscar,
  somarDias,
  TABELA_PADRAO,
  type EntradaDiasDebitados,
  type TabelaDiasDebitados,
} from '../../core/diasDebitados';
import { calcularPeriodo } from '../../core/indices';

/**
 * Módulo 1 — calculadora de índices do período.
 *
 * Não há botão de calcular: o resultado acompanha a digitação. Um botão faria o
 * usuário acreditar que existe um momento em que o número "fica pronto", e o que
 * este app precisa ensinar é o contrário — mudou a entrada, mudou a conta, e a
 * memória de cálculo ao lado mostra exatamente onde.
 *
 * Erro de campo não apaga o resultado anterior por acidente: enquanto o
 * formulário não converte para um `Periodo` válido, o painel diz o que falta em
 * vez de exibir número velho.
 */

function entradasSelecionadas(
  tabela: TabelaDiasDebitados,
  chaves: readonly string[],
): readonly EntradaDiasDebitados[] {
  return chaves
    .map((chave) => buscar(tabela, chave))
    .filter((e): e is EntradaDiasDebitados => e !== undefined);
}

export default function ModuloIndices() {
  const [tabela, setTabela] = useState<TabelaDiasDebitados>(TABELA_PADRAO);
  const [selecao, setSelecao] = useState<readonly string[]>([]);

  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquemaPeriodo),
    defaultValues: VALORES_INICIAIS,
    mode: 'onChange',
  });

  // `useWatch` e não `watch()`: o segundo devolve uma função nova a cada render,
  // o que faz o React Compiler desistir de memoizar o componente inteiro.
  const valores = useWatch({ control });

  const soma = useMemo(
    () => somarDias(entradasSelecionadas(tabela, selecao)),
    [tabela, selecao],
  );

  /** A seleção é a fonte da verdade dos dias debitados enquanto houver seleção. */
  function fixarDiasDebitados(
    novaTabela: TabelaDiasDebitados,
    novasChaves: readonly string[],
  ) {
    const nova = somarDias(entradasSelecionadas(novaTabela, novasChaves));
    setValue('diasDebitados', String(nova.dias), { shouldValidate: true });
  }

  function aoMudarSelecao(chaves: readonly string[]) {
    setSelecao(chaves);
    fixarDiasDebitados(tabela, chaves);
  }

  function aoTrocarTabela(nova: TabelaDiasDebitados) {
    setTabela(nova);
    fixarDiasDebitados(nova, selecao);
  }

  const periodo = montarPeriodo(valores);

  return (
    <div className="space-y-8">
      <section aria-labelledby="entrada" className="space-y-6">
        <h2 id="entrada" className="text-xl font-semibold text-slate-900">
          Dados do período
        </h2>

        <FormularioHHT
          register={register}
          errors={errors}
          diasDebitadosCalculados={selecao.length > 0}
        />

        <SeletorOcorrencias
          tabela={tabela}
          selecao={selecao}
          soma={soma}
          aoMudarSelecao={aoMudarSelecao}
          aoTrocarTabela={aoTrocarTabela}
        />
      </section>

      <section aria-labelledby="resultados" className="space-y-4">
        <h2 id="resultados" className="text-xl font-semibold text-slate-900">
          Índices do período
        </h2>

        {periodo.ok ? (
          <PainelIndices resultado={calcularPeriodo(periodo.valor)} />
        ) : (
          <p
            role="status"
            className="rounded-xl border border-slate-300 bg-slate-100 p-4 text-sm text-slate-700"
          >
            Ainda não dá para calcular: {mensagemDeErro(periodo.erro)}
          </p>
        )}
      </section>
    </div>
  );
}
