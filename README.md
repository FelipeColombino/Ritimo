# Ritmo — planejador de metas

App de página única: você define uma meta, um prazo e os horários que realmente dedica à atividade,
e ele calcula **quanto fazer por hora** — refazendo a conta sozinho conforme você adianta ou atrasa.

Instalável como aplicativo no Android (abre sem barra de navegador) e funciona offline.

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | o app inteiro — HTML, CSS e JavaScript numa página só, sem build e sem dependências |
| `manifest.webmanifest` | metadados de instalação (nome, ícones, `display: standalone`) |
| `sw.js` | service worker: cache para funcionar offline |
| `icon-192.png`, `icon-512.png` | ícones padrão |
| `icon-maskable-512.png` | ícone para launchers que aplicam máscara (One UI, Pixel) |

Todos os caminhos internos são **relativos** (`./`), porque o app é servido de um subdiretório
(`usuario.github.io/Ritimo/`). Caminhos absolutos quebrariam silenciosamente.

## Publicação

Hospedado no GitHub Pages a partir da branch `main`, raiz do repositório.
Publicar uma alteração é `git add` + `git commit` + `git push`; o Pages atualiza em ~1 minuto.

Para testar antes de enviar, sirva a pasta por HTTP (o service worker não funciona em `file://`):

```bash
python -m http.server 8000
```

## Como o cálculo funciona

Três camadas encaixadas, do maior para o menor. *Horas livres* são só as que caem nas faixas
marcadas para aquele dia da semana — almoço fora da faixa não conta, dia sem faixa não conta.

**1. Ciclo** — a meta grande (25 h por semana). Recorrente, com reset automático, ou período com data fim.

**2. Dia** — o que sobrou do ciclo dividido entre os dias que faltam, **proporcionalmente às horas
livres de cada um**: um dia com 3 h livres recebe menos que um com 14 h. Esse número **congela quando
o dia começa**. Fazer mais hoje não muda a meta de hoje — alivia os próximos dias.

**3. Hora** — o que falta do dia dividido pelas horas que ainda restam hoje. Este se move o tempo
todo: pulou uma faixa, as seguintes apertam; adiantou, elas afrouxam.

| Exemplo | Conta | Resultado |
|---|---|---|
| 25 h/semana, 7 dias iguais | 25 ÷ 7 | **3 h 34 min** por dia |
| Estudou 10 h no primeiro dia | 15 ÷ 6 | próximos dias caem para **2 h 30 min** |
| Seg–sex 3 h livres, sáb–dom 14 h | proporcional | **1 h 45 min** em dia útil, **8 h 08 min** no fim de semana |
| Meta de 2 h entre 8h e 12h | 2 ÷ 4 faixas | **30 min** por faixa |
| Pulou a faixa das 8h | 2 ÷ 3 | as três restantes viram **40 min** |
| Fez 1 h na faixa das 8h | 1 ÷ 3 | as três restantes viram **20 min** |

Outros comportamentos:

- **Transbordo** — se o que falta não cabe mais no tempo livre de hoje, o app avisa em vez de pedir o
  impossível, e o excedente entra na conta dos próximos dias. *Encerrar o dia* faz isso explicitamente.
- **Saldo entre ciclos** (opcional) — sobrou tempo, o ciclo seguinte afrouxa; faltou, ele aperta.
  Limitado a ±30% da meta base por padrão, para uma semana ruim não gerar outra impossível.
- **Faixa passada sem lançamento não é falha** — o tempo dela já foi redistribuído nas seguintes,
  então ela aparece neutra, nunca em vermelho.

## Dados

Ficam no `localStorage` do navegador, no próprio aparelho — nada é enviado para servidor nenhum.
Isso significa que **não sincronizam** entre celular e PC, e que limpar os dados de navegação apaga tudo.
Use *Menu → Baixar backup* periodicamente e *Restaurar backup* para levar os dados de um aparelho a outro.

## Onde mexer

O motor de cálculo são quatro funções em `index.html`, e nenhuma delas grava estado — todas se
reconstroem a partir do histórico de lançamentos:

- `capMin(atividade, de, ate)` — minutos livres entre dois instantes, respeitando as janelas de cada dia da semana. Base de tudo.
- `metaDoCiclo(atividade, idx)` — meta do ciclo depois de aplicar o saldo transportado e o teto.
- `metaDoDia(atividade, dia)` — a meta congelada do dia. Depende só do que foi feito **antes** daquele dia,
  por isso não se mexe das 00h às 23h59 e dá o mesmo valor mesmo depois de dias sem abrir o app.
- `metrics(atividade, agora)` — o resto (falta hoje, ritmo da hora, transbordo, estado) deriva dessas três.

Cuidado ao mexer nas telas "Metas por dia" e no mapa de horas: elas **não** usam `metaDoDia`/`alvoDaFaixa`
direto para itens futuros. Essas funções respondem *"quanto este dia/faixa pediria se eu não fizesse mais
nada até lá"* — correto para o item atual, mas como plano faria cada linha assumir que todas as anteriores
falharam, e a soma estouraria a meta. Para o futuro, ambas distribuem o que resta entre o que sobra.
