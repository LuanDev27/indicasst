import { useState } from 'react';

import ModuloIndices from './features/indices';

/**
 * Navegação entre os cinco módulos. Nesta fatia só o Módulo 1 existe — os
 * outros aparecem desabilitados, com a fatia que os entrega, porque esconder o
 * roadmap de quem está testando o app não ajuda ninguém.
 */

interface Modulo {
  readonly id: string;
  readonly rotulo: string;
  readonly descricao: string;
  readonly fatia: number;
}

const MODULOS: readonly Modulo[] = [
  {
    id: 'indices',
    rotulo: 'Índices',
    descricao: 'HHT, frequência, gravidade e as demais taxas do período',
    fatia: 2,
  },
  {
    id: 'descritiva',
    rotulo: 'Estatística descritiva',
    descricao: 'Média, desvio padrão, histograma e box plot',
    fatia: 3,
  },
  {
    id: 'serie',
    rotulo: 'Série histórica',
    descricao: 'TF e TG mês a mês, com gráfico de controle',
    fatia: 4,
  },
  {
    id: 'pareto',
    rotulo: 'Pareto',
    descricao: 'Onde estão os 80% do problema',
    fatia: 5,
  },
  {
    id: 'composicao',
    rotulo: 'Composição',
    descricao: 'Participação de cada categoria no total',
    fatia: 6,
  },
];

const DISPONIVEIS = new Set(['indices']);

export default function App() {
  const [ativo, setAtivo] = useState('indices');

  const moduloAtivo = MODULOS.find((m) => m.id === ativo) ?? MODULOS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            IndicaSST
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Índices estatísticos de segurança do trabalho conforme ABNT NBR
            14280. Roda no navegador, sem cadastro e sem enviar dado nenhum.
          </p>

          <nav aria-label="Módulos" className="mt-4">
            <ul className="flex flex-wrap gap-2">
              {MODULOS.map((modulo) => {
                const disponivel = DISPONIVEIS.has(modulo.id);
                const selecionado = modulo.id === ativo;

                return (
                  <li key={modulo.id}>
                    <button
                      type="button"
                      disabled={!disponivel}
                      aria-current={selecionado ? 'page' : undefined}
                      onClick={() => {
                        setAtivo(modulo.id);
                      }}
                      title={
                        disponivel ? modulo.descricao : `Chega na Fatia ${modulo.fatia}`
                      }
                      className={[
                        'min-h-11 rounded-lg border px-3 text-sm font-medium',
                        selecionado
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-800',
                        disponivel ? '' : 'cursor-not-allowed opacity-50',
                      ].join(' ')}
                    >
                      {modulo.rotulo}
                      {disponivel ? null : (
                        <span className="ml-1 font-normal">
                          · Fatia {modulo.fatia}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        {ativo === 'indices' ? (
          <ModuloIndices />
        ) : (
          <p className="text-slate-600">
            {moduloAtivo?.descricao} — ainda não implementado.
          </p>
        )}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-xs text-slate-500">
        <p>
          Taxa de incidência, mortalidade e letalidade não constam da NBR 14280:
          são indicadores da Previdência Social e da epidemiologia. Cada cartão
          diz de onde vem o seu número.
        </p>
      </footer>
    </div>
  );
}
