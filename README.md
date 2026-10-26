# Personal Lentes Dentais — Método Personalizer

Landing page estática (HTML + CSS + JS), sem build. Abra `index.html` por um servidor
(ex.: `npx serve` ou `python3 -m http.server`) — via `file://` o navegador bloqueia as fontes.

## Estrutura
- `index.html` — página completa
- `assets/css/style.css` — estilos (tokens da marca no `:root`)
- `assets/js/main.js` — animações (GSAP + ScrollTrigger) e interações
- `assets/js/vendor/` — GSAP 3.13 local (sem CDN)
- `assets/fonts/` — Manrope, DM Sans e Playfair Display auto-hospedadas (OFL)
- `assets/img/`, `assets/video/` — mídia otimizada (WebP / MP4 sem áudio)

## Antes de publicar
1. Substituir os placeholders entre colchetes (busque por `class="ph"`):
   [DATA], [DATAS], [CIDADE], [CIDADE — ENDEREÇO], [HORÁRIO],
   [FORMAÇÃO / ESPECIALIDADE] e [FUNÇÃO NA PERSONAL CURSOS].
2. Depois, apagar a regra `.ph` no CSS (ela só destaca o que está pendente).
3. Depoimentos: em cada `.story-cover`, preencher `data-video="assets/video/arquivo.mp4"`
   e colocar a foto do ALUNO dentro do botão como `<img>` (nunca foto de paciente).
   Sem `data-video` o card fica como "Vídeo em breve".
4. Foto do "Quem conduz" é provisória (acervo) — trocar pela [FOTO] oficial.
5. Link de inscrição: todos os botões "Quero garantir minha vaga", o CTA final e a barra do celular abrem o formulário https://form.respondi.app/jWdw6rvi em nova aba.
6. `og:image` precisa de URL absoluta do domínio final.

## Acessibilidade e performance
- Conteúdo visível mesmo sem JS ou se o GSAP falhar.
- `prefers-reduced-motion` desliga todas as animações e o carrossel.
- Pins e empilhamento de cards só a partir de 761px; no celular a página flui sem travas.
- Vídeos só tocam quando estão na tela.

## Seção de vídeos ("A prática começa aqui")
- Dois vídeos verticais (`pratica-vertical.mp4` 0:38 e `momentos-vertical.mp4` 0:28), ambos com áudio.
- Prévia muda em loop quando o vídeo está na tela; "Assistir com som" reinicia com áudio e abre os controles
  (play/pausa, barra de progresso, mudo, volume e tela cheia). Só um vídeo toca com som por vez.
- Atalhos com o player em foco: espaço/K pausa, M silencia, Esc encerra.
- No celular os vídeos viram um carrossel com indicador; o controle de volume fica oculto em telas de toque
  (o iOS não permite ajustar volume pelo site — o botão de mudo continua).
- Com "economia de dados" ou movimento reduzido ativados, não há prévia automática.

## Camada imersiva (scrollytelling)
- Rolagem suave com Lenis (`assets/js/vendor/lenis.min.js`) só em desktop com mouse; no toque a rolagem é nativa.
- Hero: palco 3D que reage ao mouse (inclinação, chips em profundidade, luz e reflexo) e, a partir de 1024px,
  uma saída cinematográfica fixada no scroll: o texto sai, o vídeo gira para frente e cresce até o centro.
- Números: entram virando em 3D. Método: passos entram em perspectiva e o passo atual ganha foco.
- Programa (3 dias): o card anterior recua e inclina como um baralho; imagens com parallax; itens em cascata.
- Resultados: carrossel em destaque. A partir de 761px a seção fica fixa e o scroll percorre as 6 fotos;
  setas, pontos e teclado levam até cada foto. No celular: deslizar, setas e troca automática a cada 4,5 s.
- Cortinas: "Quem conduz", "Turma" e CTA final abrem de um painel arredondado para a tela cheia.
- Cards de "Para quem é", "Tudo incluso" e "Turma" têm perspectiva 3D e brilho que segue o cursor.
- Barra de progresso de leitura no topo.
- Tudo respeita `prefers-reduced-motion` e funciona sem JS/GSAP.

## Transições entre seções
- Empilhamento (desktop ≥1024px): Números → Para quem é, Vídeos → Programa, Depoimentos → Resultados e
  Tudo incluso → Turma. A seção de baixo fica presa, recua e escurece enquanto a próxima sobe por cima
  com cantos arredondados. No celular fica só o encaixe arredondado, sem trava.
- Texto que acende palavra por palavra no resumo de Resultados.
- Cortinas mantidas em "Quem conduz" e no CTA final.

## Carrossel dos 3 dias (Programa)
- Desktop (≥1101px): a seção fixa e os cards correm na horizontal conforme o scroll; o card central fica em
  destaque e os vizinhos giram levemente, sem escurecer. Abas (Planejamento / Preparo / Cimentação),
  setas e as teclas ← → levam direto a cada dia; a linha sob as abas mostra o progresso.
- Celular / movimento reduzido: carrossel de deslizar com as mesmas abas.
- Os itens de cada dia entram em cascata quando o card vira o atual.

## Ajustes para notebook
- A altura dos cards do Programa é calculada pela altura da janela para o card caber inteiro na tela;
  em telas mais baixas (≤940px e ≤760px de altura) espaçamentos e tipografia dos cards ficam mais compactos.
