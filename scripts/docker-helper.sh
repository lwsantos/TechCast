#!/bin/bash

# Helper script para detectar e usar o comando correto do Docker Compose

# Definir comando do Docker Compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Executar o comando passado como argumento
$DOCKER_COMPOSE "$@" 