# IndicaSST

Calculadora e visualizador de índices estatísticos de segurança do trabalho,
conforme a **ABNT NBR 14280**. Roda inteiro no navegador: sem cadastro, sem
backend, sem enviar dado nenhum para lugar nenhum.

**Live:** https://indicasst.vercel.app

> **Estado**: Fatia 1 entregue — o núcleo de cálculo dos índices existe, está
> testado a 100% e publicado. O Módulo 1 (formulário) é a Fatia 2.

---

## O problema

Técnico e estudante de Segurança do Trabalho calcula Taxa de Frequência e Taxa de
Gravidade na mão, e erra sempre nos mesmos três lugares:

1. **Monta o HHT errado**, incluindo férias e afastamentos no que deveria ser hora
   de exposição ao risco.
2. **Esquece os dias debitados** no tempo computado — uma amputação de polegar vale
   600 dias, e sem isso a TG sai baixa demais.
3. **Tira média aritmética das taxas mensais** em vez de recalcular pelos totais
   acumulados. Com HHT variando entre meses, os dois números divergem, e o errado
   parece plausível.

O app impede os três por construção e mostra o porquê.

## A decisão que sustenta o projeto

Um erro de cálculo aqui **não aparece como tela quebrada**. Aparece como número
plausível e errado, assinado por alguém que confiou nele. Por isso:

```
src/core/     ← funções puras. ZERO import de React. 100% de cobertura.
src/features/ ← uma pasta por módulo. Consome core/. Descartável.
```

O `core/` é o produto; a UI é substituível. Isso torna o ponto de falha real —
a fórmula — trivialmente testável, e abre reuso futuro (CLI, bot, planilha) sem
reescrever nada.

Três consequências concretas dessa escolha:

- **Todo índice devolve sua memória de cálculo.** `memoria` e `fonte` são campos
  obrigatórios no tipo `Indice`: um resultado sem a conta substituída **não
  compila**. Não é convenção, é o compilador.
- **Unidade mora no tipo.** `Horas`, `Dias`, `Acidentes` e `Trabalhadores` são
  branded types de custo zero em runtime — trocar horas por dias numa chamada vira
  erro de compilação, e esse é o bug clássico do domínio.
- **Divisão por zero é valor, não exceção.** `Result<T, ErroCalculo>` obriga quem
  chama a tratar o caso. Nenhum `NaN` e nenhum `Infinity` alcança a tela; o usuário
  lê "sem HHT a taxa não é definível — não é zero, é indefinida".

Há um teste que varre `src/core/` e falha se algum arquivo importar React ou
chamar `toFixed` fora de `formatacao.ts`. A arquitetura é verificada, não combinada.

## Exemplo de aceite

Empresa com 200 trabalhadores, 8 h/dia, 21 dias/mês por 12 meses, 5 acidentes com
afastamento, 120 dias perdidos e uma amputação total de polegar (600 dias
debitados):

| Índice | Resultado | Memória de cálculo |
|---|---|---|
| HHT | 403.200 | `HHT = (200 × 8 × 252) + 0 = 403.200` |
| Tempo computado | 720 | `TC = 120 + 600 = 720` |
| Taxa de Frequência | 12,40 | `TF = (5 × 1.000.000) ÷ 403.200 = 12,40` |
| Taxa de Gravidade | 1.785,71 | `TG = (720 × 1.000.000) ÷ 403.200 = 1.785,71` |
| Taxa de Incidência | 25,00 | `TI = (5 × 1.000) ÷ 200 = 25,00` |

Esse caso é um teste automatizado, não um exemplo de documentação.

## Stack

| Camada | Escolha |
|---|---|
| Build | Vite |
| UI | React 18 + TypeScript strict |
| Estilo | Tailwind CSS |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Testes | Vitest + Testing Library |
| Deploy | Vercel (estático) |

Sem Next.js (não há SSR nem rota de API), sem banco (não há multiusuário), sem
biblioteca de PDF (`@media print` resolve), sem gerenciador de estado global (o
estado cabe em `useState`).

## Rodar

```bash
npm install
npm run dev
```

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção em `dist/` |
| `npm test` | Vitest em watch |
| `npm run test:coverage` | cobertura — `src/core/` precisa de 100% |
| `npm run lint` | ESLint, incluindo a regra que proíbe React em `core/` |
| `npm run typecheck` | `tsc --noEmit` |

## Roadmap

- [x] **Fatia 1** — núcleo de cálculo dos índices + testes
- [ ] **Fatia 2** — Módulo 1: calculadora com memória de cálculo *(publicar e validar
      com usuários reais antes de seguir)*
- [ ] **Fatia 3** — Módulo 2: estatística descritiva, histograma e box plot
- [ ] **Fatia 4** — Módulo 3: série histórica e gráfico de controle
- [ ] **Fatia 5** — Módulo 4: diagrama de Pareto
- [ ] **Fatia 6** — Módulo 5: composição (rosca)
- [ ] **Fatia 7** — PWA, persistência local, CSS de impressão

## Limitação conhecida

A tabela de dias debitados da NBR 14280 **ainda não foi conferida em fonte
primária**. A norma é comercializada pela ABNT, e apostilas de curso técnico
divergem entre si. Até que isso se resolva:

- os dias debitados entram como número informado pelo usuário;
- quando a tabela embarcada existir, cada entrada carregará uma flag de procedência
  confirmada, e a interface avisará que a tabela é parcial.

Um app de SST que calcula errado em silêncio é pior que nenhum app.

## Documentação de projeto

Este projeto foi especificado antes de implementado, usando
[Spec Kit](https://github.com/github/spec-kit):

- [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — os nove
  princípios inegociáveis
- [`specs/001-indicasst-v1/spec.md`](specs/001-indicasst-v1/spec.md) — o quê e por quê
- [`specs/001-indicasst-v1/plan.md`](specs/001-indicasst-v1/plan.md) — como
- [`specs/001-indicasst-v1/tasks.md`](specs/001-indicasst-v1/tasks.md) — em que ordem

## Licença

MIT.
