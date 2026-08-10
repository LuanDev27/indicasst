<!--
SYNC IMPACT REPORT
==================
Version change: TEMPLATE (não versionado) → 1.0.0
Bump rationale: MAJOR inicial. Primeira ratificação da constituição do IndicaSST.
                Nove princípios definidos a partir do pacote Spec Kit original
                (princípios 1–8) mais o adendo de 2026-08-09 (princípio 9).

Princípios adicionados:
  I.    Núcleo Puro
  II.   Memória de Cálculo Obrigatória
  III.  Rastreabilidade Normativa
  IV.   Unidades Explícitas no Tipo
  V.    Sem Backend, Sem Coleta
  VI.   Arredondamento Declarado
  VII.  Mobile-First e Offline
  VIII. Português Brasileiro
  IX.   Animação Subordinada à Leitura

Princípios renomeados: nenhum (constituição nova).
Princípios removidos: nenhum.

Seções adicionadas:
  - Restrições Técnicas (stack travada, escopo v1, fora de escopo)
  - Fluxo de Desenvolvimento (ordem de entrega em 7 fatias, portões de validação)
  - Governance

Templates verificados:
  ✅ .specify/templates/plan-template.md — Constitution Check é genérico, lê este
     arquivo em runtime; nenhuma edição necessária.
  ✅ .specify/templates/spec-template.md — estrutura de requisitos compatível;
     nenhuma edição necessária.
  ✅ .specify/templates/tasks-template.md — categorias de tarefa compatíveis;
     testes de core/ entram como fase própria; nenhuma edição necessária.
  ✅ .claude/skills/speckit-*/SKILL.md — sem referências a agentes específicos
     que conflitem com esta constituição.
  ✅ docs/indicasst-speckit.md e docs/indicasst-adendo.md — fontes desta
     constituição, mantidas como registro.

Follow-up TODOs:
  - TODO(TABELA_NBR_14280): a tabela de dias debitados completa e conferida ainda
    não foi obtida (ver Parte 3 do pacote original). Enquanto não for, entradas
    não confirmadas MUST carregar flag `confirmado: false` e a interface MUST
    exibir aviso de tabela parcial. Este item bloqueia a Fatia 2, não a Fatia 1.
-->

# IndicaSST Constitution

IndicaSST é a calculadora e visualizador de índices estatísticos de segurança do
trabalho conforme ABNT NBR 14280. O produto é a correção das fórmulas: um erro de
cálculo aqui não aparece como tela quebrada, aparece como número plausível e
errado. Os princípios abaixo existem para tornar esse erro impossível ou visível.

## Core Principles

### I. Núcleo Puro

Toda lógica de cálculo MUST viver em `src/core/` como funções puras, sem nenhum
import de React ou de biblioteca de UI. Cada função de `core/` MUST receber e
devolver valores primitivos ou objetos simples; MUST NOT receber evento, estado
ou componente. Cobertura de teste de 100% em `src/core/` é condição de merge.
Componentes de gráfico MUST receber dados já calculados por `core/` e MUST NOT
calcular nada internamente.

**Rationale**: o `core/` é o produto e a UI é descartável. Núcleo isolado dá
testes triviais, reuso futuro (CLI, API, bot) e impede que a mesma fórmula seja
reimplementada dentro de cinco telas com cinco resultados divergentes.

### II. Memória de Cálculo Obrigatória

Nenhum resultado MUST ser exibido sozinho. Todo índice MUST mostrar a fórmula com
os valores substituídos e o resultado — por exemplo
`TF = (5 × 1.000.000) ÷ 403.200 = 12,40`. Um resultado sem memória de cálculo é
um bug e MUST ser tratado como tal.

**Rationale**: o app é ferramenta de estudo, não caixa-preta. O usuário precisa
conseguir conferir o número à mão e aprender o porquê no mesmo movimento.

### III. Rastreabilidade Normativa

Todo índice MUST exibir sua fonte normativa (NBR 14280, item X). Onde houver
divergência entre normas ou entre fontes secundárias, o app MUST mostrar as duas
e exigir que o usuário escolha; MUST NOT decidir por ele. Dados de tabela cuja
procedência não foi confirmada em fonte primária MUST carregar flag explícita e
gerar aviso visível na interface.

**Rationale**: um app de SST que calcula errado em silêncio é pior que nenhum
app. A responsabilidade técnica é de quem assina o laudo, e ele precisa saber de
onde veio cada número.

### IV. Unidades Explícitas no Tipo

Nenhum número MUST circular sem unidade declarada em TypeScript. Usar branded
types ou objetos `{valor, unidade}` — `Horas`, `Dias`, `Acidentes`,
`Trabalhadores`. TypeScript MUST rodar em modo `strict`.

**Rationale**: confundir horas com dias é o erro clássico deste domínio, e é
exatamente o tipo de erro que o compilador pode pegar de graça.

### V. Sem Backend, Sem Coleta

Zero requisições de rede em runtime. Zero dado pessoal. Zero telemetria. Tudo
MUST rodar no navegador; persistência MUST usar apenas `localStorage`, através de
wrapper tipado com versionamento de schema.

**Rationale**: não há multiusuário nem dado compartilhado. Adicionar backend em
v1 seria construir infraestrutura antes de validar demanda — e criaria obrigação
de tratamento de dados que o projeto não precisa ter.

### VI. Arredondamento Declarado

