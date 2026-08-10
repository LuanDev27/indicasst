---
description: "Task list — IndicaSST v1"
---

# Tasks: IndicaSST v1

**Input**: `specs/001-indicasst-v1/` — spec.md, plan.md, research.md, data-model.md,
contracts/core-api.md

**Tests**: obrigatórios. A constituição exige 100% de cobertura em `src/core/` como
condição de merge (princípio I) — testes não são opcionais nesta feature.

**Organização**: por fatia de entrega. Cada fatia corresponde a uma User Story da
spec e é entregável sozinha.

## Format: `[ID] [P?] [Story] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1–US5, ou `SETUP`/`FUND`/`POLISH`

## Path Conventions

Projeto único. Código em `src/`, testes ao lado do código como `*.test.ts`.

---

## Phase 1: Setup (Fatia 1 — infraestrutura)

- [ ] T001 [SETUP] Scaffold Vite + React 18 + TypeScript na raiz (`package.json`,
      `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`)
- [ ] T002 [SETUP] Ativar TypeScript strict em `tsconfig.json`: `strict`,
      `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`
- [ ] T003 [P] [SETUP] Configurar Tailwind CSS (`tailwind.config.js`,
      `postcss.config.js`, `src/index.css`) com abordagem mobile-first a partir de 360px
- [ ] T004 [P] [SETUP] Configurar Vitest (`vitest.config.ts`) com ambiente `jsdom`,
      `globals: true` e limiar de cobertura 100% restrito a `src/core/**`
- [ ] T005 [P] [SETUP] Configurar ESLint + Prettier com regra
      `no-restricted-imports` proibindo `react`, `react-dom` e `recharts` dentro de
      `src/core/**` (princípio I)
- [ ] T006 [P] [SETUP] `.gitignore`, `.editorconfig` e scripts npm: `dev`, `build`,
      `preview`, `test`, `test:run`, `test:coverage`, `lint`, `typecheck`
- [ ] T007 [SETUP] `README.md` de portfólio: problema, decisão arquitetural do
      `core/`, stack, como rodar, estado das fatias

---

## Phase 2: Foundational — `core/` de base (Fatia 1, bloqueia tudo)

**Purpose**: os tipos e a formatação que todos os módulos consomem. Nada de UI.

- [ ] T008 [FUND] `src/core/tipos.ts`: branded types (`Horas`, `Dias`, `Acidentes`,
      `Trabalhadores`, `Obitos`), `Result<T,E>`, `ErroCalculo`, interface `Indice`,
      helpers `ok`/`falha`
- [ ] T009 [FUND] Construtores validadores em `src/core/tipos.ts`: `horas`, `dias`,
      `acidentes`, `trabalhadores`, `obitos` — rejeitam negativo, `NaN` e não inteiro
      nas contagens, devolvendo `Result`
- [ ] T010 [FUND] `src/core/tipos.test.ts`: cada construtor com caso feliz, negativo,
      `NaN` e (nas contagens) fracionário
- [ ] T011 [FUND] `src/core/formatacao.ts`: `formatarNumero`, `formatarInteiro`,
      `formatarPercentual`, `mensagemDeErro` — `Intl.NumberFormat('pt-BR')`
      centralizado aqui e em nenhum outro lugar
- [ ] T012 [FUND] `src/core/formatacao.test.ts`: `1785.714285` → `"1.785,71"`,
      `403200` → `"403.200"`, negativos, zero, e uma mensagem em pt-BR por variante de
      `ErroCalculo`
- [ ] T013 [FUND] `src/core/arquitetura.test.ts`: varre `src/core/**` e falha se
      encontrar `toFixed`/`Intl.NumberFormat` fora de `formatacao.ts`, ou import de
      `react`/`recharts` em qualquer arquivo (invariantes 2 e 3 do data-model)
- [ ] T014 [FUND] `src/core/memoria.ts` + teste: `montarMemoria` produz
      `"TF = (5 × 1.000.000) ÷ 403.200 = 12,40"` usando `formatacao.ts`

**Checkpoint**: `npm run typecheck`, `npm run lint` e `npm run test:run` verdes.

---

## Phase 3: User Story 1 — Calcular os índices do período (Fatia 1 + 2) 🎯 MVP

**Goal**: um técnico obtém os oito índices com memória de cálculo e referência
normativa, sem conseguir montar o HHT errado.

**Independent Test**: preencher o caso de aceite e conferir HHT 403.200, TF 12,40,
TG 1.785,71, TI 25 com as memórias visíveis.

### Fatia 1 — cálculo puro (sem UI)

