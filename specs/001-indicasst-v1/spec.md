# Feature Specification: IndicaSST v1 — índices estatísticos de segurança do trabalho

**Feature Branch**: `main` (entrega fatiada, sem branch por fatia em v1)

**Created**: 2026-08-09

**Status**: Draft

**Input**: `docs/indicasst-speckit.md` (pacote original) + `docs/indicasst-adendo.md` (adendo de 2026-08-09, que trava decisões e acrescenta o Módulo 5)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Calcular os índices do período sem errar o HHT (Priority: P1)

Um técnico de segurança precisa fechar os indicadores do ano da empresa. Ele informa
efetivo exposto, jornada, dias trabalhados, horas extras, acidentes com e sem
afastamento, dias perdidos e as ocorrências que geram dias debitados. O app devolve
HHT, TF, TG, tempo computado, média de dias perdidos, TI, mortalidade e letalidade —
cada um com a fórmula preenchida com os próprios números dele, para que ele possa
conferir à mão e defender o resultado.

**Why this priority**: é o motivo de o app existir. Sozinha, esta história já
substitui a planilha que a turma usa hoje e já entrega valor completo.

**Independent Test**: preencher o formulário com o exemplo de aceite e conferir os
quatro números-alvo e as oito memórias de cálculo, sem que nenhum outro módulo exista.

**Acceptance Scenarios**:

1. **Given** o formulário vazio, **When** o usuário informa 200 trabalhadores, 8 h/dia,
   252 dias no período (21 dias × 12 meses), 0 horas extras, 5 acidentes com
   afastamento, 120 dias perdidos e uma amputação de polegar (600 dias debitados),
   **Then** o app exibe HHT = 403.200, TF = 12,40, TG = 1.785,71 e TI = 25, cada um
   acompanhado da fórmula com os valores substituídos.
2. **Given** dados válidos preenchidos, **When** o usuário lê o resultado de TF,
   **Then** vê o texto `TF = (5 × 1.000.000) ÷ 403.200 = 12,40` junto do número.
3. **Given** o formulário de HHT, **When** o usuário passa por ele, **Then** o que
   entra no cômputo (horas efetivamente trabalhadas, horas extras) e o que não entra
   (férias, afastamentos, faltas, licenças) está visualmente separado e rotulado.
4. **Given** um efetivo de 0 trabalhadores ou 0 dias, **When** o cálculo roda,
   **Then** o app não exibe número: exibe mensagem explicando que o HHT é zero e que
   as taxas não são definíveis.
5. **Given** um resultado calculado, **When** o usuário abre a lista de ocorrências
   com dias debitados, **Then** vê aviso de que a tabela embarcada é parcial e de que
   a NBR 14280 vigente deve ser consultada.

---

### User Story 2 - Descrever uma série de valores e saber se ela é homogênea (Priority: P2)

Um estudante cola de uma planilha a série de dias perdidos por mês e quer média,
mediana, moda, amplitude, variância, desvio padrão e coeficiente de variação — com o
passo a passo do desvio padrão visível, porque o que ele precisa é aprender a conta,
não só o número.

**Why this priority**: é o segundo uso mais frequente em sala e não depende do
Módulo 1. Entrega valor didático isolado.

**Independent Test**: colar uma série de 12 valores e conferir as sete estatísticas,
a tabela passo a passo e a faixa de interpretação do CV.

**Acceptance Scenarios**:

1. **Given** uma série colada de planilha (valores separados por quebra de linha, tab,
   ponto e vírgula ou vírgula), **When** o app processa, **Then** todos os valores
   numéricos são reconhecidos e os não numéricos são listados como ignorados.
2. **Given** uma série válida, **When** o usuário abre o passo a passo do desvio
   padrão, **Then** vê uma tabela com valor, desvio em relação à média e desvio ao
   quadrado, linha a linha, mais a soma dos quadrados.
3. **Given** um CV de 8%, **When** o resultado é exibido, **Then** o app classifica a
   série como baixa dispersão (< 15%); em 22% classifica como média (15–30%); em 41%
   classifica como alta (> 30%).
4. **Given** uma série com um único valor, **When** o app calcula, **Then** o desvio
   padrão amostral não é exibido como número, e sim como indefinido com explicação.
5. **Given** uma série sem valor repetido, **When** o app calcula a moda, **Then**
   informa que a série é amodal em vez de escolher um valor arbitrário.

---

### User Story 3 - Ver a evolução no tempo e não cair na média de taxas (Priority: P3)

