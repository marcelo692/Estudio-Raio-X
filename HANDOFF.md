# Handoff — Estúdio Raio-X

Criado em 03/11/2026 a partir do Estúdio do Zuco. Leia junto com o **AGENTS.md** (regras técnicas e o contrato do JSON de animação). Este arquivo diz onde o projeto está e o que vem a seguir.

## 1. O que é
Estúdio local (navegador + `servidor.py`, porta **8766**) que transforma um roteiro em JSON em um Short vertical com uma **explicação animada em 3D**: o Zuco fala no cantinho (com o lip sync de sempre) e um mundo 3D low poly mostra por dentro como a coisa funciona. É do canal **Por Dentro do Óbvio**. O Estúdio do Zuco original continua separado (`marcelo692/estudio-do-zuco`) e o experimento dele não deve ser mexido.

## 2. Como se trabalha
- **O GitHub é a fonte da verdade:** `marcelo692/Estudio-Raio-X`, ramo `main`. O PC do Marcelo recebe pelo botão **⚙ Configurações → Verificar → Atualizar agora**. A chave de leitura do GitHub (em `~/.estudio-zuco.json`, compartilhada com o Zuco) precisa ter acesso a **este** repositório também.
- Quando o `servidor.py` mudar, peça para fechar a janela preta e abrir de novo.
- Chaves (GitHub, ElevenLabs) só no PC, nunca no repositório. Nunca peça nem digite chave pelo Marcelo.
- Commits em português, explicando o porquê, direto na `main`. Atualize o AGENTS.md quando mudar contrato ou regra.
- Um agente por vez (Claude no app, Claude Code, Codex): termine e suba antes de trocar.
- Fluxo de um vídeo: tema → roteiro e **lista de componentes** (o Marcelo aprova) → peças e animação em JSON → imagens paradas para aprovar → gravar blocos para conferir → exportar o vídeo completo.

## 3. O que já funciona (testado na nuvem com Chromium sem GPU)
- Modo Raio-X: peças em JSON (formas simples, vidro com contorno, líquido com nível, nuvem, tubo), elementos com âncoras, ações no tempo (mostrar, mover, girar, nível, destacar, fluxo de partículas, rótulo, seta, temperatura), câmera por bloco, transições (fade e flash).
- Sincronia por palavra: `"em": {"palavra": N}` usa o tempo real da voz.
- Zuco no cantinho com lip sync, legenda palavra por palavra e moldura.
- Cartão **Animação (Raio-X)**: JSON editável, **Aplicar** e **Mesclar por id** (para pedir alterações pontuais à IA), lista de blocos com arrastar, subir/descer, ▶ ver, −/+ duração, ✕ apagar e ⏺ gravar bloco.
- Exportação por trecho (`exportVideo({de, ate, sufixo})`) e dos blocos em `videos/<titulo>-bloco-NN.mp4`.
- Formato **Raio-X** no gerador de prompt (`Raiox.prompt`), com todo o vocabulário.
- Exemplo pronto: `roteiros/exemplo-descarga.json` (5 blocos, ~26 s), que abre por padrão.
- Tudo do Estúdio do Zuco (vozes ElevenLabs, música, efeitos, postagens, atualização, formatos antigos) continua funcionando.

## 4. Ainda não feito / próximos passos (em ordem)
1. **Testar no PC do Marcelo** com a voz da ElevenLabs (na nuvem a voz não roda): conferir a sincronia por palavra e o visual com GPU. Ajustar cores e luz do exemplo conforme o gosto dele.
2. **Primeiro vídeo de verdade** (tema a escolher), seguindo o fluxo da seção 2. Cada tema novo exige peças novas; o que se repetir vira biblioteca.
3. **Biblioteca de peças reutilizáveis** (`modulos/pecas/*.json` ou similar): tubo com válvula, engrenagem, mola, termômetro, ventilador, copo, etc., para a IA e o Marcelo reaproveitarem.
4. **Editor de linha do tempo mais completo** (estilo CapCut): hoje há reordenar, esticar e gravar bloco; faltam cortar um bloco ao meio, mais transições (deslizar) e uma régua visual com os blocos em largura proporcional.
5. **Botão "Criar peça com IA"** (Claude Haiku 5.5 via API): a IA devolve **JSON de peça** (não código), validado antes de entrar.
6. Edições visuais: apontar um ponto na tela e dizer "muda aqui" (hoje a alteração é por id de bloco/elemento).
7. Voz do Zuco gerada automaticamente em outras línguas (ver o HANDOFF do Zuco).

## 5. Pegadinhas
- **"Rota desconhecida"** = página nova com servidor antigo: fechar a janela preta e abrir de novo.
- Mudar texto, voz ou ritmo gera as falas de novo na ElevenLabs (gasta crédito); mudar câmera, ação do mundo ou cores não gasta.
- O Zuco original e o Raio-X compartilham `~/.estudio-zuco.json` (mesma chave da ElevenLabs), mas têm `padrao.json`, `cache_voz/` e `localStorage` separados (porta diferente).
- Na nuvem, a exportação é lenta (sem GPU): no PC com placa de vídeo é bem mais rápida.
- Rótulos e setas ficam por cima do mundo (sem teste de profundidade); posicione com `desloc` para não cobrir o assunto.
