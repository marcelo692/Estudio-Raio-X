"""Servidor local do Estúdio Raio-X.

Abre o estúdio no navegador e oferece:
  /api/status          -> se a voz neural está disponível e quais convidados .glb existem
  /api/tts             -> gera a fala com voz neural gratuita (edge-tts), com cache em cache_voz/
  /api/salvar-roteiro  -> salva o roteiro em roteiros/
  /api/salvar-video    -> salva o vídeo gravado em videos/
  /api/config          -> guarda a chave da ElevenLabs (fica só neste computador, fora da pasta do OneDrive)
  /api/eleven/vozes    -> lista as suas vozes e as vozes brasileiras da biblioteca da ElevenLabs
  /api/eleven/adicionar-> adiciona uma voz da biblioteca à sua conta
  /api/atualizacao     -> compara a versão desta pasta com a do GitHub
  /api/atualizar       -> baixa a versão nova do GitHub, guarda cópia do que mudou e reinicia
"""
import asyncio
import base64
import hashlib
import io
import json
import os
import random
import re
import shutil
import subprocess
import sys
import time
import zipfile
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORTA = 8766
PASTA = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(PASTA, "cache_voz")
ROTEIROS = os.path.join(PASTA, "roteiros")
VIDEOS = os.path.join(PASTA, "videos")
CONVIDADOS = os.path.join(PASTA, "convidados")
MUSICAS = os.path.join(PASTA, "musicas")
SONS = os.path.join(PASTA, "sons")  # efeitos sonoros gerados pela ElevenLabs (um .mp3 por efeito)
CLIMAS = ("divertida", "animada", "suspense", "calma")
for p in (CACHE, ROTEIROS, VIDEOS, CONVIDADOS, MUSICAS, SONS) + tuple(os.path.join(MUSICAS, c) for c in CLIMAS):
    os.makedirs(p, exist_ok=True)
EXT_MUSICA = (".mp3", ".m4a", ".ogg", ".wav")

# A chave da ElevenLabs fica na pasta do usuário do Windows, fora do OneDrive e fora do GitHub.
CONFIG = os.path.join(os.path.expanduser("~"), ".estudio-zuco.json")