Um técnico lança 12 a 24 meses de acidentes, dias perdidos e HHT. Quer ver TF e TG ao
longo do tempo, saber quais meses saíram do controle estatístico, e obter o número
consolidado do período — calculado pelos totais acumulados, não pela média das taxas
mensais.

**Why this priority**: corrige o terceiro erro recorrente, mas depende de o usuário já
confiar no cálculo de um período único (História 1).

**Independent Test**: lançar 12 meses de dados e verificar que o consolidado correto
difere da média ingênua das taxas mensais, com o aviso explicando por quê.

**Acceptance Scenarios**:

1. **Given** 12 meses lançados, **When** o app consolida o período, **Then** exibe
   lado a lado o valor correto (Σ acidentes × 1.000.000 ÷ Σ HHT) e a média aritmética
   das TF mensais, com aviso de que a segunda está errada e por quê.
2. **Given** meses com HHT muito diferentes entre si, **When** os dois valores são
   comparados, **Then** a diferença entre eles é exibida em números, não só descrita.
3. **Given** uma série mensal de TF, **When** o gráfico de controle é exibido,
   **Then** mostra a linha média e os limites x̄ ± 3s, e destaca os pontos fora dos
   limites.
4. **Given** um mês com HHT igual a zero, **When** o app monta a série, **Then** esse
   mês aparece como sem taxa definida, sem quebrar o gráfico e sem virar zero.
5. **Given** TF e TG em ordens de grandeza diferentes, **When** o gráfico de linha é
   exibido, **Then** usa eixos duplos rotulados, e cada série é identificável sem
   depender só da cor.

---

### User Story 4 - Descobrir onde cortar 80% do problema (Priority: P4)

Um técnico tem a contagem de acidentes por parte do corpo lesionada e quer saber em
quais categorias concentrar a ação. O app ordena, acumula e destaca o corte de 80%,
listando as categorias que caem dentro dele.

**Why this priority**: é a ferramenta de decisão do conjunto, mas exige que os dados
de categoria já existam — o que na prática vem depois dos módulos anteriores.

**Independent Test**: lançar 8 categorias com frequências e conferir a ordenação
decrescente, a linha de acumulado e a lista das categorias dentro dos 80%.

**Acceptance Scenarios**:

1. **Given** categorias e frequências, **When** o Pareto é gerado, **Then** as barras
   aparecem em ordem decrescente com a linha de percentual acumulado sobreposta.
2. **Given** o acumulado atravessa 80% na quarta categoria, **When** o corte é
   exibido, **Then** as quatro primeiras categorias são destacadas e listadas
   nominalmente, com o percentual que somam.
3. **Given** duas categorias com frequência idêntica, **When** a ordenação é aplicada,
   **Then** o critério de desempate é estável e declarado (ordem alfabética).
4. **Given** todas as categorias com a mesma frequência, **When** o Pareto é gerado,
   **Then** o app avisa que não há concentração e que o corte de 80% não informa
   prioridade neste caso.

---

### User Story 5 - Mostrar a composição do período em um relatório (Priority: P5)

Um técnico precisa de uma figura simples para o relatório impresso: quanto do total de
acidentes foi com afastamento, sem afastamento e de trajeto. O app entrega uma rosca
com legenda que traz rótulo, valor absoluto e percentual.

**Why this priority**: é a fatia mais fácil e a de menor impacto. É a única do projeto
que não muda nenhuma decisão de quem usa — serve à comunicação, não à análise.

**Independent Test**: lançar três categorias e verificar a rosca com legenda completa;
lançar oito e verificar o agrupamento automático em "outros".

**Acceptance Scenarios**:

1. **Given** três categorias (com afastamento, sem afastamento, de trajeto),
   **When** a rosca é gerada, **Then** cada item da legenda exibe rótulo, valor
   absoluto e percentual.
2. **Given** oito categorias, **When** a rosca é gerada, **Then** as cinco maiores são
   mantidas, o excedente é agrupado em "outros", e o app avisa quantas categorias
   foram agrupadas.
3. **Given** duas categorias apenas, **When** o usuário pede a visualização, **Then**
   o app não desenha rosca: desenha barra de proporção com os valores numéricos.
4. **Given** percentuais que arredondados somam 99 ou 101, **When** a legenda é
   exibida, **Then** o app inclui nota explicando que a soma não fecha 100 por
   arredondamento.
