# IndicaSST — Pacote Spec Kit para Claude Code

Aplicação para cálculo e visualização de índices estatísticos de segurança do trabalho.

---

## Parte 0 — Por que especificar antes de codar

Spec Kit completo em app pequeno costuma ser desperdício. **Este caso é a exceção**,
por dois motivos concretos:

- **O produto é a correção das fórmulas.** Um erro em `TG` não aparece na tela como
  bug: aparece como número plausível e errado. Especificar antes tem retorno real
  aqui; num CRUD não teria.
- **Cinco módulos compartilham o mesmo `core/`.** Sem spec, a lógica de cálculo é
  duplicada dentro de cada tela e os números divergem entre módulos.

### Riscos identificados antes da primeira linha de código

- **A NBR 14280 completa não está em mãos.** A tabela de dias debitados tem dezenas
  de entradas (falanges, percentuais de incapacidade parcial). O material disponível
  é resumo didático, não fonte primária. **Sem a tabela conferida, o app calcula
  errado em qualquer caso não trivial.**
- **Redistribuir a tabela integral tem risco jurídico.** A ABNT comercializa a
  norma; reproduzir a tabela completa num app público é área cinzenta. Mitigação:
  tratar a tabela como dado editável pelo usuário, embarcar só os valores mais
  citados, e citar a fonte.
- **Planejar demais antes de validar.** Mitigação concreta: mostrar o `spec.md` a
  dois usuários reais antes de `/implement`, e publicar a Fatia 2 antes de escrever
  a Fatia 3.

---

## Parte 1 — Stack recomendada

| Camada | Escolha | Por quê |
|---|---|---|
| Build | **Vite** | SPA sem servidor. Build em segundos. |
| UI | **React 18 + TypeScript** (strict) | TS é obrigatório aqui: unidade errada é o bug clássico deste domínio. |
| Estilo | **Tailwind CSS** | Stack já dominada pela equipe. |
| Gráficos | **Recharts** | API declarativa, TS nativo, cobre barra/linha/composto. |
| Formulários | **React Hook Form + Zod** | Validação de domínio (HHT > 0, dias ≥ 0) declarada uma vez e reutilizada no core. |
| Testes | **Vitest** | Padrão do projeto. |
| Persistência | **localStorage** (via wrapper tipado) | Dados são pequenos e do próprio usuário. |
| Offline | **vite-plugin-pwa** | Uso real é em sala de aula e em campo, com internet ruim. |
| Deploy | **Cloudflare Pages** ou **Vercel** | Estático. Ambos gratuitos. |

### O que NÃO usar (e por quê)

- **Next.js** — aqui não há SSR, rota de API, nem SEO relevante. Traria servidor sem necessidade. Vite é a escolha certa.
- **Supabase** — não há multiusuário, não há dado compartilhado, não há login. Adicionar banco em v1 é exatamente o padrão de construir infraestrutura antes de validar demanda.
- **Biblioteca de PDF (jsPDF, react-pdf)** — CSS `@media print` resolve com uma fração do peso. Só troque se o print não bastar.
- **Zustand / Redux** — o estado cabe em `useState` + Context. Se aparecer necessidade de gerenciador global em v1, o escopo cresceu demais.

### Decisão arquitetural central

```
src/
├── core/          ← funções puras. ZERO import de React. 100% testado.
│   ├── indices.ts       (hht, tf, tg, ti, mortalidade, letalidade)
│   ├── descritiva.ts    (media, mediana, moda, desvioPadrao, cv)
│   ├── diasDebitados.ts (tabela + lookup)
│   └── memoria.ts       (gera a memória de cálculo textual)
├── components/
├── features/
└── App.tsx
```

**O `core/` é o produto. A UI é descartável.** Isso dá: testes triviais, reuso futuro (CLI, API, bot) e uma fronteira arquitetural clara.

---

## Parte 2 — Os comandos Spec Kit

Execute na ordem. Cole o texto de cada bloco como argumento do comando.

### `/constitution`

