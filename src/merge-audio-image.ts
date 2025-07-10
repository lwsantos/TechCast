import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { sendTelegramMessage } from './telegram-provider';

dotenv.config();

const execAsync = promisify(exec);

class AudioImageMerger {
  private outputDir: string;

  constructor() {
    this.outputDir = 'output/video';
  }

  private getCurrentDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async checkFileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async createDirectories(): Promise<void> {
    try {
      await fs.promises.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de saída:', error);
      throw error;
    }
  }

  public async mergeAudioWithImage(): Promise<void> {
    try {
      console.log('🎬 Iniciando mesclagem de áudio com imagem...');
      await sendTelegramMessage('🎬 Iniciando mesclagem de áudio com imagem...');
      // Obter data atual
      const currentDate = this.getCurrentDate();

      // Definir caminhos dos arquivos
      const audioFilePath = path.join('output', 'audio', `audio_${currentDate}.mp3`);
      const imageFilePath = path.join('TechCast.png');
      const videoOutputPath = path.join(this.outputDir, `podcast_video_${currentDate}.mp4`);

      console.log(`📁 Verificando arquivos...`);
      console.log(`🎵 Áudio: ${audioFilePath}`);
      console.log(`🖼️ Imagem: ${imageFilePath}`);
      console.log(`🎬 Vídeo de saída: ${videoOutputPath}`);

      // Verificar se os arquivos de entrada existem
      if (!await this.checkFileExists(audioFilePath)) {
        throw new Error(`Arquivo de áudio não encontrado: ${audioFilePath}`);
      }

      if (!await this.checkFileExists(imageFilePath)) {
        throw new Error(`Arquivo de imagem não encontrado: ${imageFilePath}`);
      }

      // Criar diretório de saída se não existir
      await this.createDirectories();

      // Construir comando FFmpeg
      const ffmpegCommand = `ffmpeg -loop 1 -i "${path.resolve(imageFilePath)}" -i "${path.resolve(audioFilePath)}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${path.resolve(videoOutputPath)}"`;

      console.log('🔗 Executando FFmpeg para mesclar áudio com imagem...');
      console.log(`🔄 Comando: ${ffmpegCommand}`);

      // Executar comando FFmpeg
      const { stdout, stderr } = await execAsync(ffmpegCommand);

      // Log de saída do FFmpeg
      if (stdout) {
        console.log('FFmpeg stdout:', stdout);
      }

      if (stderr && !stderr.includes('frame=')) {
        console.warn('⚠️ FFmpeg warnings:', stderr);
      }

      // Verificar se o arquivo de saída foi criado
      if (await this.checkFileExists(videoOutputPath)) {
        const stats = await fs.promises.stat(videoOutputPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('✅ Vídeo gerado com sucesso!');
        console.log(`📁 Arquivo: ${videoOutputPath}`);
        console.log(`📊 Tamanho: ${fileSizeInMB} MB`);
        console.log('🎉 Pronto para upload no YouTube!');
        await sendTelegramMessage('🎉 Vídeo gerado com sucesso!');
      } else {
        throw new Error('Arquivo de vídeo não foi criado');
      }

    } catch (error) {
      console.error('❌ Erro durante a mesclagem:', error);
      await sendTelegramMessage(`❌ Erro durante a mesclagem: ${error}`);
      throw error;
    }
  }
}

export { AudioImageMerger }; 