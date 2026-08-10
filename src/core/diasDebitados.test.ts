import { describe, expect, it } from 'vitest';

import {
  buscar,
  lerJson,
  mesclar,
  somarDias,
  TABELA_PADRAO,
  TETO_DIAS,
  validarJson,
  type EntradaDiasDebitados,
  type TabelaDiasDebitados,
} from './diasDebitados';
import { mensagemDeErro } from './formatacao';
import type { Result } from './tipos';

/* -------------------------------------------------------------------------- */
/* Auxiliares                                                                  */
/* -------------------------------------------------------------------------- */

function forcar<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(`esperava sucesso, veio ${JSON.stringify(r.erro)}`);
  return r.valor;
}

function erroDe<T>(r: Result<T>): { campo?: string; motivo?: string } {
  if (r.ok) throw new Error('esperava falha, veio sucesso');
  if (r.erro.tipo !== 'entrada-invalida') {
    throw new Error(`esperava entrada-invalida, veio ${r.erro.tipo}`);
  }
  return { campo: r.erro.campo, motivo: r.erro.motivo };
}

function achar(chave: string): EntradaDiasDebitados {
  const e = buscar(TABELA_PADRAO, chave);
  if (e === undefined) throw new Error(`chave ausente na tabela padrão: ${chave}`);
  return e;
}

/** Entrada avulsa para os testes de regra, sem depender da tabela padrão. */
function avulsa(
  chave: string,
  dias: number,
  extras: Partial<EntradaDiasDebitados> = {},
): EntradaDiasDebitados {
  return {
    chave,
    grupo: 'Teste',
    descricao: chave,
    dias,
    fonte: 'teste',
    confirmado: false,
    ...extras,
  };
}

/* -------------------------------------------------------------------------- */
/* A tabela em si                                                              */
/* -------------------------------------------------------------------------- */

