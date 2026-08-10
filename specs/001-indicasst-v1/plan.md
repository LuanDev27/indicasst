# Implementation Plan: IndicaSST v1

**Branch**: `main` | **Date**: 2026-08-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-indicasst-v1/spec.md`

## Summary

Aplicação web puramente cliente que calcula, visualiza e **explica** índices
estatísticos de segurança do trabalho (NBR 14280). A abordagem central é separar um
núcleo de funções puras (`src/core/`) de toda a camada visual: o núcleo devolve, para
cada índice, um objeto com valor, unidade, memória de cálculo e referência normativa,
e a UI apenas renderiza. Isso torna o produto testável em 100% no ponto onde ele pode
falhar em silêncio — a fórmula — e mantém a UI descartável e substituível.

Entrega em 7 fatias, cada uma útil sozinha, com publicação obrigatória após a Fatia 2.

## Technical Context

**Language/Version**: TypeScript 5.x em modo `strict`, ES2022, React 18

**Primary Dependencies**: Vite (build), React 18, Tailwind CSS, Recharts (gráficos),
React Hook Form + Zod (formulários e validação), `vite-plugin-pwa` (offline)

**Storage**: `localStorage`, através de wrapper tipado com versionamento de schema.
Nenhum banco, nenhum backend.

**Testing**: Vitest (unitário, `src/core/`) + Testing Library (componentes)

**Target Platform**: navegadores modernos em celular e desktop; PWA instalável;
operação offline após primeira carga

**Project Type**: SPA estática de página única, sem servidor

**Performance Goals**: recálculo imperceptível ao digitar (< 16ms por atualização de
campo — todo cálculo é aritmética sobre no máximo 24 pontos); animação de gráfico
apenas na montagem, teto de 600ms; bundle inicial abaixo de 300 kB gzip

**Constraints**: zero requisições de rede em runtime; layout a partir de 360px;
precisão total até a fronteira de exibição; nenhum `Infinity`/`NaN` alcança a tela

**Scale/Scope**: 5 módulos, ~8 índices, ~10 estatísticas descritivas, até 24 pontos
mensais, até 6 categorias por gráfico de composição. Usuário único, dados locais.

## Constitution Check

*GATE: avaliado contra `.specify/memory/constitution.md` v1.0.0.*

| # | Princípio | Como o plano satisfaz | Status |
|---|---|---|---|
| I | Núcleo Puro | Todo cálculo em `src/core/`, sem import de React. ESLint com `no-restricted-imports` proibindo `react` e `recharts` dentro de `core/`. Cobertura 100% em `core/` como gate de CI. | ✅ |
| II | Memória de Cálculo | Toda função de índice devolve `Indice` com campo `memoria` obrigatório no tipo — omitir não compila. Componente `BlocoMemoriaCalculo` renderiza. | ✅ |
| III | Rastreabilidade Normativa | `Indice` carrega `fonte` obrigatório. Entradas de dias debitados carregam `confirmado: boolean`; `AvisoNormativo` renderiza a marcação. | ✅ |
| IV | Unidades no Tipo | `core/tipos.ts` define branded types `Horas`, `Dias`, `Acidentes`, `Trabalhadores`, `Obitos`. Construtores validam. `strict: true` + `noUncheckedIndexedAccess`. | ✅ |
| V | Sem Backend | Nenhuma dependência de rede. Deploy estático. `storage/` é o único ponto de escrita persistente. | ✅ |
| VI | Arredondamento Declarado | `core/formatacao.ts` é o único módulo autorizado a chamar `toFixed`/`Intl.NumberFormat`; teste garante que nenhum outro arquivo de `core/` os usa. Divisões por zero devolvem `Result<T, ErroCalculo>`. | ✅ |
| VII | Mobile-First e Offline | Tailwind mobile-first por padrão. `vite-plugin-pwa` com precache do shell. | ✅ |
| VIII | pt-BR | `Intl.NumberFormat('pt-BR')` centralizado em `formatacao.ts`. Textos de UI em pt-BR; identificadores de código em inglês. | ✅ |
| IX | Animação Subordinada à Leitura | Hook `usePrimeiraMontagem()` devolve boolean; todo componente Recharts recebe `isAnimationActive={primeiraMontagem && !reduzirMovimento}` e `animationDuration={600}`. | ✅ |

**Resultado**: nenhuma violação. Seção Complexity Tracking permanece vazia.

**Portões não técnicos herdados do pacote original** (não bloqueiam `/speckit-tasks`,
bloqueiam fatias específicas):

- `TODO(TABELA_NBR_14280)`: tabela de dias debitados completa e conferida. Bloqueia a
  **Fatia 2**, não a Fatia 1 — `core/indices.ts` recebe dias debitados como número.
- Validação humana da `spec.md` com dois colegas da turma antes de implementar além da
  Fatia 2 (SC-010).

## Project Structure

### Documentation (this feature)

```text
specs/001-indicasst-v1/
├── spec.md              # Especificação (/speckit-specify)
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Decisões técnicas resolvidas (Fase 0)
├── data-model.md        # Entidades e tipos (Fase 1)
├── quickstart.md        # Como rodar e validar (Fase 1)
├── contracts/
│   └── core-api.md      # Assinaturas públicas de src/core/ (Fase 1)
├── checklists/
│   └── requirements.md  # Checklist de qualidade da spec
└── tasks.md             # (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── core/                  # funções puras. ZERO import de React. 100% testado.
│   ├── tipos.ts               branded types de unidade + Result<T,E> + Indice
│   ├── formatacao.ts          arredondamento e formatação pt-BR (única fonte)
│   ├── memoria.ts             montagem da string de fórmula substituída
│   ├── indices.ts             hht, taxaFrequencia, taxaGravidade, taxaIncidencia,
│   │                          tempoComputado, mediaDiasPerdidos, mortalidade,
│   │                          letalidade
│   ├── descritiva.ts          media, mediana, moda, amplitude, variancia,
│   │                          desvioPadrao, coeficienteVariacao, interpretarCV,
│   │                          limitesControle, binsHistograma, resumoBoxPlot
│   ├── serie.ts               consolidado por totais acumulados vs. média ingênua
│   ├── pareto.ts              ordenação, acumulado, corte em 80%
│   ├── composicao.ts          agrupamento em "outros", percentuais inteiros,
│   │                          detecção de soma ≠ 100, regra de 2 fatias
│   ├── diasDebitados.ts       tabela padrão + lookup + merge com tabela do usuário
│   └── planilha.ts            parsing de série colada (separadores + decimal pt-BR)
├── components/            # compartilhados
│   ├── CampoNumerico.tsx
│   ├── CartaoResultado.tsx
│   ├── BlocoMemoriaCalculo.tsx
│   ├── AvisoNormativo.tsx
│   ├── BarraProporcao.tsx     substituto da rosca de 2 fatias (FR-041)
│   └── graficos/              wrappers Recharts com a política de animação
├── features/
│   ├── indices/           Módulo 1
│   ├── descritiva/        Módulo 2
│   ├── serie/             Módulo 3
│   ├── pareto/            Módulo 4
│   └── composicao/        Módulo 5
├── hooks/
│   ├── usePrimeiraMontagem.ts
│   └── useReduzirMovimento.ts
├── storage/               wrapper tipado de localStorage com versão de schema
├── styles/
│   └── print.css          CSS de impressão (@media print)
└── App.tsx

