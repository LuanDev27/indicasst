# Phase 0 — Research: decisões técnicas resolvidas

Cada item abaixo era uma incógnita real. Todos estão resolvidos; nenhum
`NEEDS CLARIFICATION` permanece.

---

## R-001 — Desvio padrão: amostral ou populacional?

**Decisão**: amostral (denominador `n − 1`), com o denominador declarado na tabela
passo a passo.

**Razão**: séries de indicadores de SST (12 meses de TF, por exemplo) são amostra de
um processo contínuo, não a população inteira. É também o padrão do `DESVPAD` do
Excel/LibreOffice, de onde o usuário virá comparando números.

**Alternativa rejeitada**: populacional (`n`). Daria número menor e divergiria da
planilha que o usuário usa hoje — divergência silenciosa é exatamente o que o produto
existe para evitar.

**Consequência**: série de 1 elemento tem desvio padrão indefinido (divisão por zero),
tratada como `Result` com erro (FR-005, edge case da spec).

---

## R-002 — Box plot em Recharts

**Decisão**: `ComposedChart` com barras empilhadas invisíveis + `ErrorBar` para os
bigodes, e `Scatter` para outliers. Cálculo de Q1/mediana/Q3/IQR feito em
`core/descritiva.ts`, não no componente.

**Razão**: Recharts não tem box plot nativo. A composição por barras empilhadas é o
padrão da comunidade, mantém a política de animação do princípio IX e não adiciona
dependência.

**Alternativas rejeitadas**:
- Trocar para uma lib com box plot nativo (Plotly, Nivo): peso muito maior e a
  constituição já travou Recharts.
- SVG manual: viável, mas perde tooltip e responsividade de graça.

**Método de quartis**: interpolação linear entre ordens (tipo 7, o padrão de R e do
`QUARTIL` do Excel), declarado na interface.

---

## R-003 — Rosca com cutout de 58% em Recharts

**Decisão**: `<Pie innerRadius="58%" outerRadius="100%" />`, com `<Legend />` do
Recharts substituída por lista HTML própria fora do gráfico.

**Razão**: FR-038/FR-039 exigem legenda com rótulo, valor absoluto e percentual, e
identificação que não dependa só de cor. A legenda nativa do Recharts mostra apenas
rótulo e cor. Lista HTML própria também é o que torna o gráfico legível na impressão e
acessível a leitor de tela.

---

## R-004 — Política de animação (princípio IX)

**Decisão**: dois hooks e uma regra.

```ts
usePrimeiraMontagem(): boolean   // true apenas na 1ª renderização, via useRef
useReduzirMovimento(): boolean   // matchMedia('(prefers-reduced-motion: reduce)')
```

Todo wrapper em `components/graficos/` aplica:
`isAnimationActive={primeiraMontagem && !reduzirMovimento}` e
`animationDuration={600}`. Nenhum componente de `features/` define essas props.

**Razão**: centralizar a regra num único lugar torna a violação detectável por lint
(`isAnimationActive` proibido fora de `components/graficos/`) em vez de depender de
revisão manual.

---

## R-005 — Branded types de unidade sem custo de runtime

**Decisão**: branded types por interseção com símbolo de marca, com construtores
validadores que devolvem `Result`.

```ts
declare const marca: unique symbol;
type Marcado<T, M> = T & { readonly [marca]: M };
export type Horas = Marcado<number, 'Horas'>;
export type Dias = Marcado<number, 'Dias'>;
```

**Razão**: custo zero em runtime (some na compilação), mas `taxaGravidade(dias, horas)`
com os argumentos trocados vira erro de compilação. Objetos `{valor, unidade}` teriam
o mesmo efeito com alocação e ruído em cada chamada.

**Alternativa rejeitada**: `{valor, unidade}`. Mais verboso em toda a cadeia e obriga
desempacotar antes de cada operação aritmética.

---

## R-006 — Result tipado em vez de exceção

**Decisão**:

```ts
type Result<T, E = ErroCalculo> =
  | { ok: true; valor: T }
  | { ok: false; erro: E };

type ErroCalculo =
  | { tipo: 'divisao-por-zero'; denominador: string }
  | { tipo: 'amostra-insuficiente'; minimo: number }
  | { tipo: 'entrada-invalida'; campo: string; motivo: string };
```

**Razão**: FR-005 exige explicação, não crash nem `NaN`. `Result` obriga o chamador a
tratar o caso na hora da compilação; exceção seria esquecida e viraria tela branca.
`ErroCalculo` é união discriminada para que a mensagem em pt-BR seja derivada do tipo,
numa única função de tradução.

---

## R-007 — Parsing de série colada de planilha

