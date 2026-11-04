# AGENTS.md — Estúdio Raio-X (base: Estúdio do Zuco)

> Para o estado atual do projeto, dados do canal e próximos passos, leia também o **HANDOFF.md**.

Leia este arquivo inteiro antes de alterar qualquer coisa nesta pasta. Ele descreve a estrutura, as regras que não podem ser quebradas e o passo a passo das mudanças mais comuns. Se uma mudança contrariar uma regra daqui, pare e pergunte ao Marcelo antes.

## O que é
Estúdio local que transforma um roteiro em JSON num vídeo vertical (1080×1920) do canal **Por Dentro do Óbvio**. Este projeto é uma cópia do Estúdio do Zuco com um **modo novo, o Raio-X**: explicações animadas em que o Zuco fala num cantinho e um mundo 3D animado mostra o mecanismo (seção "Modo Raio-X" abaixo). Os formatos antigos (Zuco + convidado) continuam funcionando igual. No modo antigo, o Zuco, um alienígena low poly que é o mascote fixo, entrevista um objeto (o "convidado"). Tudo roda no navegador (Chrome ou Edge) com um servidor Python local.

Fluxo: tema → prompt (botão "Copiar prompt") → IA externa devolve JSON → "Aplicar roteiro" → vozes neurais geradas → preview e edição cena a cena → "Exportar vídeo" → `videos/*.mp4`.

## Arquivos
| Arquivo | Papel |
|---|---|
| `index.html` | O estúdio: HTML, CSS e JS num arquivo só. Sem build, sem framework. |
| `modulos/raiox.js` | **Motor do modo Raio-X** (script comum, sem build, global `Raiox`): monta o mundo, compila as ações no tempo, câmera, rótulos, partículas, Zuco no canto, cartão da interface e prompt. |
| `modulos/exemplo-descarga.js` | Gerado a partir de `roteiros/exemplo-descarga.json` (a fonte da verdade). É o roteiro que abre por padrão. |
| `postagens.html` | Janela separada de postagens (botão "📅 Postagens" no topo). Página autocontida que lista `videos/*.mp4`, mostra os textos do `.txt` ao lado para copiar e marca o que foi postado em cada rede. Pedido do Marcelo: fica fora da tela principal. |
| `servidor.py` | Servidor HTTP local (porta 8766, só stdlib + `edge-tts`). Serve a pasta e expõe a `/api/*`. |
| `Abrir estudio.bat` | Acha o Python, instala o `edge-tts` na primeira vez e roda `servidor.py`, que abre o navegador. |
| `lib/` | Bibliotecas locais, sem CDN: `three.min.js` (three.js **r128**), `GLTFLoader.js`, `OrbitControls.js` (versões "examples/js" que criam `THREE.*` globais) e `mp4-muxer.js` (v5, global `Mp4Muxer`). **Não trocar de versão** sem testar tudo: r128 é a última com `examples/js`. |
| `convidados/` | Objetos 3D `.glb`. O nome do arquivo é o nome do convidado no roteiro. |
| `roteiros/` | Roteiros JSON salvos. `exemplo-oculos.json` é o exemplo de referência. |
| `videos/` | Saída da exportação (criada pelo servidor). |
| `cache_voz/` | MP3 das falas, com cache por hash de provedor+voz+ajustes+texto. Pode ser apagado (mas apagar refaz as falas da ElevenLabs e gasta crédito de novo). |
| `musicas/<clima>/` | Músicas de fundo separadas por clima (`divertida`, `animada`, `suspense`, `calma`). Arquivo solto em `musicas/` vale para qualquer clima. |
| `padrao.json` | "Meu padrão" do canal (voz, música, legenda, final, formato). Gravado pelo botão "Definir como meu padrão". Num navegador novo, o estúdio começa por ele. |
| `~/.estudio-zuco.json` | Fica na pasta do usuário do Windows, **fora** do projeto: guarda a chave da ElevenLabs. Nunca copiar a chave para o projeto, o roteiro, o `padrao.json` ou o `localStorage`. |
| `PROMPT_MESTRE.md` | Cópia estática do prompt. **A fonte de verdade é `buildPrompt()` no `index.html`.** |
| `LEIA-ME.md` | Manual de uso para o Marcelo (não técnico). |

## Onde o código vive (fluxo de trabalho)
- **A fonte da verdade é o GitHub:** `marcelo692/Estudio-Raio-X`, ramo `main`. Toda alteração de código é feita e enviada (commit + push) para lá.
- O PC do Marcelo **não é um clone git**: é a pasta do OneDrive. Ela recebe o código pelo botão **Atualizar agora** (janela **⚙ Configurações**, no topo), que chama `/api/atualizar`.
- Não edite arquivos de código direto na pasta do PC: a próxima atualização sobrescreve (a versão anterior fica em `versoes/antes-da-atualizacao-*`). Se um agente local mudar algo, essa mudança precisa ir para o GitHub.
- Ficam só no PC (no `.gitignore`): `videos/`, `cache_voz/`, `versoes/`, músicas, `padrao.json` e `versao.json`. A atualização nunca apaga arquivos; ela só cria ou substitui os que vêm do GitHub, e nunca toca em `padrao.json` e `versao.json`.

