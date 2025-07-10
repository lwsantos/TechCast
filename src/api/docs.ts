import express from 'express';

const router = express.Router();

/**
 * @route GET /api/docs
 * @desc Documentação da API TechCast
 * @access Public
 */
router.get('/', (req, res) => {
  res.json({
    title: 'TechCast API - Documentação',
    version: '1.0.0',
    description: 'API RESTful para automatização do pipeline de geração e upload de podcasts',
    baseUrl: 'http://localhost:3100',
    endpoints: {
      health: {
        method: 'GET',
        path: '/api/health',
        description: 'Verificar status da API'
      },
      cron: {
        'next-execution': {
          method: 'GET',
          path: '/api/cron/next-execution',
          description: 'Verificar próxima execução programada do cron'
        }
      },

      news: {
        scrape: {
          method: 'GET',
          path: '/api/news/scrape',
          description: 'Inicia o processo de web scraping das notícias do TechCrunch'
        },
        translate: {
          method: 'GET',
          path: '/api/news/translate',
          description: 'Inicia o processo de tradução das notícias'
        }
      },
      podcast: {
        'generate-script': {
          method: 'GET',
          path: '/api/podcast/generate-script',
          description: 'Inicia a geração do roteiro do podcast'
        },
        'generate-audio': {
          method: 'GET',
          path: '/api/podcast/generate-audio',
          description: 'Inicia a geração do arquivo de áudio do podcast'
        },
        'generate-video': {
          method: 'GET',
          path: '/api/podcast/generate-video',
          description: 'Inicia a geração do arquivo de vídeo MP4'
        }
      },
      youtube: {
        upload: {
          method: 'POST',
          path: '/api/youtube/upload',
          description: 'Faz o upload do vídeo para o YouTube',
          body: {
            date: 'string (opcional) - Data no formato YYYY-MM-DD'
          }
        }
      },
      pipeline: {
        execute: {
          method: 'GET',
          path: '/api/pipeline/execute',
          description: 'Executa o pipeline completo sequencialmente'
        },
        status: {
          method: 'GET',
          path: '/api/pipeline/status',
          description: 'Retorna o status atual do pipeline'
        }
      },
      output: {
        list: {
          method: 'GET',
          path: '/api/output/list',
          description: 'Lista todos os arquivos gerados'
        },
        download: {
          method: 'GET',
          path: '/api/output/download/:type/:filename',
          description: 'Download de um arquivo específico',
          params: {
            type: 'string - Tipo do arquivo (news, script, audio, video)',
            filename: 'string - Nome do arquivo'
          }
        }
      }
    },
    examples: {
      'Executar pipeline completo': 'GET /api/pipeline/execute',
      'Verificar status do pipeline': 'GET /api/pipeline/status',
      'Verificar próxima execução do cron': 'GET /api/cron/next-execution',
      'Listar todos os arquivos': 'GET /api/output/list',
      'Upload para YouTube': 'POST /api/youtube/upload',
      'Upload com data específica': 'POST /api/youtube/upload {"date": "2025-01-08"}',
      'Download de vídeo': 'GET /api/output/download/video/podcast_video_2025-01-08.mp4'
    },
    responseFormat: {
      success: 'boolean',
      message: 'string',
      data: 'object',
      error: 'string (apenas em caso de erro)'
    }
  });
});

export default router; 