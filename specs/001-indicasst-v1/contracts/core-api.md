# Phase 1 — Contrato público de `src/core/`

Este é o contrato que a UI consome. Mudança de assinatura aqui é mudança de produto.
Nenhuma função abaixo importa React, arredonda valor, ou lança exceção.

---

## `core/tipos.ts`

```ts
export type Horas, Dias, Acidentes, Trabalhadores, Obitos   // branded
export type Result<T, E = ErroCalculo>
export type ErroCalculo
export interface Indice

export function horas(n: number): Result<Horas>;
export function dias(n: number): Result<Dias>;
export function acidentes(n: number): Result<Acidentes>;
export function trabalhadores(n: number): Result<Trabalhadores>;
export function obitos(n: number): Result<Obitos>;

export function ok<T>(valor: T): Result<T>;
export function falha<E>(erro: E): Result<never, E>;
```

---

## `core/formatacao.ts` — **única fonte de arredondamento e formato pt-BR**

```ts
export function formatarNumero(valor: number, casas?: number): string;  // padrão 2
export function formatarInteiro(valor: number): string;
export function formatarPercentual(valor: number, casas?: number): string;
export function mensagemDeErro(erro: ErroCalculo): string;              // pt-BR
```

`formatarNumero(1785.714285)` → `"1.785,71"`.
`formatarInteiro(403200)` → `"403.200"`.

Nenhum outro arquivo de `core/` chama `toFixed` ou `Intl.NumberFormat`.

---

## `core/memoria.ts`

```ts
export function montarMemoria(params: {
  sigla: string;
  expressao: string;   // "(5 × 1.000.000) ÷ 403.200"
  resultado: number;
  casas?: number;
}): string;            // "TF = (5 × 1.000.000) ÷ 403.200 = 12,40"
```

---

## `core/indices.ts` — Fatia 1

```ts
export interface EntradaHht {
  trabalhadores: Trabalhadores;
  horasPorDia: Horas;
  diasTrabalhados: Dias;
  horasExtras: Horas;
}
export interface EntradaTempoComputado {
  diasPerdidos: Dias;
  diasDebitados: Dias;
}

export function valorHht(p: EntradaHht): number;
export function hht(p: EntradaHht): Result<Indice>;
// (trabalhadores × horasPorDia × diasTrabalhados) + horasExtras

export function valorTempoComputado(p: EntradaTempoComputado): number;
export function tempoComputado(p: EntradaTempoComputado): Result<Indice>;
// diasPerdidos + diasDebitados

// As duas variantes `valor*` devolvem o número cru. Existem porque hht() e
// tempoComputado() nunca falham: se `calcularPeriodo` desembrulhasse o Result
// deles, criaria um ramo de erro inalcançável — e cobertura de 100% em core/ é
// condição de merge (princípio I).

export function taxaFrequencia(p: {
  acidentesComAfastamento: Acidentes;
  hht: number;
}): Result<Indice>;
// acidentesComAfastamento × 1_000_000 ÷ hht     | hht = 0 ⇒ divisao-por-zero

export function taxaGravidade(p: {
  tempoComputado: number;
  hht: number;
}): Result<Indice>;
// tempoComputado × 1_000_000 ÷ hht              | hht = 0 ⇒ divisao-por-zero

export function taxaIncidencia(p: {
  acidentes: Acidentes;
  trabalhadores: Trabalhadores;
}): Result<Indice>;
// acidentes × 1_000 ÷ trabalhadores             | trabalhadores = 0 ⇒ erro

export function mediaDiasPerdidos(p: {
  tempoComputado: number;
  acidentados: Acidentes;
}): Result<Indice>;
// tempoComputado ÷ acidentados                  | acidentados = 0 ⇒ erro

export function mortalidade(p: {
  obitos: Obitos;
  trabalhadores: Trabalhadores;
}): Result<Indice>;
// obitos × 100_000 ÷ trabalhadores

export function letalidade(p: {
  obitos: Obitos;
  acidentes: Acidentes;
}): Result<Indice>;
// obitos × 1_000 ÷ acidentes

export function calcularPeriodo(p: Periodo): {
  readonly [K in NomeIndice]: Result<Indice>
};
// conveniência: calcula os oito de uma vez a partir de um Periodo
```

### Caso de aceite (teste obrigatório)

Entrada: `trabalhadores = 200`, `horasPorDia = 8`, `diasTrabalhados = 252`,
`horasExtras = 0`, `acidentesComAfastamento = 5`, `diasPerdidos = 120`,
`diasDebitados = 600`.

| Índice | Valor esperado (precisão total) | Exibido |
|---|---|---|
| HHT | `403200` | `403.200` |
| Tempo computado | `720` | `720` |
| TF | `5_000_000 / 403_200` | `12,40` |
| TG | `720_000_000 / 403_200` | `1.785,71` |
| TI | `25` | `25,00` |
| Média de dias perdidos | `144` | `144,00` |

O teste escreve TF e TG como a divisão, não como literal decimal: um literal com
17 dígitos não é representável em `double` e o valor comparado deixaria de ser o
valor real da conta.

Memória de TF esperada:
`TF = (5 × 1.000.000) ÷ 403.200 = 12,40`

