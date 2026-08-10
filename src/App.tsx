import { calcularPeriodo } from './core/indices';
import { formatarNumero, mensagemDeErro } from './core/formatacao';
import {
  acidentes,
  dias,
  horas,
  obitos,
  trabalhadores,
  type Periodo,
  type Result,
} from './core/tipos';

/**
 * Fatia 1 — o núcleo de cálculo existe e está testado; o Módulo 1 (formulário)
 * é a Fatia 2. Esta página não é o módulo: é prova de vida do núcleo, rodando o
 * exemplo de aceite da spec em dados fixos, sem nenhum campo de entrada.
 */

function cru<T>(r: Result<T>): T {
  if (!r.ok) throw new Error('caso de demonstração não deveria falhar');
  return r.valor;
}

const CASO_DE_ACEITE: Periodo = {
  trabalhadores: cru(trabalhadores(200)),
  horasPorDia: cru(horas(8)),
  diasTrabalhados: cru(dias(21 * 12)),
  horasExtras: cru(horas(0)),
  acidentesComAfastamento: cru(acidentes(5)),
  acidentesSemAfastamento: cru(acidentes(0)),
  obitos: cru(obitos(0)),
  diasPerdidos: cru(dias(120)),
  diasDebitados: cru(dias(600)),
};

const FATIAS = [
  { rotulo: 'Núcleo de cálculo dos índices + testes', pronta: true },
  { rotulo: 'Módulo 1 — calculadora com memória de cálculo', pronta: false },
  { rotulo: 'Módulo 2 — estatística descritiva', pronta: false },
  { rotulo: 'Módulo 3 — série histórica', pronta: false },
  { rotulo: 'Módulo 4 — diagrama de Pareto', pronta: false },
  { rotulo: 'Módulo 5 — composição', pronta: false },
  { rotulo: 'PWA, persistência e impressão', pronta: false },
];

export default function App() {
  const resultado = calcularPeriodo(CASO_DE_ACEITE);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">IndicaSST</h1>
          <p className="mt-2 text-slate-600">
            Índices estatísticos de segurança do trabalho conforme ABNT NBR
            14280. Roda no navegador, sem cadastro e sem enviar dado nenhum.
          </p>
        </header>

        <section
          aria-labelledby="demonstracao"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 id="demonstracao" className="text-lg font-semibold">
            Exemplo de aceite, calculado pelo núcleo
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            200 trabalhadores · 8&nbsp;h/dia · 21 dias/mês por 12 meses · 5
            acidentes com afastamento · 120 dias perdidos · amputação total de
            polegar (600 dias debitados).
          </p>

          <dl className="mt-5 space-y-4">
            {Object.entries(resultado).map(([chave, r]) => (
              <div
                key={chave}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                {r.ok ? (
                  <>
                    <dt className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{r.valor.nome}</span>
                      <span className="text-2xl font-semibold tabular-nums">
                        {formatarNumero(r.valor.valor, r.valor.casas)}
                      </span>
                    </dt>
                    <dd className="mt-1 text-xs text-slate-500">
                      {r.valor.unidade}
                    </dd>
                    <dd className="mt-3 rounded bg-white px-3 py-2 font-mono text-sm text-slate-700">
                      {r.valor.memoria}
                    </dd>
                    <dd className="mt-2 text-xs text-slate-500">
                      Fonte: {r.valor.fonte}
                    </dd>
                  </>
                ) : (
                  <>
                    <dt className="font-medium">{chave}</dt>
                    <dd className="mt-1 text-sm text-amber-700">
                      {mensagemDeErro(r.erro)}
                    </dd>
                  </>
                )}
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="estado" className="mt-8">
          <h2 id="estado" className="text-lg font-semibold">
            Onde o projeto está
          </h2>
          <ol className="mt-3 space-y-1 text-sm">
            {FATIAS.map((fatia, i) => (
              <li key={fatia.rotulo} className="flex gap-2">
                <span aria-hidden="true">{fatia.pronta ? '✓' : '○'}</span>
                <span className={fatia.pronta ? '' : 'text-slate-500'}>
                  Fatia {i + 1} — {fatia.rotulo}
                  {fatia.pronta ? ' (pronta)' : ''}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="aviso"
          className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <h2 id="aviso" className="font-semibold">
            Aviso
          </h2>
          <p className="mt-1">
            A tabela de dias debitados da NBR 14280 ainda não foi conferida em
            fonte primária. Enquanto isso, o app não oferece seleção de
            ocorrências — os dias debitados entram como número informado. A norma
            vigente deve ser consultada.
          </p>
        </section>
      </main>
    </div>
  );
}
