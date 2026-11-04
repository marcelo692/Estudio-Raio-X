@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Estudio Raio-X
set "PY="
rem 1o: o Python proprio do estudio (instalado pelo "Instalar Estudio Raio-X.bat")
if exist "%~dp0python\python.exe" set "PY=%~dp0python\python.exe"
if not defined PY for /f "delims=" %%i in ('where py 2^>nul') do if not defined PY set "PY=%%i"
if not defined PY for /f "delims=" %%i in ('where python 2^>nul') do (
  echo %%i | find /i "WindowsApps" >nul || if not defined PY set "PY=%%i"
)
if not defined PY for %%v in (313 312 311 310) do (
  if not defined PY if exist "%LOCALAPPDATA%\Programs\Python\Python%%v\python.exe" set "PY=%LOCALAPPDATA%\Programs\Python\Python%%v\python.exe"
)
if not defined PY (
  echo Python nao encontrado. Rode o "Instalar Estudio Raio-X.bat" ou instale em https://www.python.org/downloads/ marcando "Add python.exe to PATH".
  echo Abrindo o estudio sem servidor: voz neural e objetos .glb ficam desligados.
  start "" "%~dp0index.html"
  pause
  exit /b
)
"%PY%" -c "import edge_tts" >nul 2>nul || (
  echo Instalando a voz neural gratuita - so na primeira vez...
  "%PY%" -m pip install --user edge-tts
)
"%PY%" servidor.py
pause