---

## `core/descritiva.ts` — Fatia 3

```ts
export function media(v: readonly number[]): Result<number>;
export function mediana(v: readonly number[]): Result<number>;
export function moda(v: readonly number[]): readonly number[];   // vazio ⇒ amodal
export function amplitude(v: readonly number[]): Result<number>;
export function variancia(v: readonly number[]): Result<number>;      // n − 1
export function desvioPadrao(v: readonly number[]): Result<number>;   // n − 1
export function coeficienteVariacao(v: readonly number[]): Result<number>;
export function interpretarCV(cv: number): 'baixa' | 'media' | 'alta';
export function passosDesvio(v: readonly number[]): Result<readonly PassoDesvio[]>;
export function binsHistograma(v: readonly number[], bins?: number): Result<readonly Bin[]>;
export function resumoBoxPlot(v: readonly number[]): Result<ResumoBoxPlot>;
```

`interpretarCV`: `< 15` ⇒ `'baixa'`; `15 ≤ cv ≤ 30` ⇒ `'media'`; `> 30` ⇒ `'alta'`.
Série de 1 elemento ⇒ `amostra-insuficiente` com `minimo: 2` em variância, desvio e CV.

---

## `core/serie.ts` — Fatia 4

```ts
export function serieTaxas(pontos: readonly PontoMensal[]): readonly {
  mes: string;
  tf: Result<Indice>;
  tg: Result<Indice>;
}[];

export function consolidarPeriodo(pontos: readonly PontoMensal[]): Result<ConsolidadoPeriodo>;
export function limitesControle(taxas: readonly number[]): Result<LimitesControle>;
```

`consolidarPeriodo` devolve `correto` **e** `mediaIngenua`, mais a diferença — nunca
só um dos dois (FR-033).

---

## `core/pareto.ts` — Fatia 5

```ts
export function pareto(cats: readonly Categoria[]): Result<{
  itens: readonly ItemPareto[];
  categoriasNoCorte: readonly string[];
  percentualDoCorte: number;
  semConcentracao: boolean;   // todas as frequências iguais (edge case)
}>;
```

Ordenação: frequência decrescente; empate desfeito por ordem alfabética do rótulo
(critério estável e declarado, FR-037). Frequência 0 é excluída e listada à parte.

---

## `core/composicao.ts` — Fatia 6

```ts
export function composicao(
  cats: readonly Categoria[],
  opcoes?: { maximoFatias?: number }   // padrão 6
): Result<Composicao>;
```

Regras codificadas aqui, não no componente:
- ordena decrescente, mantém as `maximoFatias − 1` maiores, agrupa o resto em
  `"Outros"` e conta em `categoriasAgrupadas`;
- percentuais arredondados para inteiro; `somaFecha100 = false` quando a soma ≠ 100;
- exatamente 2 fatias ⇒ `forma: 'barra-proporcao'`;
- 3 a 6 fatias ⇒ `forma: 'rosca'`;
- frequência 0 excluída.

---

## `core/diasDebitados.ts` — Fatia 2 ✅ implementado

```ts
export const TETO_DIAS = 6_000;                    // item 3.4.3.5
export const TABELA_PADRAO: TabelaDiasDebitados;   // quadro 1, tudo com `confirmado: false`
export function buscar(tabela: TabelaDiasDebitados, chave: string): EntradaDiasDebitados | undefined;
export function mesclar(padrao: TabelaDiasDebitados, usuario: TabelaDiasDebitados): TabelaDiasDebitados;
export function somarDias(entradas: readonly EntradaDiasDebitados[]): SomaDiasDebitados;
export function validarJson(json: unknown): Result<TabelaDiasDebitados>;
export function lerJson(texto: string): Result<TabelaDiasDebitados>;
```

`somarDias` devolve `SomaDiasDebitados`, não `Dias` puro, porque a extração da norma
mostrou que a soma carrega duas regras que a UI precisa explicar:

- **3.4.3.1** — no mesmo dedo conta-se só o osso de maior valor; dedos diferentes
  somam-se. As entradas vencidas vão para `desprezadas`, com o motivo em `avisos`.
- **3.4.3.5** — o que passar de 6 000 dias é desprezado, e a `memoria` mostra o corte
  como `mín(6.000; …)` em vez de exibir um total que não fecha com as parcelas.

`temEntradaNaoConfirmada` é o gancho do aviso de tabela não conferida (T029).

---

## `core/planilha.ts` — Fatia 3

```ts
export function lerSerieColada(texto: string): ResultadoColagem;
```

Separadores de campo: `\n`, `\t`, `;`, `,`. Decimal pt-BR detectado por token
(ver R-007). Tokens não numéricos vão para `ignorados`.

---

## Regras que valem para todo o contrato

1. Nenhuma função lança exceção. Falha é `Result` com `ErroCalculo`.
2. Nenhuma função arredonda `valor`. Arredondamento só em `formatacao.ts`.
3. Nenhum arquivo importa `react` ou `recharts` — verificado por lint e por teste.
4. Todo `Indice` devolvido tem `memoria` e `fonte` preenchidos.
5. Toda função tem teste com caso feliz, caso limite e — quando aplicável — o caso de
   aceite acima.
