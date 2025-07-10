import express from 'express';
import { FullPipeline } from '../../full-pipeline';

const router = express.Router();

/**
 * @route GET /api/pipeline/execute
 * @desc Executa o pipeline completo sequencialmente
 * @access Public
 */
router.get('/execute', async (req, res) => {
  try {
    console.log('🚀 Iniciando execução do pipeline completo...');
    
    const pipeline = new FullPipeline();
    
    // Executar o pipeline
    await pipeline.run();

    res.json({
      success: true,
      message: 'Pipeline completo executado com sucesso!',
      data: {
        timestamp: new Date().toISOString(),
        status: 'completed',
        steps: [
          'scraping',
          'translation',
          'script-generation',
          'audio-generation',
          'video-generation',
          'youtube-upload'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Erro na execução do pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Erro durante a execução do pipeline',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * @route GET /api/pipeline/status
 * @desc Retorna o status atual do pipeline
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    // Verificar se os arquivos do pipeline existem
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    const fs = require('fs');
    const path = require('path');
    
    const files = {
      news: `output/news/news_${dateString}.json`,
      script: `output/roteiro/roteiro_podcast_${dateString}.txt`,
      audio: `output/audio/audio_${dateString}.mp3`,
      video: `output/video/podcast_video_${dateString}.mp4`
    };
    
    const status = {
      news: fs.existsSync(files.news),
      script: fs.existsSync(files.script),
      audio: fs.existsSync(files.audio),
      video: fs.existsSync(files.video)
    };
    
    const completedSteps = Object.values(status).filter(Boolean).length;
    const totalSteps = Object.keys(status).length;
    
    res.json({
      success: true,
      message: `Status do pipeline para ${dateString}`,
      data: {
        date: dateString,
        status,
        progress: {
          completed: completedSteps,
          total: totalSteps,
          percentage: Math.round((completedSteps / totalSteps) * 100)
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status do pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status do pipeline',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router; 