def ler_config():
    try:
        with open(CONFIG, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def gravar_config(cfg):
    with open(CONFIG, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def eleven(caminho, metodo="GET", corpo=None, chave=None):
    """Chamada à API da ElevenLabs só com a biblioteca padrão do Python."""
    chave = chave or ler_config().get("eleven_chave")
    if not chave:
        raise RuntimeError("chave da ElevenLabs não configurada")
    dados = json.dumps(corpo).encode("utf-8") if corpo is not None else None
    # o plano limita quantas falas são geradas ao mesmo tempo: uma fila local evita o erro 429,
    # e se ele vier mesmo assim, espera e tenta de novo
    for tentativa in range(6):
        req = urllib.request.Request("https://api.elevenlabs.io" + caminho, data=dados, method=metodo,
                                     headers={"xi-api-key": chave, "Content-Type": "application/json", "Accept": "application/json"})
        try:
            with FILA_ELEVEN:
                with urllib.request.urlopen(req, timeout=90) as r:
                    return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429 and tentativa < 5:
                e.read()
                time.sleep(1.5 * (tentativa + 1))
                continue
            erro_eleven(e)


FILA_ELEVEN = threading.Semaphore(2)

# Música gerada pela Eleven Music (uso comercial liberado). Cada clima tem alguns estilos
# e o estúdio sorteia um, para as faixas guardadas não ficarem todas iguais.
ESTILOS_MUSICA = {
    "divertida": [
        "playful quirky cartoon comedy underscore, pizzicato strings, bassoon, light percussion, bouncy",
        "cheerful ukulele and whistling, hand claps, light comedic groove",
        "goofy marimba and tuba, mischievous sneaky comedy, light and silly",
        "upbeat quirky indie pop, glockenspiel, plucky synth bass, fun and light",
    ],
    "animada": [
        "energetic upbeat electronic pop, punchy drums, bright synth, positive and fast",
        "funky upbeat groove, slap bass, brass stabs, energetic and fun",
        "fast happy chiptune with modern drums, playful and exciting",
    ],
    "suspense": [
        "mysterious playful suspense, pizzicato, low strings, ticking clock, light tension, cartoon detective",
        "curious investigative underscore, soft synth pulses, muted piano, mysterious but not scary",
        "sneaky tension, low bass pulse, light percussion, quirky mystery",
    ],
    "calma": [
        "calm warm lo-fi, soft piano, mellow beat, relaxed and friendly",
        "gentle acoustic guitar and soft pads, relaxed and warm",
        "soft ambient electronic, light keys, peaceful and curious",
    ],
}


def eleven_musica(clima, chave=None):
    """Gera uma faixa instrumental de ~1 minuto na Eleven Music e devolve os bytes do mp3."""
    chave = chave or ler_config().get("eleven_chave")
    if not chave:
        raise RuntimeError("chave da ElevenLabs não configurada")
    estilo = random.choice(ESTILOS_MUSICA.get(clima) or ESTILOS_MUSICA["divertida"])
    corpo = {
        "prompt": estilo + ". Instrumental background music for a short comedy video, no vocals, "
                  "steady volume, no big build-ups, ends ready to loop.",
        "music_length_ms": 60000,
        "force_instrumental": True,
    }
    dados = json.dumps(corpo).encode("utf-8")
    for tentativa in range(4):
        req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", data=dados, method="POST",
                                     headers={"xi-api-key": chave, "Content-Type": "application/json", "Accept": "audio/mpeg"})
        try:
            with FILA_ELEVEN:
                with urllib.request.urlopen(req, timeout=300) as r:
                    return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and tentativa < 3:
                e.read()
                time.sleep(3 * (tentativa + 1))
                continue
            erro_eleven(e)


def erro_eleven(e):
    """Transforma a resposta de erro da ElevenLabs numa mensagem clara."""
    detalhe = e.read().decode("utf-8", "replace")[:400]
    # a ElevenLabs explica o motivo em {"detail": {"status": ..., "message": ...}}
    status, msg = "", ""
    try:
        det = json.loads(detalhe).get("detail")
        if isinstance(det, dict):
            status, msg = str(det.get("status") or ""), str(det.get("message") or "")
        elif det:
            msg = str(det)
    except Exception:
        msg = detalhe
    if status == "missing_permissions" or "permission" in msg.lower():
        raise RuntimeError("a chave da ElevenLabs não tem permissão para isso. Crie uma chave nova com Text to Speech, Voices, Music e Sound Effects liberados. Detalhe: " + msg[:160])
    if status in ("quota_exceeded", "insufficient_credits") or "quota" in msg.lower() or "credit" in msg.lower():
        raise RuntimeError("acabaram os créditos da ElevenLabs deste mês (ou o plano não permite essa voz). Detalhe: " + msg[:160])
    if status == "detected_unusual_activity" or "unusual activity" in msg.lower():
        raise RuntimeError("a ElevenLabs bloqueou o uso gratuito por atividade incomum; é preciso um plano pago. Detalhe: " + msg[:160])
    if e.code == 401:
        raise RuntimeError("a ElevenLabs recusou a chave (" + (status or "401") + "): " + (msg[:160] or "confira se copiou a chave inteira"))
    raise RuntimeError(f"ElevenLabs respondeu {e.code}: {(msg or detalhe)[:200]}")


# ---------- ATUALIZAÇÃO PELO GITHUB ----------
# O repositório é privado: o download usa uma chave do GitHub só de leitura, guardada no mesmo arquivo da ElevenLabs.
REPO = "marcelo692/Estudio-Raio-X"
RAMO = "main"
VERSAO = os.path.join(PASTA, "versao.json")
# Pastas do usuário: a atualização nunca apaga nada; só cria ou substitui arquivos que vêm do GitHub.
NUNCA_SOBRESCREVER = ("padrao.json", "versao.json")


def github(caminho, chave=None, bruto=False):
    chave = chave or ler_config().get("github_chave")
    if not chave:
        raise RuntimeError("chave do GitHub não configurada")
    req = urllib.request.Request("https://api.github.com" + caminho, headers={
        "Authorization": "Bearer " + chave, "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "estudio-raio-x"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            dados = r.read()
    except urllib.error.HTTPError as e:
        if e.code in (401, 403, 404):
            raise RuntimeError("o GitHub recusou a chave (confira se ela tem acesso de leitura ao repositório Estudio-Raio-X)")
        raise RuntimeError(f"GitHub respondeu {e.code}")
    return dados if bruto else json.loads(dados.decode("utf-8"))


def versao_local():
    try:
        with open(VERSAO, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def ultima_versao():
    c = github(f"/repos/{REPO}/commits/{RAMO}")
    msg = (c.get("commit", {}).get("message") or "").split("\n")[0]
    return {"sha": c.get("sha"), "mensagem": msg, "data": c.get("commit", {}).get("committer", {}).get("date")}


def aplicar_atualizacao():
    """Baixa o zip do GitHub, guarda cópia dos arquivos que vão mudar e grava os novos."""
    nova = ultima_versao()
    dados = github(f"/repos/{REPO}/zipball/{nova['sha']}", bruto=True)
    z = zipfile.ZipFile(io.BytesIO(dados))
    antes = (versao_local().get("sha") or "desconhecida")[:7]
    copia = os.path.join(PASTA, "versoes", "antes-da-atualizacao-" + time.strftime("%Y-%m-%d-%H%M") + "-" + antes)
    mudou = []
    for info in z.infolist():
        if info.is_dir():
            continue
        rel = info.filename.split("/", 1)[1] if "/" in info.filename else ""
        if not rel or rel.startswith(".") or rel in NUNCA_SOBRESCREVER or ".." in rel.split("/"):
            continue
        novo = z.read(info)
        destino = os.path.join(PASTA, *rel.split("/"))
        if os.path.exists(destino):
            with open(destino, "rb") as f:
                if f.read() == novo:
                    continue
            os.makedirs(os.path.dirname(os.path.join(copia, rel)) or copia, exist_ok=True)
            shutil.copy2(destino, os.path.join(copia, *rel.split("/")))
        os.makedirs(os.path.dirname(destino) or PASTA, exist_ok=True)
        with open(destino + ".novo", "wb") as f:
            f.write(novo)
        os.replace(destino + ".novo", destino)
        mudou.append(rel)
    with open(VERSAO, "w", encoding="utf-8") as f:
        json.dump(nova, f, ensure_ascii=False, indent=2)
    return nova, mudou


def reiniciar_servidor():
    """Abre um servidor novo (com o código atualizado) e fecha este."""
    time.sleep(0.6)
    args = [sys.executable, os.path.abspath(__file__), "--sem-navegador", "--reinicio"]
    if os.name == "nt":
        subprocess.Popen(args, cwd=PASTA, creationflags=getattr(subprocess, "CREATE_NEW_CONSOLE", 0))
    else:
        subprocess.Popen(args, cwd=PASTA)
    os._exit(0)


def palavras_do_alinhamento(al):
    """Converte o tempo por letra da ElevenLabs em tempo por palavra (igual ao edge-tts)."""
    if not al:
        return []
    letras = al.get("characters") or []
    inicios = al.get("character_start_times_seconds") or []
    out, atual, t0 = [], "", 0.0
    for c, t in zip(letras, inicios):
        if c.isspace():
            if atual:
                out.append({"w": atual, "t": round(t0, 3)})
            atual = ""
            continue
        if not atual:
            t0 = t
        atual += c
    if atual:
        out.append({"w": atual, "t": round(t0, 3)})
    return out


def lista_sons():
    return sorted(os.path.splitext(a)[0] for a in os.listdir(SONS) if a.lower().endswith(".mp3")) if os.path.isdir(SONS) else []


def eleven_sfx(texto, duracao, chave=None):
    """Gera um efeito sonoro na ElevenLabs (Sound Effects) e devolve os bytes do mp3."""
    chave = chave or ler_config().get("eleven_chave")
    if not chave:
        raise RuntimeError("chave da ElevenLabs não configurada")
    dados = json.dumps({"text": texto, "duration_seconds": duracao, "prompt_influence": 0.6}).encode("utf-8")
    for tentativa in range(4):
        req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", data=dados, method="POST",
                                     headers={"xi-api-key": chave, "Content-Type": "application/json", "Accept": "audio/mpeg"})
        try:
            with FILA_ELEVEN:
                with urllib.request.urlopen(req, timeout=120) as r:
                    return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and tentativa < 3:
                e.read()
                time.sleep(2 * (tentativa + 1))
                continue
            erro_eleven(e)


def lista_musicas():
    out = []
    for raiz, _, arquivos in os.walk(MUSICAS):
        for a in arquivos:
            if a.lower().endswith(EXT_MUSICA):
                out.append(os.path.relpath(os.path.join(raiz, a), MUSICAS).replace(os.sep, "/"))
    return sorted(out)

try:
    import edge_tts  # type: ignore
    TEM_TTS = True
except Exception:
    TEM_TTS = False


# ---------- POSTAGENS ----------
# O que já foi postado fica em videos/postagens.json (a pasta videos/ só existe no PC, fora do GitHub).
POSTAGENS = os.path.join(VIDEOS, "postagens.json")
REDES = ("youtube", "tiktok", "instagram")
TRAVA_POSTAGENS = threading.Lock()


def ler_postagens():
    try:
        with open(POSTAGENS, encoding="utf-8") as f:
            d = json.load(f)
            return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def ler_textos(txt):
    """Lê o .txt de publicação (blocos '=== Nome ===') e devolve {nome: texto}."""
    try:
        with open(txt, encoding="utf-8") as f:
            bruto = f.read()
    except OSError:
        return {}
    out, chave, linhas = {}, None, []
    for linha in bruto.splitlines():
        m = re.match(r"^=== (.+) ===$", linha)
        if m:
            if chave:
                out[chave] = "\n".join(linhas).strip()
            chave, linhas = m.group(1), []
        elif chave:
            linhas.append(linha)
    if chave:
        out[chave] = "\n".join(linhas).strip()
    if not out and bruto.strip():
        out["Texto"] = bruto.strip()
    return out


def lista_postagens():
    estado = ler_postagens()
    out = []
    for a in os.listdir(VIDEOS):
        if not a.lower().endswith((".mp4", ".webm")):
            continue
        caminho = os.path.join(VIDEOS, a)
        e = estado.get(a) or {}
        out.append({"arquivo": a, "url": "videos/" + urllib.parse.quote(a), "criado": os.path.getmtime(caminho),
                    "mb": round(os.path.getsize(caminho) / 1048576, 1),
                    "textos": ler_textos(os.path.splitext(caminho)[0] + ".txt"),
                    "postado": {r: e.get(r) for r in REDES}, "agendado": e.get("agendado") or ""})
    return sorted(out, key=lambda v: v["criado"])


def marcar_postagem(d):
    arquivo = os.path.basename(str(d.get("arquivo") or ""))
    if not arquivo or not os.path.isfile(os.path.join(VIDEOS, arquivo)):
        raise RuntimeError("vídeo não encontrado na pasta videos")
    with TRAVA_POSTAGENS:
        estado = ler_postagens()
        e = estado.get(arquivo) or {}
        rede = d.get("rede")
        if rede in REDES:
            e[rede] = time.strftime("%Y-%m-%d %H:%M") if d.get("postado") else None
        if "agendado" in d:
            e["agendado"] = str(d.get("agendado") or "")[:10]
        estado[arquivo] = e
        with open(POSTAGENS + ".tmp", "w", encoding="utf-8") as f:
            json.dump(estado, f, ensure_ascii=False, indent=2)
        os.replace(POSTAGENS + ".tmp", POSTAGENS)
    return e


def lista_ajustes():
    """Ajustes de olhos/boca de cada convidado, guardados ao lado do modelo (convidados/<nome>.ajustes.json)."""
    out = {}
    if os.path.isdir(CONVIDADOS):
        for a in os.listdir(CONVIDADOS):
            if a.endswith(".ajustes.json"):
                try:
                    with open(os.path.join(CONVIDADOS, a), encoding="utf-8") as f:
                        out[a[:-len(".ajustes.json")]] = json.load(f)
                except Exception:
                    pass
    return out


def nome_seguro(nome, padrao="episodio"):
    nome = re.sub(r"[^a-zA-Z0-9_-]+", "-", str(nome or "")).strip("-")[:60]
    return nome or padrao


def proximo_livre(pasta, nome, ext):
    caminho = os.path.join(pasta, f"{nome}.{ext}")
    i = 2
    while os.path.exists(caminho):
        caminho = os.path.join(pasta, f"{nome}-{i}.{ext}")
        i += 1
    return caminho


async def gerar_fala(texto, voz, tom, velocidade, destino):
    """Gera o MP3 e um .json ao lado com o tempo de cada palavra (para a legenda palavra por palavra)."""
    args = dict(rate=f"{int(velocidade):+d}%", pitch=f"{int(tom):+d}Hz")
    try:
        com = edge_tts.Communicate(texto, voz, boundary="WordBoundary", **args)
    except TypeError:  # versões antigas do edge-tts já mandam WordBoundary por padrão
        com = edge_tts.Communicate(texto, voz, **args)
    temp = destino + ".tmp"
    palavras = []
    with open(temp, "wb") as f:
        async for parte in com.stream():
            if parte["type"] == "audio":
                f.write(parte["data"])
            elif parte["type"] == "WordBoundary":
                palavras.append({"w": parte["text"], "t": round(parte["offset"] / 1e7, 3)})
    os.replace(temp, destino)
    with open(destino[:-4] + ".json", "w", encoding="utf-8") as f:
        json.dump(palavras, f, ensure_ascii=False)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=PASTA, **k)

    def log_message(self, fmt, *args):
        if "/api/" in (self.path or ""):
            sys.stdout.write("  " + (fmt % args) + "\n")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, codigo, dados):
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _corpo(self):
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n) if n else b""

    def do_GET(self):
        if self.path.startswith("/api/status"):
            convidados = sorted(f[:-4] for f in os.listdir(CONVIDADOS) if f.lower().endswith(".glb"))
            chave = ler_config().get("eleven_chave") or ""
            return self._json(200, {"ok": True, "tts": TEM_TTS, "convidados": convidados, "musicas": lista_musicas(), "sons": lista_sons(), "ajustes": lista_ajustes(),
                                    "climas": list(CLIMAS), "eleven": bool(chave), "eleven_fim": chave[-4:] if chave else ""})
        if self.path.startswith("/api/atualizacao"):
            local = versao_local()
            if not ler_config().get("github_chave"):
                return self._json(200, {"github": False, "local": local})
            try:
                rem = ultima_versao()
                return self._json(200, {"github": True, "local": local, "remoto": rem, "nova": rem["sha"] != local.get("sha")})
            except Exception as e:  # noqa: BLE001
                return self._json(200, {"github": True, "local": local, "erro": str(e)})
        if self.path.startswith("/api/postagens"):
            return self._json(200, {"videos": lista_postagens()})
        if self.path.startswith("/api/biblioteca/validacao"):
            try:
                with open(os.path.join(PASTA, "biblioteca", "validacao.json"), encoding="utf-8") as f:
                    return self._json(200, json.load(f))
            except Exception:
                return self._json(200, {})
        if self.path.startswith("/api/padrao"):
            try:
                with open(os.path.join(PASTA, "padrao.json"), encoding="utf-8") as f:
                    return self._json(200, json.load(f))
            except Exception:
                return self._json(200, {})
        if self.path.startswith("/api/eleven/vozes"):
            try:
                minhas = eleven("/v1/voices").get("voices", [])
                q = urllib.parse.urlencode({"language": "pt", "accent": "brazilian", "page_size": 60})
                try:
                    biblioteca = eleven("/v1/shared-voices?" + q).get("voices", [])
                except RuntimeError:
                    biblioteca = []
                def resumo(v, lib):
                    lab = v.get("labels") or {}
                    return {"id": v.get("voice_id"), "nome": v.get("name"), "previa": v.get("preview_url"),
                            "dono": v.get("public_owner_id") if lib else None,
                            "info": ", ".join(x for x in [v.get("gender") or lab.get("gender"), v.get("age") or lab.get("age"),
                                                         v.get("accent") or lab.get("accent"), v.get("descriptive") or lab.get("descriptive"),
                                                         v.get("use_case") or lab.get("use_case")] if x)}
                return self._json(200, {"minhas": [resumo(v, False) for v in minhas], "biblioteca": [resumo(v, True) for v in biblioteca]})
            except Exception as e:  # noqa: BLE001
                return self._json(400, {"erro": str(e)})
        return super().do_GET()

    def do_POST(self):
        try:
            if self.path.startswith("/api/tts"):
                return self._tts()
            if self.path.startswith("/api/config"):
                d = json.loads(self._corpo() or b"{}")
                cfg = ler_config()
                gh = str(d.get("github_chave") or "").strip()
                if gh:
                    github(f"/repos/{REPO}", chave=gh)  # testa antes de guardar
                    cfg["github_chave"] = gh
                    gravar_config(cfg)
                    return self._json(200, {"github": True})
                chave = str(d.get("eleven_chave") or "").strip()
                if chave:
                    eleven("/v1/voices", chave=chave)  # testa antes de guardar
                    cfg["eleven_chave"] = chave
                elif d.get("apagar"):
                    cfg.pop("eleven_chave", None)
                gravar_config(cfg)
                c = cfg.get("eleven_chave") or ""
                return self._json(200, {"eleven": bool(c), "eleven_fim": c[-4:] if c else ""})
            if self.path.startswith("/api/atualizar"):
                nova, mudou = aplicar_atualizacao()
                print(f"  atualizado para {nova['sha'][:7]}: {len(mudou)} arquivo(s)")
                self._json(200, {"ok": True, "versao": nova, "mudou": mudou})
                threading.Thread(target=reiniciar_servidor, daemon=True).start()
                return
            if self.path.startswith("/api/postagens"):
                return self._json(200, {"ok": True, "estado": marcar_postagem(json.loads(self._corpo() or b"{}"))})
            if self.path.startswith("/api/biblioteca/validacao"):
                d = json.loads(self._corpo() or b"{}")
                pasta = os.path.join(PASTA, "biblioteca"); os.makedirs(pasta, exist_ok=True)
                caminho = os.path.join(pasta, "validacao.json")
                try:
                    with open(caminho, encoding="utf-8") as f:
                        todos = json.load(f)
                except Exception:
                    todos = {}
                if d.get("id"):
                    todos[str(d["id"])] = d
                with open(caminho, "w", encoding="utf-8") as f:
                    json.dump(todos, f, ensure_ascii=False, indent=2)
                return self._json(200, {"ok": True})
            if self.path.startswith("/api/padrao"):
                d = json.loads(self._corpo() or b"{}")
                caminho = os.path.join(PASTA, "padrao.json")
                if d.get("apagar"):
                    if os.path.exists(caminho):
                        os.remove(caminho)
                else:
                    with open(caminho, "w", encoding="utf-8") as f:
                        json.dump(d, f, ensure_ascii=False, indent=2)
                return self._json(200, {"ok": True})
            if self.path.startswith("/api/eleven/adicionar"):
                d = json.loads(self._corpo() or b"{}")
                r = eleven(f"/v1/voices/add/{d.get('dono')}/{d.get('id')}", "POST", {"new_name": str(d.get("nome") or "voz")[:40]})
                return self._json(200, {"id": r.get("voice_id")})
            if self.path.startswith("/api/salvar-roteiro"):
                d = json.loads(self._corpo() or b"{}")
                os.makedirs(ROTEIROS, exist_ok=True)
                caminho = os.path.join(ROTEIROS, nome_seguro(d.get("nome")) + ".json")
                with open(caminho, "w", encoding="utf-8") as f:
                    json.dump(d.get("roteiro"), f, ensure_ascii=False, indent=2)
                return self._json(200, {"caminho": os.path.relpath(caminho, PASTA)})
            if self.path.startswith("/api/salvar-video"):
                from urllib.parse import parse_qs, urlparse
                q = parse_qs(urlparse(self.path).query)
                ext = "mp4" if (q.get("ext") or ["webm"])[0] == "mp4" else "webm"
                os.makedirs(VIDEOS, exist_ok=True)
                caminho = proximo_livre(VIDEOS, nome_seguro((q.get("nome") or [""])[0]), ext)
                with open(caminho, "wb") as f:
                    f.write(self._corpo())
                print(f"  vídeo salvo: {caminho}")
                return self._json(200, {"caminho": os.path.relpath(caminho, PASTA)})
            if self.path.startswith("/api/salvar-textos"):
                # textos de publicação ao lado do vídeo, com o mesmo nome (.txt)
                d = json.loads(self._corpo() or b"{}")
                video = os.path.abspath(os.path.join(PASTA, str(d.get("video") or "")))
                if not video.startswith(os.path.abspath(VIDEOS) + os.sep):
                    return self._json(400, {"erro": "caminho do vídeo inválido"})
                txt = os.path.splitext(video)[0] + ".txt"
                with open(txt, "w", encoding="utf-8") as f:
                    f.write(str(d.get("texto") or ""))
                return self._json(200, {"caminho": os.path.relpath(txt, PASTA)})
            if self.path.startswith("/api/abrir-pasta"):
                # abre a pasta videos/ no Explorador, já com o arquivo selecionado
                d = json.loads(self._corpo() or b"{}")
                alvo = os.path.abspath(os.path.join(PASTA, str(d.get("caminho") or "videos")))
                if not (alvo == os.path.abspath(VIDEOS) or alvo.startswith(os.path.abspath(VIDEOS) + os.sep)):
                    return self._json(400, {"erro": "só abre a pasta de vídeos"})
                os.makedirs(VIDEOS, exist_ok=True)
                if os.name == "nt":
                    if os.path.isfile(alvo):
                        subprocess.Popen(["explorer", "/select,", alvo])
                    else:
                        subprocess.Popen(["explorer", alvo])
                elif sys.platform == "darwin":
                    subprocess.Popen(["open", "-R", alvo] if os.path.isfile(alvo) else ["open", alvo])
                else:
                    subprocess.Popen(["xdg-open", os.path.dirname(alvo) if os.path.isfile(alvo) else alvo])
                return self._json(200, {"ok": True})
            if self.path.startswith("/api/salvar-convidado"):
                from urllib.parse import parse_qs, urlparse
                q = parse_qs(urlparse(self.path).query)
                nome = nome_seguro((q.get("nome") or [""])[0], "convidado").lower()
                dados = self._corpo()
                if dados[:4] != b"glTF":
                    return self._json(400, {"erro": "o arquivo precisa ser .glb (glTF binário)"})
                os.makedirs(CONVIDADOS, exist_ok=True)
                caminho = os.path.join(CONVIDADOS, nome + ".glb")
                with open(caminho, "wb") as f:
                    f.write(dados)
                print(f"  convidado salvo: {caminho}")
                return self._json(200, {"caminho": os.path.relpath(caminho, PASTA), "nome": nome})
            if self.path.startswith("/api/salvar-ajustes"):
                # ajustes do rosto ficam com o MODELO, não com o roteiro: trocar de roteiro não perde nada
                d = json.loads(self._corpo() or b"{}")
                nome = str(d.get("nome") or "")
                if not re.fullmatch(r"[a-z0-9_-]{1,80}", nome):
                    return self._json(400, {"erro": "nome de convidado inválido"})
                caminho = os.path.join(CONVIDADOS, nome + ".ajustes.json")
                aj = d.get("ajustes")
                if isinstance(aj, dict) and aj:
                    with open(caminho, "w", encoding="utf-8") as f:
                        json.dump(aj, f, ensure_ascii=False, indent=1)
                elif os.path.exists(caminho):
                    os.remove(caminho)
                return self._json(200, {"ok": True})
            if self.path.startswith("/api/gerar-sfx"):
                # gera (ou refaz) um efeito sonoro e guarda em sons/<nome>.mp3
                d = json.loads(self._corpo() or b"{}")
                nome = str(d.get("nome") or "")
                texto = str(d.get("texto") or "").strip()[:450]
                if not re.fullmatch(r"[a-z]{2,20}", nome) or not texto:
                    return self._json(400, {"erro": "efeito inválido"})
                duracao = min(8.0, max(0.5, float(d.get("duracao") or 1)))
                audio = eleven_sfx(texto, duracao)
                if not audio or len(audio) < 500:
                    return self._json(502, {"erro": "a ElevenLabs não devolveu o efeito"})
                with open(os.path.join(SONS, nome + ".mp3"), "wb") as f:
                    f.write(audio)
                print(f"  efeito gerado: {nome}")
                return self._json(200, {"nome": nome})
            if self.path.startswith("/api/gerar-musica"):
                # gera uma música nova na Eleven Music e guarda em musicas/<clima>/
                d = json.loads(self._corpo() or b"{}")
                clima = str(d.get("clima") or "")
                if clima not in CLIMAS:
                    return self._json(400, {"erro": "clima desconhecido"})
                audio = eleven_musica(clima)
                if not audio or len(audio) < 1000:
                    return self._json(502, {"erro": "a ElevenLabs não devolveu a música"})
                nome = clima + "/ia-" + clima + "-" + time.strftime("%Y%m%d-%H%M%S") + ".mp3"
                with open(os.path.join(MUSICAS, nome), "wb") as f:
                    f.write(audio)
                print(f"  música gerada: {nome}")
                return self._json(200, {"nome": nome})
            if self.path.startswith("/api/salvar-musica"):
                from urllib.parse import parse_qs, urlparse
                q = parse_qs(urlparse(self.path).query)
                original = os.path.basename((q.get("nome") or ["musica.mp3"])[0])
                base, ext = os.path.splitext(original)
                ext = ext.lower() if ext.lower() in EXT_MUSICA else ".mp3"
                pasta = (q.get("clima") or [""])[0]
                nome = nome_seguro(base, "musica") + ext
                if pasta in CLIMAS:
                    nome = pasta + "/" + nome
                os.makedirs(os.path.dirname(os.path.join(MUSICAS, nome)), exist_ok=True)
                with open(os.path.join(MUSICAS, nome), "wb") as f:
                    f.write(self._corpo())
                print(f"  música salva: {nome}")
                return self._json(200, {"nome": nome})
            return self._json(404, {"erro": "rota desconhecida"})
        except Exception as e:  # noqa: BLE001
            return self._json(500, {"erro": str(e)})

    def _tts_eleven(self, d, texto):
        voz = str(d.get("voz") or "")
        modelo = str(d.get("modelo") or "eleven_multilingual_v2")
        vel = int(float(d.get("velocidade") or 0))
        estab = float(d.get("estabilidade") if d.get("estabilidade") is not None else 0.45)
        estilo = float(d.get("estilo") if d.get("estilo") is not None else 0.25)
        # a ElevenLabs aceita velocidade de 0,7 a 1,2
        speed = max(0.7, min(1.2, 1 + vel / 100))
        chave = hashlib.sha1(f"eleven|{voz}|{modelo}|{speed:.2f}|{estab:.2f}|{estilo:.2f}|{texto}".encode("utf-8")).hexdigest()
        arquivo = os.path.join(CACHE, chave + ".mp3")
        tempos = arquivo[:-4] + ".json"
        if not os.path.exists(arquivo) or not os.path.exists(tempos):
            r = eleven(f"/v1/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128", "POST", {
                "text": texto, "model_id": modelo,
                "voice_settings": {"stability": estab, "similarity_boost": 0.8, "style": estilo,
                                   "use_speaker_boost": True, "speed": speed}})
            with open(arquivo + ".tmp", "wb") as f:
                f.write(base64.b64decode(r.get("audio_base64") or ""))
            os.replace(arquivo + ".tmp", arquivo)
            with open(tempos, "w", encoding="utf-8") as f:
                json.dump(palavras_do_alinhamento(r.get("alignment") or r.get("normalized_alignment")), f, ensure_ascii=False)
        return arquivo, tempos

    def _tts(self):
        d0 = json.loads(self._corpo() or b"{}")
        if d0.get("provedor") == "eleven":
            texto = str(d0.get("texto") or "").strip()
            if not texto:
                return self._json(400, {"erro": "texto vazio"})
            try:
                arquivo, tempos = self._tts_eleven(d0, texto)
            except Exception as e:  # noqa: BLE001
                return self._json(502, {"erro": str(e)})
            return self._enviar_audio(arquivo, tempos)
        self._d = d0
        if not TEM_TTS:
            return self._json(503, {"erro": "edge-tts não está instalado. Rode: pip install edge-tts"})
        d = self._d
        texto = str(d.get("texto") or "").strip()
        if not texto:
            return self._json(400, {"erro": "texto vazio"})
        voz = str(d.get("voz") or "pt-BR-AntonioNeural")
        tom = int(float(d.get("tom") or 0))
        vel = int(float(d.get("velocidade") or 0))
        chave = hashlib.sha1(f"{voz}|{tom}|{vel}|{texto}".encode("utf-8")).hexdigest()
        arquivo = os.path.join(CACHE, chave + ".mp3")
        tempos = arquivo[:-4] + ".json"
        # áudio antigo sem tempo das palavras é refeito uma vez, para a legenda palavra por palavra
        if not os.path.exists(arquivo) or not os.path.exists(tempos):
            asyncio.run(gerar_fala(texto, voz, tom, vel, arquivo))
        return self._enviar_audio(arquivo, tempos)

    def _enviar_audio(self, arquivo, tempos):
        with open(arquivo, "rb") as f:
            dados = f.read()
        palavras = b"[]"
        try:
            with open(tempos, "rb") as f:
                palavras = f.read()
        except OSError:
            pass
        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Content-Length", str(len(dados)))
        self.send_header("X-Palavras", base64.b64encode(palavras).decode("ascii"))
        self.send_header("Access-Control-Expose-Headers", "X-Palavras")
        self.end_headers()
        self.wfile.write(dados)


def main():
    url = f"http://localhost:{PORTA}/index.html"
    srv = None
    # depois de uma atualização, espera o servidor antigo liberar a porta
    for _ in range(40 if "--reinicio" in sys.argv else 1):
        try:
            srv = ThreadingHTTPServer(("127.0.0.1", PORTA), Handler)
            break
        except OSError:
            time.sleep(0.25)
    if srv is None:
        print("O estúdio já está aberto. Abrindo o navegador...")
        webbrowser.open(url)
        return
    if "--reinicio" in sys.argv:
        print("Estúdio atualizado e reiniciado.")
    print("Estúdio Raio-X rodando em", url)
    print("Voz neural:", "pronta" if TEM_TTS else "indisponível (pip install edge-tts)")
    print("ElevenLabs:", "chave configurada" if ler_config().get("eleven_chave") else "sem chave (cole a chave no card Voz do estúdio)")
    print("Deixe esta janela aberta enquanto usa o estúdio. Para encerrar, feche a janela.")
    if "--sem-navegador" not in sys.argv:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
