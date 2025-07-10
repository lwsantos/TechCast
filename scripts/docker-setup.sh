#!/bin/bash

# Script para configurar e executar o TechCast Scraper com Docker

set -e

echo "🐳 TechCast Scraper - Setup Docker"
echo "=================================="

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

# Verificar arquivos necessários
echo "📋 Verificando arquivos necessários..."

if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado. Copie o env.example e configure suas credenciais:"
    echo "   cp env.example .env"
    echo "   # Edite o arquivo .env com suas configurações"
    exit 1
fi

if [ ! -f "TechCast.png" ]; then
    echo "❌ Arquivo TechCast.png não encontrado. Este arquivo é necessário para gerar os vídeos."
    exit 1
fi

if [ ! -d "credentials" ]; then
    echo "❌ Pasta credentials não encontrada. Crie a pasta e adicione suas credenciais do Google Cloud:"
    echo "   mkdir credentials"
    echo "   # Adicione seus arquivos de credenciais na pasta credentials/"
    exit 1
fi

echo "✅ Todos os arquivos necessários encontrados!"

# Criar diretórios de saída se não existirem
echo "📁 Criando diretórios de saída..."
mkdir -p output/news output/podcast output/audio output/video

# Build da imagem
echo "🔨 Fazendo build da imagem Docker..."
$DOCKER_COMPOSE build

# Executar o container
echo "🚀 Iniciando o container..."
$DOCKER_COMPOSE up -d

# Aguardar um pouco para o container inicializar
echo "⏳ Aguardando inicialização do container..."
sleep 10

# Verificar se o container está rodando
if $DOCKER_COMPOSE ps | grep -q "Up"; then
    echo "✅ Container iniciado com sucesso!"
    echo ""
    echo "🌐 Acesse a API em: http://localhost:3000"
    echo "📊 Health Check: http://localhost:3000/health"
    echo "📚 Documentação: http://localhost:3000/api/docs"
    echo ""
    echo "📋 Comandos úteis:"
    echo "   $DOCKER_COMPOSE logs -f          # Ver logs em tempo real"
    echo "   $DOCKER_COMPOSE down             # Parar o container"
    echo "   $DOCKER_COMPOSE exec techcast-api npm run scraper  # Executar scraper"
    echo "   $DOCKER_COMPOSE exec techcast-api sh               # Acessar shell"
else
    echo "❌ Erro ao iniciar o container. Verifique os logs:"
    echo "   $DOCKER_COMPOSE logs"
    exit 1
fi 