## API do servidor (`servidor.py`)
| Rota | Entrada | Saída |
|---|---|---|
| `GET /api/status` | — | `{ok, tts, convidados, musicas: ["clima/arquivo.mp3", ...], climas, eleven: bool, eleven_fim}` |
| `POST /api/tts` | JSON `{provedor: "edge"\|"eleven", texto, voz, tom (Hz), velocidade (%), modelo?, estabilidade?, estilo?}` | `audio/mpeg` + header `X-Palavras` (base64 de JSON `[{w, t}]`, tempo de cada palavra em segundos). Na ElevenLabs usa `/v1/text-to-speech/{voz}/with-timestamps` e converte o tempo por letra em tempo por palavra (`palavras_do_alinhamento`); a velocidade vira `speed` entre 0,7 e 1,2 e o tom é ignorado. Cache em `cache_voz/<hash>.mp3` + `.json`. |
| `POST /api/config` | JSON `{eleven_chave}` ou `{apagar: true}` | Testa a chave na ElevenLabs e guarda em `~/.estudio-zuco.json`. Devolve só os 4 últimos caracteres. |
| `GET /api/eleven/vozes` | — | `{minhas: [...], biblioteca: [...]}` (biblioteca = vozes compartilhadas em português com sotaque brasileiro). Cada voz: `{id, nome, previa, dono, info}`. |
| `POST /api/eleven/adicionar` | JSON `{id, dono, nome}` | Adiciona uma voz da biblioteca à conta (`/v1/voices/add/...`) e devolve `{id}`. A página faz isso sozinha antes de gerar a primeira fala (`ensureElevenVoices`). |
| `GET/POST /api/padrao` | JSON das preferências | Lê ou grava `padrao.json`. |
| `POST /api/salvar-textos` | JSON `{video, texto}` | Grava os textos de publicação num `.txt` com o mesmo nome do vídeo (só dentro de `videos/`). |
| `GET /api/postagens` | — | `{videos: [{arquivo, url, criado, mb, textos: {"YouTube: título": ..., ...}, postado: {youtube, tiktok, instagram}, agendado}]}`. Os textos vêm do `.txt` (blocos `=== Nome ===`); `postado` guarda a data/hora ou `null`. |
| `POST /api/postagens` | JSON `{arquivo, rede?, postado?, agendado?}` | Marca/desmarca uma rede ou grava a data planejada em `videos/postagens.json` (com trava, escrita atômica). Só aceita arquivos que existem em `videos/`. Devolve `{estado}`. |
| `POST /api/abrir-pasta` | JSON `{caminho}` | Abre o Explorador na pasta `videos/`, com o vídeo selecionado (botão "Abrir pasta do vídeo"). Só aceita caminhos dentro de `videos/`. |
| `GET /api/atualizacao` | — | `{github, local, remoto, nova}`: compara `versao.json` com o último commit do `main`. |
| `POST /api/atualizar` | — | Baixa o zip do commit, guarda cópia do que muda em `versoes/`, grava os arquivos, atualiza `versao.json` e reinicia o servidor (`reiniciar_servidor`, que sobe um processo novo com `--reinicio`). A chave do GitHub (`github_chave`, só leitura) fica em `~/.estudio-zuco.json`, como a da ElevenLabs. |
| `POST /api/salvar-musica?clima=&nome=` | corpo do áudio | `{nome: "clima/arquivo.mp3"}` |
| `POST /api/salvar-ajustes` | `{nome, ajustes}` | grava os ajustes do rosto do convidado em `convidados/<nome>.ajustes.json` (`ajustes` vazio apaga) |
| `POST /api/gerar-sfx` | `{nome, texto, duracao}` | gera um efeito na ElevenLabs Sound Effects e grava em `sons/<nome>.mp3`; devolve `{nome}` |
| `POST /api/gerar-musica` | `{clima}` | gera ~1 min instrumental na Eleven Music e grava em `musicas/<clima>/ia-*.mp3`; devolve `{nome}` |
| `POST /api/salvar-roteiro` | JSON `{nome, roteiro}` | `{caminho}` em `roteiros/` |
| `POST /api/salvar-video?nome=&ext=mp4` | corpo binário | `{caminho}` em `videos/`, sem sobrescrever (`-2`, `-3`…) |
| `POST /api/salvar-convidado?nome=` | corpo `.glb` (precisa começar com `glTF`) | `{caminho, nome}` em `convidados/` |

O `index.html` também funciona aberto direto do arquivo, sem servidor, mas aí fica sem voz neural, sem `.glb` e sem salvar na pasta. Toda chamada à API deve checar `SERVER`/`TTS` e degradar com uma mensagem clara.

## Formato do roteiro (contrato)
```json
{
  "titulo": "Por que os humanos usam óculos?",
  "cenario": "lago",
  "convidado": "oculos",
  "clima": "divertida",
  "ajustes": { "tamanho": 1, "olhosY": 0.02, "bocaCor": "#2a1f25" },
  "vozes": { "mascote": { "voz": "pt-BR-AntonioNeural", "tom": 20, "velocidade": 10 } },
  "falas": [
    { "quem": "mascote", "texto": "...", "camera": "geral", "acao": "pulo" },
    { "quem": "convidado", "texto": "...", "camera": "convidado", "reacao": "arregalar", "cenario": "cozinha" }
  ],
  "final": { "relatorio": "a geladeira é uma prisão", "resposta": "Ou eu só gelo comida." }
}
```
- `final` (opcional no contrato, pedido pelo prompt): textos do **final automático**. As falas do roteiro terminam na virada; o estúdio gera sozinho as falas finais.
- Obrigatórios: `falas[]` com `quem` (`mascote` | `convidado`) e `texto`.
- Opcionais por fala: `camera`, `acao` (quem fala faz), `reacao` (quem escuta faz), `cenario` (troca o lugar só nessa fala) e `duracao` (força os segundos).
- `publicacao` (pedido pelo prompt): `{youtube_titulo, youtube_descricao, tiktok, instagram, hashtags[]}`. Mostrado no painel "Textos para publicar" (`renderPub`, com modelo pelo título se faltar) e salvo num `.txt` ao lado do vídeo exportado (`/api/salvar-textos`). O aviso de uso de IA entra sempre na descrição.
- `clima` (opcional): `divertida`, `animada`, `suspense` ou `calma` (catálogo `CLIMAS`). Sem ele, vale o `clima` do formato. `musica` (opcional) fixa um arquivo; sem ele, a música é **automática** pelo clima. `sorteio` (opcional, número) troca qual faixa do clima é sorteada.
- `ajustes` e `vozes` são opcionais. `ajustes` é preenchido pelo painel de ajustes do convidado.
- Valores desconhecidos de câmera, ação ou cenário **não quebram**: `validate()` avisa e eles são ignorados.
- Compatibilidade: roteiros antigos em `roteiros/` precisam continuar abrindo. Campo novo entra sempre como **opcional**.

## Modo Raio-X (explicações animadas)

**Ideia:** o roteiro (`falas`) e a animação (`animacao`) são JSON, e as duas coisas entram no estúdio colando texto (sem API). O JSON só **chama nomes**; o movimento mora no código de `modulos/raiox.js`. Por isso o JSON fica pequeno (alguns KB).

**Ligação com o resto do estúdio** (poucos ganchos em `index.html`, todos marcados com `Raiox`):
- `poseAt`: se `Raiox.ativo(script)` (o roteiro tem `animacao`), usa a cena `raiox`, chama `Raiox.atualizar(t,…)` (nós, câmera, efeitos) e não usa as câmeras do Zuco.
- `renderView` = `renderMain` + `Raiox.pip(R)`: o Zuco é desenhado por último, num retângulo (scissor) do canto, com câmera própria. Na vista principal o Zuco e o convidado ficam invisíveis.
- `drawCaptions` chama `Raiox.overlay` (moldura "ZUCO" e transições) e usa `Raiox.legendaPos()` (padrão 54%, para não cobrir o Zuco). Legenda continua só em `drawCaptions`.
- `rebuildTimeline` chama `Raiox.timelineMudou()`; `applyScript` chama `Raiox.sincronizarUI()`; `finalLines` não monta o final automático no Raio-X (o roteiro fecha sozinho, a menos que tenha `final`).
- `FORMATOS.explica` (`raiox:true`) faz `buildPrompt` devolver `Raiox.prompt(...)`.
- `exportVideo({de, ate, sufixo})` grava um trecho: é como o cartão grava cada bloco (`videos/<titulo>-bloco-NN.mp4`). O vídeo final é a exportação completa, igual aos blocos juntos.

