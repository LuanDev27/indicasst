import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import CampoNumerico from '../../components/CampoNumerico';
import type { ValoresFormulario } from './esquema';

/**
 * O formulário do período.
 *
 * FR-013 é o motivo de este componente existir separado: o erro mais caro do
 * Módulo 1 não é errar a fórmula, é montar o HHT com horas que não deveriam
 * entrar. Por isso o que entra e o que **não** entra no cômputo estão em blocos
 * distintos e rotulados, e o que não entra aparece na tela mesmo não tendo campo.
 */

export interface PropsFormularioHHT {
  readonly register: UseFormRegister<ValoresFormulario>;
  readonly errors: FieldErrors<ValoresFormulario>;
  /** Verdadeiro quando os dias debitados vêm da seleção de ocorrências. */
  readonly diasDebitadosCalculados: boolean;
}

const NAO_ENTRA = [
  'férias',
  'afastamentos',
  'faltas',
  'licenças',
  'folgas e feriados não trabalhados',
];

export default function FormularioHHT({
  register,
  errors,
  diasDebitadosCalculados,
}: PropsFormularioHHT) {
  const erro = (campo: keyof ValoresFormulario): string | undefined =>
    errors[campo]?.message;

  return (
    <div className="space-y-6">
      <fieldset className="rounded-xl border border-emerald-300 bg-emerald-50/40 p-4">
        <legend className="px-2 text-sm font-semibold text-emerald-900">
          Entra no cômputo do HHT
        </legend>

        <p className="mb-4 text-sm text-emerald-950">
          Horas de exposição ao risco: horas efetivamente trabalhadas, mais horas
          extras.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoNumerico
            id="trabalhadores"
            rotulo="Efetivo exposto"
            unidade="trabalhadores"
            ajuda="Média de trabalhadores expostos ao risco no período."
            registro={register('trabalhadores')}
            erro={erro('trabalhadores')}
          />
          <CampoNumerico
            id="horasPorDia"
            rotulo="Jornada"
            unidade="horas por dia"
            decimal
            registro={register('horasPorDia')}
            erro={erro('horasPorDia')}
          />
          <CampoNumerico
            id="diasTrabalhados"
            rotulo="Dias trabalhados no período"
            unidade="dias"
            ajuda="Só dias efetivamente trabalhados. Um ano de 21 dias/mês dá 252."
            registro={register('diasTrabalhados')}
            erro={erro('diasTrabalhados')}
          />
          <CampoNumerico
            id="horasExtras"
            rotulo="Horas extras"
            unidade="horas no período"
            decimal
            registro={register('horasExtras')}
            erro={erro('horasExtras')}
          />
        </div>
      </fieldset>

      <div className="rounded-xl border border-slate-300 bg-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-800">
          Não entra no cômputo do HHT
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Estas horas não são exposição ao risco e não têm campo aqui de
          propósito. Se você as somou aos dias trabalhados, o HHT sai inflado e
          todas as taxas saem baixas demais:
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {NAO_ENTRA.map((item) => (
            <li
              key={item}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <fieldset className="rounded-xl border border-slate-300 bg-white p-4">
        <legend className="px-2 text-sm font-semibold text-slate-800">
          Ocorrências do período
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoNumerico
            id="acidentesComAfastamento"
            rotulo="Acidentes com afastamento"
            unidade="acidentados com lesão"
            registro={register('acidentesComAfastamento')}
            erro={erro('acidentesComAfastamento')}
          />
          <CampoNumerico
            id="acidentesSemAfastamento"
            rotulo="Acidentes sem afastamento"
            unidade="acidentados"
            ajuda="Contam na taxa de incidência; a norma pede que apareçam em separado (3.6.1.3)."
            registro={register('acidentesSemAfastamento')}
            erro={erro('acidentesSemAfastamento')}
          />
          <CampoNumerico
            id="obitos"
            rotulo="Óbitos"
            unidade="óbitos"
            registro={register('obitos')}
            erro={erro('obitos')}
          />
          <CampoNumerico
            id="diasPerdidos"
            rotulo="Dias perdidos"
            unidade="dias de afastamento"
            ajuda="Dias de incapacidade temporária, contados conforme 2.9.6."
            registro={register('diasPerdidos')}
            erro={erro('diasPerdidos')}
          />
          <CampoNumerico
            id="diasDebitados"
            rotulo="Dias debitados"
            unidade="dias"
            somenteLeitura={diasDebitadosCalculados}
            ajuda={
              diasDebitadosCalculados
                ? 'Somado a partir das ocorrências marcadas abaixo. Desmarque todas para digitar à mão.'
                : 'Digite o total, ou marque as ocorrências na tabela abaixo.'
            }
            registro={register('diasDebitados')}
            erro={erro('diasDebitados')}
          />
        </div>
      </fieldset>
    </div>
  );
}
