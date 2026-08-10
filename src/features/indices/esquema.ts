/**
 * Validação do formulário do Módulo 1.
 *
 * Duas camadas, de propósito:
 *
 * - `esquemaPeriodo` (Zod) existe para dar **mensagem por campo** ao React Hook
 *   Form. Trabalha sobre strings, porque é isso que o `<input>` produz.
 * - `montarPeriodo` converte para os tipos do núcleo usando os construtores de
 *   `core/tipos.ts`, que são quem realmente define o que é um valor válido.
 *
 * O HHT igual a zero **não** é erro de formulário. É resultado legítimo de um
 * efetivo zero, e quem explica isso é o núcleo, com a mensagem de divisão por
 * zero (cenário de aceite 4 da spec). Bloquear aqui esconderia a explicação.
 */

import { z } from 'zod';

import { interpretarNumero } from '../../core/formatacao';
import {
  acidentes,
  dias,
  falha,
  horas,
  obitos,
  ok,
  trabalhadores,
  type Periodo,
  type Result,
} from '../../core/tipos';

export const ROTULOS = {
  trabalhadores: 'efetivo exposto',
  horasPorDia: 'horas por dia',
  diasTrabalhados: 'dias trabalhados no período',
  horasExtras: 'horas extras',
  acidentesComAfastamento: 'acidentes com afastamento',
  acidentesSemAfastamento: 'acidentes sem afastamento',
  obitos: 'óbitos',
  diasPerdidos: 'dias perdidos',
  diasDebitados: 'dias debitados',
} as const;

/* -------------------------------------------------------------------------- */
/* Esquema Zod — mensagens por campo                                           */
/* -------------------------------------------------------------------------- */

/** Cada refinamento só opina sobre o que consegue ler; assim aparece uma mensagem por vez. */
function numeroDe(texto: string): number | undefined {
  const r = interpretarNumero(texto);
  return r.ok ? r.valor : undefined;
}

function campo(inteiro: boolean) {
  return z
    .string()
    .refine(
      (t) => numeroDe(t) !== undefined,
      'Informe um número. Use vírgula para decimais: 8,5.',
    )
    .refine((t) => {
      const n = numeroDe(t);
      return n === undefined || n >= 0;
    }, 'Não pode ser negativo.')
    .refine((t) => {
      const n = numeroDe(t);
      return !inteiro || n === undefined || Number.isInteger(n);
    }, 'Deve ser um número inteiro — não existe meio acidente.');
}

const CONTAGEM = campo(true);
const MEDIDA = campo(false);

export const esquemaPeriodo = z
  .object({
    trabalhadores: CONTAGEM,
    horasPorDia: MEDIDA,
    diasTrabalhados: CONTAGEM,
    horasExtras: MEDIDA,
    acidentesComAfastamento: CONTAGEM,
    acidentesSemAfastamento: CONTAGEM,
    obitos: CONTAGEM,
    diasPerdidos: CONTAGEM,
    diasDebitados: CONTAGEM,
  })
  .superRefine((valores, ctx) => {
    const mortes = numeroDe(valores.obitos);
    const comAfastamento = numeroDe(valores.acidentesComAfastamento);

    if (
      mortes !== undefined &&
      comAfastamento !== undefined &&
      mortes > comAfastamento
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['obitos'],
        message:
          'Não pode haver mais óbitos do que acidentes com afastamento — todo óbito é um acidente com afastamento.',
      });
    }
  });

export type ValoresFormulario = z.infer<typeof esquemaPeriodo>;

export const VALORES_INICIAIS: ValoresFormulario = {
  trabalhadores: '',
  horasPorDia: '8',
  diasTrabalhados: '',
  horasExtras: '0',
  acidentesComAfastamento: '',
  acidentesSemAfastamento: '0',
  obitos: '0',
  diasPerdidos: '',
  diasDebitados: '0',
};

/**
 * Campo ausente é campo vazio — nunca herda o valor inicial. Se `useWatch` ainda
 * não conhece um campo, o resultado tem de ser "está vazio", não um `8` que o
 * usuário não digitou.
 */
const CAMPOS_VAZIOS: ValoresFormulario = {
  trabalhadores: '',
  horasPorDia: '',
  diasTrabalhados: '',
  horasExtras: '',
  acidentesComAfastamento: '',
  acidentesSemAfastamento: '',
  obitos: '',
  diasPerdidos: '',
  diasDebitados: '',
};

/* -------------------------------------------------------------------------- */
/* Conversão para os tipos do núcleo                                           */
/* -------------------------------------------------------------------------- */

function ler<T>(
  texto: string,
  rotulo: string,
  construtor: (n: number) => Result<T>,
): Result<T> {
  const numero = interpretarNumero(texto, rotulo);
  if (!numero.ok) return numero;

  const construido = construtor(numero.valor);
  if (construido.ok) return construido;

  // O construtor do núcleo nomeia o campo pela unidade ("dias"); aqui trocamos
  // pelo rótulo do formulário, que é o que o usuário está vendo na tela.
  return falha(
    construido.erro.tipo === 'entrada-invalida'
      ? { ...construido.erro, campo: rotulo }
      : construido.erro,
  );
}

/** Converte o formulário no `Periodo` do núcleo, ou devolve o primeiro erro. */
export function montarPeriodo(
  parcial: Partial<ValoresFormulario>,
): Result<Periodo> {
  const v: ValoresFormulario = { ...CAMPOS_VAZIOS, ...parcial };

  const efetivo = ler(v.trabalhadores, ROTULOS.trabalhadores, trabalhadores);
  if (!efetivo.ok) return efetivo;

  const horasPorDia = ler(v.horasPorDia, ROTULOS.horasPorDia, horas);
  if (!horasPorDia.ok) return horasPorDia;

  const diasTrabalhados = ler(
    v.diasTrabalhados,
    ROTULOS.diasTrabalhados,
    dias,
  );
  if (!diasTrabalhados.ok) return diasTrabalhados;

  const horasExtras = ler(v.horasExtras, ROTULOS.horasExtras, horas);
  if (!horasExtras.ok) return horasExtras;

  const comAfastamento = ler(
    v.acidentesComAfastamento,
    ROTULOS.acidentesComAfastamento,
    acidentes,
  );
  if (!comAfastamento.ok) return comAfastamento;

  const semAfastamento = ler(
    v.acidentesSemAfastamento,
    ROTULOS.acidentesSemAfastamento,
    acidentes,
  );
  if (!semAfastamento.ok) return semAfastamento;

  const mortes = ler(v.obitos, ROTULOS.obitos, obitos);
  if (!mortes.ok) return mortes;

  const diasPerdidos = ler(v.diasPerdidos, ROTULOS.diasPerdidos, dias);
  if (!diasPerdidos.ok) return diasPerdidos;

  const diasDebitados = ler(v.diasDebitados, ROTULOS.diasDebitados, dias);
  if (!diasDebitados.ok) return diasDebitados;

  return ok({
    trabalhadores: efetivo.valor,
    horasPorDia: horasPorDia.valor,
    diasTrabalhados: diasTrabalhados.valor,
    horasExtras: horasExtras.valor,
    acidentesComAfastamento: comAfastamento.valor,
    acidentesSemAfastamento: semAfastamento.valor,
    obitos: mortes.valor,
    diasPerdidos: diasPerdidos.valor,
    diasDebitados: diasDebitados.valor,
  });
}