5. **Given** dados de série temporal ou taxas (TF e TG), **When** o usuário tenta
   representá-los em rosca, **Then** a opção não é oferecida pelo app.

---

### Edge Cases

- **HHT igual a zero** (efetivo, jornada ou dias iguais a zero): todas as taxas que
  dividem por HHT ficam indefinidas. O app exibe explicação, nunca `Infinity`, `NaN`
  ou `0`.
- **Zero acidentes no período**: TF, TG e TI valem 0 legitimamente; média de dias
  perdidos fica indefinida (divisão por zero acidentados) e é exibida como tal.
- **Dias perdidos sem acidente registrado**: o app sinaliza a inconsistência sem
  bloquear o cálculo.
- **Acidentes com afastamento maior que o total de acidentes**: validação impede o
  envio, com mensagem em pt-BR.
- **Valores negativos ou não inteiros onde só cabe contagem**: rejeitados na validação.
- **Série colada com separador decimal por vírgula** (padrão brasileiro): interpretada
  corretamente, não como separador de campos.
- **Série colada com mais de 24 meses no Módulo 3**: o app avisa e trunca ou pede
  recorte, sem descartar dados em silêncio.
- **Categoria com frequência zero** no Pareto ou na composição: excluída do gráfico e
  listada à parte.
- **Tabela de dias debitados com entrada não confirmada**: exibida com marcação
  visível de que a procedência não foi verificada em fonte primária.
- **JSON de tabela de dias debitados importado com formato inválido**: rejeitado com
  mensagem específica, sem sobrescrever a tabela existente.
- **`localStorage` cheio, indisponível ou desabilitado**: o app continua calculando;
  apenas avisa que não conseguirá lembrar os dados na próxima sessão.
- **Schema de persistência de versão anterior**: migrado ou descartado com aviso,
  nunca lido como se fosse da versão atual.
- **`prefers-reduced-motion` ativo**: nenhum gráfico anima.
- **Impressão**: o relatório sai com memórias de cálculo e gráficos legíveis, sem
  elementos de navegação.

## Requirements *(mandatory)*

### Functional Requirements

**Cálculo e apresentação (transversal)**

- **FR-001**: O sistema MUST exibir, junto de todo índice calculado, a fórmula com os
  valores do usuário substituídos e o resultado, no formato
  `TF = (5 × 1.000.000) ÷ 403.200 = 12,40`.
- **FR-002**: O sistema MUST exibir, para todo índice, a referência normativa que o
  fundamenta (NBR 14280 e item).
- **FR-003**: O sistema MUST manter precisão total nos cálculos intermediários e
  arredondar apenas na exibição, com 2 casas decimais.
- **FR-004**: O sistema MUST formatar todo número no padrão brasileiro (`1.785,71`).
- **FR-005**: O sistema MUST devolver erro explicado — nunca `Infinity`, `NaN` ou zero
  silencioso — em qualquer divisão cujo denominador seja zero.
- **FR-006**: O sistema MUST apresentar toda a interface, incluindo mensagens de erro,
  em português brasileiro.
- **FR-007**: O sistema MUST funcionar integralmente sem conexão de rede após a
  primeira carga, e MUST NOT fazer nenhuma requisição de rede em runtime.
- **FR-008**: O sistema MUST NOT coletar dado pessoal nem telemetria.
- **FR-009**: O sistema MUST ser utilizável em tela de 360px de largura.
- **FR-010**: O sistema MUST ser instalável como aplicativo (PWA).

**Módulo 1 — Calculadora de índices**

- **FR-011**: Usuários MUST poder informar efetivo exposto, horas por dia, dias
  trabalhados no período, horas extras, acidentes com afastamento, acidentes sem
  afastamento, óbitos e dias perdidos.
- **FR-012**: O sistema MUST calcular HHT como
  `(trabalhadores × horas/dia × dias) + horas extras`.
- **FR-013**: O formulário de HHT MUST separar visualmente o que entra no cômputo
  (horas efetivamente trabalhadas, horas extras) do que não entra (férias,
  afastamentos, faltas, licenças).
- **FR-014**: O sistema MUST calcular Taxa de Frequência como
  `acidentes com afastamento × 1.000.000 ÷ HHT`.
- **FR-015**: O sistema MUST calcular tempo computado como
  `dias perdidos + dias debitados`.
- **FR-016**: O sistema MUST calcular Taxa de Gravidade como
  `tempo computado × 1.000.000 ÷ HHT`.