- [ ] T015 [US1] `src/core/indices.ts`: `hht` — `(trab × h/dia × dias) + horasExtras`
- [ ] T016 [US1] `src/core/indices.ts`: `tempoComputado` — `diasPerdidos + diasDebitados`
- [ ] T017 [US1] `src/core/indices.ts`: `taxaFrequencia` — `× 1e6 ÷ hht`, com
      `divisao-por-zero` quando `hht = 0`
- [ ] T018 [US1] `src/core/indices.ts`: `taxaGravidade` — `× 1e6 ÷ hht`, mesma guarda
- [ ] T019 [US1] `src/core/indices.ts`: `taxaIncidencia` — `× 1e3 ÷ trabalhadores`
- [ ] T020 [US1] `src/core/indices.ts`: `mediaDiasPerdidos` — `÷ acidentados`, com
      guarda de zero acidentados
- [ ] T021 [US1] `src/core/indices.ts`: `mortalidade` (`× 1e5`) e `letalidade` (`× 1e3`)
- [ ] T022 [US1] `src/core/indices.ts`: `calcularPeriodo` agregando os oito
- [ ] T023 [US1] `src/core/indices.test.ts` — **caso de aceite**: 200 / 8 / 252 / 0 /
      5 / 120 / 600 → HHT `403200`, tempo computado `720`, TF `12.400793650793651`,
      TG `1785.7142857142858`, TI `25`, média `144`
- [ ] T024 [US1] `src/core/indices.test.ts` — casos limite: HHT zero, zero acidentes,
      zero trabalhadores, zero acidentados; nenhum resultado é `NaN` ou `Infinity`
- [ ] T025 [US1] `src/core/indices.test.ts` — toda saída tem `memoria` e `fonte` não
      vazios (princípios II e III)

**Checkpoint Fatia 1**: `npm run test:coverage` com 100% em `src/core/`.

### Fatia 2 — Módulo 1 na tela

> ✅ **Destravada em 2026-08-10**: o quadro 1 foi extraído em
> `docs/nbr-14280-extracao.md` e T026–T027 estão feitas. T029 continua obrigatória —
> as entradas seguem `confirmado: false` até conferência em exemplar da ABNT.

- [x] T026 [US1] `src/core/diasDebitados.ts`: `TABELA_PADRAO` (subconjunto citado,
      cada entrada com `fonte` e `confirmado`), `buscar`, `mesclar`, `somarDias`,
      `validarJson` — mais `lerJson` e as regras 3.4.3.1 (só o osso de maior valor
      por dedo) e 3.4.3.5 (teto de 6 000 dias), que a extração revelou serem lógica
- [x] T027 [US1] `src/core/diasDebitados.test.ts`: merge sobrescreve por chave, JSON
      inválido não sobrescreve a tabela existente, soma de dias
- [ ] T028 [US1] `src/features/indices/SeletorOcorrencias.tsx`: seleção de ocorrências
      da tabela, com soma automática dos dias debitados
- [ ] T029 [US1] `src/components/AvisoNormativo.tsx`: aviso permanente de tabela
      parcial + marcação por entrada com `confirmado: false`
- [ ] T030 [P] [US1] `src/components/CampoNumerico.tsx`: input numérico pt-BR com
      rótulo, unidade, erro e alvo de toque adequado a 360px
- [ ] T031 [P] [US1] `src/components/CartaoResultado.tsx`: valor formatado + unidade +
      slot de memória + fonte normativa
- [ ] T032 [P] [US1] `src/components/BlocoMemoriaCalculo.tsx`: renderiza `memoria`
- [ ] T033 [US1] `src/features/indices/esquema.ts`: schema Zod do `Periodo` — HHT > 0,
      dias ≥ 0, contagens inteiras, acidentes com afastamento ≤ total, óbitos ≤
      acidentes com afastamento
- [ ] T034 [US1] `src/features/indices/FormularioHHT.tsx`: separação visual explícita
      entre o que entra no cômputo (horas trabalhadas, horas extras) e o que não entra
      (férias, afastamentos, faltas, licenças) — FR-013
- [ ] T035 [US1] `src/features/indices/PainelIndices.tsx`: os oito `CartaoResultado`,
      cada um com memória visível
- [ ] T036 [US1] `src/features/indices/index.tsx`: liga formulário e painel via React
      Hook Form; erro de `Result` vira mensagem, nunca número
- [ ] T037 [US1] `src/App.tsx`: navegação entre módulos (só o Módulo 1 ativo nesta fatia)
- [ ] T038 [US1] Teste de componente: caso de aceite ponta a ponta na tela; e efetivo
      zero exibindo explicação em vez de `NaN`

