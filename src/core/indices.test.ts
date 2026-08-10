import { describe, expect, it } from 'vitest';

import {
  calcularPeriodo,
  hht,
  letalidade,
  mediaDiasPerdidos,
  mortalidade,
  taxaFrequencia,
  taxaGravidade,
  taxaIncidencia,
  tempoComputado,
  valorHht,
  valorTempoComputado,
  valorTempoComputadoDoAcidente,
} from './indices';
import type { Indice, Periodo, Result } from './tipos';
import {
  acidentes,
  dias,
  horas,
  obitos,
  trabalhadores,
  type Acidentes,
  type Dias,
  type Horas,
  type Obitos,
  type Trabalhadores,
} from './tipos';

/* -------------------------------------------------------------------------- */
/* Auxiliares de teste                                                         */
/* -------------------------------------------------------------------------- */

function forcar<T>(r: Result<T>): T {
  if (!r.ok) {
    throw new Error(`esperava sucesso, veio ${JSON.stringify(r.erro)}`);
  }
  return r.valor;
}

const h = (n: number): Horas => forcar(horas(n));
const d = (n: number): Dias => forcar(dias(n));
const a = (n: number): Acidentes => forcar(acidentes(n));
const t = (n: number): Trabalhadores => forcar(trabalhadores(n));
const o = (n: number): Obitos => forcar(obitos(n));

function normalizar(s: string): string {
  return s.replace(/\s/g, ' ');
}

/** Valores exatos esperados, escritos como a conta — não como literal truncado. */
const TF_ESPERADA = 5_000_000 / 403_200;
const TG_ESPERADA = 720_000_000 / 403_200;

/**
 * Exemplo de aceite da spec (SC-001): empresa com 200 trabalhadores, 8 h/dia,
 * 21 dias/mês por 12 meses, 5 acidentes com afastamento, 120 dias perdidos e
 * uma amputação total de polegar (600 dias debitados).
 */
const CASO_DE_ACEITE: Periodo = {
  trabalhadores: t(200),
  horasPorDia: h(8),
  diasTrabalhados: d(21 * 12),
  horasExtras: h(0),
  acidentesComAfastamento: a(5),
  acidentesSemAfastamento: a(0),
  obitos: o(0),
  diasPerdidos: d(120),
  diasDebitados: d(600),
};

/* -------------------------------------------------------------------------- */
/* Caso de aceite                                                              */
/* -------------------------------------------------------------------------- */