**Contrato do `animacao`** (tudo opcional; o que for inválido é ignorado e listado em "Avisos" no cartão):
```json
{
  "ambiente":  {"fundo": ["#topo","#meio","#horizonte","#brilho"], "chao": "#c9b48c"},
  "layout":    {"pip": {"x": .035, "y": .60, "w": .36}, "legenda": 54},
  "pecas":     {"nome": {"partes": [{"nome":"casca","forma":"caixa","tam":[1,.7,.3],"pos":[0,0,0],"rot":[0,0,0],"esc":1,"cor":"#a9d6ec","vidro":.3,"brilho":0}], "ancoras": {"saida":[0,-.3,0]}}},
  "elementos": [{"id":"tanque","peca":"nome","pos":[0,1.5,-.5],"rot":[0,0,0],"esc":1,"oculto":false}, {"id":"cano","tipo":"tubo","pontos":[[0,1,0],[0,0,0]],"raio":.05}],
  "blocos":    [{"id":"b1","camera":{...},"transicao":{"tipo":"fade","dur":.3},"acoes":[{"em":0,"dur":1,"alvo":"tanque.boia","faz":"mover","delta":[0,-.4,0]}]}]
}
```
- **Ligação fala ↔ bloco:** `falas[i].bloco = "id"`; sem o campo, vale o bloco de mesma posição. Reordenar falas leva o bloco junto.
- **Mundo:** metros, Y para cima, chão em y=0. Formas: `caixa`(tam), `cilindro`(raio, raio_topo, alt, lados), `esfera`(raio), `cone`, `anel`(raio, espessura), `tubo`(pontos, raio), `liquido`(base `caixa` com tam ou `cilindro` com raio/alt, `nivel` 0 a 1, origem no fundo), `nuvem`(raio). Peça de vidro (`vidro`) ganha contorno (`contorno:false` desliga). Todo elemento tem âncoras automáticas: `topo, base, centro, esq, dir, frente, fundo`, além das que a peça declarar.
- **Nomes e referências:** nós animáveis são `id` (o elemento) e `id.parte`. `ref` = `"id"`, `"id.âncora"`, `"id.parte"` ou `[x,y,z]` (resolvidas todo quadro, então acompanham o que se move).
- **Tempo (`em`):** segundos depois do começo da fala; `"50%"`; `"fim"`; ou `{"palavra": N | "texto", "mais": s}` (a N-ésima palavra, a partir de 0, usando o tempo real da voz). Estados persistem entre blocos (o que mudou continua mudado).
- **Ações (`faz`):** `mostrar`, `esconder`, `mover`(para | delta), `girar`(eixo+graus ou graus [x,y,z]; relativo), `girar_continuo`(eixo, vel graus/s), `escalar`(para), `cor`(para), `nivel`(para, só líquido), `destacar`, `vibrar`, `fluxo`(de, via[], para, qtd, vida, tam, cor, espalhar), `rotulo`(alvo, texto, estilo pilula|titulo|temp, desloc [direita, cima] em fração da altura da tela), `seta`(alvo, dir, tam), `temperatura`(alvo, de, para, unidade). `ease`: suave (padrão), linear, saida, entrada, pulo. Elemento que só aparece por `mostrar` começa escondido (a menos que `oculto:false`).
- **Câmera (por bloco):** orbita um alvo: `alvo`(ref), `dist`, `alt`, `azim` (graus; 0 = de frente), com variantes `_fim` ou `movimento` = `aproximar|afastar|orbitar|subir`; ou absoluta com `pos`/`olha` (+ `_fim`). `fov`. O que faltar herda do bloco anterior; o primeiro bloco herda o enquadramento automático de tudo.
- **Rótulos têm tamanho em tela** (fração da altura do vídeo), não em metros. Não mude isso: o vídeo é vertical e o assunto muda de distância.

**Regras do Raio-X (valem junto das regras gerais abaixo)**
1. **Tudo é função de `t`.** Nada de `Date.now`/`setTimeout`/`T` (relógio) em animação do mundo; partículas são `posição = f(t, índice)` (sem simulação com estado), para o preview, o pulo no tempo e a exportação saírem iguais.
2. **Peça nova ou ação nova** entra só em `modulos/raiox.js` (forma em `geometria`/`criarForma`, verbo em `compilarAcao`) e no `RX.prompt`, para a IA conhecer. Depois, uma linha neste arquivo.
3. **Estética:** paleta curta, cores não estouradas (a luz do Raio-X já é baixa; peças brancas puras estouram), vidro com contorno, rótulos curtos em maiúsculas. O Zuco fica no canto inferior esquerdo, acima da área que TikTok/Reels/Shorts cobrem; assunto no meio e na metade de cima.
4. **JSON nunca quebra o estúdio:** valor desconhecido vira aviso (`avisar`), não exceção.
5. `exemplo-descarga.json` é a referência. Se o contrato mudar, atualize o exemplo e regere `modulos/exemplo-descarga.js`:
   `python3 -c "import json;j=json.load(open('roteiros/exemplo-descarga.json',encoding='utf-8'));open('modulos/exemplo-descarga.js','w',encoding='utf-8').write('/* Gerado a partir de roteiros/exemplo-descarga.json (fonte da verdade). Não edite aqui. */\nwindow.RAIOX_EXEMPLO = '+json.dumps(j,ensure_ascii=False,indent=1)+';\n')"`

**Como testar o Raio-X** (nuvem, sem GPU): suba `python3 servidor.py --sem-navegador` (porta 8766), abra no Playwright/Chromium com `--use-gl=swiftshader --enable-unsafe-swiftshader`, troque `requestAnimationFrame` por uma função vazia (`addInitScript`) e use o gancho `window.__T = {poseAt, renderView, applyScript, frame, exportVideo, playhead (setter), timeline, total, script}`: `__T.applyScript(obj)`, depois `__T.playhead = t; __T.frame(performance.now())` desenha o quadro com a legenda; `Raiox.debug()` mostra nós, blocos, trilhas e avisos. A exportação funciona no Chromium da nuvem (H.264 + Opus), só é lenta sem GPU.


## Vídeos longos em partes e palco fixo (Raio-X)

**Palco fixo.** Todo o vídeo acontece no mesmo cenário (como nos vídeos de "construção" que fazem sucesso): fundo, chão e objeto principal não mudam de lugar; só entram, saem e mudam os elementos. A animação declara `palco` (câmera principal: `alvo`, `dist`, `alt`, `azim`, `fov`) e cada bloco só varia em torno dela: `camera:{"base":true}` volta ao palco, `zoom`/`zoom_fim` (1 = palco) aproxima ou afasta, `azim` pequeno. Sem `palco`, vale o enquadramento automático de tudo.

**Partes.** O cartão "Vídeo por partes" escolhe a duração (30 s, 1, 1:30, 2, 3 min; cerca de 36 s por parte), gera o prompt da parte K e recebe a resposta. `RX.prompt(tema, cat, {parte, total, dur, plano})` monta o prompt; da parte 2 em diante ele inclui `estadoResumo()` (peças, elementos, ids de blocos, últimas falas) e o `plano` guardado em `script.plano`, e manda REAPROVEITAR ids/peças e criar só o que é novo. A parte 1 devolve `ambiente`, `palco`, `plano` e as peças base. As partes 2+ devolvem `{"parte":K,"total":N,"falas":[...],"animacao":{"pecas":{novas},"elementos":[novos],"blocos":[...]}}`; `aplicarParte` junta as falas ao fim do roteiro, mescla a animação por id (ignorando `ambiente`/`palco`/`layout`) e recusa ids de blocos repetidos (prefixo `p<K>b<n>`). Estado do vídeo em `script.partes` ({total, atual, dur}). Elementos novos nas partes 2+ precisam entrar por `mostrar` ou `crescer` (senão aparecem desde o começo).

