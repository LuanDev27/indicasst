# Quickstart — IndicaSST

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:5173
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção em `dist/` |
| `npm run preview` | serve o `dist/` já buildado |
| `npm test` | Vitest em modo watch |
| `npm run test:run` | Vitest uma vez (CI) |
| `npm run test:coverage` | cobertura — **`src/core/` precisa de 100%** |
| `npm run lint` | ESLint, inclui a regra que proíbe React dentro de `core/` |
| `npm run typecheck` | `tsc --noEmit` em modo strict |

## Validar a Fatia 1 sem abrir o navegador

A Fatia 1 não tem UI. A validação é o teste do caso de aceite:

```bash
npm run test:run -- indices
```

Deve passar o caso: 200 trabalhadores, 8 h/dia, 252 dias, 0 horas extras,
5 acidentes com afastamento, 120 dias perdidos, 600 dias debitados →
HHT `403200`, tempo computado `720`, TF `12,40`, TG `1.785,71`, TI `25`.

## Validar a Fatia 2 no navegador

1. `npm run dev`
2. Preencher o formulário do Módulo 1 com o caso de aceite acima.
3. Conferir os quatro números-alvo **e** as memórias de cálculo abaixo de cada um.
4. Zerar o efetivo e confirmar que aparece explicação de HHT zero — não `NaN`, não
   `Infinity`, não `0`.
5. Reduzir a janela para 360px e confirmar que não há rolagem horizontal.

## Verificar os princípios que não aparecem na tela

| Princípio | Como verificar |
|---|---|
| V — sem rede | DevTools → Network, usar o app inteiro. A lista fica vazia após a carga inicial. |
| VII — offline | Carregar uma vez, ativar modo avião, recarregar. O app abre e calcula. |
| IX — animação | Digitar num campo com gráfico na tela. O gráfico atualiza sem reanimar. |
| IX — reduced motion | Ativar "reduzir movimento" no SO e recarregar. Nenhuma animação. |
| I — núcleo puro | `npm run lint` acusa qualquer import de React em `src/core/`. |
| VI — arredondamento | `npm run test:run -- formatacao` inclui o teste que varre `src/core/` procurando `toFixed` fora de `formatacao.ts`. |

## Deploy

```bash
npm run build
vercel --prod
```

Build estático. Sem variável de ambiente, sem função serverless, sem banco.

## Estado atual das fatias

- [x] Fatia 1 — `core/tipos.ts`, `core/formatacao.ts`, `core/memoria.ts`, `core/indices.ts` + testes
- [ ] Fatia 2 — Módulo 1 (bloqueada por `TODO(TABELA_NBR_14280)`)
- [ ] Fatia 3 — `core/descritiva.ts` + Módulo 2
- [ ] Fatia 4 — `core/serie.ts` + Módulo 3
- [ ] Fatia 5 — `core/pareto.ts` + Módulo 4
- [ ] Fatia 6 — `core/composicao.ts` + Módulo 5
- [ ] Fatia 7 — PWA, persistência, impressão
