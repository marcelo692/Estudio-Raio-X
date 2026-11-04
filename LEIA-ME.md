# Estúdio Raio-X · Por Dentro do Óbvio

O Raio-X é o estúdio das **explicações animadas**: o Zuco aparece num cantinho, falando, e uma animação 3D mostra por dentro como a coisa funciona. Ele nasceu do Estúdio do Zuco e mantém tudo o que ele faz (vozes, legenda, música, exportação, atualização). Ele usa a **porta 8766**, então pode ficar aberto ao mesmo tempo que o Estúdio do Zuco.

## Como instalar num computador novo (Windows)
1. Baixe o zip do estúdio e extraia (botão direito > Extrair tudo).
2. Clique duas vezes em **Instalar Estudio Raio-X.bat**. Ele instala o Python se precisar, copia o estúdio para `Documentos\Estudio Raio-X`, instala a voz grátis e cria o atalho **Estudio Raio-X** na área de trabalho.
3. No estúdio, abra o painel **Padrões e atualização**, cole a chave de leitura do GitHub e clique em **Salvar chave**. A partir daí, o botão **Atualizar agora** traz as versões novas.
4. Se for usar a ElevenLabs, cole a chave dela em **⚙ Configurações** (cada computador guarda as suas chaves).

## Como abrir
Use o atalho **Estudio Raio-X** ou clique duas vezes em **Abrir estudio.bat**. Ele liga o servidor local e abre o estúdio no navegador (Chrome ou Edge).
**Deixe a janela preta aberta** enquanto usa o estúdio. Para encerrar, feche essa janela.

## Ordem de um episódio
1. **Roteiro**: em "Gerar roteiro com IA", escreva o tema, aperte **Copiar prompt**, cole numa IA e copie o JSON de volta. Cole no campo Roteiro e aperte **Aplicar roteiro**.
2. **Convidado**: baixe o objeto em .glb (poly.pizza) e aperte **Enviar objeto .glb**. Ele vai para a pasta `convidados/` e entra na cena na hora.
3. **Rosto**: em "Ajustes do rosto e do objeto", mexa nos controles. A câmera foca no convidado enquanto você ajusta.
4. **Revisão cena a cena**: clique numa fala (ou use as setas ◀ ▶). No painel "Cena", troque o texto, a câmera, a ação e a reação. **Ver esta cena** toca só aquela fala.
5. **Exportar vídeo**: gera o MP4 quadro a quadro, com voz e legenda sincronizadas. O arquivo vai para `videos/`.

## Postagens (janela separada)
O botão **📅 Postagens**, no topo do estúdio, abre outra janela só para postar.
- Cada vídeo exportado entra sozinho na aba **A postar**, com os textos de YouTube, TikTok e Instagram prontos para **Copiar**.
- Depois de postar numa rede, clique no nome dela (YouTube, TikTok ou Instagram) para marcar como postado. Clicar de novo desmarca.
- Quando as 3 redes estão marcadas, o vídeo vai para **Já postados**.
- **Postar em** guarda a data planejada. Os vídeos com data aparecem primeiro na fila.
- O registro fica em `videos/postagens.json`, só neste computador.

## Atalhos
- **Espaço**: reproduzir/pausar
- **Setas ← →**: cena anterior/próxima
- **Câmera livre**: arraste para girar, use a roda do mouse para aproximar e o botão direito para mover. Os botões "Focar Zuco", "Focar convidado" e "Ver tudo" levam a câmera direto ao ponto.
- **Barra de progresso**: clique para pular para qualquer ponto.

## Sobre a exportação
O vídeo é montado quadro a quadro, então sempre sai sincronizado, mesmo que o computador seja lento. Um vídeo de 1 minuto leva de 1 a 4 minutos para exportar, dependendo do computador.
Só a **voz neural** entra no vídeo. A voz do navegador serve só para o preview.

## O que o roteiro aceita
- **Cenários**: lago, cozinha, rua, sala, escritorio, banheiro, quarto, estudio, podcast. Use `cenario` no episódio ou numa fala para trocar de lugar no meio.
- **Câmeras**: geral, mascote, convidado, dois, ombro, baixo, giro, zoom, susto, paisagem.
- **Ações** (`acao` = quem fala faz; `reacao` = quem escuta faz): pulo, quicar, tremer, girar, olhar, negar, concordar, balancar, encolher, crescer, cair, aproximar, flutuar, arregalar.

## Pastas
- `convidados/`: objetos .glb
- `roteiros/`: roteiros salvos
- `videos/`: vídeos exportados
- `cache_voz/`: vozes já geradas (pode apagar para liberar espaço)
- `lib/`: bibliotecas do estúdio (não mexer)

## Modo Raio-X (explicação animada)
1. Em **Gerar roteiro com IA**, escolha o formato **Raio-X (explicação animada)**, escreva o tema e aperte **Copiar prompt**. Cole numa IA (Claude, ChatGPT…) e traga o JSON de volta para o campo **Roteiro**. Esse JSON já vem com a animação dentro.
2. Aperte **Aplicar roteiro**. O estúdio monta o mundo 3D, o Zuco vai para o cantinho e a animação toca junto com a fala.
3. O cartão **Animação (Raio-X)** mostra o JSON da animação e a lista de **Blocos** (cada fala é um bloco). Dá para **arrastar** um bloco para reordenar, **▶** para ver só ele, **−/+** para encurtar ou esticar, **✕** para apagar e **⏺** para gravar só aquele bloco em MP4.
4. Para pedir uma alteração à IA ("faz a câmera chegar mais perto no bloco 3"), peça só o trecho novo em JSON, cole no cartão e aperte **Mesclar por id**: o que tem o mesmo id é trocado e o resto fica como está.
5. **Gravar todos os blocos** salva um MP4 por bloco em `videos/` para você conferir. Quando estiver bom, **Exportar vídeo** gera o vídeo completo (é igual aos blocos juntos).
6. O botão **Exemplo: descarga** carrega uma animação pronta para você ver como funciona.

## Vídeos de 1 a 3 minutos (por partes)
1. No cartão **Vídeo por partes**, escreva o tema e escolha a duração. O estúdio mostra em quantas partes vai dividir.
2. Aperte **Copiar prompt** (Parte 1), cole na IA, copie a resposta e cole na caixa de baixo. Aperte **Adicionar parte ao vídeo**.
3. Escolha a **Parte 2** e repita. O prompt das partes seguintes já leva tudo o que existe (peças e elementos) para a IA reaproveitar; o cenário não muda.
4. Assista no player. Para ajustar um trecho, use a lista de blocos (arrastar, ▶, ⏺, −/+, ✕) ou cole só um pedaço novo em **Animação (Raio-X)** e use **Mesclar por id**.
5. Quer ver como fica? Clique em **Exemplo: prédio (2 partes)**.
