import CartaoResultado from '../../components/CartaoResultado';
import type { ResultadoPeriodo } from '../../core/indices';

/**
 * Os oito índices do período, cada um com a memória de cálculo visível.
 *
 * A ordem não é alfabética: é a ordem em que se calcula à mão. HHT primeiro
 * porque tudo depende dele; tempo computado antes da gravidade porque entra
 * nela. Quem confere no papel segue esta sequência.
 */

export interface PropsPainelIndices {
  readonly resultado: ResultadoPeriodo;
}

const ORDEM: readonly {
  readonly chave: keyof ResultadoPeriodo;
  readonly nome: string;
}[] = [
  { chave: 'hht', nome: 'Homem-hora trabalhado (HHT)' },
  { chave: 'tempoComputado', nome: 'Tempo computado (TC)' },
  { chave: 'taxaFrequencia', nome: 'Taxa de Frequência (TF)' },
  { chave: 'taxaGravidade', nome: 'Taxa de Gravidade (TG)' },
  { chave: 'mediaDiasPerdidos', nome: 'Média de dias perdidos (MDP)' },
  { chave: 'taxaIncidencia', nome: 'Taxa de Incidência (TI)' },
  { chave: 'mortalidade', nome: 'Taxa de Mortalidade (TM)' },
  { chave: 'letalidade', nome: 'Taxa de Letalidade (TL)' },
];

export default function PainelIndices({ resultado }: PropsPainelIndices) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {ORDEM.map(({ chave, nome }) => (
        <CartaoResultado
          key={chave}
          resultado={resultado[chave]}
          nomeDeReserva={nome}
        />
      ))}
    </div>
  );
}