```
Projeto: IndicaSST — calculadora e visualizador de índices estatísticos de
segurança do trabalho, conforme ABNT NBR 14280.

PRINCÍPIOS INEGOCIÁVEIS:

1. NÚCLEO PURO. Toda lógica de cálculo vive em src/core/ como funções puras,
   sem nenhum import de React ou de biblioteca de UI. Cobertura de teste de
   100% em src/core/ é condição de merge.

2. MEMÓRIA DE CÁLCULO OBRIGATÓRIA. Nenhum resultado é exibido sozinho. Todo
   índice mostra a fórmula com os valores substituídos e o resultado. Exemplo:
   "TF = (5 × 1.000.000) ÷ 403.200 = 12,40". O app é ferramenta de estudo,
   não caixa-preta. Um resultado sem memória de cálculo é um bug.

3. RASTREABILIDADE NORMATIVA. Todo índice exibe sua fonte normativa
   (NBR 14280, item X). Onde houver divergência entre normas, o app mostra as
   duas e exige que o usuário escolha — nunca decide por ele.

4. UNIDADES EXPLÍCITAS NO TIPO. Nenhum número circula sem unidade declarada
   em TypeScript. Usar branded types ou objetos {valor, unidade}. Confundir
   horas com dias é o erro clássico deste domínio.

5. SEM BACKEND, SEM COLETA. Zero requisições de rede em runtime. Zero dado
   pessoal. Zero telemetria. Tudo roda no navegador; persistência só em
   localStorage.

6. ARREDONDAMENTO DECLARADO. Cálculos internos em precisão total;
   arredondamento apenas na exibição, com 2 casas decimais, centralizado em
   uma única função. Nunca arredondar valores intermediários.

7. MOBILE-FIRST E OFFLINE. O uso real é em sala de aula e em campo, em celular,
   com internet ruim. Layout parte de 360px. PWA instalável.

8. PORTUGUÊS BRASILEIRO. Interface, mensagens de erro e nomes de domínio em
   pt-BR. Formato numérico brasileiro (1.785,71). Nomes de código em inglês.
```

### `/specify`

```
Construir o IndicaSST, aplicação web para calcular, visualizar e explicar
índices estatísticos de segurança do trabalho.

PROBLEMA: técnicos e estudantes de Segurança do Trabalho calculam Taxa de
Frequência e Taxa de Gravidade manualmente, com três erros recorrentes:
(a) montar o HHT errado, incluindo férias e afastamentos;
(b) esquecer os dias debitados no tempo computado;
(c) tirar média aritmética de taxas mensais em vez de recalcular com os totais
acumulados do período.
O app precisa impedir esses três erros por construção e ensinar o porquê.

ESCOPO v1 — quatro módulos:

MÓDULO 1 — Calculadora de índices
Entradas: efetivo exposto, horas por dia, dias trabalhados no período, horas
extras, nº de acidentes com afastamento, nº sem afastamento, dias perdidos,
e uma lista de ocorrências com dias debitados (selecionadas de uma tabela).
Saídas: HHT, Taxa de Frequência, Taxa de Gravidade, tempo computado, média de
dias perdidos, Taxa de Incidência, mortalidade, letalidade.
Cada saída acompanhada da memória de cálculo com valores substituídos.
O formulário de HHT deve deixar visualmente explícito o que entra e o que não
entra no cômputo.

MÓDULO 2 — Estatística descritiva
Entrada: uma série de valores numéricos, digitada ou colada de planilha.
Saídas: média, mediana, moda, amplitude, variância, desvio padrão e coeficiente
de variação, com tabela passo a passo do cálculo do desvio padrão (valor,
desvio, desvio ao quadrado).
Visualização: histograma e box plot.
Interpretação automática do CV nas faixas <15%, 15–30%, >30%.

MÓDULO 3 — Série histórica
Entrada: dados mensais de acidentes, dias perdidos e HHT, por até 24 meses.
Saídas: gráfico de linha com TF e TG ao longo do tempo em eixos duplos; gráfico
de controle com linha média e limites de x̄ ± 3s; consolidado do período
calculado corretamente pelos totais acumulados, exibindo lado a lado o valor
correto e a média ingênua das taxas mensais, com aviso explicando a diferença.

MÓDULO 4 — Diagrama de Pareto
Entrada: categorias e frequências (ex.: parte do corpo lesionada, setor, agente).
Saída: barras em ordem decrescente com linha de percentual acumulado, corte
destacado em 80%, e lista das categorias dentro do corte.

TRANSVERSAL:
- Persistência local dos dados entre sessões, com opção de limpar.
- Exportação: relatório imprimível via CSS de impressão, incluindo memórias de
  cálculo e gráficos.
- Tabela de dias debitados editável pelo usuário e exportável/importável em
  JSON. Embarcar apenas os valores mais citados, com aviso visível de que a
  tabela é parcial e de que a NBR 14280 vigente deve ser consultada.

FORA DE ESCOPO em v1: login, backend, banco de dados, multiusuário,
compartilhamento, cálculo de dose de ruído, geração de PDF por biblioteca,
i18n, modo escuro.

CRITÉRIO DE ACEITE: um estudante consegue reproduzir, no app, o exemplo
completo de uma empresa com 200 trabalhadores, 8h/dia, 21 dias/mês, 12 meses,
5 acidentes com afastamento, 120 dias perdidos e uma amputação de polegar,
obtendo HHT = 403.200, TF = 12,40, TG = 1.785,71 e TI = 25 — com todas as
memórias de cálculo visíveis.
```

