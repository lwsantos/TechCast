# TechCrunch Scraper

Um web scraper em TypeScript/Node.js para extrair notícias do site TechCrunch e traduzi-las para português.

## 🎯 Objetivo

O scraper extrai as seguintes informações das notícias mais recentes:

1. **Título da Notícia:** O título principal do artigo
2. **URL do Artigo:** O link direto para a notícia completa
3. **Data de Publicação:** A data em que a notícia foi publicada
4. **Autor:** O nome do autor do artigo (quando disponível)
5. **Conteúdo Principal:** O texto completo do corpo da notícia

E o tradutor adiciona:
6. **Título Traduzido:** Versão em português do título
7. **Conteúdo Traduzido:** Versão em português do conteúdo

## 📋 Pré-requisitos

### Para Instalação Local
- Node.js versão 22 ou superior (recomendamos usar NVM para gerenciar versões)
- npm ou yarn
- FFmpeg instalado no sistema
- Conta no Google Cloud Platform com Translation API habilitada
- Arquivo de credenciais do Google Cloud (`podcast-tech-news-key.json`)
- **Opcional:** Bot do Telegram para notificações

### Para Instalação com Docker
- Docker e Docker Compose instalados
- Conta no Google Cloud Platform com Translation API habilitada
- Arquivo de credenciais do Google Cloud (`podcast-tech-news-key.json`)
- **Opcional:** Bot do Telegram para notificações
- **Nota:** FFmpeg será instalado automaticamente no container

### Configurando o Node.js 22 com NVM

```bash
# Instalar Node.js 22
nvm install 22

# Usar Node.js 22
nvm use 22

# Definir Node.js 22 como padrão (opcional)
nvm alias default 22
```

### Configurando o Google Cloud APIs

1. Crie um projeto no Google Cloud Console
2. Habilite as seguintes APIs:
   - Google Cloud Translation API (para tradução tradicional)
   - Google AI Studio (Gemini) - **Recomendado para tradução econômica**
   - Google Cloud Text-to-Speech API
   - YouTube Data API v3
3. Crie uma conta de serviço e baixe o arquivo JSON de credenciais
4. Coloque o arquivo de credenciais na raiz do projeto como `podcast-tech-news-key.json`
5. Configure as variáveis de ambiente:

```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas configurações
GOOGLE_API_KEY=sua-api-key-aqui
GOOGLE_CLOUD_PROJECT_ID=seu-project-id-aqui
GEMINI_API_KEY=sua-chave-do-gemini-aqui
```

**Nota:** 
- O tradutor original usa o arquivo `podcast-tech-news-key.json`
- O tradutor Gemini usa a `GEMINI_API_KEY` (mais econômico)
- O gerador de podcast e o gerador de áudio usam a `GOOGLE_API_KEY`

### 🚀 Configurando Gemini AI para Tradução Econômica

Para usar o Gemini AI (97.5% mais barato que Google Translate):

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login e crie uma API Key
3. Adicione no `.env`: `GEMINI_API_KEY=sua-chave-aqui`
4. Teste a conexão: `npm run test:gemini`
5. Use para tradução: `npm run translate:gemini`

Veja mais detalhes em [GEMINI_TRANSLATION.md](./GEMINI_TRANSLATION.md)

### 🔐 Autorização do YouTube

Para fazer upload de vídeos diretamente para o YouTube, você precisa configurar a autorização OAuth2:

#### 1. Configurar Credenciais OAuth2

1. No Google Cloud Console, vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure o tipo de aplicativo como "Desktop application"
4. Baixe o arquivo JSON de credenciais
5. Renomeie para `oAuthCredentials.json` e coloque na pasta `credentials/`

#### 2. Executar Script de Autorização

```bash
# Executar o script de autorização
npm run token
```

#### 3. Processo de Autorização

O script seguirá estes passos:

