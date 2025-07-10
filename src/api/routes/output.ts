import express from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

/**
 * @route GET /api/output/list
 * @desc Lista todos os arquivos gerados nas pastas de output
 * @access Public
 */
router.get('/list', async (req, res) => {
  try {
    console.log('📁 Listando todos os arquivos de output...');
    
    const outputDir = path.join(__dirname, '..', '..', '..', 'output');
    
    // Função para listar arquivos de uma pasta
    const listFilesInDirectory = (dirPath: string): string[] => {
      try {
        if (!fs.existsSync(dirPath)) {
          return [];
        }
        
        const files = fs.readdirSync(dirPath);
        return files;
      } catch (error) {
        console.error(`Erro ao listar arquivos em ${dirPath}:`, error);
        return [];
      }
    };
    
    // Listar todos os arquivos por categoria
    const newsFiles = listFilesInDirectory(path.join(outputDir, 'news'));
    const scriptFiles = listFilesInDirectory(path.join(outputDir, 'roteiro'));
    const audioFiles = listFilesInDirectory(path.join(outputDir, 'audio'));
    const videoFiles = listFilesInDirectory(path.join(outputDir, 'video'));
    
    // Função para obter informações dos arquivos
    const getFileInfo = (filePath: string) => {
      try {
        const stats = fs.statSync(filePath);
        return {
          name: path.basename(filePath),
          size: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          created: stats.birthtime,
          modified: stats.mtime
        };
      } catch (error) {
        return null;
      }
    };
    
    // Obter informações detalhadas dos arquivos
    const getDetailedFiles = (files: string[], subDir: string) => {
      return files.map(file => {
        const filePath = path.join(outputDir, subDir, file);
        return getFileInfo(filePath);
      }).filter((file): file is NonNullable<typeof file> => file !== null)
      .sort((a, b) => {
        // Ordenar por data de modificação decrescente (mais recentes primeiro)
        return new Date(b.modified).getTime() - new Date(a.modified).getTime();
      });
    };
    
    const result = {
      timestamp: new Date().toISOString(),
      files: {
        news: getDetailedFiles(newsFiles, 'news'),
        scripts: getDetailedFiles(scriptFiles, 'roteiro'),
        audio: getDetailedFiles(audioFiles, 'audio'),
        video: getDetailedFiles(videoFiles, 'video')
      },
      summary: {
        totalFiles: newsFiles.length + scriptFiles.length + audioFiles.length + videoFiles.length,
        newsCount: newsFiles.length,
        scriptCount: scriptFiles.length,
        audioCount: audioFiles.length,
        videoCount: videoFiles.length
      }
    };
    
    res.json({
      success: true,
      message: 'Todos os arquivos listados com sucesso',
      data: result
    });

  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar arquivos',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * @route GET /api/output/download/:type/:filename
 * @desc Download de um arquivo específico
 * @access Public
 */
router.get('/download/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    // Mapear tipos para diretórios
    const typeMap: { [key: string]: string } = {
      'news': 'news',
      'script': 'roteiro',
      'audio': 'audio',
      'video': 'video'
    };
    
    if (!typeMap[type]) {
      return res.status(400).json({
        success: false,
        error: 'Tipo inválido',
        message: 'Tipo deve ser: news, script, audio, ou video'
      });
    }
    
    const filePath = path.join(__dirname, '..', '..', '..', 'output', typeMap[type], filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado',
        message: `Arquivo ${filename} não existe`
      });
    }
    
    // Configurar headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Enviar arquivo
    res.sendFile(filePath);
    return;

  } catch (error) {
    console.error('❌ Erro no download:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro no download',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router; 