describe('TABELA_PADRAO reproduz o quadro 1 sem inventar valor', () => {
  it('o caso de aceite da spec bate: polegar, 1ª falange = 600 dias', () => {
    expect(achar('mao.polegar.falange-proximal').dias).toBe(600);
  });

  it('o polegar não tem 3ª falange', () => {
    expect(buscar(TABELA_PADRAO, 'mao.polegar.falange-distal')).toBeUndefined();
  });

  it('a 2ª falange do polegar vale 300 e é anunciada como a da ponta', () => {
    const e = achar('mao.polegar.falange-medial');
    expect(e.dias).toBe(300);
    expect(e.descricao).toContain('falange da ponta');
  });

  it('as linhas dos quirodáctilos não estão deslocadas — indicador vale menos que polegar', () => {
    expect(achar('mao.indicador.falange-distal').dias).toBe(100);
    expect(achar('mao.indicador.falange-medial').dias).toBe(200);
    expect(achar('mao.indicador.falange-proximal').dias).toBe(400);
    expect(achar('mao.indicador.metacarpiano').dias).toBe(600);
    expect(achar('mao.minimo.falange-distal').dias).toBe(50);
    expect(achar('mao.polegar.metacarpiano').dias).toBe(900);
  });

  it('"cada um dos demais" pododáctilos virou uma entrada por dedo', () => {
    expect(achar('pe.halux.falange-proximal').dias).toBe(300);
    for (const dedo of ['segundo', 'terceiro', 'quarto', 'quinto']) {
      expect(achar(`pe.${dedo}.falange-distal`).dias).toBe(35);
      expect(achar(`pe.${dedo}.metatarsiano`).dias).toBe(350);
    }
    expect(buscar(TABELA_PADRAO, 'pe.halux.falange-distal')).toBeUndefined();
  });

  it('morte, incapacidade total e perturbação funcional', () => {
    expect(achar('morte').dias).toBe(6_000);
    expect(achar('incapacidade-permanente-total').dias).toBe(6_000);
    expect(achar('visao.um-olho').dias).toBe(1_800);
    expect(achar('visao.ambos-os-olhos').dias).toBe(6_000);
    expect(achar('audicao.um-ouvido').dias).toBe(600);
    expect(achar('audicao.ambos-os-ouvidos').dias).toBe(3_000);
    expect(achar('hernia-inguinal-nao-reparada').dias).toBe(50);
  });

  it('membros superiores e inferiores', () => {
    expect(achar('braco.acima-do-punho-ate-o-cotovelo').dias).toBe(3_600);
    expect(achar('braco.do-cotovelo-ate-o-ombro').dias).toBe(4_500);
    expect(achar('mao.no-punho').dias).toBe(3_000);
    expect(achar('perna.acima-do-joelho').dias).toBe(4_500);
    expect(achar('perna.acima-do-tornozelo-ate-o-joelho').dias).toBe(3_000);
    expect(achar('pe.no-tornozelo').dias).toBe(2_400);
  });

  it('nenhuma chave repetida', () => {
    const chaves = TABELA_PADRAO.map((e) => e.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
  });

  it('nenhum valor passa do teto e nenhum é negativo', () => {
    for (const e of TABELA_PADRAO) {
      expect(e.dias).toBeGreaterThan(0);
      expect(e.dias).toBeLessThanOrEqual(TETO_DIAS);
    }
  });

  it('toda entrada declara fonte e nasce não confirmada (princípio III)', () => {
    for (const e of TABELA_PADRAO) {
      expect(e.fonte).toContain('NBR 14280');
      expect(e.confirmado).toBe(false);
      expect(e.descricao.length).toBeGreaterThan(0);
      expect(e.grupo.length).toBeGreaterThan(0);
    }
  });

  it('lesões de dedo trazem o agrupador de dedo; as demais não', () => {
    expect(achar('mao.polegar.falange-proximal').dedo).toBe('mao.polegar');
    expect(achar('pe.quinto.metatarsiano').dedo).toBe('pe.quinto');
    expect(achar('morte').dedo).toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/* buscar / mesclar                                                            */
/* -------------------------------------------------------------------------- */

describe('buscar', () => {
  it('devolve a entrada quando a chave existe', () => {
    expect(buscar(TABELA_PADRAO, 'morte')?.dias).toBe(6_000);
  });

  it('devolve undefined quando não existe — não inventa entrada', () => {
    expect(buscar(TABELA_PADRAO, 'chave.que.nao.existe')).toBeUndefined();
  });
});

describe('mesclar', () => {
  const usuario: TabelaDiasDebitados = [
    avulsa('morte', 6_000, { confirmado: true, fonte: 'exemplar da ABNT' }),
    avulsa('lesao.propria.da.empresa', 90),
  ];

  const mesclada = mesclar(TABELA_PADRAO, usuario);

  it('a entrada do usuário sobrescreve a padrão pela chave', () => {
    const morte = buscar(mesclada, 'morte');
    expect(morte?.confirmado).toBe(true);
    expect(morte?.fonte).toBe('exemplar da ABNT');
  });

  it('as entradas não sobrescritas ficam intactas e na mesma posição', () => {
    expect(buscar(mesclada, 'mao.polegar.falange-proximal')).toEqual(
      achar('mao.polegar.falange-proximal'),
    );
    expect(mesclada.indexOf(achar('visao.um-olho'))).toBe(
      TABELA_PADRAO.indexOf(achar('visao.um-olho')),
    );
  });

  it('chaves novas entram no fim, sem duplicar as antigas', () => {
    expect(mesclada.length).toBe(TABELA_PADRAO.length + 1);
    expect(mesclada.at(-1)?.chave).toBe('lesao.propria.da.empresa');
  });

  it('mesclar com tabela vazia devolve a padrão', () => {
    expect(mesclar(TABELA_PADRAO, [])).toEqual(TABELA_PADRAO);
  });
});

/* -------------------------------------------------------------------------- */
/* somarDias — itens 3.4.3.1 e 3.4.3.5                                         */
/* -------------------------------------------------------------------------- */

describe('somarDias', () => {
  it('sem ocorrência nenhuma, zero é resultado legítimo e a memória mostra isso', () => {
    const soma = somarDias([]);
    expect(soma.dias).toBe(0);
    expect(soma.memoria).toBe('Dias debitados = 0 = 0');
    expect(soma.avisos).toEqual([]);
    expect(soma.temEntradaNaoConfirmada).toBe(false);
  });

  it('o caso de aceite: só o polegar amputado = 600 dias', () => {
    const soma = somarDias([achar('mao.polegar.falange-proximal')]);
    expect(soma.dias).toBe(600);
    expect(soma.memoria).toBe('Dias debitados = 600 = 600');
    expect(soma.temEntradaNaoConfirmada).toBe(true);
  });

  it('dedos diferentes somam-se', () => {
    const soma = somarDias([
      achar('mao.polegar.falange-proximal'),
      achar('mao.indicador.falange-medial'),
    ]);
    expect(soma.dias).toBe(800);
    expect(soma.memoria).toBe('Dias debitados = 600 + 200 = 800');
    expect(soma.avisos).toEqual([]);
  });

  it('3.4.3.1: no mesmo dedo conta só o osso de maior valor', () => {
    const soma = somarDias([
      achar('mao.polegar.falange-medial'), // 300
      achar('mao.polegar.metacarpiano'), // 900 — este vence
      achar('mao.indicador.falange-distal'), // 100, outro dedo
    ]);
    expect(soma.dias).toBe(1_000);
    expect(soma.consideradas.map((e) => e.chave)).toEqual([
      'mao.polegar.metacarpiano',
      'mao.indicador.falange-distal',
    ]);
    expect(soma.desprezadas.map((e) => e.chave)).toEqual([
      'mao.polegar.falange-medial',
    ]);
    expect(soma.avisos).toHaveLength(1);
    expect(soma.avisos.at(0)).toContain('3.4.3.1');
    expect(soma.avisos.at(0)).toContain('300 dias');
  });

  it('3.4.3.1 é estável quando os valores empatam: fica o primeiro selecionado', () => {
    const soma = somarDias([
      avulsa('a', 100, { dedo: 'mao.medio' }),
      avulsa('b', 100, { dedo: 'mao.medio' }),
    ]);
    expect(soma.dias).toBe(100);
    expect(soma.consideradas.map((e) => e.chave)).toEqual(['a']);
  });

  it('a mesma ocorrência selecionada duas vezes conta uma vez, com aviso', () => {
    const morte = achar('morte');
    const soma = somarDias([morte, morte]);
    expect(soma.dias).toBe(6_000);
    expect(soma.avisos.at(0)).toContain('mais de uma vez');
    expect(soma.desprezadas).toHaveLength(1);
  });

  it('3.4.3.5: o que passa de 6.000 dias é desprezado, e a memória diz que houve corte', () => {
    const soma = somarDias([
      achar('braco.do-cotovelo-ate-o-ombro'), // 4.500
      achar('perna.acima-do-joelho'), // 4.500
    ]);
    expect(soma.dias).toBe(TETO_DIAS);
    expect(soma.memoria).toBe(
      'Dias debitados = mín(6.000; 4.500 + 4.500) = 6.000',
    );
    expect(soma.avisos.at(0)).toContain('3.4.3.5');
    expect(soma.avisos.at(0)).toContain('9.000');
  });

  it('soma exatamente igual ao teto não dispara aviso', () => {
    const soma = somarDias([achar('morte')]);
    expect(soma.dias).toBe(TETO_DIAS);
    expect(soma.avisos).toEqual([]);
  });

  it('entradas confirmadas não levantam o aviso de tabela não conferida', () => {
    const soma = somarDias([avulsa('x', 10, { confirmado: true })]);
    expect(soma.temEntradaNaoConfirmada).toBe(false);
  });

  it('nunca devolve NaN nem valor negativo', () => {
    const soma = somarDias(TABELA_PADRAO);
    expect(Number.isFinite(soma.dias)).toBe(true);
    expect(soma.dias).toBe(TETO_DIAS);
  });
});

/* -------------------------------------------------------------------------- */
/* validarJson — a tabela do usuário                                           */
/* -------------------------------------------------------------------------- */

describe('validarJson', () => {
  const minima = [{ chave: 'x', descricao: 'Lesão X', dias: 42 }];

  it('aceita o mínimo e preenche grupo, fonte e confirmado com padrões honestos', () => {
    const tabela = forcar(validarJson(minima));
    expect(tabela).toEqual([
      {
        chave: 'x',
        grupo: 'Importado',
        descricao: 'Lesão X',
        dias: 42,
        fonte: 'Informado pelo usuário',
        confirmado: false,
      },
    ]);
  });

  it('aceita a entrada completa, inclusive dedo e confirmado', () => {
    const tabela = forcar(
      validarJson([
        {
          chave: 'y',
          grupo: 'Mão',
          descricao: 'Lesão Y',
          dias: 7,
          fonte: 'exemplar da ABNT',
          confirmado: true,
          dedo: 'mao.polegar',
        },
      ]),
    );
    expect(tabela.at(0)).toMatchObject({
      confirmado: true,
      dedo: 'mao.polegar',
      grupo: 'Mão',
    });
  });

  it('lista vazia é tabela válida', () => {
    expect(forcar(validarJson([]))).toEqual([]);
  });

  it('recusa o que não é lista', () => {
    expect(erroDe(validarJson({ chave: 'x' }))).toEqual({
      campo: 'tabela',
      motivo: 'deve ser uma lista de entradas',
    });
  });

  it.each([
    ['texto solto', 'nao sou objeto'],
    ['nulo', null],
    ['lista aninhada', []],
  ])('recusa item que é %s', (_nome, item) => {
    expect(erroDe(validarJson([item])).campo).toBe('tabela[0]');
  });

  it('recusa chave ausente, vazia ou não textual', () => {
    expect(erroDe(validarJson([{ descricao: 'a', dias: 1 }])).campo).toBe(
      'tabela[0].chave',
    );
    expect(
      erroDe(validarJson([{ chave: '   ', descricao: 'a', dias: 1 }])).motivo,
    ).toBe('deve ser um texto não vazio');
    expect(
      erroDe(validarJson([{ chave: 7, descricao: 'a', dias: 1 }])).motivo,
    ).toBe('deve ser um texto não vazio');
  });

  it('recusa chave repetida dentro do próprio arquivo, apontando a posição', () => {
    const erro = erroDe(validarJson([...minima, ...minima]));
    expect(erro.campo).toBe('tabela[1].chave');
    expect(erro.motivo).toContain('já apareceu antes');
  });

  it('recusa descrição ausente', () => {
    expect(erroDe(validarJson([{ chave: 'x', dias: 1 }])).campo).toBe(
      'tabela[0].descricao',
    );
  });

  it('recusa dias não numérico, não finito ou negativo', () => {
    expect(
      erroDe(validarJson([{ chave: 'x', descricao: 'a', dias: '10' }])).motivo,
    ).toBe('deve ser um número');
    expect(
      erroDe(validarJson([{ chave: 'x', descricao: 'a', dias: Number.NaN }]))
        .motivo,
    ).toBe('deve ser um número');
    expect(
      erroDe(validarJson([{ chave: 'x', descricao: 'a', dias: -1 }])).motivo,
    ).toBe('não pode ser negativo');
  });

  it('recusa grupo, fonte, confirmado e dedo com tipo errado', () => {
    const base = { chave: 'x', descricao: 'a', dias: 1 };
    expect(erroDe(validarJson([{ ...base, grupo: 3 }])).campo).toBe(
      'tabela[0].grupo',
    );
    expect(erroDe(validarJson([{ ...base, fonte: 3 }])).campo).toBe(
      'tabela[0].fonte',
    );
    expect(erroDe(validarJson([{ ...base, confirmado: 'sim' }]))).toEqual({
      campo: 'tabela[0].confirmado',
      motivo: 'deve ser verdadeiro ou falso',
    });
    expect(erroDe(validarJson([{ ...base, dedo: 42 }])).campo).toBe(
      'tabela[0].dedo',
    );
  });

  it('a mensagem de erro sai legível em pt-BR', () => {
    const r = validarJson([{ chave: 'x', descricao: 'a', dias: -1 }]);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(mensagemDeErro(r.erro)).toBe(
        'O campo "tabela[0].dias" não pode ser negativo.',
      );
    }
  });
});

describe('lerJson', () => {
  it('lê o texto de um arquivo válido', () => {
    const tabela = forcar(
      lerJson('[{"chave":"x","descricao":"Lesão X","dias":42}]'),
    );
    expect(tabela.at(0)?.dias).toBe(42);
  });

  it('JSON quebrado devolve Result com erro — não lança exceção', () => {
    expect(erroDe(lerJson('{ isso não é json'))).toEqual({
      campo: 'arquivo',
      motivo: 'não é um JSON válido',
    });
  });

  it('JSON válido mas com forma errada não sobrescreve a tabela existente', () => {
    const r = lerJson('{"chave":"x"}');
    expect(r.ok).toBe(false);
    const tabela = r.ok ? mesclar(TABELA_PADRAO, r.valor) : TABELA_PADRAO;
    expect(tabela).toBe(TABELA_PADRAO);
  });
});