Cálculos internos MUST manter precisão total. Arredondamento MUST acontecer
exclusivamente em `src/core/formatacao.ts`, na fronteira de exibição, com 2 casas
decimais. Nenhuma função de cálculo MUST arredondar valores intermediários.
Divisão por HHT = 0 MUST devolver `Result` tipado com erro; MUST NOT devolver
`Infinity` nem `NaN`.

**Rationale**: arredondar no meio propaga erro de forma invisível. Uma única
fonte de arredondamento é também a única fonte de formatação pt-BR.

### VII. Mobile-First e Offline

O layout MUST partir de 360px de largura. O app MUST ser PWA instalável e MUST
funcionar sem rede após a primeira carga.

**Rationale**: o uso real é em sala de aula e em campo, em celular, com internet
ruim. Um app que só funciona no desktop do laboratório não é usado.

### VIII. Português Brasileiro

Interface, mensagens de erro e nomes de domínio MUST estar em pt-BR. Formato
numérico MUST ser brasileiro (`1.785,71`). Nomes de código (funções, variáveis,
arquivos) MUST estar em inglês, exceto termos de domínio sem tradução corrente.

**Rationale**: o público é técnico e estudante de SST no Brasil. Um separador
decimal errado num relatório de acidente é erro de comunicação, não de estilo.

### IX. Animação Subordinada à Leitura

Gráficos MUST animar apenas na montagem inicial, com duração máxima de 600ms.
MUST NOT haver animação em recálculo ou em mudança de entrada. `prefers-reduced-motion`
MUST desligar toda animação. Em Recharts, `isAnimationActive` MUST ser `false` a
partir da segunda renderização, controlado por ref de montagem.

**Rationale**: reanimar a cada tecla digitada faz o gráfico piscar justamente
para quem está conferindo um número. A animação serve à primeira leitura; depois
disso ela só atrapalha.

## Restrições Técnicas

**Stack travada para v1** (mudança exige emenda desta constituição):

- Build: Vite. UI: React 18 + TypeScript `strict`. Estilo: Tailwind CSS.
- Gráficos: **Recharts**. Chart.js está fora — controlar `isAnimationActive` é
  prop em Recharts e exige `ref` imperativo no Chart.js, o que inviabiliza o
  princípio IX num app de campos reativos.
- Formulários: React Hook Form + Zod. Testes: Vitest + Testing Library.
- Offline: `vite-plugin-pwa`. Deploy: estático na Vercel.

**Proibido em v1**: Next.js (não há SSR, rota de API nem SEO relevante),
Supabase ou qualquer banco, biblioteca de PDF (jsPDF, react-pdf — `@media print`
resolve), Zustand/Redux (o estado cabe em `useState` + Context).

**Escopo v1 — cinco módulos**: índices, estatística descritiva, série histórica,
Pareto, composição.

**Fora de escopo em v1**: login, backend, banco de dados, multiusuário,
compartilhamento, dose de ruído, geração de PDF por biblioteca, i18n, modo
escuro, importação de CSV, benchmark setorial.

**Restrição de forma gráfica**: gráfico de rosca MUST NOT ser usado para série
temporal, para comparação de taxas entre períodos, nem como substituto do Pareto
do Módulo 4. TF e TG não somam 100% — não são partes de um todo e uma rosca com
as duas é um gráfico sem significado.

## Fluxo de Desenvolvimento

Entrega fatiada, uma fatia por vez, na ordem:

1. `core/indices.ts` + `core/formatacao.ts` + testes. Sem UI.
2. Módulo 1 (índices + memória de cálculo). **PUBLICAR E VALIDAR.**
3. `core/descritiva.ts` + Módulo 2 (histograma e box plot).
4. Módulo 3 (série histórica + gráfico de controle).
5. Módulo 4 (Pareto).
6. Módulo 5 (composição / rosca).
7. PWA, persistência, CSS de impressão.

**Portões que MUST ser respeitados:**

- A Fatia 2 MUST estar publicada e utilizável antes de começar a Fatia 3.
- A Fatia 6 MUST NOT ser antecipada. É a única do projeto que não muda nenhuma
  decisão de quem usa; puxá-la para frente por ser rápida e render print bonito
  troca valor por aparência.
- Toda função de `core/` MUST ter teste com, no mínimo: caso feliz, caso limite
  (zero, divisão por zero) e o caso do exemplo de aceite do spec.

## Governance

Esta constituição supersede qualquer outra prática do projeto. Em conflito entre
esta constituição e um `plan.md`, `tasks.md` ou preferência de implementação,
esta constituição vence.

**Emendas** MUST ser documentadas neste arquivo, com Sync Impact Report
atualizado no topo, e MUST propagar para `.specify/templates/` quando alterarem
seções obrigatórias.

**Versionamento** segue SemVer:

- MAJOR: remoção ou redefinição incompatível de princípio ou de governança.
- MINOR: novo princípio ou seção, ou expansão material de orientação.
- PATCH: esclarecimento, redação, correção não semântica.

**Conformidade**: toda revisão de código MUST verificar aderência aos nove
princípios. Complexidade adicional MUST ser justificada por escrito na seção de
Complexity Tracking do `plan.md` correspondente. Violação do princípio I ou VI
bloqueia merge sem exceção.

**Versão**: 1.0.0 | **Ratificada**: 2026-08-09 | **Última emenda**: 2026-08-09
