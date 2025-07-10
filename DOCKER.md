# TechCast Scraper - Docker

Este documento explica como executar o TechCast Scraper usando Docker.

## 🐳 Pré-requisitos

- Docker instalado
- Docker Compose (incluído nas versões mais recentes do Docker Desktop)
- Arquivo `.env` configurado
- Arquivo `TechCast.png` presente
- Pasta `credentials/` com credenciais do Google Cloud
- **Opcional:** Bot do Telegram para notificações

## 📱 Configuração do Telegram (Opcional)

Para receber notificações sobre o progresso do pipeline:

1. **Criar bot:** Use @BotFather no Telegram
2. **Obter chat_id:** Envie mensagem para o bot e use `https://api.telegram.org/botSEU_TOKEN/getUpdates`
3. **Configurar .env:**
   ```bash
   TELEGRAM_BOT_TOKEN=seu-token-aqui
   TELEGRAM_CHAT_ID=seu-chat-id-aqui
   ```

**Documentação completa:** Veja a seção "Configuração do Telegram" no README.md

## 🚀 Instalação Rápida

### 1. Configuração Inicial

```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar configurações
nano .env
```

### 2. Executar Setup Automático

```bash
# Executar script de setup completo
npm run docker:setup
```

O script irá:
- Verificar se Docker está instalado
- Verificar arquivos necessários
- Fazer build da imagem
- Iniciar o container
- Verificar se está funcionando

## 🔧 Comandos Disponíveis

### Scripts NPM (Recomendado)
```bash
npm run docker:build    # Build da imagem
npm run docker:up       # Iniciar container
npm run docker:down     # Parar container
npm run docker:logs     # Ver logs
npm run docker:setup    # Setup completo
npm run docker:restart  # Reiniciar container
npm run docker:shell    # Acessar shell
```

### Comandos Docker Compose Diretos
```bash
# Versão antiga
docker-compose build
docker-compose up -d
docker-compose down

# Versão nova
docker compose build
docker compose up -d
docker compose down
```

## 📁 Estrutura de Volumes

O container monta os seguintes volumes:

- `./output` → `/app/output` - Arquivos gerados (notícias, áudios, vídeos)
- `./.env` → `/app/.env` - Configurações

## 🌐 Acessos

- **API:** http://localhost:3100
- **Health Check:** http://localhost:3100/health
- **Documentação:** http://localhost:3100/api/docs

## 🔍 Troubleshooting

### Container não inicia
```bash
# Verificar logs
npm run docker:logs

# Verificar status
docker ps -a
```

### Erro de permissão
```bash
# Dar permissão aos scripts
chmod +x scripts/*.sh
```

### Rebuild após mudanças
```bash
# Rebuild completo
npm run docker:build
npm run docker:up
```

### Executar comandos específicos
```bash
# Acessar shell do container
npm run docker:shell

# Dentro do container
npm run scraper
npm run translate
npm run podcast
npm run audio
npm run video
npm run upload
npm run pipeline  # Pipeline completo
```

## 📋 Verificações

### Antes de executar
- [ ] Docker instalado e funcionando
- [ ] Arquivo `.env` configurado
- [ ] Arquivo `TechCast.png` presente
- [ ] Pasta `credentials/` com credenciais
- [ ] Porta 3100 disponível
- [ ] **Opcional:** Bot do Telegram configurado

### Após execução
- [ ] Container rodando (`docker ps`)
- [ ] API respondendo (`curl http://localhost:3100/health`)
- [ ] Logs sem erros (`npm run docker:logs`)

## 🔄 Atualizações

Para atualizar o código:

```bash
# Parar container
npm run docker:down

# Rebuild com mudanças
npm run docker:build

# Iniciar novamente
npm run docker:up
```

## 🗑️ Limpeza

```bash
# Parar e remover container
npm run docker:down

# Remover imagem
docker rmi scraper-techcrunch_techcast-api

# Limpar volumes (cuidado: remove dados)
docker volume prune
``` 