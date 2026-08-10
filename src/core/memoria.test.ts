import { describe, expect, it } from 'vitest';

import { montarMemoria } from './memoria';

function normalizar(s: string): string {
  return s.replace(/\s/g, ' ');
}

describe('montarMemoria', () => {
  it('produz a memória de cálculo do exemplo de aceite', () => {
    const memoria = montarMemoria({
      sigla: 'TF',
      expressao: '(5 × 1.000.000) ÷ 403.200',
      resultado: 5_000_000 / 403_200,
    });
    expect(normalizar(memoria)).toBe('TF = (5 × 1.000.000) ÷ 403.200 = 12,40');
  });

  it('respeita o número de casas pedido', () => {
    const memoria = montarMemoria({
      sigla: 'HHT',
      expressao: '(200 × 8 × 252) + 0',
      resultado: 403200,
      casas: 0,
    });
    expect(normalizar(memoria)).toBe('HHT = (200 × 8 × 252) + 0 = 403.200');
  });
});
