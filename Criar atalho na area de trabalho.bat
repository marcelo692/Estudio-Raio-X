@echo off
rem Cria o atalho "Estudio Raio-X" na area de trabalho, apontando para o Abrir estudio.bat desta pasta
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut($d+'\Estudio Raio-X.lnk'); $s.TargetPath='%~dp0Abrir estudio.bat'; $s.WorkingDirectory='%~dp0'; $s.IconLocation='%SystemRoot%\System32\shell32.dll,115'; $s.Save()"
echo Atalho "Estudio Raio-X" criado na Area de Trabalho.
echo Use esse atalho para abrir o Estudio Raio-X.
pause