### `/clarify`

O comando vai fazer perguntas. Respostas já decididas — não improvise na hora, é onde o escopo escapa:

| Pergunta provável | Resposta |
|---|---|
| Autenticação / contas? | Não. Nenhuma, em nenhuma fase. |
| Backend ou banco? | Não. Apenas localStorage. |
| Múltiplas empresas/projetos salvos? | Sim, mas só em v2. Em v1, um conjunto de dados por módulo. |
| Exportar em PDF? | Via impressão do navegador. Sem biblioteca de PDF. |
| Idioma? | Só pt-BR. |
| Modo escuro? | Não em v1. |
| Tabela de dias debitados completa embarcada? | Não. Subconjunto + editável pelo usuário + aviso de tabela parcial. |
| Calcular dose de ruído? | Não em v1. |
| Comparar com benchmark setorial? | Não. Exigiria fonte de dados externa e manutenção. |
| Importar CSV? | Só colar de planilha em v1 (Módulo 2 e 3). CSV fica para v2. |

### `/plan`

```
Vite + React 18 + TypeScript em modo strict. Tailwind CSS. Recharts para
gráficos. React Hook Form + Zod para formulários e validação. Vitest +
Testing Library. vite-plugin-pwa. Deploy estático em Cloudflare Pages.

ESTRUTURA:
src/core/       funções puras de cálculo, sem import de React
  indices.ts        hht, taxaFrequencia, taxaGravidade, taxaIncidencia,
                    tempoComputado, mediaDiasPerdidos, mortalidade, letalidade
  descritiva.ts     media, mediana, moda, amplitude, variancia, desvioPadrao,
                    coeficienteVariacao, limitesControle
  pareto.ts         ordenação, acumulado, corte em 80%
  diasDebitados.ts  tabela padrão + lookup + merge com tabela do usuário
  memoria.ts        gera string da fórmula substituída para cada índice
  formatacao.ts     arredondamento e formatação numérica pt-BR (única fonte)
  tipos.ts          branded types de unidade (Horas, Dias, Acidentes)
src/features/   um diretório por módulo (indices, descritiva, serie, pareto)
src/components/ componentes compartilhados (CampoNumerico, CartaoResultado,
                BlocoMemoriaCalculo, AvisoNormativo)
src/storage/    wrapper tipado de localStorage com versionamento de schema

REGRAS TÉCNICAS:
- Cada função de core/ recebe e devolve valores primitivos ou objetos simples;
  nunca recebe evento, estado ou componente.
- Toda função de core/ tem teste com pelo menos: caso feliz, caso limite
  (zero, divisão por zero), e caso do exemplo de aceite do spec.
- Divisão por HHT = 0 devolve Result tipado com erro, nunca Infinity ou NaN.
- Arredondamento acontece exclusivamente em formatacao.ts, na fronteira de
  exibição. Nenhuma função de cálculo arredonda.
- Componentes de gráfico recebem dados já calculados por core/; não calculam
  nada internamente.

ORDEM DE ENTREGA (fatiada para ser útil desde cedo):
Fatia 1 — core/indices.ts + core/formatacao.ts + testes. Sem UI.
Fatia 2 — Módulo 1 (calculadora de índices) com memória de cálculo. Deploy.
Fatia 3 — core/descritiva.ts + Módulo 2 com histograma.
Fatia 4 — Módulo 3 (série histórica + gráfico de controle).
Fatia 5 — Módulo 4 (Pareto).
Fatia 6 — PWA, persistência, CSS de impressão.

A Fatia 2 já deve estar publicada e utilizável antes de começar a Fatia 3.
```