- **FR-017**: O sistema MUST calcular Taxa de Incidência como
  `acidentes × 1.000 ÷ número de trabalhadores`.
- **FR-018**: O sistema MUST calcular média de dias perdidos como
  `tempo computado ÷ número de acidentados`.
- **FR-019**: O sistema MUST calcular mortalidade como `óbitos × 100.000 ÷ trabalhadores`
  e letalidade como `óbitos × 1.000 ÷ acidentes`.
- **FR-020**: Usuários MUST poder montar uma lista de ocorrências selecionadas de uma
  tabela de dias debitados, e o sistema MUST somar automaticamente os dias
  correspondentes ao tempo computado.
- **FR-021**: O sistema MUST exibir aviso permanente de que a tabela de dias debitados
  embarcada é parcial e de que a NBR 14280 vigente deve ser consultada.
- **FR-022**: O sistema MUST marcar visualmente as entradas da tabela cuja procedência
  não foi confirmada em fonte primária.
- **FR-023**: Usuários MUST poder editar a tabela de dias debitados e exportá-la ou
  importá-la em JSON.

**Módulo 2 — Estatística descritiva**

- **FR-024**: Usuários MUST poder informar uma série de valores digitando ou colando
  de planilha, com separadores de quebra de linha, tabulação, ponto e vírgula ou
  vírgula, e separador decimal brasileiro.
- **FR-025**: O sistema MUST calcular média, mediana, moda, amplitude, variância,
  desvio padrão e coeficiente de variação.
- **FR-026**: O sistema MUST exibir tabela passo a passo do desvio padrão com valor,
  desvio em relação à média e desvio ao quadrado, linha a linha.
- **FR-027**: O sistema MUST classificar o coeficiente de variação nas faixas
  `< 15%` (baixa), `15–30%` (média) e `> 30%` (alta), com o texto da interpretação.
- **FR-028**: O sistema MUST exibir histograma e box plot da série.
- **FR-029**: O sistema MUST listar os valores não numéricos ignorados na colagem.

**Módulo 3 — Série histórica**

- **FR-030**: Usuários MUST poder lançar até 24 meses de acidentes, dias perdidos e
  HHT.
- **FR-031**: O sistema MUST exibir gráfico de linha com TF e TG em eixos duplos
  rotulados.
- **FR-032**: O sistema MUST exibir gráfico de controle com linha média e limites
  `x̄ ± 3s`, destacando pontos fora dos limites.
- **FR-033**: O sistema MUST calcular o consolidado do período pelos totais acumulados
  e MUST exibi-lo lado a lado com a média aritmética das taxas mensais, acompanhado de
  aviso explicando por que a média das taxas está errada.

**Módulo 4 — Pareto**

- **FR-034**: Usuários MUST poder informar categorias e frequências.
- **FR-035**: O sistema MUST exibir barras em ordem decrescente com linha de
  percentual acumulado.
- **FR-036**: O sistema MUST destacar o corte de 80% e listar nominalmente as
  categorias contidas nele, com o percentual que somam.
- **FR-037**: O sistema MUST usar critério de desempate estável e declarado para
  categorias de frequência idêntica.

**Módulo 5 — Composição**

- **FR-038**: O sistema MUST exibir gráfico de rosca com cutout de 58% e legenda em
  HTML fora da área do gráfico.
- **FR-039**: Cada item da legenda MUST exibir rótulo, valor absoluto e percentual; a
  identificação de uma fatia MUST NOT depender apenas da cor.
- **FR-040**: A partir da 6ª categoria, o sistema MUST agrupar o excedente em "outros"
  automaticamente e MUST informar quantas categorias foram agrupadas.
- **FR-041**: Com apenas 2 categorias, o sistema MUST exibir barra de proporção com
  valores numéricos em vez de rosca.
- **FR-042**: O sistema MUST arredondar percentuais da composição para inteiro e MUST
  exibir nota quando a soma não fechar 100.
- **FR-043**: O sistema MUST NOT oferecer rosca para série temporal, para comparação
  de taxas entre períodos, nem como substituto do Pareto.

**Persistência, exportação e animação**

- **FR-044**: O sistema MUST persistir localmente os dados entre sessões e MUST
  oferecer ação explícita de limpar.
- **FR-045**: O sistema MUST continuar funcionando quando a persistência local estiver
  indisponível, avisando que os dados não serão lembrados.
- **FR-046**: O sistema MUST produzir relatório imprimível contendo memórias de
  cálculo e gráficos, sem elementos de navegação.
