import { describe, expect, it } from 'vitest';

import {
  formatarInteiro,
  formatarNumero,
  formatarPercentual,
  interpretarNumero,
  mensagemDeErro,
} from './formatacao';
import type { ErroCalculo, Result } from './tipos';

/**
 * O separador de milhar do pt-BR é U+00A0 em alguns runtimes e '.' em outros.
 * Normalizamos para comparar o que importa: a forma brasileira.
 */
function normalizar(s: string): string {
  return s.replace(/\s/g, ' ');
}

describe('formatarNumero', () => {
  it('usa vírgula decimal e ponto de milhar, com 2 casas por padrão', () => {
    expect(normalizar(formatarNumero(1785.714285))).toBe('1.785,71');
  });

  it('arredonda para cima na fronteira', () => {
    expect(formatarNumero(12.4008)).toBe('12,40');
    expect(formatarNumero(12.405)).toBe('12,41');
  });

  it('completa casas decimais ausentes', () => {
    expect(formatarNumero(25)).toBe('25,00');
  });

  it('aceita número de casas explícito', () => {
    expect(formatarNumero(5_000_000 / 403_200, 4)).toBe('12,4008');
  });

  it('formata zero e negativo', () => {
    expect(formatarNumero(0)).toBe('0,00');
    expect(normalizar(formatarNumero(-1234.5))).toBe('-1.234,50');
  });
});

describe('formatarInteiro', () => {
  it('não exibe casas decimais', () => {
    expect(normalizar(formatarInteiro(403200))).toBe('403.200');
  });

  it('arredonda o que receber com decimais', () => {
    expect(formatarInteiro(719.6)).toBe('720');
  });
});

describe('formatarPercentual', () => {
  it('arredonda para inteiro por padrão', () => {
    expect(formatarPercentual(41.6)).toBe('42%');
  });

  it('aceita casas explícitas', () => {
    expect(formatarPercentual(41.64, 1)).toBe('41,6%');
  });
});

describe('interpretarNumero', () => {
  function valor(r: Result<number>): number {
    if (!r.ok) throw new Error(`esperava número, veio ${r.erro.tipo}`);
    return r.valor;
  }

  function motivo(r: Result<number>): string {
    if (r.ok) throw new Error('esperava falha, veio número');
    return r.erro.tipo === 'entrada-invalida' ? r.erro.motivo : r.erro.tipo;
  }

  it('lê o formato brasileiro: ponto de milhar, vírgula decimal', () => {
    expect(valor(interpretarNumero('1.785,71'))).toBe(1785.71);
    expect(valor(interpretarNumero('403.200'))).toBe(403200);
    expect(valor(interpretarNumero('8,5'))).toBe(8.5);
  });

  it('é o inverso de formatarNumero no caso de aceite', () => {
    expect(valor(interpretarNumero(formatarInteiro(403200)))).toBe(403200);
  });

  it('aceita inteiro simples, zero e negativo', () => {
    expect(valor(interpretarNumero('200'))).toBe(200);
    expect(valor(interpretarNumero('0'))).toBe(0);
    expect(valor(interpretarNumero('-5'))).toBe(-5);
  });

  it('ignora espaço em volta', () => {
    expect(valor(interpretarNumero('  42  '))).toBe(42);
  });

  it('campo vazio é vazio, não zero', () => {
    expect(motivo(interpretarNumero(''))).toBe('está vazio');
    expect(motivo(interpretarNumero('   '))).toBe('está vazio');
  });

  it.each(['abc', '12abc', '1,2,3', '--3', ','])('recusa %o', (texto) => {
    expect(motivo(interpretarNumero(texto))).toBe('não é um número');
  });

  it.each(['1..2', '8.', '1.2.3', '12.34', '.5', '1.23'])(
    'recusa %o em vez de apagar o ponto e devolver número plausível e errado',
    (texto) => {
      expect(motivo(interpretarNumero(texto))).toBe('não é um número');
    },
  );

  it('recusa número grande demais em vez de devolver Infinity', () => {
    expect(motivo(interpretarNumero('9'.repeat(400)))).toBe(
      'é grande demais para ser calculado',
    );
  });

  it('nomeia o campo na mensagem de erro', () => {
    const r = interpretarNumero('abc', 'horas por dia');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(mensagemDeErro(r.erro)).toBe(
        'O campo "horas por dia" não é um número.',
      );
    }
  });
});

describe('mensagemDeErro', () => {
  it('explica divisão por zero sem falar em zero como resultado', () => {
    const erro: ErroCalculo = { tipo: 'divisao-por-zero', denominador: 'o HHT' };
    const msg = mensagemDeErro(erro);
    expect(msg).toContain('o HHT é zero');
    expect(msg).toContain('indefinida');
  });

  it('explica amostra insuficiente com os dois números', () => {
    const erro: ErroCalculo = {
      tipo: 'amostra-insuficiente',
      minimo: 2,
      recebido: 1,
    };
    const msg = mensagemDeErro(erro);
    expect(msg).toContain('pelo menos 2');
    expect(msg).toContain('foram informados 1');
  });

  it('nomeia o campo inválido', () => {
    const erro: ErroCalculo = {
      tipo: 'entrada-invalida',
      campo: 'óbitos',
      motivo: 'não pode ser negativo',
    };
    expect(mensagemDeErro(erro)).toBe(
      'O campo "óbitos" não pode ser negativo.',
    );
  });
});
