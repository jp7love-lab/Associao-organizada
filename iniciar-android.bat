@echo off
title AMFAC - Servidor para Android
color 0A

echo ============================================
echo   AMFAC - Iniciando servidor para Android
echo ============================================
echo.

:: Detectar IP da maquina
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| findstr /v "169."') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo IP desta maquina: %IP%
echo.
echo No celular Android, o app vai conectar em:
echo http://%IP%:3001
echo.
echo IMPORTANTE: Celular e computador devem estar
echo na MESMA rede Wi-Fi!
echo.
echo ============================================
echo.

:: Mata processos anteriores na porta 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001"') do taskkill /PID %%a /F >nul 2>&1

:: Inicia backend
cd /d "%~dp0backend"
start "Backend AMFAC" cmd /k "npm run dev"

echo Servidor iniciado! Aguarde 5 segundos...
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo  Servidor rodando em http://%IP%:3001
echo  Instale o APK no celular e abra o app!
echo  (arquivo: AMFAC-debug.apk na sua pasta Documentos)
echo ============================================
pause