1. **URL de Autorização:** O script imprimirá uma URL no console
2. **Abertura Automática:** Tentará abrir essa URL no seu navegador padrão
3. **Login Google:** No navegador, faça login na conta do Google associada ao canal do YouTube
4. **Tela de Consentimento:** Você verá a tela de permissão OAuth configurada no Google Cloud Console
5. **Permitir Acesso:** Clique em "Permitir" para autorizar o aplicativo
6. **Código de Autorização:** Uma página com um código será exibida
7. **Copiar Código:** Copie o código de autorização
8. **Colar no Terminal:** Volte ao terminal, cole o código quando solicitado e pressione Enter

#### 4. Resultado

Após a autorização bem-sucedida:
- O `refresh_token` será exibido no console
- Os tokens serão salvos automaticamente em `credentials/youtube_token.json`
- Este token permitirá uploads futuros sem reautorização

**⚠️ Importante:** Guarde o `refresh_token` de forma segura. Ele é válido até que você revogue o acesso no Google Cloud Console.

### 📱 Configuração do Telegram

Para receber notificações sobre o progresso do pipeline, você pode configurar um bot do Telegram:

#### 1. Criar um Bot no Telegram

1. **Abra seu aplicativo Telegram**
2. **Procure por @BotFather** na barra de pesquisa
3. **Inicie uma conversa** com ele e use o comando `/newbot`
4. **Siga as instruções** para dar um nome ao seu bot (ex: "TechCast Notifier Bot") e um username (deve terminar com "bot", ex: "TechCastNotifier_bot")
5. **@BotFather lhe dará um HTTP API Token** (uma longa sequência de caracteres, ex: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`). Este é o token que seu script Node.js usará para enviar mensagens. **Guarde-o com segurança**

#### 2. Obter o Chat ID

Você precisa saber para qual chat o bot deve enviar as mensagens:

**Para conversa privada:**
1. **Inicie uma conversa** com o seu recém-criado bot no Telegram
2. **Mande qualquer mensagem** para ele (ex: "Olá")
3. **Abra a URL** no seu navegador (substituindo `SEU_BOT_TOKEN` pelo token que você obteve do BotFather):
   ```
   https://api.telegram.org/botSEU_BOT_TOKEN/getUpdates
   ```
4. **Procure por "chat"** e, dentro dele, o "id" numérico (ex: `123456789`). Este é o seu `chat_id`

**Para grupos:**
- Adicione o bot ao grupo
- Mande uma mensagem no grupo
- Use a mesma URL acima - o `chat_id` de um grupo é negativo

#### 3. Configurar as Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# Telegram Configuration
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789
```

#### 4. Testar a Configuração

Execute o scraper para testar se as notificações estão funcionando:

```bash
npm run scraper
```

Você deve receber mensagens no Telegram sobre:
- Início do scraping
- Conclusão do scraping
- Erros (se houver)

#### 5. Exemplos de Mensagens

O bot enviará mensagens como:
```
🚀 Scraping de notícias iniciado...
✅ Scraping concluído! 15 artigos coletados
❌ Erro durante o scraping: [detalhes do erro]
```

#### Observações Importantes

- **Segurança:** Nunca compartilhe seu bot token publicamente
- **Grupos:** Para enviar mensagens em grupos, o bot precisa ter permissões de administrador
- **Limites:** O Telegram tem limites de taxa para envio de mensagens
- **Formatação:** As mensagens usam MarkdownV2 para formatação (caracteres especiais são escapados automaticamente)

## 🚀 Instalação

### Opção 1: Instalação Local

1. Clone ou baixe este repositório
2. Certifique-se de estar usando Node.js 22:
   ```bash
   node --version
   # Deve mostrar v22.x.x
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Configure as variáveis de ambiente (veja seção acima)

### Opção 2: Instalação com Docker (Recomendado)

**📖 Documentação completa:** [DOCKER.md](./DOCKER.md)

#### Pré-requisitos
- Docker e Docker Compose instalados
- FFmpeg será instalado automaticamente no container

#### Configuração
1. Clone ou baixe este repositório
2. Configure o arquivo `.env` com suas credenciais
3. Certifique-se de que os arquivos necessários estão presentes:
   - `TechCast.png` (imagem para o vídeo)
   - `credentials/` (pasta com credenciais do Google Cloud)
   - `.env` (variáveis de ambiente)
   - **Opcional:** Configurar bot do Telegram para notificações

#### Build e Execução

**Método 1: Script Automático (Recomendado)**
```bash
# Executar script de setup completo
npm run docker:setup
```

**Método 2: Comandos Manuais**
```bash
# Build da imagem
npm run docker:build

# Executar o container
npm run docker:up

# Ver logs
npm run docker:logs

# Parar o container
npm run docker:down
```

**Comandos NPM Disponíveis:**
- `npm run docker:build` - Build da imagem
- `npm run docker:up` - Iniciar container
- `npm run docker:down` - Parar container
- `npm run docker:logs` - Ver logs
- `npm run docker:setup` - Setup completo automático
- `npm run docker:restart` - Reiniciar container
- `npm run docker:shell` - Acessar shell do container

#### Acessar a API
- API: `http://localhost:3100`
- Health Check: `http://localhost:3100/health`
- Documentação: `http://localhost:3100/api/docs`

#### Volumes Montados
- `./output` → `/app/output` (arquivos gerados)
- `./.env` → `/app/.env` (configurações)

#### Comandos Úteis
```bash
# Executar comando específico no container
npm run docker:shell
# Dentro do container: npm run scraper

# Ou executar diretamente (se docker-compose estiver disponível)
docker-compose exec techcast-api npm run scraper
# Ou (versão mais recente do Docker)
docker compose exec techcast-api npm run scraper

# Acessar shell do container
npm run docker:shell

# Rebuild após mudanças no código
npm run docker:build
npm run docker:up

# Ver logs em tempo real
npm run docker:logs

# Reiniciar container
npm run docker:restart
```

## 🏃‍♂️ Como usar

### 🎯 Pipeline Completo (Recomendado)

Execute todas as etapas de uma vez (scraper + tradução + roteiro + áudio + vídeo + upload):

```bash
npm run pipeline
```

**Nota:** O upload para YouTube é opcional e pode falhar se as credenciais OAuth2 não estiverem configuradas. Nesse caso, o pipeline continuará normalmente e você pode fazer o upload manualmente com `npm run upload`.

### 📱 Notificações do Pipeline

Se você configurou o bot do Telegram, receberá notificações sobre:

- **Início de cada etapa** do pipeline
- **Conclusão bem-sucedida** de cada etapa
- **Erros** durante a execução
- **Resumo final** do pipeline

**Exemplo de notificações:**
```
🚀 Pipeline iniciado...
📰 Scraping de notícias iniciado...
✅ Scraping concluído! 15 artigos coletados
🌐 Tradução iniciada...
✅ Tradução concluída!
🎙️ Geração de roteiro iniciada...
✅ Roteiro gerado com sucesso!
🔊 Geração de áudio iniciada...
✅ Áudio gerado com sucesso!
🎬 Geração de vídeo iniciada...
✅ Vídeo gerado com sucesso!
📤 Upload para YouTube iniciado...
✅ Upload concluído! Vídeo disponível em: https://youtube.com/watch?v=...
🎉 Pipeline concluído com sucesso!
```

### 🔧 Execução Individual

Você também pode executar cada etapa separadamente:

#### 1. Extrair notícias do TechCrunch
```bash
npm run scraper
```

#### 2. Traduzir as notícias para português
```bash
npm run translate
```

#### 3. Gerar roteiro do podcast
```bash
npm run podcast
```

#### 4. Gerar áudio do podcast
```bash
npm run audio
```

#### 5. Gerar vídeo para YouTube
```bash
npm run video
```

#### 6. Fazer upload para YouTube (opcional)
```bash
npm run upload
```

### 🌐 API RESTful

O projeto inclui uma API RESTful completa para automatizar todas as operações:

#### Iniciar a API
```bash
npm run api
```

A API estará disponível em: `http://localhost:3100`

#### Endpoints Disponíveis

**Health Check:**
- `GET /api/health` - Verificar status da API

**Cron:**
- `GET /api/cron/next-execution` - Verificar próxima execução programada do cron

**Notícias:**
- `GET /api/news/scrape` - Iniciar scraping de notícias
- `GET /api/news/translate` - Traduzir notícias

**Podcast:**
- `GET /api/podcast/generate-script` - Gerar roteiro do podcast
- `GET /api/podcast/generate-audio` - Gerar áudio do podcast
- `GET /api/podcast/generate-video` - Gerar vídeo do podcast

**YouTube:**
- `POST /api/youtube/upload` - Upload para YouTube
- `GET /api/youtube/upload` - Upload para YouTube (método GET)

**Pipeline:**
- `GET /api/pipeline/execute` - Executar pipeline completo
- `GET /api/pipeline/status` - Verificar status do pipeline

**Output:**
- `GET /api/output/list` - Listar todos os arquivos gerados
- `GET /api/output/download/:type/:filename` - Download de arquivos

**Documentação:**
- `GET /api/docs` - Documentação completa da API

#### Exemplos de Uso

```bash
# Executar pipeline completo via API
curl -X GET http://localhost:3100/api/pipeline/execute

# Verificar próxima execução do cron
curl -X GET http://localhost:3100/api/cron/next-execution

# Listar todos os arquivos gerados
curl -X GET http://localhost:3100/api/output/list

# Fazer upload para YouTube
curl -X POST http://localhost:3100/api/youtube/upload

# Download de um vídeo específico
curl -X GET http://localhost:3100/api/output/download/video/podcast_video_2025-01-08.mp4
```

### Modo watch (desenvolvimento)

```bash
# Compilar em modo watch
npm run watch
```

### Limpar arquivos compilados

```bash
npm run clean
```

### ⏰ Agendamento Automático (Cron Integrado)

O pipeline é executado automaticamente todos os dias no horário configurado (padrão: **20:00** no timezone de São Paulo) pelo cron job integrado ao servidor Express da API.

#### Configuração do Cron

As configurações do cron podem ser alteradas via variáveis de ambiente:

```bash
# Horário de execução (formato HH:MM)
CRON_EXECUTION_TIME=20:00

# Timezone para execução
CRON_TIMEZONE=America/Sao_Paulo
```

**Exemplos de configuração:**
- `CRON_EXECUTION_TIME=08:00` - Executar às 8h da manhã
- `CRON_EXECUTION_TIME=22:30` - Executar às 22h30
- `CRON_TIMEZONE=America/New_York` - Usar timezone de Nova York

- **Agendamento:** Não é necessário configurar scripts externos ou systemd/launchd.
- **Timezone:** America/Sao_Paulo (GMT-3, considera horário de verão automaticamente)
- **Evita execuções simultâneas:** O pipeline não será iniciado se já estiver rodando.
- **Logs:** Toda execução do pipeline via cron é logada no console do servidor.
- **Execução manual:** Você pode disparar o pipeline manualmente via API a qualquer momento.



#### Exemplo de resposta do status:

```json
{
  "success": true,
  "message": "Status do cron job",
  "data": {
    "isRunning": false,
    "nextExecution": "09/07/2025 20:00:00",
    "schedule": "Todos os dias no horário configurado (padrão: 20:00)",
    "timezone": "America/Sao_Paulo",
    "cronExpression": "0 20 * * *"
  }
}
```

#### Exemplo de resposta da próxima execução:

```json
{
  "success": true,
  "message": "Próxima execução do cron",
  "data": {
    "nextExecution": "09/07/2025 20:00:00",
    "schedule": "Todos os dias no horário configurado (padrão: 20:00)",
    "timezone": "America/Sao_Paulo",
    "cronExpression": "0 20 * * *",
    "timestamp": "2025-07-09T17:30:00.000Z"
  }
}
```

#### Como funciona a próxima execução
- Se o horário atual for **antes do horário configurado**, a próxima execução é hoje no horário configurado.
- Se for **após o horário configurado**, a próxima execução é amanhã no horário configurado.

#### Logs de execução

No console do servidor, você verá logs como:
```
⏰ Cron job configurado: Pipeline executará todos os dias no horário configurado (padrão: 20:00)
⏰ Expressão cron: 0 20 * * *
⏰ Próxima execução: 09/07/2025 20:00:00
🕐 ==========================================
🕐 EXECUÇÃO CRON INICIADA
📅 Data/Hora: 09/07/2025 20:00:00
🕐 ==========================================
... (etapas do pipeline) ...
✅ ==========================================
✅ EXECUÇÃO CRON CONCLUÍDA COM SUCESSO
📅 Data/Hora: 09/07/2025 20:15:30
✅ ==========================================
```

#### Execução manual

Você pode disparar o pipeline manualmente a qualquer momento:
```bash
curl -X GET http://localhost:3100/api/pipeline/execute
```

O pipeline será executado sequencialmente e você receberá o status de cada etapa.

#### Observação
- O cron é inicializado automaticamente junto com a API (`npm run api`).
- Não é necessário configurar crontab do sistema.
- O agendamento é robusto e não executa em duplicidade.

## 📁 Estrutura do Projeto

```
SCRAPER-TECHCRUNCH/
├── src/
│   ├── scraper.ts                    # Código principal do scraper
│   ├── scraper-index.ts              # Script de execução do scraper
│   ├── translator.ts                 # Código do tradutor
│   ├── translator-index.ts           # Script de execução do tradutor
│   ├── podcast-generator.ts          # Código do gerador de roteiro de podcast
│   ├── podcast-generator-index.ts    # Script de execução do gerador de podcast
│   ├── audio-generator.ts            # Código do gerador de áudio MP3
│   ├── audio-generator-index.ts      # Script de execução do gerador de áudio
│   ├── merge-audio-image.ts          # Código do gerador de vídeo MP4
│   ├── merge-audio-image-index.ts    # Script de execução do gerador de vídeo
│   ├── upload_to_youtube.ts          # Código do upload para YouTube
│   ├── upload_to_youtube_index.ts    # Script de execução do upload
│   ├── get_refresh_token.ts          # Script de autorização OAuth2
│   ├── full-pipeline.ts              # Pipeline completo (todas as etapas)
│   ├── api-index.ts                  # Script de inicialização da API
│   ├── api/                          # API RESTful
│   │   ├── server.ts                 # Servidor Express principal
│   │   ├── docs.ts                   # Documentação da API
│   │   └── routes/                   # Rotas da API
│   │       ├── news.ts               # Rotas de notícias
│   │       ├── podcast.ts            # Rotas de podcast
│   │       ├── youtube.ts            # Rotas do YouTube
│   │       ├── pipeline.ts           # Rotas do pipeline
│   │       └── output.ts             # Rotas de output
│   └── types.ts                      # Definições de tipos TypeScript
├── dist/                    # Código compilado (gerado automaticamente)
├── package.json             # Dependências e scripts
├── tsconfig.json            # Configuração do TypeScript
├── env.example              # Exemplo de variáveis de ambiente
├── README.md                # Este arquivo
├── credentials/
│   ├── podcast-tech-news-key.json # Credenciais do Google Cloud (Translation, TTS, Gemini)
│   ├── oAuthCredentials.json # Credenciais OAuth2 para YouTube (opcional)
│   └── youtube_token.json # Tokens de acesso do YouTube (gerado automaticamente)
├── output/
│   ├── news/
│   │   └── news_YYYY-MM-DD.json # Artigos originais e traduzidos (gerado automaticamente)
│   ├── roteiro/
│   │   └── roteiro_podcast_YYYY-MM-DD.txt # Roteiro do podcast (gerado automaticamente)
│   ├── audio/
│   │   └── audio_YYYY-MM-DD.mp3 # Podcast em áudio (gerado automaticamente)
│   └── video/
│       └── podcast_video_YYYY-MM-DD.mp4 # Vídeo para YouTube (gerado automaticamente)
```

## 📊 Formatos de Saída

### Scraper e Tradutor (`output/news/news_YYYY-MM-DD.json`)

```json
{
  "dataColeta": "2025-01-08T10:30:00.000Z",
  "dataTraducao": "2025-01-08T10:35:00.000Z",
  "totalArtigos": 16,
  "artigos": [
    {
      "titulo": "Name of News",
      "url": "https://techcrunch.com/2025/01/08/news-example/",
      "dataPublicacao": "2025-01-08",
      "autor": "Author Name",
      "conteudo": "Paragraph 1 of the article... Paragraph 2...",
      "tituloTraduzido": "Nome da Notícia",
      "conteudoTraduzido": "Parágrafo 1 do artigo... Parágrafo 2..."
    }
  ]
}
```

### Gerador de Podcast (`output/roteiro/roteiro_podcast_YYYY-MM-DD.txt`)

```
ROTEIRO DE PODCAST - TECHCRUNCH
Data: 08/07/2025
Gerado automaticamente com Gemini AI
=====================================

João: E aí, galera! Sejam bem-vindos mais uma vez ao TechCast...

Maria: Tudo joia, João! E hoje o papo vai ser quente, hein?...

João: Começando com uma bomba: "Em um golpe para o Google Cloud..."
```

### Gerador de Áudio (`output/audio/audio_YYYY-MM-DD.mp3`)

Arquivo de áudio MP3 contendo o podcast completo com:
- Voz masculina (João) usando `pt-BR-Wavenet-B`
- Voz feminina (Maria) usando `pt-BR-Wavenet-A`
- Sequência mantida conforme o roteiro original

### Gerador de Vídeo (`output/video/podcast_video_YYYY-MM-DD.mp4`)

Arquivo de vídeo MP4 otimizado para YouTube contendo:
- Áudio do podcast sincronizado
- Imagem estática da capa (`TechCast.png`) durante toda a duração
- Codec H.264 para máxima compatibilidade
- Qualidade otimizada para upload no YouTube

### Upload para YouTube

O script de upload:
- Carrega automaticamente o vídeo do dia atual
- Autentica-se usando OAuth2 com refresh_token
- Faz upload com metadados otimizados:
  - Título: "TechCast: Notícias do dia DD/MM/YYYY"
  - Descrição rica com hashtags e informações
  - Tags relevantes para SEO
  - Categoria: Ciência e Tecnologia
  - Visibilidade: Público
- Mostra progresso do upload em tempo real
- Exibe URL do vídeo após conclusão

### API RESTful

A API RESTful oferece:
- **Endpoints individuais** para cada etapa do pipeline
- **Pipeline completo** via API
- **Listagem de arquivos** com ordenação por data
- **Download de arquivos** específicos
- **Status do pipeline** em tempo real
- **Documentação automática** em JSON
- **Tratamento de erros** robusto
- **Respostas padronizadas** em JSON
- **CORS habilitado** para integração frontend
- **Logs detalhados** de todas as operações

## ⚙️ Configurações

### Scraper

Você pode modificar as configurações passando um objeto de configuração para o construtor:

```typescript
import { TechCrunchScraper } from './src/scraper.js';

const scraper = new TechCrunchScraper({
  delay: 2000,        // Delay entre requisições (ms)
  maxArticles: 15,    // Número máximo de artigos
  timeout: 15000,     // Timeout das requisições (ms)
  retries: 5          // Número de tentativas
});
```

### Tradutor

O tradutor usa as seguintes configurações padrão:
- **Delay entre traduções:** 1000ms (para evitar rate limiting)
- **Idioma de origem:** Inglês (en)
- **Idioma de destino:** Português (pt)
- **MIME Type:** text/plain

## 🛡️ Recursos de Robustez

### Scraper
- **Retry automático:** Tentativas múltiplas em caso de falha de rede
- **Headers realistas:** Simula um navegador real para evitar bloqueios
- **Tratamento de erros:** Captura e trata erros de rede e parsing
- **Delay entre requisições:** Evita sobrecarregar o servidor
- **Filtros de conteúdo:** Remove anúncios, scripts e elementos indesejados
- **Seletores robustos:** Múltiplos seletores para diferentes layouts
- **Tipagem forte:** TypeScript garante maior segurança e melhor DX

### Tradutor
- **Tratamento de erros:** Continua processando mesmo se uma tradução falhar
- **Rate limiting:** Delay entre traduções para respeitar limites da API
- **Fallback:** Mantém texto original em caso de erro
- **Validação de credenciais:** Verifica se as credenciais estão configuradas
- **Extração automática do Project ID:** Extrai do arquivo de credenciais se não configurado

### Gerador de Podcast
- **IA generativa:** Usa Gemini AI para criar roteiros naturais e envolventes
- **Formato de diálogo:** Simula conversa entre dois apresentadores
- **Tom informal:** Linguagem acessível e amigável
- **Estrutura consistente:** Introdução, desenvolvimento e conclusão

### Gerador de Áudio
- **Vozes distintas:** Voz masculina para João, feminina para Maria
- **Qualidade Wavenet:** Usa vozes de alta qualidade do Google Cloud TTS
- **Concatenação automática:** FFmpeg combina todos os segmentos
- **Limpeza automática:** Remove arquivos temporários após conclusão
- **Rate limiting:** Delay entre gerações para evitar limites da API

### Gerador de Vídeo
- **Mesclagem automática:** Combina áudio MP3 com imagem PNG
- **Otimização para YouTube:** Codec H.264, formato MP4, qualidade AAC
- **Imagem estática:** Exibe a capa durante toda a duração do áudio
- **Compatibilidade máxima:** Formato de pixel yuv420p para todos os players
- **Qualidade profissional:** Bitrate de 192k para áudio de alta qualidade

### Pipeline Completo
- **Execução sequencial:** Scraper → Tradução → Roteiro → Áudio → Vídeo → Upload
- **Validação de dados:** Verifica se há artigos antes de cada etapa
- **Tratamento de erros:** Captura erros em todas as etapas
- **Upload opcional:** Upload para YouTube é opcional e não interrompe o pipeline
- **Feedback visual:** Mostra progresso de cada etapa
- **Execução individual:** Cada etapa pode ser executada separadamente

### API RESTful
- **Endpoints RESTful:** Todos os comandos disponíveis via HTTP
- **Execução remota:** Pipeline pode ser executado remotamente
- **Integração fácil:** Compatível com qualquer frontend ou sistema
- **Documentação automática:** Endpoint `/api/docs` com documentação completa
- **Status em tempo real:** Endpoint `/api/pipeline/status` para monitoramento
- **Download de arquivos:** Endpoint para download direto de arquivos gerados
- **Ordenação inteligente:** Arquivos listados por data de modificação (mais recentes primeiro)

## 🔧 Desenvolvimento

### Scripts disponíveis:

- `npm run scraper` - Executa apenas o scraper (coleta notícias)
- `npm run translate` - Executa apenas o tradutor (traduz notícias usando Google Translate)
- `npm run translate:gemini` - Executa o tradutor usando Gemini AI (mais econômico)
- `npm run test:gemini` - Testa a conexão com Gemini AI
- `npm run podcast` - Gera roteiro do podcast usando Gemini AI
- `npm run audio` - Converte roteiro em arquivo de áudio MP3
- `npm run video` - Gera vídeo MP4 para YouTube (áudio + imagem)
- `npm run upload` - Faz upload do vídeo para o YouTube (requer autorização OAuth2)
- `npm run full-pipeline` - Executa pipeline completo (scraper + tradução + podcast + áudio + vídeo + upload)
- `npm run token` - Configura autorização OAuth2 para upload no YouTube
- `npm run api` - Inicia a API RESTful (porta 3100)
- `npm run build` - Compila TypeScript para JavaScript
- `npm run watch` - Compila em modo watch
- `npm run clean` - Remove arquivos compilados

### Estrutura de tipos:

```typescript
interface Article {
  titulo: string;
  url: string;
  dataPublicacao: string;
  autor: string;
  conteudo: string;
}

interface TranslatedArticle extends Article {
  tituloTraduzido: string;
  conteudoTraduzido: string;
}

interface ScraperConfig {
  baseUrl: string;
  delay: number;
  maxArticles: number;
  timeout: number;
  retries: number;
}
```

## ⚠️ Considerações Importantes

1. **Respeite os termos de uso:** Use este scraper de forma responsável e respeite os termos de uso do TechCrunch
2. **Rate limiting:** O scraper inclui delays para não sobrecarregar o servidor
3. **Custos da API:** O Google Cloud Translation API tem custos associados. Monitore seu uso
4. **Uso educacional:** Este projeto é para fins educacionais e de demonstração
5. **Robustez:** O scraper pode precisar de ajustes se o site do TechCrunch mudar sua estrutura
6. **Node.js 22:** Certifique-se de usar a versão correta do Node.js

## 🔧 Solução de Problemas

### Erro de versão do Node.js
```bash
# Verificar versão atual
node --version

# Se não for 22, usar NVM
nvm use 22
```

### Erro de credenciais do Google Cloud
```bash
# Verificar se o arquivo de credenciais existe
ls -la podcast-tech-news-key.json

# Verificar variáveis de ambiente
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $GOOGLE_CLOUD_PROJECT_ID
```

### Erro de rede
- Verifique sua conexão com a internet
- O scraper tentará novamente automaticamente

### Nenhum artigo encontrado
- O site pode ter mudado sua estrutura HTML
- Verifique se o TechCrunch está acessível

### Erro de tradução
- Verifique se a Translation API está habilitada no Google Cloud
- Verifique se as credenciais estão corretas
- Verifique se há créditos disponíveis na conta

### Erro de geração de áudio
- Verifique se o FFmpeg está instalado e acessível no PATH
- Verifique se a Text-to-Speech API está habilitada no Google Cloud
- Verifique se há créditos disponíveis na conta
- Verifique se o arquivo de roteiro existe para a data atual

### Erro de geração de vídeo
- Verifique se o FFmpeg está instalado e acessível no PATH
- Verifique se o arquivo de áudio existe para a data atual
- Verifique se o arquivo `TechCast.png` existe na raiz do projeto
- Verifique se há espaço suficiente em disco para o arquivo de vídeo

### Erro de autorização do YouTube
- Verifique se o arquivo `credentials/oAuthCredentials.json` existe
- Verifique se a YouTube Data API v3 está habilitada no Google Cloud Console
- Verifique se as credenciais OAuth2 estão configuradas como "Desktop application"
- Se o token expirou, execute `npm run token` novamente para renovar
- Verifique se a conta Google tem permissões para o canal do YouTube

### Erro de upload para YouTube
- Verifique se o arquivo de vídeo existe para a data atual
- Verifique se o arquivo `credentials/youtube_token.json` existe e é válido
- Verifique se a YouTube Data API v3 está habilitada no Google Cloud Console
- Verifique se há espaço suficiente em disco para o upload
- Verifique se a conexão com a internet está estável
- Se o upload falhar, tente executar `npm run upload` manualmente

### Erro da API RESTful
- Verifique se a porta 3100 está disponível
- Verifique se todas as dependências estão instaladas (`npm install`)
- Verifique se o arquivo `.env` está configurado corretamente
- Verifique se as credenciais do Google Cloud estão configuradas
- Se a API não iniciar, verifique os logs de erro no console
- Para reiniciar a API, pare o processo e execute `npm run api` novamente

### Erros de TypeScript
```bash
# Verificar erros de compilação
npm run build

# Executar em modo desenvolvimento para ver erros em tempo real
npm run dev
```

## 🚀 Próximos Passos

### Melhorias Futuras
- **Interface Web:** Dashboard para gerenciar o pipeline
- **Agendamento:** Execução automática em horários específicos
- **Notificações:** Webhooks para notificar conclusão de etapas
- **Métricas:** Dashboard com estatísticas de uso
- **Múltiplas fontes:** Suporte a outros sites de notícias
- **Personalização:** Configuração de vozes e estilos de podcast

## 📝 Licença

MIT License - Use livremente para fins educacionais.

## 🤝 Contribuições

Sinta-se à vontade para contribuir com melhorias, correções de bugs ou novas funcionalidades! 