import { describe, expect, it } from 'vitest';

import {
  acidentes,
  dias,
  falha,
  horas,
  obitos,
  ok,
  trabalhadores,
} from './tipos';

describe('ok / falha', () => {
  it('embrulha um valor de sucesso', () => {
    const r = ok(42);
    expect(r).toEqual({ ok: true, valor: 42 });
  });

  it('embrulha um erro', () => {
    const r = falha({ tipo: 'divisao-por-zero', denominador: 'o HHT' } as const);
    expect(r.ok).toBe(false);
  });
});

describe('construtores de unidade', () => {
  const naoInteiros = [
    { nome: 'horas', fn: horas },
    { nome: 'dias', fn: dias },
  ];
  const inteiros = [
    { nome: 'acidentes', fn: acidentes },
    { nome: 'trabalhadores', fn: trabalhadores },
    { nome: 'obitos', fn: obitos },
  ];
  const todos = [...naoInteiros, ...inteiros];

  it.each(todos)('$nome aceita zero', ({ fn }) => {
    const r = fn(0);
    expect(r.ok).toBe(true);
  });

  it.each(todos)('$nome aceita um valor positivo', ({ fn }) => {
    const r = fn(7);
    expect(r).toEqual({ ok: true, valor: 7 });
  });

  it.each(todos)('$nome rejeita negativo', ({ fn }) => {
    const r = fn(-1);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toMatchObject({
        tipo: 'entrada-invalida',
        motivo: 'não pode ser negativo',
      });
    }
  });

  it.each(todos)('$nome rejeita NaN', ({ fn }) => {
    const r = fn(Number.NaN);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toMatchObject({ motivo: 'não é um número finito' });
    }
  });

  it.each(todos)('$nome rejeita Infinity', ({ fn }) => {
    const r = fn(Number.POSITIVE_INFINITY);
    expect(r.ok).toBe(false);
  });

  it.each(naoInteiros)('$nome aceita fracionário', ({ fn }) => {
    const r = fn(7.5);
    expect(r.ok).toBe(true);
  });

  it.each(inteiros)('$nome rejeita fracionário', ({ fn }) => {
    const r = fn(2.5);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toMatchObject({
        tipo: 'entrada-invalida',
        motivo: 'deve ser um número inteiro',
      });
    }
  });

  it('nomeia o campo em português na mensagem de erro', () => {
    const r = obitos(-1);
    expect(r.ok).toBe(false);
    if (!r.ok && r.erro.tipo === 'entrada-invalida') {
      expect(r.erro.campo).toBe('óbitos');
    }
  });
});
