@echo off
echo ============================================================
echo   Associacao Organizada - Gestao Inteligente para Associacoes
echo ============================================================
echo.

echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale em: https://nodejs.org
    pause
    exit /b 1
)

echo [2/4] Instalando dependencias do backend...
cd backend
call npm install --silent
if %errorlevel% neq 0 (
    echo ERRO ao instalar dependencias do backend
    pause
    exit /b 1
)

echo [3/4] Instalando dependencias do frontend...
cd ..\frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo ERRO ao instalar dependencias do frontend
    pause
    exit /b 1
)

echo [4/4] Iniciando o sistema...
cd ..
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Aguarde o navegador abrir automaticamente...
echo Pressione Ctrl+C para encerrar
echo.

start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start cmd /k "cd frontend && npm run dev"
timeout /t 5 /nobreak >nul
start http://localhost:3000