**Decisão**: normalizar em três passos — separar por `\n`, `\t`, `;` ou `,` **de
campo**; detectar o separador decimal por heurística (se o token casa
`^\d{1,3}(\.\d{3})*(,\d+)?$` é pt-BR; se casa `^\d+(\.\d+)?$` é en-US); devolver
`{ valores: number[], ignorados: string[] }`.

**Razão**: a vírgula é ambígua no Brasil — é separador de campo no CSV e separador
decimal na planilha. Colar `12,5` de uma célula do Excel pt-BR não pode virar dois
valores. A heurística por token resolve o caso real (uma coluna colada) sem exigir que
o usuário declare formato.

**Limite conhecido**: uma linha `1,5` é ambígua entre "um vírgula cinco" e "1 e 5".
Resolvida a favor do decimal, e os `ignorados` mais o total de valores lidos ficam
visíveis (FR-029) para o usuário perceber se deu errado.

---

## R-008 — Consolidado do período vs. média das taxas

**Decisão**: `core/serie.ts` devolve **os dois** números mais a diferença:

```ts
consolidarPeriodo(pontos): {
  correto: Indice,        // Σ acidentes × 1e6 ÷ Σ HHT
  mediaIngenua: Indice,   // média aritmética das TF mensais
  diferencaAbsoluta: number,
  diferencaPercentual: number,
}
```

**Razão**: FR-033 pede exibição lado a lado. Calcular a média ingênua é
contraintuitivo (estamos calculando de propósito um número errado), então ela é
nomeada `mediaIngenua` no próprio tipo, e o teste documenta que os dois divergem
quando o HHT varia entre meses.

---

## R-009 — Limites do gráfico de controle

**Decisão**: `x̄ ± 3s` sobre a série de taxas mensais, com `s` amostral (coerente com
R-001). Limite inferior negativo é truncado em 0 **na exibição**, e o valor original é
mantido no cálculo, com nota.

**Razão**: taxa negativa não existe; mas truncar no cálculo distorceria a simetria dos
limites. Truncar só na exibição preserva o princípio VI.

---

## R-010 — Versionamento do schema em localStorage

**Decisão**: uma chave por módulo, cada valor no envelope
`{ versao: number, dados: unknown }`. Na leitura, se `versao` não for a corrente, o
wrapper tenta migração registrada; sem migração, descarta e avisa.

**Razão**: edge case da spec exige nunca ler dado de versão antiga como se fosse
atual. Envelope explícito é a forma mais barata de detectar isso. Chave por módulo
evita que um módulo corrompido derrube todos.

**Falha de escrita** (`QuotaExceededError`, modo privado, storage desabilitado): o
wrapper devolve `Result` com erro; o app continua calculando e avisa que não vai
lembrar (FR-045).

---

## R-011 — Tabela de dias debitados: modelo e risco jurídico

**Decisão**: JSON embarcado com apenas os valores mais citados, cada entrada com
`confirmado: boolean` e `fonte: string`. Tabela do usuário mesclada por cima por
chave. Aviso permanente de tabela parcial.

**Razão**: a ABNT comercializa a NBR 14280; reproduzir a tabela integral num app
público é área cinzenta. Tratar a tabela como *dado do usuário* e embarcar um
subconjunto citado em material didático mantém o app útil sem redistribuir a norma.

**Consequência de projeto**: `core/indices.ts` **não** depende de
`core/diasDebitados.ts` — recebe dias debitados como número já somado. É por isso que
o `TODO(TABELA_NBR_14280)` bloqueia a Fatia 2 e não a Fatia 1.

---

## R-012 — PWA e "zero requisições de rede"

**Decisão**: `vite-plugin-pwa` em modo `generateSW`, com precache do shell e
`navigateFallback`. Nenhuma estratégia `NetworkFirst`, nenhuma fonte externa, nenhum
CDN: fontes e ícones entram no bundle.

**Razão**: SC-007 é verificável na aba de rede. Qualquer fonte do Google Fonts ou
script de CDN quebraria o critério e o princípio V.

---

## R-013 — Impressão sem biblioteca de PDF

**Decisão**: `styles/print.css` com `@media print` — esconde navegação, força fundo
branco, evita quebra dentro de cartão de resultado (`break-inside: avoid`), e fixa
largura de gráfico em unidade absoluta.

**Razão**: jsPDF/react-pdf pesariam centenas de kB para reproduzir mal o que o
navegador já faz. Recharts renderiza SVG, que imprime nítido.

**Ponto de atenção**: gráfico com `ResponsiveContainer` pode medir 0 na impressão;
solução é largura fixa em `@media print`.
