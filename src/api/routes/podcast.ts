import express from 'express';
import { PodcastGenerator } from '../../podcast-generator';
import { AudioGenerator } from '../../audio-generator';
import { AudioImageMerger } from '../../merge-audio-image';

const router = express.Router();

/**
 * @route GET /api/podcast/generate-script
 * @desc Inicia a geração do roteiro do podcast
 * @access Public
 */
router.get('/generate-script', async (req, res) => {
  try {
    console.log('🎙️ Iniciando geração do roteiro do podcast...');
    
    const podcastGenerator = new PodcastGenerator();
    await podcastGenerator.generatePodcast();

    // Obter a data atual para o nome do arquivo
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const fileName = `roteiro_podcast_${dateString}.txt`;

    res.json({
      success: true,
      message: 'Roteiro do podcast gerado com sucesso!',
      data: {
        fileName,
        filePath: `output/roteiro/${fileName}`,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Erro na geração do roteiro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro durante a geração do roteiro',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * @route GET /api/podcast/generate-audio
 * @desc Inicia a geração do arquivo de áudio do podcast
 * @access Public
 */
router.get('/generate-audio', async (req, res) => {
  try {
    console.log('🎵 Iniciando geração do áudio do podcast...');
    
    const audioGenerator = new AudioGenerator();
    await audioGenerator.generatePodcast();

    // Obter a data atual para o nome do arquivo
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const fileName = `audio_${dateString}.mp3`;

    res.json({
      success: true,
      message: 'Áudio do podcast gerado com sucesso!',
      data: {
        fileName,
        filePath: `output/audio/${fileName}`,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Erro na geração do áudio:', error);
    res.status(500).json({
      success: false,
      error: 'Erro durante a geração do áudio',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * @route GET /api/podcast/generate-video
 * @desc Inicia a geração do arquivo de vídeo MP4
 * @access Public
 */
router.get('/generate-video', async (req, res) => {
  try {
    console.log('🎬 Iniciando geração do vídeo do podcast...');
    
    const videoMerger = new AudioImageMerger();
    await videoMerger.mergeAudioWithImage();

    // Obter a data atual para o nome do arquivo
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const fileName = `podcast_video_${dateString}.mp4`;

    res.json({
      success: true,
      message: 'Vídeo do podcast gerado com sucesso!',
      data: {
        fileName,
        filePath: `output/video/${fileName}`,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Erro na geração do vídeo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro durante a geração do vídeo',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router; 