- **FR-047**: Gráficos MUST animar apenas na montagem inicial, com duração máxima de
  600ms, e MUST NOT animar em recálculo ou mudança de entrada.
- **FR-048**: O sistema MUST desligar toda animação quando `prefers-reduced-motion`
  estiver ativo.

### Key Entities

- **Período**: recorte temporal de apuração. Efetivo exposto, horas por dia, dias
  trabalhados, horas extras. Origem de todo HHT.
- **Ocorrência**: um acidente. Tem classificação (com afastamento, sem afastamento, de
  trajeto, óbito), dias perdidos e, quando há lesão permanente, uma entrada de dias
  debitados.
- **Entrada de dias debitados**: lesão nomeada, dias correspondentes, referência
  normativa e flag de procedência confirmada. Vem da tabela embarcada ou da tabela do
  usuário.
- **Índice**: resultado nomeado, com valor, unidade, memória de cálculo e referência
  normativa. Nunca circula sem esses quatro campos.
- **Série numérica**: lista ordenada de valores com rótulo opcional. Base dos Módulos
  2 e 3.
- **Ponto mensal**: mês, acidentes, dias perdidos e HHT. Unidade da série histórica.
- **Categoria**: rótulo e frequência. Base dos Módulos 4 e 5.
- **Tabela de dias debitados do usuário**: conjunto de entradas editadas, exportável e
  importável em JSON, mesclada sobre a tabela embarcada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um estudante reproduz o exemplo de aceite completo (200 trabalhadores,
  8 h/dia, 252 dias, 5 acidentes com afastamento, 120 dias perdidos, amputação de
  polegar) e obtém HHT = 403.200, TF = 12,40, TG = 1.785,71 e TI = 25, com todas as
  memórias de cálculo visíveis.
- **SC-002**: 100% dos índices exibidos vêm acompanhados de memória de cálculo e de
  referência normativa — zero resultados nus na interface.
- **SC-003**: Um usuário que nunca viu o app calcula os índices de um período em menos
  de 3 minutos a partir de dados em mãos.
- **SC-004**: Nenhum campo de entrada aceita valor que produza taxa indefinida sem que
  o app explique o que aconteceu — verificado nos casos de HHT zero, zero acidentados
  e série de um único valor.
- **SC-005**: O app abre e calcula com o dispositivo em modo avião, após a primeira
  visita.
- **SC-006**: O app é operável em tela de 360px sem rolagem horizontal em nenhuma
  tela.
- **SC-007**: Nenhuma requisição de rede sai do app durante o uso — verificável na aba
  de rede do navegador.
- **SC-008**: Alterar um campo de entrada não reanima nenhum gráfico já montado.
- **SC-009**: O relatório impresso cabe em página A4 com memórias de cálculo e
  gráficos legíveis.
- **SC-010**: Dois colegas da turma conseguem, sem instrução prévia, chegar ao
  resultado correto do próprio período usando apenas o app.

## Assumptions

- **Autenticação**: nenhuma, em nenhuma fase. Não há usuário identificado.
- **Backend e banco**: nenhum. Toda persistência é local ao navegador.
- **Múltiplos conjuntos de dados**: v1 guarda um conjunto por módulo. Salvar vários
  projetos nomeados fica para v2.
- **Exportação em PDF**: via impressão do navegador. Sem biblioteca de geração de PDF.
- **Idioma**: apenas pt-BR. Sem internacionalização.
- **Tema**: apenas claro. Modo escuro fica para v2.
- **Importação de CSV**: fora de v1. Em v1, colar de planilha atende os Módulos 2 e 3.
- **Dose de ruído e benchmark setorial**: fora de escopo. Benchmark exigiria fonte
  externa e manutenção contínua.
- **Dias trabalhados**: informados como total do período (ex.: 252 = 21 × 12). O app
  não deriva calendário nem desconta feriados por conta própria.
- **Desvio padrão**: amostral (denominador `n − 1`), por ser o uso corrente em séries
  de indicadores de SST. O app declara qual usa.
- **Tabela de dias debitados**: a NBR 14280 completa ainda não foi obtida. v1 embarca
  apenas os valores mais citados, cada um com flag de confirmação, e depende da edição
  do usuário para os demais. Redistribuir a tabela integral tem risco jurídico — a
  ABNT comercializa a norma.
- **Público**: técnicos e estudantes de Segurança do Trabalho no Brasil, com acesso a
  celular e internet intermitente.
