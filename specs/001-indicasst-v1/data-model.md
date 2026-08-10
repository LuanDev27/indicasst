# Phase 1 — Data Model

Todos os tipos vivem em `src/core/tipos.ts`, salvo indicação. Nenhum importa React.

## Tipos de fundação

```ts
declare const marca: unique symbol;
type Marcado<T, M extends string> = T & { readonly [marca]: M };

export type Horas         = Marcado<number, 'Horas'>;
export type Dias          = Marcado<number, 'Dias'>;
export type Acidentes     = Marcado<number, 'Acidentes'>;
export type Trabalhadores = Marcado<number, 'Trabalhadores'>;
export type Obitos        = Marcado<number, 'Obitos'>;

export type Result<T, E = ErroCalculo> =
  | { readonly ok: true;  readonly valor: T }
  | { readonly ok: false; readonly erro: E };

export type ErroCalculo =
  | { readonly tipo: 'divisao-por-zero';      readonly denominador: string }
  | { readonly tipo: 'amostra-insuficiente';  readonly minimo: number; readonly recebido: number }
  | { readonly tipo: 'entrada-invalida';      readonly campo: string; readonly motivo: string };
```

**Construtores validadores** (um por unidade): `horas(n)`, `dias(n)`,
`acidentes(n)`, `trabalhadores(n)`, `obitos(n)`. Rejeitam negativo, `NaN` e — nas
contagens — não inteiro. Devolvem `Result`.

---

## `Indice` — o contrato central

```ts
export interface Indice {
  readonly nome: string;        // "Taxa de Frequência"
  readonly sigla: string;       // "TF"
  readonly valor: number;       // precisão total, NUNCA arredondado
  readonly unidade: string;     // "acidentes por milhão de HHT"
  readonly casas: number;       // casas decimais de exibição: 0 ou 2
  readonly memoria: string;     // "TF = (5 × 1.000.000) ÷ 403.200 = 12,40"
  readonly fonte: string;       // "ABNT NBR 14280"
}
```

`casas` existe porque HHT e tempo computado são contagens inteiras — SC-001 exige
`HHT = 403.200`, não `403.200,00`. Taxas usam 2 casas. O arredondamento continua
acontecendo num lugar só (`formatacao.ts`); `casas` apenas diz quantas.

`fonte` cita a norma sem número de item enquanto a NBR 14280 não for consultada em
fonte primária — ver `TODO(NBR_14280_ITENS)` em `src/core/indices.ts`. Inventar item
seria precisão falsa, exatamente o que o princípio III existe para impedir.

`memoria` e `fonte` são obrigatórios **no tipo**: um índice sem memória de cálculo ou
sem referência normativa não compila (princípios II e III). Toda função de
`core/indices.ts` devolve `Result<Indice>`.

**Regra**: `valor` carrega precisão total. Quem formata é `formatacao.ts`. A string
`memoria` já vem formatada em pt-BR porque é texto de exibição, montada em
`core/memoria.ts` a partir de `formatacao.ts`.

---

## Entidades de domínio

### `Periodo` — entrada do Módulo 1

| Campo | Tipo | Regra |
|---|---|---|
| `trabalhadores` | `Trabalhadores` | ≥ 0, inteiro |
| `horasPorDia` | `Horas` | > 0 |
| `diasTrabalhados` | `Dias` | ≥ 0, total do período (ex.: 252 = 21 × 12) |
| `horasExtras` | `Horas` | ≥ 0 |
| `acidentesComAfastamento` | `Acidentes` | ≥ 0, inteiro |
| `acidentesSemAfastamento` | `Acidentes` | ≥ 0, inteiro |
| `obitos` | `Obitos` | ≥ 0, inteiro; ≤ acidentes com afastamento |
| `diasPerdidos` | `Dias` | ≥ 0 |
| `diasDebitados` | `Dias` | ≥ 0, já somado a partir das ocorrências |

`core/indices.ts` recebe `diasDebitados` como número pronto — **não** conhece a
tabela. É essa fronteira que permite entregar a Fatia 1 sem a NBR 14280 completa.

### `EntradaDiasDebitados` — item da tabela

