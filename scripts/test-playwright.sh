#!/bin/bash

# Script para testar se o Playwright está funcionando no container

set -e

echo "🧪 Testando Playwright no Container"
echo "==================================="

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não está instalado."
    exit 1
fi

# Definir comando do Docker Compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Verificar se o container está rodando
if ! $DOCKER_COMPOSE ps | grep -q "Up"; then
    echo "❌ Container não está rodando. Execute: npm run docker:up"
    exit 1
fi

echo "🔍 Verificando instalação do Playwright..."
$DOCKER_COMPOSE exec techcast-api npx playwright --version

echo ""
echo "🔍 Verificando navegadores instalados..."
$DOCKER_COMPOSE exec techcast-api npx playwright install --dry-run

echo ""
echo "🔍 Verificando ts-node..."
$DOCKER_COMPOSE exec techcast-api ts-node --version

echo ""
echo "🔍 Verificando FFmpeg..."
$DOCKER_COMPOSE exec techcast-api ffmpeg -version | head -1

echo ""
echo "🔍 Verificando API..."
if curl -s http://localhost:3100/health > /dev/null; then
    echo "✅ API respondendo corretamente"
else
    echo "⚠️ API não está respondendo"
fi

echo ""
echo "✅ Verificações concluídas!"
echo ""
echo "📋 Para executar o scraper manualmente:"
echo "   docker-compose exec techcast-api npm run scraper"
echo ""
echo "📋 Para executar o pipeline completo:"
echo "   docker-compose exec techcast-api npm run pipeline" 