**Checkpoint Fatia 2**: 🚩 **PUBLICAR NA VERCEL E VALIDAR COM A TURMA** antes de
qualquer tarefa da Fase 4 (SC-010, portão do plano).

---

## Phase 4: User Story 2 — Estatística descritiva (Fatia 3)

- [ ] T039 [US2] `src/core/planilha.ts`: `lerSerieColada` — separadores `\n`, `\t`,
      `;`, `,` e detecção de decimal pt-BR por token (R-007)
- [ ] T040 [US2] `src/core/planilha.test.ts`: coluna colada do Excel pt-BR (`12,5`)
      não vira dois valores; tokens não numéricos vão para `ignorados`
- [ ] T041 [P] [US2] `src/core/descritiva.ts`: `media`, `mediana`, `moda`, `amplitude`
- [ ] T042 [P] [US2] `src/core/descritiva.ts`: `variancia`, `desvioPadrao` (amostral,
      `n − 1`), `coeficienteVariacao`, `interpretarCV`
- [ ] T043 [P] [US2] `src/core/descritiva.ts`: `passosDesvio`, `binsHistograma`,
      `resumoBoxPlot` (quartis por interpolação linear, R-002)
- [ ] T044 [US2] `src/core/descritiva.test.ts`: série de 1 elemento ⇒
      `amostra-insuficiente`; série sem repetição ⇒ moda vazia (amodal); CV 8/22/41 ⇒
      `baixa`/`media`/`alta`
- [ ] T045 [US2] `src/hooks/usePrimeiraMontagem.ts` e
      `src/hooks/useReduzirMovimento.ts` (princípio IX, R-004)
- [ ] T046 [US2] `src/components/graficos/`: wrappers Recharts que aplicam
      `isAnimationActive={primeiraMontagem && !reduzirMovimento}` e
      `animationDuration={600}`; regra de lint proibindo `isAnimationActive` fora daqui
- [ ] T047 [US2] `src/features/descritiva/Histograma.tsx`
- [ ] T048 [US2] `src/features/descritiva/BoxPlot.tsx` (ComposedChart + ErrorBar +
      Scatter, R-002)
- [ ] T049 [US2] `src/features/descritiva/TabelaPassoAPasso.tsx`: valor, desvio,
      desvio ao quadrado, linha a linha, mais soma dos quadrados (FR-026)
- [ ] T050 [US2] `src/features/descritiva/index.tsx`: colagem, resultados,
      interpretação do CV e lista de valores ignorados
- [ ] T051 [US2] Teste: digitar num campo não reanima o histograma já montado (FR-047)

---

## Phase 5: User Story 3 — Série histórica (Fatia 4)

- [ ] T052 [US3] `src/core/serie.ts`: `serieTaxas` — TF e TG por mês, mês com HHT zero
      fica sem taxa definida em vez de zero
- [ ] T053 [US3] `src/core/serie.ts`: `consolidarPeriodo` — `correto` (totais
      acumulados), `mediaIngenua`, `diferencaAbsoluta`, `diferencaPercentual` (R-008)
- [ ] T054 [US3] `src/core/serie.ts`: `limitesControle` — `x̄ ± 3s`, pontos fora,
      limite inferior negativo preservado no cálculo (R-009)
- [ ] T055 [US3] `src/core/serie.test.ts`: meses com HHT desigual ⇒ `correto ≠
      mediaIngenua`, e a diferença é a esperada; mês com HHT zero não quebra a série
- [ ] T056 [US3] `src/features/serie/GraficoLinha.tsx`: TF e TG em eixos duplos
      rotulados, séries identificáveis sem depender só de cor (FR-031)
- [ ] T057 [US3] `src/features/serie/GraficoControle.tsx`: média, limites e destaque
      dos pontos fora
- [ ] T058 [US3] `src/features/serie/ComparativoConsolidado.tsx`: valor correto e
      média ingênua lado a lado, com o aviso explicando por que a segunda está errada
- [ ] T059 [US3] `src/features/serie/index.tsx`: grade de lançamento de até 24 meses,
      com aviso ao exceder (edge case)

---

## Phase 6: User Story 4 — Pareto (Fatia 5)

- [ ] T060 [US4] `src/core/pareto.ts`: ordenação decrescente, desempate alfabético,
      percentual acumulado, corte em 80%, `semConcentracao`
- [ ] T061 [US4] `src/core/pareto.test.ts`: empate desfeito de forma estável;
      frequências todas iguais ⇒ `semConcentracao: true`; frequência 0 excluída