describe('caso de aceite da spec', () => {
  const r = calcularPeriodo(CASO_DE_ACEITE);

  it('HHT = 403.200', () => {
    expect(forcar(r.hht).valor).toBe(403_200);
    expect(normalizar(forcar(r.hht).memoria)).toBe(
      'HHT = (200 × 8 × 252) + 0 = 403.200',
    );
  });

  it('tempo computado = 720 dias', () => {
    expect(forcar(r.tempoComputado).valor).toBe(720);
    expect(forcar(r.tempoComputado).memoria).toBe('TC = 120 + 600 = 720');
  });

  it('TF = 12,40 e mantém precisão total no valor', () => {
    const indice = forcar(r.taxaFrequencia);
    expect(indice.valor).toBe(TF_ESPERADA);
    expect(normalizar(indice.memoria)).toBe(
      'TF = (5 × 1.000.000) ÷ 403.200 = 12,40',
    );
  });

  it('TG = 1.785,71 e mantém precisão total no valor', () => {
    const indice = forcar(r.taxaGravidade);
    expect(indice.valor).toBe(TG_ESPERADA);
    expect(normalizar(indice.memoria)).toBe(
      'TG = (720 × 1.000.000) ÷ 403.200 = 1.785,71',
    );
  });

  it('TI = 25', () => {
    const indice = forcar(r.taxaIncidencia);
    expect(indice.valor).toBe(25);
    expect(normalizar(indice.memoria)).toBe('TI = (5 × 1.000) ÷ 200 = 25,00');
  });

  it('média de dias perdidos = 144', () => {
    expect(forcar(r.mediaDiasPerdidos).valor).toBe(144);
  });

  it('sem óbitos, mortalidade e letalidade são zero — e zero é resultado, não erro', () => {
    expect(forcar(r.mortalidade).valor).toBe(0);
    expect(forcar(r.letalidade).valor).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */
/* Princípios II e III — memória e fonte em todo índice                        */
/* -------------------------------------------------------------------------- */

describe('todo índice carrega memória de cálculo e fonte normativa', () => {
  const r = calcularPeriodo(CASO_DE_ACEITE);
  const indices = Object.entries(r);

  it.each(indices)('%s tem memória, fonte, nome, sigla e unidade', (_nome, resultado) => {
    const indice: Indice = forcar(resultado);
    expect(indice.memoria.length).toBeGreaterThan(0);
    expect(indice.fonte.length).toBeGreaterThan(0);
    expect(indice.nome.length).toBeGreaterThan(0);
    expect(indice.sigla.length).toBeGreaterThan(0);
    expect(indice.unidade.length).toBeGreaterThan(0);
  });

  it('a memória termina com o resultado formatado em pt-BR', () => {
    const indice = forcar(r.taxaGravidade);
    expect(indice.memoria.endsWith('1.785,71')).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Princípio III — procedência: cada índice cita a fonte que é dele            */
/* -------------------------------------------------------------------------- */

describe('procedência das fontes', () => {
  const r = calcularPeriodo(CASO_DE_ACEITE);

  it('os índices da norma citam o item normativo, não só o número da NBR', () => {
    expect(forcar(r.hht).fonte).toContain('3.2');
    expect(forcar(r.tempoComputado).fonte).toContain('3.5');
    expect(forcar(r.taxaFrequencia).fonte).toContain('3.6.1.2');
    expect(forcar(r.taxaGravidade).fonte).toContain('3.6.2');
    expect(forcar(r.mediaDiasPerdidos).fonte).toContain('3.6.3');
  });

  it('TI, mortalidade e letalidade não são atribuídas à NBR 14280', () => {
    for (const resultado of [r.taxaIncidencia, r.mortalidade, r.letalidade]) {
      const indice = forcar(resultado);
      expect(indice.fonte).toContain('não consta da ABNT NBR 14280');
      expect(indice.nota).toContain('não está na NBR 14280');
    }
  });

  it('a TF diz qual das duas taxas de frequência da norma ela é', () => {
    const indice = forcar(r.taxaFrequencia);
    expect(indice.nota).toContain('3.6.1.1');
    expect(indice.nota).toContain('3.6.1.3');
  });

  it('a TG mostra a divergência de 3.6.2 em vez de resolvê-la em silêncio', () => {
    const indice = forcar(r.taxaGravidade);
    expect(indice.casas).toBe(2);
    expect(indice.memoria.endsWith('1.785,71')).toBe(true);
    expect(indice.nota).toContain('números inteiros');
    expect(indice.nota).toContain('1.786');
  });

  it('o tempo computado avisa que a soma do período não é a regra de um acidente', () => {
    expect(forcar(r.tempoComputado).nota).toContain('3.5');
  });
});

/* -------------------------------------------------------------------------- */
/* Casos limite — FR-005: nunca NaN, nunca Infinity, nunca zero silencioso     */
/* -------------------------------------------------------------------------- */

describe('divisões com denominador zero', () => {
  it('TF com HHT zero devolve erro explicado', () => {
    const r = taxaFrequencia({ acidentesComAfastamento: a(5), hht: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toEqual({ tipo: 'divisao-por-zero', denominador: 'o HHT' });
    }
  });

  it('TG com HHT zero devolve erro explicado', () => {
    const r = taxaGravidade({ tempoComputado: 720, hht: 0 });
    expect(r.ok).toBe(false);
  });

  it('TI sem trabalhadores devolve erro explicado', () => {
    const r = taxaIncidencia({ acidentes: a(5), trabalhadores: t(0) });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toMatchObject({ denominador: 'o número de trabalhadores' });
    }
  });

  it('média de dias perdidos sem acidentados devolve erro explicado', () => {
    const r = mediaDiasPerdidos({ tempoComputado: 720, acidentados: a(0) });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toMatchObject({ denominador: 'o número de acidentados' });
    }
  });

  it('mortalidade sem trabalhadores devolve erro explicado', () => {
    const r = mortalidade({ obitos: o(1), trabalhadores: t(0) });
    expect(r.ok).toBe(false);
  });

  it('letalidade sem acidentes devolve erro explicado', () => {
    const r = letalidade({ obitos: o(0), acidentes: a(0) });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erro).toMatchObject({ denominador: 'o número de acidentes' });
    }
  });
});

describe('período degenerado', () => {
  const vazio: Periodo = {
    trabalhadores: t(0),
    horasPorDia: h(0),
    diasTrabalhados: d(0),
    horasExtras: h(0),
    acidentesComAfastamento: a(0),
    acidentesSemAfastamento: a(0),
    obitos: o(0),
    diasPerdidos: d(0),
    diasDebitados: d(0),
  };

  const r = calcularPeriodo(vazio);

  it('HHT e tempo computado valem zero legitimamente', () => {
    expect(forcar(r.hht).valor).toBe(0);
    expect(forcar(r.tempoComputado).valor).toBe(0);
  });

  it('nenhuma taxa é calculada — todas devolvem erro', () => {
    expect(r.taxaFrequencia.ok).toBe(false);
    expect(r.taxaGravidade.ok).toBe(false);
    expect(r.taxaIncidencia.ok).toBe(false);
    expect(r.mediaDiasPerdidos.ok).toBe(false);
    expect(r.mortalidade.ok).toBe(false);
    expect(r.letalidade.ok).toBe(false);
  });

  it('nenhum valor exibível é NaN ou Infinity', () => {
    for (const resultado of Object.values(r)) {
      if (resultado.ok) {
        expect(Number.isFinite(resultado.valor.valor)).toBe(true);
      }
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Casos felizes isolados                                                      */
/* -------------------------------------------------------------------------- */

describe('funções isoladas', () => {
  it('HHT soma as horas extras à base', () => {
    const r = hht({
      trabalhadores: t(10),
      horasPorDia: h(8),
      diasTrabalhados: d(20),
      horasExtras: h(160),
    });
    expect(forcar(r).valor).toBe(1760);
  });

  it('valorHht devolve o número cru', () => {
    expect(
      valorHht({
        trabalhadores: t(10),
        horasPorDia: h(8),
        diasTrabalhados: d(20),
        horasExtras: h(0),
      }),
    ).toBe(1600);
  });

  it('valorTempoComputado devolve o número cru', () => {
    expect(
      valorTempoComputado({ diasPerdidos: d(30), diasDebitados: d(0) }),
    ).toBe(30);
  });

  it('tempo computado sem dias debitados é só o perdido', () => {
    const r = tempoComputado({ diasPerdidos: d(30), diasDebitados: d(0) });
    expect(forcar(r).valor).toBe(30);
  });

  it('mortalidade por cem mil trabalhadores', () => {
    const r = mortalidade({ obitos: o(1), trabalhadores: t(500) });
    expect(forcar(r).valor).toBe(200);
    expect(normalizar(forcar(r).memoria)).toBe(
      'TM = (1 × 100.000) ÷ 500 = 200,00',
    );
  });

  it('letalidade por mil acidentes', () => {
    const r = letalidade({ obitos: o(2), acidentes: a(40) });
    expect(forcar(r).valor).toBe(50);
    expect(normalizar(forcar(r).memoria)).toBe('TL = (2 × 1.000) ÷ 40 = 50,00');
  });

  it('TI considera acidentes com e sem afastamento', () => {
    const r = calcularPeriodo({
      ...CASO_DE_ACEITE,
      acidentesSemAfastamento: a(15),
    });
    // (5 + 15) × 1000 ÷ 200
    expect(forcar(r.taxaIncidencia).valor).toBe(100);
  });

  it('TF considera apenas os acidentes com afastamento', () => {
    const r = calcularPeriodo({
      ...CASO_DE_ACEITE,
      acidentesSemAfastamento: a(15),
    });
    expect(forcar(r.taxaFrequencia).valor).toBe(TF_ESPERADA);
  });
});

/* -------------------------------------------------------------------------- */
/* Item 3.5 e nota de 3.6.2 — tempo computado de um acidente só                */
/* -------------------------------------------------------------------------- */

describe('valorTempoComputadoDoAcidente', () => {
  it('sem incapacidade permanente, é o tempo perdido', () => {
    expect(
      valorTempoComputadoDoAcidente({ diasPerdidos: d(45), diasDebitados: d(0) }),
    ).toBe(45);
  });

  it('com incapacidade permanente, conta só o debitado — não a soma', () => {
    expect(
      valorTempoComputadoDoAcidente({
        diasPerdidos: d(120),
        diasDebitados: d(600),
      }),
    ).toBe(600);
  });

  it('salvo quando os dias perdidos excedem os debitados', () => {
    expect(
      valorTempoComputadoDoAcidente({
        diasPerdidos: d(800),
        diasDebitados: d(600),
      }),
    ).toBe(800);
  });

  it('difere da soma do período — é por isso que a nota do TC existe', () => {
    const entrada = { diasPerdidos: d(120), diasDebitados: d(600) };
    expect(valorTempoComputado(entrada)).toBe(720);
    expect(valorTempoComputadoDoAcidente(entrada)).toBe(600);
  });
});
