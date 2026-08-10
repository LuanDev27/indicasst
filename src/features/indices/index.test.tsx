import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ModuloIndices from './index';

/**
 * Teste do caso de aceite ponta a ponta (SC-001) e do cenário 4 da spec: efetivo
 * zero exibe explicação, não `NaN`.
 *
 * O núcleo já é testado em `src/core/`; o que se verifica aqui é a ligação —
 * que o número digitado chega na conta certa e que a memória de cálculo aparece
 * ao lado do resultado, que é a promessa do produto.
 */

afterEach(cleanup);

function preencher(rotulo: RegExp, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

/** Entradas do exemplo de aceite: 200 · 8 h · 252 dias · 5 acidentes · 120 + 600 dias. */
function preencherCasoDeAceite() {
  preencher(/Efetivo exposto/, '200');
  preencher(/Jornada/, '8');
  preencher(/Dias trabalhados no período/, '252');
  preencher(/Horas extras/, '0');
  preencher(/Acidentes com afastamento/, '5');
  preencher(/Acidentes sem afastamento/, '0');
  preencher(/Óbitos/, '0');
  preencher(/Dias perdidos/, '120');
  preencher(/Dias debitados/, '600');
}

describe('Módulo 1 — caso de aceite na tela', () => {
  it('exibe HHT, TF, TG e TI com os valores da spec', async () => {
    render(<ModuloIndices />);
    preencherCasoDeAceite();

    await waitFor(() => {
      expect(screen.getByText('403.200')).toBeInTheDocument();
    });

    expect(screen.getByText('12,40')).toBeInTheDocument();
    expect(screen.getByText('1.785,71')).toBeInTheDocument();
    expect(screen.getByText('25,00')).toBeInTheDocument();
    expect(screen.getByText('720')).toBeInTheDocument();
    expect(screen.getByText('144,00')).toBeInTheDocument();
  });

  it('exibe a memória de cálculo junto de cada número', async () => {
    render(<ModuloIndices />);
    preencherCasoDeAceite();

    await waitFor(() => {
      expect(
        screen.getByText(/TF\s=\s\(5\s×\s1\.000\.000\)\s÷\s403\.200\s=\s12,40/),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/HHT\s=\s\(200\s×\s8\s×\s252\)\s\+\s0\s=\s403\.200/),
    ).toBeInTheDocument();
    expect(screen.getByText(/TC\s=\s120\s\+\s600\s=\s720/)).toBeInTheDocument();
  });

  it('mostra a fonte normativa e a ressalva de quem não é da norma', async () => {
    render(<ModuloIndices />);
    preencherCasoDeAceite();

    await waitFor(() => {
      expect(screen.getByText(/item 3\.6\.1\.2/)).toBeInTheDocument();
    });

    expect(
      screen.getAllByText(/não consta da ABNT NBR 14280/).length,
    ).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/números inteiros: 1\.786/)).toBeInTheDocument();
  });
});

describe('efetivo zero', () => {
  it('explica que o HHT é zero em vez de exibir NaN', async () => {
    render(<ModuloIndices />);
    preencher(/Efetivo exposto/, '0');
    preencher(/Dias trabalhados no período/, '252');
    preencher(/Acidentes com afastamento/, '5');
    preencher(/Dias perdidos/, '120');

    await waitFor(() => {
      expect(screen.getAllByText(/o HHT é zero/).length).toBeGreaterThan(0);
    });

    // HHT zero é resultado legítimo e aparece com a conta; as taxas é que não existem.
    expect(
      screen.getByText(/HHT\s=\s\(0\s×\s8\s×\s252\)\s\+\s0\s=\s0/),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('NaN');
    expect(document.body.textContent).not.toContain('Infinity');
  });
});

describe('validação de campo', () => {
  it('recusa meio acidente com mensagem em pt-BR', async () => {
    render(<ModuloIndices />);
    preencher(/Acidentes com afastamento/, '2,5');

    await waitFor(() => {
      expect(screen.getByText(/não existe meio acidente/)).toBeInTheDocument();
    });
  });

  it('recusa mais óbitos do que acidentes com afastamento', async () => {
    render(<ModuloIndices />);
    preencher(/Acidentes com afastamento/, '1');
    preencher(/Óbitos/, '3');

    await waitFor(() => {
      expect(
        screen.getByText(/mais óbitos do que acidentes com afastamento/),
      ).toBeInTheDocument();
    });
  });

  it('sem dados, o painel diz o que falta em vez de mostrar número', () => {
    render(<ModuloIndices />);
    expect(screen.getByRole('status')).toHaveTextContent(
      /Ainda não dá para calcular/,
    );
  });
});

describe('seleção de ocorrências', () => {
  it('marcar a amputação de polegar preenche os dias debitados com 600', async () => {
    render(<ModuloIndices />);

    fireEvent.click(
      screen.getByLabelText(/polegar\), 1ª falange \(proximal\)/),
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^Dias debitados/)).toHaveValue('600');
    });
  });

  it('aplica 3.4.3.1 e diz qual osso ficou de fora', async () => {
    render(<ModuloIndices />);

    fireEvent.click(screen.getByLabelText(/polegar\), 1ª falange \(proximal\)/));
    fireEvent.click(screen.getByLabelText(/polegar\), metacarpiano/));

    await waitFor(() => {
      expect(screen.getByLabelText(/^Dias debitados/)).toHaveValue('900');
    });

    expect(screen.getByText(/Item 3\.4\.3\.1/)).toBeInTheDocument();
  });

  it('avisa que a tabela não foi conferida em fonte primária', () => {
    render(<ModuloIndices />);
    expect(
      screen.getByText(/Tabela não conferida em fonte primária/),
    ).toBeInTheDocument();
    expect(screen.getAllByText('não conferido').length).toBeGreaterThan(40);
  });
});