### `/tasks`, `/analyze`, `/implement`

Rode sem argumento extra. Duas instruções ao chegar em `/implement`:

1. **Implemente uma fatia por vez.** Rode `/implement` apontando para a Fatia 1, valide os testes, e só então avance. Deixar o Claude Code implementar as 6 fatias de uma vez produz um volume de código que ninguém revisa de verdade.
2. **Após a Fatia 2, publique e mande o link para usuários reais.** Antes de escrever a Fatia 3. É esse passo que quebra o hábito de construir tudo antes de validar.

---

## Parte 3 — Bloqueador a resolver antes da Fatia 1

É preciso obter a tabela de dias debitados **completa e conferida**. Caminhos, em ordem de preferência:

1. Biblioteca de instituição de ensino técnico — normas ABNT costumam estar disponíveis para consulta.
2. Portal da ABNT via convênio institucional (algumas instituições de ensino têm acesso).
3. Apostilas de cursos técnicos reproduzem a tabela, mas **divergem entre si** — se usar, cruze pelo menos três fontes e marque no código quais entradas não foi possível confirmar.

Enquanto não resolver, marque as entradas não confirmadas com uma flag no JSON e exiba um aviso na interface. Um app de SST que calcula errado em silêncio é pior que nenhum app.

---

## Parte 4 — Alternativa rápida, sem Spec Kit

> **DESCARTADA pelo adendo** (`docs/indicasst-adendo.md`, seção 1): a rota é o Spec Kit
> completo. Mantida aqui apenas como registro histórico. Não executar.

Para um caminho rápido, sem os sete comandos, cole isto direto no Claude Code:

```
Crie um app Vite + React 18 + TypeScript strict + Tailwind + Recharts que
calcule índices de segurança do trabalho conforme a NBR 14280.

Comece APENAS pela camada de cálculo em src/core/, sem nenhuma UI:

- hht(trabalhadores, horasPorDia, dias, horasExtras)
- taxaFrequencia(acidentesComAfastamento, hht)      → × 1.000.000 / hht
- tempoComputado(diasPerdidos, diasDebitados)
- taxaGravidade(tempoComputado, hht)                → × 1.000.000 / hht
- taxaIncidencia(acidentes, numeroTrabalhadores)    → × 1.000 / trabalhadores
- mediaDiasPerdidos(tempoComputado, acidentados)
- mortalidade(obitos, trabalhadores)                → × 100.000
- letalidade(obitos, acidentes)                     → × 1.000

Regras:
- Funções puras, sem import de React.
- HHT igual a zero devolve Result tipado com erro, nunca Infinity ou NaN.
- Nenhuma função arredonda; arredondamento fica em formatacao.ts.
- Cada função devolve também uma string de memória de cálculo com os valores
  substituídos, ex.: "TF = (5 × 1.000.000) ÷ 403.200 = 12,40".
- Testes em Vitest, incluindo este caso: 200 trabalhadores, 8h/dia, 21 dias/mês,
  12 meses, 5 acidentes com afastamento, 120 dias perdidos, 600 dias debitados
  → HHT 403.200, TF 12,40, TG 1.785,71, TI 25.

Não escreva nenhum componente ainda. Pare quando os testes passarem.
```

Esse prompt sozinho já entrega o coração do produto. A UI depois é a parte fácil.
