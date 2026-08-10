import { describe, expect, it } from 'vitest';

import {
  formatarInteiro,
  formatarNumero,
  formatarPercentual,
  mensagemDeErro,
} from './formatacao';
import type { ErroCalculo } from './tipos';

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
