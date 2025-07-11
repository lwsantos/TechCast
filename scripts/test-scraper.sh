#!/bin/bash

# Script para testar especificamente o scraper

set -e

echo "🧪 Testando Scraper"
echo "==================="

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

echo "🧪 Executando scraper..."
$DOCKER_COMPOSE exec techcast-api npm run scraper

echo ""
echo "✅ Teste do scraper concluído!" 