**Arquivos das partes.** O prompt pede a entrega como arquivo `raiox-<slug>-parte-K-de-N.json`. `lerArquivos`/`processarFila` aceitam vários arquivos em qualquer ordem (número em `parte` no JSON ou no nome), guardam num `pool` e aplicam as partes consecutivas a partir da próxima ainda não aplicada; avisam as que faltam e ignoram repetidas. "Baixar prompt (.txt)" gera o prompt como arquivo.

**Novidades do contrato:** verbo `crescer` (o elemento brota com a base parada; só para elementos que ainda não se mexeram); `animacao.grupos` ({"predio":["sapata","c1",...]}, usável em `alvo`); `ambiente.chao_y` (desce o chão, bom para cortes de terreno); cores claras demais são limitadas em `corSegura` e vidro tem opacidade mínima .22; rótulos ficam dentro da tela e fora da faixa da legenda.

**Referência:** `roteiros/exemplo-predio-parte1.json` e `-parte2.json` (gerados em `modulos/exemplo-predio.js` para o botão "Exemplo: prédio (2 partes)"). Se mudar um deles, regere o `.js` com `json.dumps([parte1, parte2])` em `window.RAIOX_EXEMPLO_PREDIO`.

## Mapa do `index.html` (seções marcadas com `/* ===== NOME =====`)
1. **CATÁLOGO**: `CAMERAS`, `ACOES` (com duração `d` e descrição `t`), `CENARIOS`, `NEURAL_VOICES` e `DEFAULT` (roteiro de exemplo). As listas de opções do editor, os chips e o prompt da IA são gerados daqui.
2. **CENA 3D**: renderer, luzes, helpers (`mesh`, `mat`, `rng`, `glow`, `bench`, `pine`, `blob`), `SEAT = 0.78` (altura do assento, igual em todos os cenários) e `addScene(nome, env, build)` com os cenários `lago`, `cozinha`, `rua` e os genéricos internos `sala`, `escritorio`, `banheiro`, `quarto`, `estudio` (fundo amarelo liso, serve para qualquer tema e para clientes) e `podcast` (ZucoCast: poltronas, neon, luz de GRAVANDO e microfones). Cenário pode ter `g.userData.update(T)`, chamado em `poseAt` a cada quadro: o podcast usa isso para posicionar os microfones conforme o tamanho do convidado e piscar o GRAVANDO. Na câmera `geral`, a parede do fundo só aparece entre x ≈ −1,9 e 2,0: decoração importante vai nessa faixa. Os internos usam `room()` (chão, parede do fundo em z = −3,1 e parede esquerda), `texCanvas()` com `planks()`/`tiles()`, `wallFrame()`, `windowPane()` e `plantPot()`, e todos têm `shots.paisagem` = plano aberto de frente. O `env` tem céu, névoa, luzes e `shots` (câmeras específicas daquele cenário).
3. **personagens**: o `zuco` é construído em código. O `guest` tem `model` (o objeto) e `face` (olhos e boca colados por cima). `BUILTIN` guarda convidados feitos em código (hoje só `oculos`). `loadGuest()` carrega `convidados/<nome>.glb`, normaliza para ~1 unidade de altura e calcula o rosto padrão. Se não existir, mostra uma caixa. `ADJ_SPEC` lista os controles de ajuste e `applyAdjust()` reconstrói o rosto.
4. **câmeras**: `shotFor(nome, fala, progresso, env, T)` devolve `{pos, look, up?}`. Posições fixas: Zuco em x = −0.75, convidado em x = 0.85. **Enquadramento automático**: as câmeras do convidado miram o rosto (`GP()` = centro entre olhos e boca) e a distância vem de `guestCloseDist()` (tamanho do rosto) e `wideDist()` (largura e altura do objeto). As medidas `guest.faceY/faceH/faceW/top/wid/sizeK` são calculadas em `applyAdjust()`. A câmera `abertura` é interna: a 1ª fala com `geral` vira `abertura` (estalo de longe para o plano dos dois de frente). `geral` = os dois de frente, como chamada de programa. `ombro` = quem fala em 3/4, visto do lado de quem escuta. `cima` saiu do catálogo: `CAM_ALIAS` troca `cima` por `ombro` nos roteiros antigos (em `applyScript` e em `poseAt`). Cada câmera devolve `blur` (força do desfoque de fundo, 0 = sem desfoque).
   - **Para onde os personagens olham** (`animChar`): quem escuta vira para quem fala, quem fala divide entre o outro e a câmera, e as pupilas apontam para o outro. Nos planos com os dois (`DUO_SHOTS`: geral, abertura, paisagem, giro, dois) os dois ficam virados um para o outro. `curShot` é preenchido em `poseAt`.
   - **Desfoque de fundo** (`DOF` + `renderView(dof)`): renderiza a cena numa textura, faz uma passada de profundidade (`MeshDepthMaterial`) e um shader desfoca o que está fora do foco (foco = distância da câmera ao ponto que ela olha). O raio é proporcional à altura da imagem, então o preview e o vídeo saem iguais. Liga e desliga em `VIS.dof` (caixa "Fundo desfocado"). Se o WebGL falhar, volta sozinho para o render normal. Toda chamada de render da cena passa por `renderView`, nunca `R.render` direto.