| Campo | Tipo | Nota |
|---|---|---|
| `chave` | `string` | slug estável, usado no merge |
| `lesao` | `string` | "Amputação total do polegar" |
| `dias` | `Dias` | 600 |
| `fonte` | `string` | referência da procedência |
| `confirmado` | `boolean` | `false` ⇒ interface exibe marcação de não verificado |

`TabelaDiasDebitados = Record<string, EntradaDiasDebitados>`. A tabela do usuário é
mesclada **por cima** da embarcada, por `chave`.

### `SerieNumerica` — Módulo 2

```ts
interface SerieNumerica {
  readonly rotulo?: string;
  readonly valores: readonly number[];
}
interface ResultadoColagem {
  readonly valores: readonly number[];
  readonly ignorados: readonly string[];
}
```

### `ResumoDescritivo` — saída do Módulo 2

`media`, `mediana`, `moda` (`readonly number[]` — vazio ⇒ amodal),
`amplitude`, `variancia`, `desvioPadrao` (amostral, `n − 1`),
`coeficienteVariacao`, `interpretacaoCV` (`'baixa' | 'media' | 'alta'`),
`passos: readonly PassoDesvio[]` onde
`PassoDesvio = { valor: number; desvio: number; desvioQuadrado: number }`.

`resumoBoxPlot`: `minimo`, `q1`, `mediana`, `q3`, `maximo`, `outliers`.

### `PontoMensal` — Módulo 3

`mes: string` (`"2026-01"`), `acidentes: Acidentes`, `diasPerdidos: Dias`,
`hht: Horas`. Máximo 24 pontos.

### `ConsolidadoPeriodo` — saída do Módulo 3

`correto: Indice`, `mediaIngenua: Indice`, `diferencaAbsoluta: number`,
`diferencaPercentual: number`. Ver R-008.

### `LimitesControle`

`media`, `limiteSuperior` (`x̄ + 3s`), `limiteInferior` (`x̄ − 3s`, truncado em 0
apenas na exibição), `pontosForaDeControle: readonly number[]` (índices).

### `Categoria` — Módulos 4 e 5

`rotulo: string`, `frequencia: number` (≥ 0, inteiro).

### `ItemPareto` — saída do Módulo 4

`rotulo`, `frequencia`, `percentual`, `percentualAcumulado`,
`dentroDoCorte: boolean`.

### `Composicao` — saída do Módulo 5

```ts
interface FatiaComposicao {
  readonly rotulo: string;         // pode ser "Outros"
  readonly valor: number;
  readonly percentual: number;     // inteiro (FR-042)
  readonly agrupada: boolean;
}
interface Composicao {
  readonly fatias: readonly FatiaComposicao[];
  readonly categoriasAgrupadas: number;  // > 0 ⇒ avisar (FR-040)
  readonly somaFecha100: boolean;        // false ⇒ nota (FR-042)
  readonly forma: 'rosca' | 'barra-proporcao';  // 2 fatias ⇒ barra (FR-041)
}
```

`forma` é decidida em `core/composicao.ts`, não no componente: a regra de "nunca rosca
com 2 fatias" é de domínio, não de apresentação.

---

## Persistência

```ts
interface Envelope<T> {
  readonly versao: number;
  readonly dados: T;
}
```

Uma chave por módulo: `indicasst:indices`, `indicasst:descritiva`,
`indicasst:serie`, `indicasst:pareto`, `indicasst:composicao`,
`indicasst:tabela-dias-debitados`. Leitura com `versao` diferente da corrente tenta
migração registrada; sem migração, descarta e avisa. Toda operação devolve `Result`.

---

## Invariantes que os testes precisam garantir

1. Nenhum campo `valor` de `Indice` chega à UI arredondado.
2. Nenhum arquivo de `core/` além de `formatacao.ts` chama `toFixed` ou
   `Intl.NumberFormat`.
3. Nenhum arquivo de `core/` importa `react` ou `recharts`.
4. Toda divisão com denominador potencialmente zero devolve `Result` com
   `tipo: 'divisao-por-zero'`.
5. `Composicao.forma === 'barra-proporcao'` sempre que houver exatamente 2 fatias.
6. `Composicao.fatias.length <= 6` sempre.
