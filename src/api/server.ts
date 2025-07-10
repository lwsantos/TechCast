import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as dotenv from 'dotenv';

// Importar rotas
import newsRoutes from './routes/news';
import podcastRoutes from './routes/podcast';
import youtubeRoutes from './routes/youtube';
import pipelineRoutes from './routes/pipeline';
import outputRoutes from './routes/output';
import cronRoutes from './routes/cron';
import docsRoutes from './docs';

import { setupCronJob } from '../cron-pipeline';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3100;


// Middlewares de segurança e logging
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de tratamento de erros global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API TechCast funcionando corretamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rota de health check simples para Docker
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Rotas da API
app.use('/api/news', newsRoutes);
app.use('/api/podcast', podcastRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/output', outputRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/docs', docsRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor TechCast API rodando na porta ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Documentação: http://localhost:${PORT}/api/docs`);
  
  // Configurar cron job após o servidor iniciar
  setupCronJob();
});

export default app; 