5a. **FINAL AUTOMÁTICO** (dentro de ROTEIRO E LINHA DO TEMPO): `FINAIS` (modos do menu: `relatorio_resposta`, `relatorio`, `obvio`, `nenhum`; o modo fica em `VIS.final`) e `finalLines()`, que gera as falas extras marcadas com `auto:true` e `kind` (`radio`, `conclusao`, `resposta`, `obvio`). A fala `radio` ("Relatório pra nave:") tem `fx:'radio'`: depois de baixada, a voz passa por `radioize()` (filtros, saturação e bipe, renderizado offline e com cache). As falas automáticas usam as câmeras internas `final` (estalo no close do Zuco) e `final2` (close que aproxima devagar), têm `gap` curto e não aparecem em `script.falas` nem no editor de cena (na lista aparecem com ★). O selo "TRANSMITINDO PRA NAVE…" e as linhas de interferência são desenhados em `drawCaptions`. A antena (`zuco.tip`) pisca em `poseAt`. O vídeo termina seco (`total = fim + 0.15 s`), para o Shorts e o Reels voltarem ao começo.
5. **ROTEIRO E LINHA DO TEMPO**: cada item de `timeline` tem `start`, `dur` e `gap` (pausa depois da fala). Use sempre `l.gap`. `cleanText()` limpa pontuação dobrada antes da voz e da legenda. `rebuildTimeline()` calcula `start` e `dur` de cada fala (áudio real + 0,02 s, ou estimativa pelo texto) com a pausa de `pausaDepois()` entre falas. Também tem `lineAt(t)`, `applyScript()` e `validate()`.
6. **EDITOR DA CENA SELECIONADA**: `selIdx`, `selectScene()`, `editScene(campo, valor)` (altera `script.falas[selIdx]`, refaz a linha do tempo e regenera só a voz alterada) e `playScene()`.
7a. **RITMO, EFEITOS E MÚSICA** (dentro de ÁUDIO):
   - `trimSilence()` corta o silêncio do começo e do fim de cada voz (o TTS vem com sobra). **Ritmo humano:** `falaTipo()` classifica cada fala (`piada` = tem `selo`, som forte ou ação de choque; `reacao` = até 3 palavras; `longa` = 10 palavras ou mais; `normal`). `pausaDepois()` calcula a pausa depois de cada fala: troca de turno ≈ 0,26 s, mesma pessoa 0,38 s, depois de pergunta 0,42 s, antes da piada 0,6 s, depois da piada 0,55 s, antes de reação no máximo 0,22 s. `velContexto()` ajusta a velocidade pedida ao TTS (reação +6%, longa −4%, piada −8%). `RITMOS` (Natural, Calmo, Ágil, em `VIS.ritmo`) multiplica as pausas e soma na velocidade. A velocidade vai sempre para o gerador de voz; o áudio nunca é esticado (isso mudaria a voz). Fala com `corta: true` entra por cima da anterior (`OVERLAP`, gap negativo). `#durInfo` mostra se o vídeo passou de 1 minuto. `liveSrcs` permite duas vozes ao mesmo tempo na interrupção.
   - `SONS` (catálogo de 14 efeitos, cada um com papel claro, pedido `p` em inglês e duração `d`). Com a chave da ElevenLabs, `autoGenerateSfx()` gera uma vez cada efeito que falta (`/api/gerar-sfx`) e guarda em `sons/<nome>.mp3` (fora do GitHub); `loadSfxFile()` corta o silêncio do começo e iguala o volume. Sem chave, os 8 marcados `synth:true` tocam na versão sintetizada de `buildSfx()`, e os outros ficam mudos. No card Música e efeitos dá para ouvir e refazer cada um. `buildSfxEvents()` monta a lista do episódio: campo `som` da fala, ou automático por ação (`AUTO_SFX_ACAO`) e por câmera dramática (`AUTO_SFX_CAM`), e `tum` no `selo`. A mesma lista toca no preview (`frame`) e entra no `mixAudio`.
   - Música: arquivos em `musicas/<clima>/`. `musicMode()` = `script.musica` ou `VIS.musica` (`'auto'` é o padrão). No modo automático, `currentMusic()` sorteia uma faixa da pasta de `currentClima()` usando o título (+ `script.sorteio`) como semente, então o preview e o vídeo tocam a mesma faixa. Toca em loop com volume `VIS.musVol` e abaixa para 35% sob as falas (`speakingAt`), igual no preview e na exportação.
   - Câmera: falas com mais de 2,6 s ganham um **corte no meio** para outro ângulo (em `poseAt`, exceto câmeras com movimento próprio).
7. **ÁUDIO**: modos de voz em `voiceMode()`: `eleven` (ElevenLabs), `neural` (edge-tts grátis), `navegador` e `mudo`. `realVoice()` = a voz entra no vídeo; `ttsReady()` = dá para gerar agora. `voiceParams()` monta os parâmetros de cada provedor (na ElevenLabs a "expressividade" vira `estabilidade`/`estilo`). Voz (`prepareVoices()` → `/api/tts` → `bufCache`), `envelopeOf()`/`levelAt()` (volume a 60 Hz que move a boca) e a voz do navegador (`speechSynthesis`, só no preview).
8. **ANIMAÇÃO**: `actionFx()` (uma `case` por ação), `animChar()`, `setScene()` e **`poseAt(t, T, dt, opts)`**, que monta a cena inteira para o instante `t` e devolve o estado da legenda `{l, s, t, started}`. O **gancho automático** (`VIS.gancho`) também vive aqui: na 1ª fala, a câmera `geral` vira `gancho` e entra `acao: 'pulo'` se não houver ação.
8a. **EXPRESSÕES DE OLHOS**: `makeEye(r, corDaPalpebra)` cria olho + pupila + pálpebra (meia esfera que gira de trás para cima do olho) + sobrancelha, e guarda as peças em `e.userData`. As expressões (`arregalar`, `curioso`, `duvida`, `espanto`, `malandro`, `piscadela`, `revirar`, `vesgo`) são ações comuns do catálogo `ACOES`: em `actionFx()` elas preenchem `fx.E` com `lid, browUpL, browUpR, browIn, px, py, ps, winkL, winkR, cross, mouthRot` (já multiplicados pelo peso `h` de entrada e saída). `animChar()` soma tudo em `X` (partindo de `NEUTRAL_EYES`) e `applyEyes()` aplica. Expressão nova = um `case` em `actionFx` usando `E({...})`, mais a linha no catálogo.
8b. **LEGENDAS**: `drawCaptions(ctx, W, H, estado, preview)` é o **único** desenhista de legenda e título, usado no preview (canvas `#cap` por cima do 3D) e na exportação (`composite`). `wordsOf(fala)` dá o tempo de cada palavra: vem do header `X-Palavras` da voz neural (WordBoundary do edge-tts) ou é estimado pelo tamanho das palavras. `groupsOf()` monta as "páginas". Os estilos são `destaque`, `palavra`, `caixa`, `classica` e `nenhuma`. As configurações ficam em `VIS` (estilo, cor, posição em % da altura, tamanho, título, gancho, área segura) e são salvas no navegador (`localStorage` `zuco.visual`), valendo para todos os episódios. A área segura (desenhada só no preview) marca onde os apps cobrem o vídeo.
9. **CÂMERA LIVRE**: `OrbitControls`, `setFree()` e `focusOn()`. Só no preview.
10. **LOOP DO PREVIEW**: `frame()` avança o `playhead`, dispara o áudio por fala e chama `poseAt`.
11. **EXPORTAÇÃO**: `exportVideo()` renderiza **quadro a quadro** (30 fps) com `t = i/30`, desenha a legenda no canvas 2D (`composite`), codifica com WebCodecs (H.264, com VP9 de reserva) e mistura o áudio com `OfflineAudioContext` (AAC, com Opus de reserva). O `mp4-muxer` junta tudo e o resultado vai para `/api/salvar-video`.
12. **PROMPT DA IA**: `FORMATOS` (moldes de roteiro: `obvio` humor, `serio` explicação verdadeira, `mito` mito ou verdade, `curiosidade` fato rápido) e `buildPrompt(tema, formato)`, que junta o molde com o CATÁLOGO. Cada formato define `intro`, `personagens`, `estrutura`, `final`, `acoes`, `camMin`, `verificar` (pede a lista de afirmações para conferir) e `selo` (permite o campo `selo` numa fala, desenhado como carimbo em `drawCaptions`). O roteiro guarda `formato` e, nos formatos sérios, `verificar: [..]`, mostrado no painel "Conferir antes de publicar" (`renderVerif`). Formato novo = mais uma entrada em `FORMATOS`.
13. **INTERFACE**: `initUI()` (todos os eventos), `renderAdjUI()`, `updateVoiceUI()`, `updateStatus()` e `boot()`. ElevenLabs: `EL_VOICES` (lista em cache no navegador), `fillElevenSelects()`, `loadElevenVoices()`, `ensureElevenVoices()`, `saveElevenKey()`. Padrões: `VIS_FABRICA` (fábrica), `PREF_KEYS`, `getPrefs()`, `applyPrefs()`. Painéis secundários são `<details class="card fold" data-fold="...">` (o estado aberto/fechado fica salvo) com um resumo em `.hint` atualizado por `updateHints()`.
13a. **Configurações** (`#cfgDlg`, um `<dialog>` aberto pelo botão ⚙ do topo): chave do GitHub e atualização, chave da ElevenLabs e padrões. Tudo que se faz uma vez por computador vai para lá, nunca para o painel principal. Convidados embutidos em código (`BUILTIN`): `oculos`, `cadeado`, `colher`.
14. **Princípio da interface: não virar um Photoshop.** Na tela aberta ficam só Cena, Falas, Roteiro, Gerar roteiro e Cenário/convidado. Todo controle novo vai para um painel recolhido já existente; painel novo só com pedido do Marcelo. Opção nova precisa de um padrão razoável, para funcionar sem mexer.

