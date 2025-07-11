# Build stage
FROM node:22-slim AS builder

# Instalar dependências necessárias para build
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Instalar navegadores do Playwright
RUN npx playwright install chromium

# Copiar código fonte
COPY src/ ./src/
COPY tsconfig.json ./

# Compilar TypeScript
RUN npm run build

# Production stage
FROM node:22-slim AS production

# Instalar FFmpeg e dependências do Playwright
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências de produção + ts-node para execução
RUN npm ci --only=production && npm install -g ts-node typescript

# Instalar navegadores do Playwright
RUN npx playwright install chromium

# Copiar código compilado do builder
COPY --from=builder /app/dist ./dist

# Copiar código fonte para execução com ts-node
COPY src/ ./src/
COPY tsconfig.json ./

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