#!/bin/bash

# Abort on errors
set -e

echo "=== Iniciando o Deploy da Aplicação ==="

# 1. Puxar as últimas alterações do repositório
echo "Puxando alterações do Git..."
git pull origin main || echo "Aviso: Não foi possível atualizar com git pull. Continuando..."

# 2. Reconstruir e reiniciar os containers Docker
echo "Buildando e iniciando os containers no Docker..."
docker compose down
docker compose up -d --build

# 3. Limpar imagens antigas não utilizadas para economizar espaço
echo "Limpando imagens antigas não utilizadas..."
docker image prune -f

echo "=== Deploy concluído com sucesso! Aplicação rodando na porta 3000 ==="