## Regras que não podem ser quebradas
1. **Animação é função do tempo.** Tudo que aparece na tela depende de `t` (posição no roteiro) e `T` (relógio de efeitos), via `poseAt`. Nada de `setTimeout`/`setInterval`/`Date.now()` para animar personagem ou câmera. Suavizações usam `dt` (`1 - Math.pow(1-k, dt*60)`). É isso que garante que o preview e o vídeo exportado fiquem idênticos.
2. **A exportação nunca é em tempo real.** Não voltar para `MediaRecorder`/`captureStream`: foi a causa do vídeo desincronizado.
3. **A boca segue o envelope do áudio** (`levelAt`) tanto no preview quanto na exportação. A voz do navegador não entra no arquivo; isso é limitação do navegador, não bug.
4. **O catálogo é a fonte única.** Câmera, ação ou cenário novo entra só no CATÁLOGO e na implementação correspondente. Não escrever listas à mão no HTML nem no prompt.
5. **Não alterar a lógica nem a estrutura do prompt** em `buildPrompt()` sem pedido explícito. Ajustes de tom e estilo do roteiro são decisão do Marcelo.
6. **Personagens originais.** O Zuco e os convidados são criações próprias do canal. Não usar personagens, logos ou marcas de terceiros nos modelos nem nos cenários.
7. **Sem etapa de build.** O `index.html` é autocontido; o motor Raio-X é o único módulo separado (`modulos/raiox.js`, carregado por `<script>`). Bibliotecas novas vão para `lib/` (versão fixa, build UMD/global) e nunca por CDN.
8. **Textos da interface em português do Brasil**, curtos e diretos. Mensagens de erro dizem o que fazer.
9. **Compatibilidade com Windows**: caminhos com `os.path`, `.bat` com CRLF, servidor só em `127.0.0.1`.
10. **Legenda só em `drawCaptions`.** Nunca desenhar legenda em DOM ou noutro lugar: o preview e o vídeo precisam sair idênticos. A posição padrão (68%) fica fora da área que TikTok, Reels e Shorts cobrem (os 20% de baixo e a coluna de botões à direita).
11. **Nada de enquadramento com número fixo para o convidado.** Câmera nova que mostre o convidado deve usar `GP()`, `guestCloseDist()` ou `wideDist()`, para funcionar com objetos de qualquer tamanho.

## Como fazer as mudanças mais comuns
**Nova ação** (ex.: `dancar`)
1. Em `ACOES`: `dancar: {d: 1.5, t: "descrição curta para a IA"}`.
2. Em `actionFx()`: `case 'dancar': ...`, usando `p` (0→1 ao longo de `d`), `e = env1(p)` e `T`. Mexa só nos campos de `fx` (`dy, dz, sx, sy, sz, rx, rz, yawAdd, yawAbs+w, eye`).
3. Pronto: ela aparece nos menus, nos chips e no prompt.

**Nova câmera** (ex.: `ombro`)
1. Em `CAMERAS`: `ombro: "descrição"`.
2. Em `shotFor()`: `case 'ombro': return {pos: V(...), look: V(...)};`. Se precisar de movimento, use `p` (progresso da fala) e `T`.
3. Se a câmera fizer o próprio movimento, inclua o nome na lista `['giro','zoom','susto']` dentro de `poseAt`, para não somar a aproximação automática.

**Novo cenário** (ex.: `escritorio`)
1. Em `CENARIOS`: `escritorio: "descrição"`.
2. `addScene('escritorio', {sky:[topo, meio, horizonte, brilho], bg, fog:[perto, longe], hemi:[céu, chão, intensidade], sun:[cor, intensidade], shots:{paisagem:{pos:[…], look:[…]}}}, g => { ... })`.
3. Regras: os personagens ficam em x = −0.75 e 0.85, z ≈ 0, sentados na altura `SEAT` (0.78). O cenário precisa ter um assento nessa altura (use `bench(g,0,0)` ou uma mesa). Use só `mesh()`/`mat()` com flat shading, no estilo low poly.
4. **Siga o "Padrão visual dos cenários" (seção abaixo).** Cenário fora do padrão não entra.

## Padrão visual dos cenários (obrigatório para todo cenário, novo ou antigo)
Baseado no que funciona em jogos indie low poly: poucas cores, céu em degradê, luz quente com sombra fria. Todo cenário novo tem que seguir isto; os 12 atuais já seguem.