- [ ] T062 [US4] `src/features/pareto/GraficoPareto.tsx`: barras + linha de acumulado
      + marca visual do corte de 80%
- [ ] T063 [US4] `src/features/pareto/index.tsx`: entrada de categorias, lista nominal
      das categorias dentro do corte com o percentual que somam (FR-036)

---

## Phase 7: User Story 5 — Composição (Fatia 6) ⛔ não antecipar

- [ ] T064 [US5] `src/core/composicao.ts`: ordenação, agrupamento em "Outros" a partir
      da 6ª categoria, percentuais inteiros, `somaFecha100`, decisão de `forma`
- [ ] T065 [US5] `src/core/composicao.test.ts`: 8 categorias ⇒ 5 + "Outros" com
      `categoriasAgrupadas: 3`; exatamente 2 ⇒ `forma: 'barra-proporcao'`;
      percentuais somando 99 ⇒ `somaFecha100: false`; `fatias.length ≤ 6` sempre
- [ ] T066 [US5] `src/components/BarraProporcao.tsx`: substituto da rosca de 2 fatias
      (FR-041)
- [ ] T067 [US5] `src/features/composicao/GraficoRosca.tsx`: `innerRadius="58%"`,
      legenda HTML fora do gráfico com rótulo, valor absoluto e percentual (R-003)
- [ ] T068 [US5] `src/features/composicao/index.tsx`: os dois usos previstos —
      (a) com/sem afastamento/trajeto, máx. 3 fatias; (b) por categoria, máx. 5 +
      "outros" — mais o aviso de agrupamento e a nota de soma ≠ 100
- [ ] T069 [US5] Garantir que a UI não oferece rosca para série temporal nem para
      comparação de taxas (FR-043)

---

## Phase 8: Polish (Fatia 7)

- [ ] T070 [P] [POLISH] `src/storage/`: wrapper tipado de `localStorage` com
      `Envelope<T>` versionado, uma chave por módulo, migração ou descarte com aviso
      (R-010)
- [ ] T071 [POLISH] `src/storage/index.test.ts`: versão antiga não é lida como atual;
      `QuotaExceededError` devolve `Result` com erro e o app segue calculando (FR-045)
- [ ] T072 [POLISH] Ligar persistência aos cinco módulos, com ação explícita de limpar
- [ ] T073 [P] [POLISH] `src/styles/print.css`: `@media print` escondendo navegação,
      `break-inside: avoid` nos cartões, largura fixa de gráfico (R-013)
- [ ] T074 [POLISH] `vite-plugin-pwa` em `generateSW`, precache do shell, manifest com
      ícones; sem nenhuma estratégia de rede (R-012)
- [ ] T075 [POLISH] Fontes e ícones embarcados no bundle — zero requisição externa
      (SC-007)
- [ ] T076 [P] [POLISH] Passada de acessibilidade: rótulos, foco visível, contraste,
      e nenhuma informação transmitida só por cor
- [ ] T077 [P] [POLISH] Verificar 360px sem rolagem horizontal em todas as telas
      (SC-006)
- [ ] T078 [POLISH] Verificação offline: carregar, ativar modo avião, recarregar,
      calcular (SC-005)
- [ ] T079 [POLISH] Atualizar `README.md` e `quickstart.md` com o estado final das
      fatias e a URL de produção

---

## Dependências

```
Setup (T001–T007)
  └─> Foundational (T008–T014)          ← bloqueia todas as user stories
        ├─> US1 Fatia 1 (T015–T025)     ← MVP do cálculo
        │     └─> US1 Fatia 2 (T026–T038)  🚩 portão: publicar e validar
        │           ├─> US2 (T039–T051)
        │           ├─> US3 (T052–T059)   [depende de T045–T046 dos gráficos]
        │           ├─> US4 (T060–T063)
        │           └─> US5 (T064–T069)   ⛔ só depois de US4
        └─────────────> Polish (T070–T079)
```

- ~~**T026–T029 bloqueadas** por `TODO(TABELA_NBR_14280)`~~ — destravadas em
  2026-08-10 pela extração da norma; T026–T027 concluídas.
- **T045–T046** (hooks + wrappers de gráfico) são pré-requisito de todo gráfico:
  US2, US3, US4 e US5.
- **US5 não pode ser antecipada** — portão do plano e da constituição.

## Paralelização

Dentro de uma fase, tarefas marcadas `[P]` tocam arquivos diferentes e podem ser
feitas em qualquer ordem. Entre fases, respeitar o grafo acima.

Após o portão da Fatia 2, US2, US3 e US4 são independentes entre si — mas o plano
recomenda uma fatia por vez, para que a revisão de código seja real.
