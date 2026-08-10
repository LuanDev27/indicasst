# IndicaSST — Adendo: decisões fechadas e Módulo 5 (composição)

Complemento ao `indicasst-speckit.md`. Aplique junto com o pacote original.

---

## 1. Decisões travadas

| Ponto | Decisão | Motivo |
|---|---|---|
| Rota de desenvolvimento | **Spec Kit completo.** Descartar o prompt rápido da Parte 4. | Quatro módulos compartilham o mesmo `core/`. Sem spec, a lógica de cálculo é duplicada dentro de cada tela e os números divergem entre módulos. |
| Biblioteca de gráficos | **Recharts.** Chart.js fica de fora. | React declarativo. Controlar `isAnimationActive` é uma prop; no Chart.js exige `ref` e atualização imperativa. Num app com campos reativos, isso decide. |
| Animação | Animar **só na montagem**. Desligar no recálculo. | Reanimar a cada tecla digitada faz o gráfico piscar justamente para quem está conferindo um número. |

**Adicione ao `/constitution` como princípio 9:**

```
9. ANIMAÇÃO SUBORDINADA À LEITURA. Gráficos animam apenas na montagem inicial,
   com duração máxima de 600ms. Nenhuma animação em recálculo ou em mudança de
   entrada. Respeitar prefers-reduced-motion desligando toda animação. Em
   Recharts, isAnimationActive deve ser false a partir da segunda renderização,
   controlado por ref de montagem.
```

---

## 2. Módulo 5 — Composição

**Adicione ao `/specify`:**

```
MÓDULO 5 — Composição (gráficos de rosca)
Entrada: categorias e frequências, com no máximo 6 categorias por gráfico.
Saída: gráfico de rosca (donut, cutout de 58%) com legenda em HTML fora do
canvas, exibindo rótulo, valor absoluto e percentual em cada item.

Dois usos previstos:
(a) Composição dos acidentes do período — com afastamento, sem afastamento,
    de trajeto. Máximo 3 fatias.
(b) Distribuição por categoria — parte do corpo, setor, agente causador.
    Máximo 5 fatias mais uma fatia "outros".

Regras obrigatórias:
- A partir da 6ª categoria, agrupar o excedente em "outros" automaticamente e
  avisar o usuário de quantas categorias foram agrupadas.
- A legenda sempre exibe valor absoluto e percentual. Identificar uma fatia não
  pode depender só da cor.
- Nenhum gráfico de rosca com apenas 2 fatias: substituir por barra de
  proporção com valor numérico.
- Percentuais arredondados para inteiro, com nota quando a soma não fechar 100.

RESTRIÇÃO: gráfico de rosca é proibido para série temporal, para comparação de
taxas entre períodos e como substituto do Pareto do Módulo 4.
```

---

## 3. Onde a pizza ajuda e onde atrapalha

Gráfico de pizza entra no escopo — mas delimitado, senão vira decoração.

**Funciona:** proporção dentro de um único período, com poucas fatias, quando a pergunta é "quanto do total é isso". A composição com/sem afastamento é o caso ideal: três fatias, soma fechada, e o contraste entre 16% com afastamento e 72% sem afastamento comunica na hora.

**Não funciona, e por isso está proibido no spec:**

- **Série temporal.** Rosca não mostra evolução. Doze roscas lado a lado é pior que uma linha.
- **Comparar taxas.** TF e TG não somam 100%. Não são partes de um todo — são grandezas independentes. Colocar as duas numa rosca produz um gráfico literalmente sem significado.
- **Substituir o Pareto.** A rosca de parte do corpo tem exatamente os mesmos dados do Pareto do Módulo 4. A barra ordenada com linha de acumulado responde melhor à pergunta que importa — *onde eu corto os 80%* — porque ordena e acumula. A rosca é mais bonita e menos útil. Mantenha as duas, mas saiba que a decisão sai da barra.
- **Muitas fatias.** Acima de 6, o olho não compara ângulos. Daí a regra de agrupar em "outros".

O caso (b) da rosca existe mais para relatório impresso, onde a leitura é rápida e ninguém vai tomar decisão ali, do que para análise. É uma escolha legítima — só não confunda as duas funções.

---

## 4. Ordem de entrega atualizada

O Módulo 5 é o mais fácil de todos e o de menor impacto. Ele entra **por último**, depois do Pareto:

```
Fatia 1 — core/indices.ts + formatacao.ts + testes. Sem UI.
Fatia 2 — Módulo 1 (índices + memória de cálculo). PUBLICAR E VALIDAR.
Fatia 3 — core/descritiva.ts + Módulo 2 (histograma e box plot).
Fatia 4 — Módulo 3 (série histórica + gráfico de controle).
Fatia 5 — Módulo 4 (Pareto).
Fatia 6 — Módulo 5 (composição / rosca).
Fatia 7 — PWA, persistência, CSS de impressão.
```

Resista à tentação de puxar a Fatia 6 para frente porque é rápida e rende print bonito. Ela é a única do projeto que não muda nenhuma decisão de quem usa.