1. **Céu em 3 cores + brilho.** Todo cenário declara `sky:['#topo','#meio','#horizonte','#brilho']`. A cúpula `SKY` faz o degradê e uma faixa de brilho no horizonte. O topo é a cor mais escura/saturada, o horizonte a mais clara. Em interior, o horizonte é a cor da parede e o topo um tom mais escuro dela.
2. **Neblina = horizonte.** O `setScene()` pinta a neblina e o fundo com a cor do horizonte. Não declare outra cor de neblina; `bg` fica só como reserva.
3. **Luz quente, sombra fria.** `sun` sempre quente (creme, pêssego, âmbar). O `setScene()` puxa o chão da luz `hemi` para azul-acinzentado (#5b6a8c, 35%) e o sol 20% para âmbar: não desfaça isso no cenário.
4. **Paleta curta.** 4 a 6 matizes por cenário, variando claro/escuro do mesmo tom. Nada de neon nem cor 100% saturada; prefira tons "empoeirados".
5. **Contraste com o Zuco.** O Zuco é verde-menta (#79c3ab). Atrás dele (x de −2.5 a 0, altura 0.5 a 2.5) não pode ter verde nem verde-água; use tons quentes, lilás ou neutros. O convidado também precisa se destacar do fundo.
6. **Luz de recorte.** Existe uma luz fria por trás (`rim`) para separar os personagens do fundo. Não apague nem mude por cenário.
7. **Acabamento.** O passo final (`DOF`) aplica contraste 1.05, saturação 1.08 e vinheta 0.18 quando `VIS.grade` está ligado (padrão de fábrica). Não aumente esses números: o objetivo é discreto.
8. **Enquadramento.** O vídeo é vertical e estreito: decoração importante fica entre x ≈ −2.5 e 2.5 e pode (deve) subir até y ≈ 4,5. Coisas altas e coloridas no fundo (letreiro, janela, prateleira, coqueiro) é o que faz o cenário ser reconhecido de longe.
9. **Teste.** Antes de subir, tire a prévia dos cenários (plano geral) e compare com os outros: mesmo nível de luz, nenhum cenário "estourado" ou "lavado".
10. **Cenário vivo, não "em cima de uma mesa".** Cada cenário precisa de: um elemento-símbolo que se reconhece de longe (o sol no mar, a janela da nave, o letreiro, a TV), camadas de profundidade (algo perto, os dois, algo no meio, o fundo) e 3 a 5 detalhes coloridos pequenos. Use `inst()`/`instByColor()` para muitas peças iguais (produtos, flores, botões), `sign()` para letreiros, `stripesTex()` para toldos e guarda-sóis, `flowers()`, `palm()` e `colorTree()`. Partes que se mexem vão em `g.userData.update(T)`; peças altas no centro (luminárias) vão em `g.userData.hideFromTop` para sumirem na câmera `grua`.

**Novo convidado em código** (sem .glb)
1. Função `buildX()` que retorna um `THREE.Group` com ~1 unidade de altura, centralizado na origem.
2. Em `BUILTIN`: `x: {build: buildX, h: altura, face: {...mesmos campos do oculos}}`.

**Novo controle de ajuste do convidado**
Adicione uma linha em `ADJ_SPEC` e use o valor em `applyAdjust()`. O padrão vem de `guestDefaults`.

**Música gerada (Eleven Music)**
Com a chave da ElevenLabs, ao clicar em "Aplicar roteiro" o estúdio cria uma música nova em segundo plano se o clima tiver menos de `MUS_META` (8) faixas, e fixa essa faixa no roteiro (`musica`). Com a pasta cheia, só sorteia. Os estilos por clima ficam em `ESTILOS_MUSICA` no `servidor.py`. O botão "Exemplo" não gera música, para não gastar créditos. A chave precisa da permissão Music.

**Novo clima de música**
Em `CLIMAS` (index.html) e na tupla `CLIMAS` do `servidor.py` (cria a pasta).

**Nova voz neural**
Adicione `["nome-da-voz-edge", "Rótulo"]` em `NEURAL_VOICES`. A lista de vozes do `edge-tts` sai com `edge-tts --list-voices`.

## Como testar depois de mudar
1. Rode `Abrir estudio.bat`. O status no topo deve mostrar "servidor ligado · voz neural pronta".
2. Clique em **Exemplo** → **Reproduzir**: as 12 falas devem tocar com voz, boca e câmeras.
3. Clique numa fala, troque a câmera e a ação nos menus: a cena deve tocar sozinha e o JSON deve se atualizar.
4. Ligue a **Câmera livre** e mexa num ajuste do convidado: a mudança aparece na hora.
5. **Exportar vídeo** com um roteiro curto: o MP4 em `videos/` deve ter a mesma duração no vídeo e no áudio, com a boca abrindo junto com a voz.
6. Abra o console do navegador (F12): não pode haver erro vermelho.

## Histórico de decisões
- A gravação em tempo real (MediaRecorder) desincronizava em computador lento. Foi trocada por exportação quadro a quadro com WebCodecs.
- A voz do Windows (speechSynthesis) não pode ser gravada pelo navegador. Ficou só para o preview, e o vídeo usa voz neural via `edge-tts`.
- As bibliotecas ficam em `lib/` para o estúdio funcionar sem depender de CDN.
- ElevenLabs entrou como provedor principal de voz (retenção). A chave fica fora do OneDrive. O edge-tts continua como opção grátis e de reserva.
- Câmeras refeitas: personagens se olham, abertura com os dois de frente, desfoque de fundo; `cima` saiu (alias para `ombro`). A versão anterior ficou em `versoes/estavel-2026-10-16/`.
- O ritmo fixo (+10% de velocidade e 0,06 s entre falas) ficou corrido demais e difícil de entender. Foi trocado pelo ritmo humano por tipo de fala, e o formato Óbvio passou a pedir 20 a 24 falas com segundo ato, para o vídeo passar de 1 minuto.
- O painel ficou recolhível e ganhou "Definir como meu padrão" / "Restaurar padrão de fábrica": o canal é o laboratório, e o padrão que funcionar vira o oficial.
- Paleta refeita (pesquisa de jogos indie low poly): céu em degradê de 3 cores com brilho no horizonte, neblina na cor do horizonte, luz quente com sombra fria, luz de recorte e acabamento de cor com vinheta. A bancada da cozinha saiu do verde-água porque apagava o Zuco.
- Música automática: em vez de pedir arquivo, o estúdio gera faixas com a Eleven Music (uso comercial liberado) até ter 8 por clima e depois só reaproveita, para gastar pouco crédito.
- Efeitos sonoros sintetizados ficaram fracos. Passaram a ser gerados uma vez pela ElevenLabs Sound Effects, com catálogo de 14 efeitos clássicos de vídeo curto de humor (inclui drama, tss, trombone, disco, risada e uau). A síntese fica só como reserva sem chave.
- Volume das vozes separado: `computeVoiceGains()` iguala a força média do Zuco e do convidado (opção "Igualar", ligada de fábrica) e depois aplica os controles Volume do Zuco / Volume do convidado (`VIS.volZuco`, `VIS.volConv`). `lineGain()` limita pelo pico de cada fala para não estourar; vale no preview e na exportação.
- Finais: o prompt passou a mudar conforme o final escolhido (`finalPrompt()`). Novo final padrão `meudeus`: o convidado diz a revelação final (`final.revelacao`, escrita pela IA) e o Zuco reage com o bordão fixo "Meu Deus… isso não é possível." (câmera susto, som drama). O antigo "sem final" virou "Final no roteiro": a IA fecha a piada com um remate na última fala.
- Convidado: o .glb enviado mantém sempre o nome do arquivo (antes copiava com o nome do roteiro e duplicava). Se o roteiro pede um objeto sem modelo (ex.: "cebola"), `applyScript` continua com o último convidado carregado (`ultimoConvidado`) em vez de mostrar a caixa.
- Respiro no começo: a 1ª fala começa em `INICIO` (0,5 s), porque a primeira palavra se perdia no início do vídeo. Antes disso ninguém fala, sem legenda, e a pose fica no começo da ação.
- Ajustes do rosto (olhos, boca, tamanho…) passaram a pertencer ao MODELO: ficam em `convidados/<nome>.ajustes.json` (`/api/salvar-ajustes`, lidos no `/api/status`) e no navegador como reserva. Trocar de roteiro ou de prompt não reseta mais o convidado. `script.ajustes` continua no roteiro só como cópia.
- Cenários: o prompt passou a deixar o cenário LIVRE por padrão (escolhido no painel; `VIS.cenModo` = 'livre' | 'auto'). No livre, o prompt não fala de cenário e o "Aplicar roteiro" usa o cenário do painel (`store 'cenario'`).
- 3 cenários novos (praia, nave, mercado) e os 9 antigos ganharam elementos-símbolo, cor e profundidade, porque os vídeos estavam todos com cara de "em cima de uma mesa".
- 5 câmeras de cinema que mostram o cenário: `distante` (ambientação de longe e do alto), `orbita` (arco pelo cenário até quem fala), `revela` (começa num detalhe do fundo e vira até quem fala), `grua` (desce do alto) e `travelling` (desliza de lado). O prompt pede 2 a 4 delas por vídeo. Todas ficam em `SEM_CORTE`.
- Formato novo `zoeira`: o convidado faz a pergunta óbvia e o Zuco responde com deboche; os dois tiram onda um do outro com respostas absurdas. O prompt tem regras de tom (deboche de amigo, sem palavrão e sem piada sobre aparência, origem ou grupos).
- Formato novo `real` (Curiosidade real com humor): os testes mostraram que o que mais funciona é conteúdo que faz sentido. O convidado pergunta, o Zuco faz uma piadinha e explica de verdade, em 3 camadas, com fato surpreendente no meio e teste caseiro no fim. Tem regras de precisão e a lista "verificar".
- 6 emoções fortes em `ACOES` (raiva, triste, chorar, pena, nojo, rir), para o Zuco e qualquer convidado. Usam os mesmos olhos; `chorar` liga a lágrima de `makeEye` (escorre em loop), `rir` fecha os olhos (`squint`) e abre a boca (`fx.mouth`).
- Formato `curto` (Óbvio Curto, 30 a 40 s): os dados do vidIQ mostraram que os Shorts de 25 a 40 s seguram 65–85% do público e os de 1 min+ só 23–57%. 10 a 12 falas de até 10 palavras (máx. 80 palavras), gancho em um de 3 tipos registrado no campo `gancho` (pergunta, absurdo, briga) para comparar resultados. Formatos podem ter `dur` (alvo do medidor de duração), `mov` (quantos movimentos de câmera pedir) e `ganchoTipo`.
- Convidado gira nos 3 eixos: `giro` (Y), `giroX` e `giroZ` (tombar, -180 a 180). Ordem 'YXZ': primeiro tomba para levantar objetos que vêm deitados, depois vira. `applyAdjust` recalcula altura/largura pela caixa girada (`guestBox`, medida antes do objeto entrar na cena) e recentra, para ele continuar sentado no banco.
- Formato `tolerancia` (Tolerância Zero, 30 a 40 s): convidado educado pergunta o óbvio, o Zuco (sempre o impaciente) responde com alternativas absurdas e interjeições fixas (lista no próprio formato), segura a resposta óbvia até a última fala e o convidado vira o jogo com uma "charada" (contradição, teste ou "o óbvio não vale pra mim"). Formatos podem ter `revelacao` e `remate` próprios, usados pelos finais "Meu Deus" e "Final no roteiro".
- **Zuco do cantinho sem fundo (03/11/2026):** o desenho do Zuco usa `autoClear=false` + `clearDepth()` e fundo nulo, então ele aparece solto por cima do mundo (sem quadrado roxo, moldura ou tag). Motivo: o quadrado atrapalhava a leitura da animação.
- **Estúdio Raio-X criado a partir do Estúdio do Zuco (03/11/2026).** Motivo: explicar coisas com movimento e informação na tela (estilo "desmontando o mundo"), com o Zuco falando no canto. Decisões: projeto separado (porta 8766, repositório próprio) para não mexer no experimento do Zuco; a animação é JSON colado (sem API por enquanto) e o JSON só chama nomes, o movimento mora em `modulos/raiox.js`; objetos são **peças em JSON feitas de formas simples**, para a IA criar sem código; tempo por palavra da voz para sincronizar; rótulos em tamanho de tela; gravação por bloco para auditar, com o vídeo final igual aos blocos juntos.

## Biblioteca de objetos 3D (modulos/biblioteca/)

- `base.js` define `window.RAIOX_LIB` (texturas procedurais, helpers, `registrar`, `construir`, `reset`, `catalogoCompacto`, utilitários `LIB.U`). Cada `loteN.js` registra 10 objetos (hoje 9 lotes = 90 objetos).
- Contrato de um objeto: `RAIOX_LIB.registrar({id, nome, lote, categoria, descricao, params:{nome:{padrao, opcoes?, desc}}, criar(P,H) -> {obj, ancoras, dim}, animacoes:{nome:{desc, dur, loop?, aplicar(partes, t, args, grupo)}}})`.
  - Base em y=0, centrado em x=0,z=0, medidas em metros. Peças animáveis = Object3D com `userData.parte` (use `nome:` nas primitivas).
  - Animações são FUNÇÕES PURAS do tempo `t`, sempre relativas à pose de repouso (`LIB.U.RP/gx/gy/gz/pos/tinge/brilha/treme`). Nunca guarde estado; o motor chama `LIB.reset(partes)` a cada quadro antes de aplicar.
  - Materiais: `mat(cor, {tex:'madeira|tijolo|bloco|concreto|telha|grama|terra|pedra|agua|metal|tecido|piso|liso', m, vidro, brilho, rough, metal})`. Materiais usados com `brilha` devem ter `userData.e` (o `mat` já cria). Texturas de canvas próprias precisam de `t.userData = {m:1}`.
- Página de validação: `biblioteca.html` (miniaturas, visualizador 3D, parâmetros, animações, Aprovar/Ajustar/Rejeitar + comentário). Salva em `biblioteca/validacao.json` via `/api/biblioteca/validacao` (fora do git); botão "Baixar anotações" é o plano B. Para ler os comentários, abra esse arquivo.
- No motor (`modulos/raiox.js`): elemento `{"id","lib":"casa_corte","params":{},"pos":[...]}`; cada parte vira nó `id.parte` (serve para cor, destacar, rotulo, etc.); verbo novo `{"faz":"anim","alvo":"id","nome":"<animação>","em":..,"dur":..,"args":{}}` (animações com loop duram até `dur` ou até o fim do vídeo; as demais seguram a pose final). O prompt lista a biblioteca inteira (`RAIOX_LIB.catalogoCompacto()`); para criar objeto novo basta registrar no próximo `loteN.js`, incluir o script em `biblioteca.html` e `index.html` e ele entra sozinho na página e no prompt.
- Exemplo completo usando só a biblioteca: `roteiros/exemplo-furacao.json` (botão "Exemplo: furacão" no estúdio).
- Modo Raio-X da tela: esconde o que é só do Zuco (convidado, cenários, formatos, final); o apresentador no canto é opcional (checkbox, guardado em `localStorage` `rx-pip`).
