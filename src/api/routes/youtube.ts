import express from 'express';
import { YouTubeUploader } from '../../upload_to_youtube';

const router = express.Router();

interface UploadRequest {
  date?: string; // YYYY-MM-DD
}

/**
 * @route POST /api/youtube/upload
 * @desc Faz o upload do vídeo para o YouTube
 * @access Public
 */
router.post('/upload', async (req, res) => {
  try {
    const { date }: UploadRequest = req.body;
    
    console.log('📤 Iniciando upload para YouTube...');
    
    const uploader = new YouTubeUploader();
    
    // Se uma data específica foi fornecida, modificar o comportamento
    if (date) {
      console.log(`📅 Upload solicitado para a data: ${date}`);
      // TODO: Implementar lógica para data específica se necessário
    }
    
    // Fazer o upload
    await uploader.upload();

    res.json({
      success: true,
      message: 'Upload para YouTube concluído com sucesso!',
      data: {
        timestamp: new Date().toISOString(),
        status: 'completed',
        date: date || new Date().toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('❌ Erro no upload para YouTube:', error);
    res.status(500).json({
      success: false,
      error: 'Erro durante o upload para YouTube',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * @route GET /api/youtube/upload
 * @desc Faz o upload do vídeo para o YouTube (método GET para compatibilidade)
 * @access Public
 */
router.get('/upload', async (req, res) => {
  try {
    const { date } = req.query;
    
    console.log('📤 Iniciando upload para YouTube...');
    
    const uploader = new YouTubeUploader();
    
    // Se uma data específica foi fornecida
    if (date && typeof date === 'string') {
      console.log(`📅 Upload solicitado para a data: ${date}`);
      // TODO: Implementar lógica para data específica se necessário
    }
    
    // Fazer o upload
    await uploader.upload();

    res.json({
      success: true,
      message: 'Upload para YouTube concluído com sucesso!',
      data: {
        timestamp: new Date().toISOString(),
        status: 'completed',
        date: date || new Date().toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('❌ Erro no upload para YouTube:', error);
    res.status(500).json({
      success: false,
      error: 'Erro durante o upload para YouTube',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router; 