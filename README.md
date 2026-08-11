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

Tudo parte de uma conta só: **quanto falta ÷ quantas horas úteis sobraram**.

*Horas úteis* são apenas as que caem nos dias da semana e nas faixas de horário marcados —
almoço fora da faixa não conta, fim de semana desmarcado não conta.

O ritmo é recalculado a cada vez que a tela é desenhada, a partir do que sobrou e do tempo que
sobrou. Se você adiantar, ele afrouxa; se atrasar, ele aperta. Não existe botão de recalcular.

| Exemplo | Conta | Resultado |
|---|---|---|
| 400 páginas em 5 dias úteis, seg–sex 8h–12h e 13h–17h | 400 ÷ 40 h | **10 páginas/h**, 80 por dia |
| 21 h de estudo na semana, todos os dias 8h–22h | 1260 min ÷ 98 h | **13 min/h**, 3 h por dia |
| Leu 30 na primeira hora em vez de 10 | 370 ÷ 39 h | ritmo cai para **9,5 páginas/h** |

Outros números da tela:

- **Saldo** — compara o que você fez com o que o plano original previa para este momento.
- **Projeção de término** — ignora a meta e usa o seu ritmo real médio para estimar quando isso acaba de verdade.
- **Histórico** — ao concluir uma atividade, guarda o ritmo real medido e passa a sugerir metas mais realistas na criação da próxima.

## Dados

Ficam no `localStorage` do navegador, no próprio aparelho — nada é enviado para servidor nenhum.
Isso significa que **não sincronizam** entre celular e PC, e que limpar os dados de navegação apaga tudo.
Use *Menu → Baixar backup* periodicamente e *Restaurar backup* para levar os dados de um aparelho a outro.

## Onde mexer

O motor de cálculo são duas funções em `index.html`:

- `capMin(atividade, de, ate)` — minutos úteis entre dois instantes, respeitando dias e janelas de horário.
- `metrics(atividade, agora)` — todo o resto (ritmo necessário, saldo, projeção) deriva dela.
