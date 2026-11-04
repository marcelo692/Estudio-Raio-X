@echo off
chcp 65001 >nul
title Instalador do Estudio Raio-X
setlocal EnableExtensions

rem Pasta de onde o instalador foi aberto (o zip extraido) e pasta final
set "ORIGEM=%~dp0"
set "DESTINO=%USERPROFILE%\Documents\Estudio Raio-X"
rem Python oficial que o estudio usa (instalado dentro da pasta do estudio, sem mexer no resto do PC)
set "PYVER=3.12.10"
set "PYNUGET=https://www.nuget.org/api/v2/package/python/%PYVER%"

echo ==================================================
echo   Instalador do Estudio Raio-X
echo ==================================================
echo.
echo O estudio sera instalado em:
echo   %DESTINO%
echo.

rem So instala a partir da pasta do zip extraido (evita copiar a area de trabalho inteira)
if not exist "%ORIGEM%index.html" goto :pasta_errada
if not exist "%ORIGEM%servidor.py" goto :pasta_errada

rem ---------- 1. Copiar os arquivos ----------
echo [1/4] Copiando o estudio...
if /i "%ORIGEM%"=="%DESTINO%\" goto :copiado
robocopy "%ORIGEM%." "%DESTINO%" /E /XD .git cache_voz videos versoes python /XF padrao.json /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  echo Falha ao copiar os arquivos.
  pause
  exit /b 1
)
:copiado
for %%P in (convidados roteiros videos cache_voz musicas\divertida musicas\animada musicas\suspense musicas\calma) do if not exist "%DESTINO%\%%P" mkdir "%DESTINO%\%%P"

rem ---------- 2. Python proprio do estudio ----------
rem Usa o Python "portatil" oficial (pacote nuget.org): e so um zip, sem instalador,
rem sem registro do Windows. Mostra a barra de progresso e tenta 3 vezes.
set "PY=%DESTINO%\python\python.exe"
if exist "%PY%" goto :python_ok
echo [2/4] Baixando o Python %PYVER% (uns 15 MB, so na primeira vez)...
set "PYZIP=%TEMP%\zuco-python-%PYVER%.zip"
set "PYTMP=%TEMP%\zuco-python-%PYVER%"
del "%PYZIP%" >nul 2>nul
if exist "%PYTMP%" rmdir /s /q "%PYTMP%"
where curl.exe >nul 2>nul && (curl.exe -L --fail --retry 3 --connect-timeout 20 -# -o "%PYZIP%" "%PYNUGET%" || del "%PYZIP%" >nul 2>nul)
if not exist "%PYZIP%" powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -TimeoutSec 300 -Uri '%PYNUGET%' -OutFile '%PYZIP%'"
if not exist "%PYZIP%" goto :sem_python_proprio
echo       Descompactando o Python na pasta do estudio...
mkdir "%PYTMP%" >nul 2>nul
tar -xf "%PYZIP%" -C "%PYTMP%" >nul 2>nul
if not exist "%PYTMP%\tools\python.exe" powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force -LiteralPath '%PYZIP%' -DestinationPath '%PYTMP%'"
if not exist "%PYTMP%\tools\python.exe" goto :sem_python_proprio
robocopy "%PYTMP%\tools" "%DESTINO%\python" /E /NFL /NDL /NJH /NJS /NP >nul
rmdir /s /q "%PYTMP%" >nul 2>nul
del "%PYZIP%" >nul 2>nul
if not exist "%PY%" goto :sem_python_proprio
"%PY%" -m pip --version >nul 2>nul || "%PY%" -m ensurepip --default-pip >nul 2>nul
goto :python_ok

:sem_python_proprio
rem Se nao deu para baixar, tenta um Python que ja exista no computador
call :acha_python
if not defined PY (
  where winget >nul 2>nul && (
    echo       Tentando instalar o Python pelo winget do Windows...
    winget install -e --id Python.Python.3.12 --scope user --accept-package-agreements --accept-source-agreements
    call :acha_python
  )
)
if not defined PY (
  echo.
  echo Nao consegui instalar o Python sozinho: sem internet ou bloqueado pelo Windows.
  echo Abra https://www.python.org/downloads/ , instale e MARQUE "Add python.exe to PATH".
  echo Depois rode este instalador de novo.
  start "" "https://www.python.org/downloads/"
  pause
  exit /b 1
)
:python_ok
echo [2/4] Python pronto: %PY%

rem ---------- 3. Voz gratuita ----------
echo [3/4] Instalando a voz gratuita (edge-tts)...
"%PY%" -m pip install --quiet --disable-pip-version-check edge-tts
if errorlevel 1 echo Aviso: nao instalou o edge-tts agora. O "Abrir estudio.bat" tenta de novo.

rem ---------- 4. Atalho na area de trabalho ----------
echo [4/4] Criando o atalho na area de trabalho...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Estudio Raio-X.lnk');" ^
  "$s.TargetPath='%DESTINO%\Abrir estudio.bat'; $s.WorkingDirectory='%DESTINO%'; $s.IconLocation='%SystemRoot%\System32\shell32.dll,115'; $s.Save()" >nul 2>nul

echo.
echo Pronto! O estudio esta instalado.
echo Use o atalho "Estudio Raio-X" na area de trabalho para abrir.
echo Na primeira vez, abra "Configuracoes" (botao no topo do estudio) e cole a chave do GitHub para receber as atualizacoes.
echo.
echo Abrindo o estudio agora...
start "" "%DESTINO%\Abrir estudio.bat"
timeout /t 3 >nul
exit /b 0

rem ---------- instalador fora da pasta do estudio ----------
:pasta_errada
echo Este instalador precisa ficar DENTRO da pasta "Estudio Raio-X" extraida do zip,
echo junto com index.html e servidor.py. Nao mova o instalador para outro lugar.
pause
exit /b 1

rem ---------- acha um Python ja instalado (no PATH ou nas pastas padrao) ----------
:acha_python
set "PY="
for /f "delims=" %%i in ('where py 2^>nul') do if not defined PY set "PY=%%i"
if defined PY goto :eof
for /f "delims=" %%i in ('where python 2^>nul') do (
  echo %%i | find /i "WindowsApps" >nul || if not defined PY set "PY=%%i"
)
if defined PY goto :eof
for %%v in (313 312 311 310) do (
  if not defined PY if exist "%LOCALAPPDATA%\Programs\Python\Python%%v\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python%%v\python.exe"
)
goto :eof
