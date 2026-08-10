# NBR 14280:2001 — extração para implementação

**Status**: dados obtidos em 2026-08-09 do texto da própria norma (PDF público de
terceiro, não de cópia adquirida da ABNT). Resolve o `TODO(TABELA_NBR_14280)` para
fins de implementação, **não** substitui a consulta à norma vigente.

> **Nota de procedência.** As três primeiras tentativas por fontes secundárias
> (apostilas e resumos) devolveram a tabela dos quirodátilos **com as linhas
> deslocadas** — atribuíam ao polegar o valor da 3ª falange do indicador. A extração
> abaixo veio da camada de texto do PDF da norma e é internamente coerente: o polegar
> não tem 3ª falange, e "amputação total do polegar = 600 dias" bate com
> `polegar / 1ª falange - proximal`, que é o caso de aceite da spec.
>
> Lição para o projeto: as apostilas divergem *e* erram de forma sistemática. Toda
> entrada aqui deve poder ser reconferida pelo usuário.

---

## 1. Quadro 1 — Dias a debitar (item 3.4.4)

### I — Morte

| Item | Dias |
|---|---|
| Morte (3.4.1) | 6 000 |

### II — Incapacidade permanente total

| Item | Dias |
|---|---|
| Incapacidade permanente total (3.4.2) | 6 000 |

### III — Perda de membro

**a) Membro superior**

| Lesão | Dias |
|---|---|
| Acima do punho até o cotovelo, exclusive | 3 600 |
| Do cotovelo até a articulação do ombro, inclusive | 4 500 |

**b) Mão — quirodátilos (dedos da mão)**

Amputação atingindo todo o osso ou parte:

| Osso | 1º (Polegar) | 2º (Indicador) | 3º (Médio) | 4º (Anular) | 5º (Mínimo) |
|---|---|---|---|---|---|
| 3ª falange — distal | — | 100 | 75 | 60 | 50 |
| 2ª falange — medial (distal para o polegar) | 300 | 200 | 150 | 120 | 100 |
| 1ª falange — proximal | **600** | 400 | 300 | 240 | 200 |
| Metacarpianos | 900 | 600 | 500 | 450 | 400 |

| Lesão | Dias |
|---|---|
| Mão, no punho (carpo) | 3 000 |

> O polegar não tem 3ª falange. A coluna "2ª falange" é, para ele, a falange distal.

**c) Membro inferior**

| Lesão | Dias |
|---|---|
| Acima do joelho | 4 500 |
| Acima do tornozelo até a articulação do joelho, exclusive | 3 000 |

**d) Pé — pododátilos (dedos do pé)**

| Osso | 1º (hálux) | Cada um dos demais |
|---|---|---|
| 3ª falange — distal | — | 35 |
| 2ª falange — medial (distal para o 1º pododátilo) | 150 | 75 |
| 1ª falange — proximal | 300 | 150 |
| Metatarsianos | 600 | 350 |

| Lesão | Dias |
|---|---|
| Pé, no tornozelo (tarso) | 2 400 |

### IV — Perturbação funcional

| Lesão | Dias |
|---|---|
| Perda de visão de um olho, haja ou não visão no outro | 1 800 |
| Perda de visão de ambos os olhos em um só acidente | 6 000 |
| Perda de audição de um ouvido, haja ou não audição no outro | 600 |
| Perda de audição de ambos os ouvidos em um só acidente | 3 000 |

### Nota de rodapé do quadro

Se o osso não é atingido, usar somente os dias perdidos e classificar como
incapacidade temporária.

---

## 2. Regras que precisam virar código

Estas não são tabela — são lógica, e o app erra se ignorá-las.

