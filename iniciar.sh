#!/bin/bash
echo "============================================"
echo "  AMFAC - Sistema de Gestão de Associados"
echo "============================================"
echo ""

echo "[1/4] Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js não encontrado!"
    echo "Instale em: https://nodejs.org"
    exit 1
fi

echo "[2/4] Instalando dependências do backend..."
cd backend && npm install --silent

echo "[3/4] Instalando dependências do frontend..."
cd ../frontend && npm install --silent

echo "[4/4] Iniciando o sistema..."
cd ..
echo ""
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para encerrar"
echo ""

(cd backend && npm run dev) &
sleep 3
(cd frontend && npm run dev) &

wait