tests/  — colocados junto ao código como *.test.ts (convenção Vitest)
```

**Structure Decision**: projeto único, sem separação frontend/backend, porque não há
backend. A fronteira arquitetural que importa não é cliente/servidor e sim
`core/` × resto: `core/` é o produto e não conhece React; `features/` e `components/`
consomem `core/` e podem ser jogados fora sem perda de lógica. Testes ficam ao lado do
código (`indices.test.ts` junto de `indices.ts`) para que a ausência de teste em
`core/` seja visível na própria listagem de diretório.

## Regras técnicas de implementação

1. Cada função de `core/` recebe e devolve valores primitivos ou objetos simples;
   nunca recebe evento, estado ou componente.
2. Toda função de `core/` tem teste com, no mínimo: caso feliz, caso limite (zero,
   divisão por zero) e o caso do exemplo de aceite da spec.
3. Divisão cujo denominador pode ser zero devolve `Result<T, ErroCalculo>`; nunca
   `Infinity`, `NaN` ou zero silencioso.
4. Arredondamento acontece exclusivamente em `formatacao.ts`, na fronteira de
   exibição. Nenhuma função de cálculo arredonda.
5. Componentes de gráfico recebem dados já calculados por `core/`; não calculam nada.
6. Todo componente Recharts recebe a política de animação do princípio IX. Nenhum
   componente define `isAnimationActive` por conta própria.

## Ordem de entrega

| Fatia | Conteúdo | Portão |
|---|---|---|
| 1 | `core/tipos.ts`, `core/formatacao.ts`, `core/memoria.ts`, `core/indices.ts` + testes. Sem UI. | Testes verdes, incluindo o caso de aceite |
| 2 | Módulo 1 — calculadora de índices com memória de cálculo | **PUBLICAR E VALIDAR** com a turma antes da Fatia 3 |
| 3 | `core/descritiva.ts` + Módulo 2 (histograma e box plot) | |
| 4 | `core/serie.ts` + Módulo 3 (série histórica + gráfico de controle) | |
| 5 | `core/pareto.ts` + Módulo 4 (Pareto) | |
| 6 | `core/composicao.ts` + Módulo 5 (composição / rosca) | **Não antecipar** |
| 7 | PWA, persistência, CSS de impressão | |

A Fatia 6 é a mais fácil e a de menor impacto: é a única do projeto que não muda
nenhuma decisão de quem usa. Puxá-la para frente por render print bonito troca valor
por aparência.

## Deploy

Build estático (`vite build` → `dist/`) publicado na **Vercel**, com repositório no
GitHub como fonte. Sem função serverless, sem variável de ambiente, sem integração de
banco — a constituição proíbe rede em runtime, então a plataforma serve apenas
arquivos estáticos.

> Divergência declarada em relação ao pacote original: o `/plan` original indicava
> Cloudflare Pages. Trocado para Vercel a pedido do autor. Sem impacto técnico — ambos
> servem estático; nenhum princípio da constituição depende da escolha.

## Complexity Tracking

> Nenhuma violação de constituição a justificar.