| Item | Regra | Onde implementar |
|---|---|---|
| **3.4.3.1** | Por dedo, conta **somente o osso de maior valor**. Em amputação de mais de um dedo, somam-se os dias de cada dedo. | `somarDias` — avisar quando duas entradas do mesmo dedo forem selecionadas |
| **3.4.3.5** | Soma que exceder **6 000 dias** tem o excesso desprezado. | `somarDias` — teto rígido |
| **3.4.3.2** | Redução permanente de função = **percentual** dos dias de amputação, avaliado pela seguradora. | entrada percentual do usuário |
| **3.4.3.4** | Redução permanente da visão = percentual dos valores do quadro, determinado pela seguradora. | idem |
| **3.4.3.6** | Lesão fora do quadro (órgão interno, perda de função) = percentual de 6 000 dias, por parecer médico. | entrada livre com aviso |
| **3.4.3.3** | Perda de audição só é incapacidade permanente parcial quando **total** para um ou ambos os ouvidos. | validação |
| **3.5** | Incapacidade permanente **e** temporária do mesmo acidente: conta-se só a de maior tempo, não a soma. | ⚠️ o `TC = diasPerdidos + diasDebitados` atual é simplificação |
| **Nota 3.6.2** | Em morte ou incapacidade permanente não se contam os dias perdidos, só os debitados — salvo se os perdidos excederem os debitados. | idem |
| **Rodapé 1** | Hérnia inguinal não reparada: 50 dias. Reclassificar após reparada. | entrada especial |

**Não são incapacidade permanente parcial** (3.4.4): hérnia inguinal reparada, perda
de unha, perda da ponta de dedo sem atingir o osso, perda de dente, desfiguramento,
fratura/distensão/torção sem limitação permanente.

---

## 3. Itens normativos dos índices — resolve `TODO(NBR_14280_ITENS)`

| Índice | Item | Observação |
|---|---|---|
| Horas-homem de exposição ao risco (HHT) | 2.10 (definição), 3.2 (cálculo) | |
| Tempo computado | 2.9.8, 3.5 | |
| Taxa de frequência de acidentes (F_A) | **3.6.1.1** | usa nº de acidentes |
| Taxa de frequência de acidentados com lesão com afastamento (F_L) | **3.6.1.2** | **é esta que o app chama de TF** |
| Taxa de frequência de acidentados sem afastamento | 3.6.1.3 | resultado deve ser apresentado em separado |
| Taxa de gravidade (G) | **3.6.2** | |
| Média de dias perdidos / tempo computado médio | 3.6.3.1, 3.6.3.2, **3.6.3.3** | "medidas optativas de avaliação da gravidade" |

### ⚠️ Índices que NÃO são da NBR 14280

Busca no texto integral da norma: **"letalidade" e "mortalidade" não aparecem**, e não
há taxa de incidência entre as medidas de 3.6.

- **Taxa de Incidência** — indicador da Previdência Social (acidentes por 1 000
  vínculos), não da NBR 14280.
- **Taxa de Mortalidade** e **Taxa de Letalidade** — indicadores epidemiológicos /
  previdenciários.

A `fonte` desses três **não pode** citar NBR 14280. Citar errado é violação direta do
princípio III.

---

## 4. Duas divergências encontradas contra o que já está implementado

### 4.1 Taxa de Gravidade: a norma pede número inteiro

> **3.6.2** — "Deve ser expressa em **números inteiros**"

O `spec.md` (SC-001) exige `TG = 1.785,71`, com duas casas. São incompatíveis.

**Encaminhamento proposto** (princípio III manda mostrar as duas e deixar o usuário
escolher, nunca decidir por ele): manter 2 casas como padrão, porque é o critério de
aceite acordado e o que o material didático usa, e exibir nota citando 3.6.2 com o
valor inteiro ao lado. Não mudar em silêncio.

### 4.2 Taxa de Frequência: a norma distingue duas taxas

- **3.6.1.1** F_A usa *número de acidentes*
- **3.6.1.2** F_L usa *número de acidentados com lesão com afastamento*

O app calcula F_L e chama de "TF". Correto quanto à conta, mas o rótulo deveria dizer
qual das duas é — e a norma ainda distingue *acidentes* de *acidentados*, que o app
hoje trata como a mesma coisa.

**A favor da implementação atual**: 3.6.1.1 confirma "aproximação de **centésimos**"
para a taxa de frequência, ou seja, 2 casas decimais — bate com o princípio VI.

---

## 5. Procedência

Texto extraído da camada de texto do PDF da NBR 14280:2001 obtido em cópia pública de
terceiro, conferido contra o caso de aceite do projeto. **Não** foi conferido contra
exemplar adquirido da ABNT.

Consequência para o código: as entradas embarcadas devem nascer com
`confirmado: false` até que alguém confira num exemplar legítimo, e a interface deve
manter o aviso de tabela não conferida. A ABNT comercializa a norma; o app trata a
tabela como dado editável do usuário, não como redistribuição da norma.
