#!/bin/bash

# Script para reconstruir a imagem Docker com correções do Playwright

set -e

echo "🔨 TechCast Scraper - Rebuild Docker"
echo "===================================="
echo "📋 Instalando dependências do Playwright para Debian..."
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Definir comando do Docker Compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
$DOCKER_COMPOSE down

# Remover imagens antigas
echo "🗑️ Removendo imagens antigas..."
$DOCKER_COMPOSE down --rmi all

# Limpar cache do Docker
echo "🧹 Limpando cache do Docker..."
docker system prune -f

# Reconstruir a imagem
echo "🔨 Reconstruindo a imagem Docker com Debian + Playwright..."
echo "⏳ Isso pode demorar alguns minutos..."
$DOCKER_COMPOSE build --no-cache

# Executar o container
echo "🚀 Iniciando o container..."
$DOCKER_COMPOSE up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização do container..."
sleep 20

# Verificar se o container está rodando
if $DOCKER_COMPOSE ps | grep -q "Up"; then
    echo "✅ Container reconstruído e iniciado com sucesso!"
    echo ""
    echo "🌐 Acesse a API em: http://localhost:3100"
    echo "📊 Health Check: http://localhost:3100/health"
    echo "📚 Documentação: http://localhost:3100/api/docs"
    echo ""
    echo "🔍 Verificando componentes..."
    
    # Verificar se o Playwright está instalado
    echo "  - Playwright:"
    $DOCKER_COMPOSE exec techcast-api npx playwright --version
    
    # Verificar se ts-node está disponível
    echo "  - TypeScript:"
    $DOCKER_COMPOSE exec techcast-api ts-node --version
    
    # Verificar se FFmpeg está disponível
    echo "  - FFmpeg:"
    $DOCKER_COMPOSE exec techcast-api ffmpeg -version | head -1
    
    # Verificar se a API está respondendo
    echo "  - API Health Check:"
    if curl -s http://localhost:3100/health > /dev/null; then
        echo "    ✅ API respondendo corretamente"
    else
        echo "    ⚠️ API não está respondendo ainda (pode demorar alguns segundos)"
    fi
    
    echo ""
    echo "🎉 Rebuild concluído com sucesso!"
    echo ""
    echo "📋 Comandos úteis:"
    echo "   npm run docker:test       # Testar Playwright"
    echo "   npm run docker:logs       # Ver logs"
    echo "   npm run docker:shell      # Acessar shell"
    echo "   docker-compose exec techcast-api npm run scraper  # Executar scraper"
else
    echo "❌ Erro ao iniciar o container. Verifique os logs:"
    echo "   $DOCKER_COMPOSE logs"
    exit 1
fi 