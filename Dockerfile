# Build stage
FROM node:22-alpine AS builder

# Instalar dependências necessárias para build
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código fonte
COPY src/ ./src/
COPY tsconfig.json ./

# Compilar TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Instalar FFmpeg e outras dependências necessárias
RUN apk add --no-cache \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar código compilado do builder
COPY --from=builder /app/dist ./dist

# Copiar arquivos necessários
COPY .env ./
COPY TechCast.png ./
COPY credentials/ ./credentials/

# Criar diretórios de saída
RUN mkdir -p output/news output/podcast output/audio output/video

# Expor porta da API
EXPOSE 3100

# Comando padrão para executar a API
CMD ["npm", "start"] 