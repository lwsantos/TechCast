import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import mime from 'mime';
import { sendTelegramMessage } from './telegram-provider';
import { getTodayISODate } from './utils/date-helper';

dotenv.config();

const execAsync = promisify(exec);

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

interface ScriptParts {
  parts: string[];
}

class AudioGenerator {
  private ai: GoogleGenAI;
  private tempDir: string;
  private outputDir: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY não está configurada no arquivo .env');
    }
    this.ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    this.tempDir = 'temp_podcast_audios';
    this.outputDir = 'output/audio';
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos
  }

  private getCurrentDate(): string {
    return getTodayISODate()
  }

  private getScriptFilename(): string {
    const date = this.getCurrentDate();
    return path.join('output', 'roteiro', `roteiro_podcast_${date}.txt`);
  }

  private async checkFileExists(filename: string): Promise<boolean> {
    try {
      await fs.promises.access(filename);
      return true;
    } catch {
      return false;
    }
  }

  private async createDirectories(): Promise<void> {
    try {
      await fs.promises.mkdir(this.tempDir, { recursive: true });
      await fs.promises.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretórios:', error);
      throw error;
    }
  }

  private async cleanupTempFiles(filePath: string): Promise<void> {
    try {
      if (await this.checkFileExists(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`✅ Arquivo temporário ${filePath} removido.`);
      }
    } catch (error) {
      console.error('⚠️ Erro ao remover arquivo temporário:', error);
    }
  }

  private async cleanupAllTempFiles(): Promise<void> {
    try {
      const filesInTempDir = await fs.promises.readdir(this.tempDir);
      for (const file of filesInTempDir) {
        const filePath = path.join(this.tempDir, file);
        await this.cleanupTempFiles(filePath);
      }
      
      if (filesInTempDir.length === 0) {
        await fs.promises.rmdir(this.tempDir);
        console.log(`✅ Diretório temporário ${this.tempDir} removido.`);
      }
    } catch (error) {
      console.error('⚠️ Erro ao limpar arquivos temporários:', error);
    }
  }

  private splitScript(scriptContent: string): ScriptParts {
    console.log('📝 Dividindo roteiro em múltiplas partes...');
    
    const lines = scriptContent.split('\n');
    const totalLines = lines.length;
    
    // Encontrar todas as linhas que contêm mudanças de apresentador
    let partsTemp: string[] = [];
    const parts: string[] = [];
    const presenterLines: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Apresentador 1:') || lines[i].includes('Apresentador 2:')) {
        partsTemp.push(lines[i]);
        presenterLines.push(i);

        if (partsTemp.length >= 14) {
          parts.push(partsTemp.join('\n'));
          partsTemp = [];
        }

      }
    }
    
    console.log(`✅ Roteiro dividido em ${parts.length} partes`);
    return { parts };
  }

  private splitScriptBySize(scriptContent: string): ScriptParts {
    console.log('📝 Dividindo roteiro por tamanho...');
    
    const lines = scriptContent.split('\n');
    const totalLines = lines.length;
    const targetParts = 5; // Dividir em 5 partes
    const linesPerPart = Math.ceil(totalLines / targetParts);
    
    const parts: string[] = [];
    
    for (let i = 0; i < targetParts; i++) {
      const startLine = i * linesPerPart;
      const endLine = Math.min((i + 1) * linesPerPart, totalLines);
      
      // Procurar por um ponto lógico para dividir (mudança de apresentador)
      let actualEndLine = endLine;
      for (let j = endLine; j < Math.min(endLine + 10, totalLines); j++) {
        if (lines[j].includes('Apresentador 1:') || lines[j].includes('Apresentador 2:') || 
            lines[j].includes('João:') || lines[j].includes('Maria:')) {
          actualEndLine = j;
          break;
        }
      }
      
      const partLines = lines.slice(startLine, actualEndLine);
      const partContent = partLines.join('\n');
      
      if (partContent.trim()) {
        parts.push(partContent);
        console.log(`📝 Parte ${i + 1}: ${partContent.length} caracteres`);
      }
    }
    
    console.log(`✅ Roteiro dividido em ${parts.length} partes por tamanho`);
    return { parts };
  }

  private convertToWav(rawData: string, mimeType: string): Buffer {
    const options = this.parseMimeType(mimeType);
    const wavHeader = this.createWavHeader(rawData.length, options);
    const buffer = Buffer.from(rawData, 'base64');

    return Buffer.concat([wavHeader, buffer]);
  }

  private parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');

    const options: Partial<WavConversionOptions> = {
      numChannels: 1,
    };

    if (format && format.startsWith('L')) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    }

    for (const param of params) {
      const [key, value] = param.split('=').map(s => s.trim());
      if (key === 'rate') {
        options.sampleRate = parseInt(value, 10);
      }
    }

    return options as WavConversionOptions;
  }

  private createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
    const {
      numChannels,
      sampleRate,
      bitsPerSample,
    } = options;

    // http://soundfile.sapp.org/doc/WaveFormat
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);                      // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
    buffer.write('WAVE', 8);                      // Format
    buffer.write('fmt ', 12);                     // Subchunk1ID
    buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);        // NumChannels
    buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
    buffer.writeUInt32LE(byteRate, 28);           // ByteRate
    buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
    buffer.write('data', 36);                     // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

    return buffer;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async generateAudioPart(partContent: string, partName: string): Promise<string> {
    const date = this.getCurrentDate();
    const tempOutputFilename = `${partName}_temp_${date}.mp3`;
    const tempOutputPath = path.join(this.tempDir, tempOutputFilename);

    console.log(`🎙️ Gerando áudio da ${partName}...`);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${this.maxRetries} para ${partName}...`);

        const config = {
          temperature: 1,
          responseModalities: ['audio'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'Apresentador 1',
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: process.env.AUDIO_VOICE_1 || 'Zephyr'
                    }
                  }
                },
                {
                  speaker: 'Apresentador 2',
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: process.env.AUDIO_VOICE_2 || 'Puck'
                    }
                  }
                },
              ]
            },
          },
        };

        const model = 'gemini-2.5-pro-preview-tts';
        const contents = [
          {
            role: 'user',
            parts: [
              {
                text: partContent,
              },
            ],
          },
        ];

        const response = await this.ai.models.generateContentStream({
          model,
          config,
          contents,
        });

        const writeStream = fs.createWriteStream(tempOutputPath);
        let hasAudioData = false;

        for await (const chunk of response) {
          if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
            continue;
          }
          
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            const inlineData = chunk.candidates[0].content.parts[0].inlineData;
            let fileExtension = mime.getExtension(inlineData.mimeType || '');
            let buffer = Buffer.from(inlineData.data || '', 'base64');
            
            if (!fileExtension) {
              fileExtension = 'wav';
              const wavBuffer = this.convertToWav(inlineData.data || '', inlineData.mimeType || '');
              buffer = Buffer.from(wavBuffer);
            }
            
            writeStream.write(buffer);
            hasAudioData = true;
          } else {
            console.log(chunk.text);
          }
        }

        writeStream.end();
        
        // Aguardar o stream terminar
        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', () => resolve());
          writeStream.on('error', reject);
        });

        if (!hasAudioData) {
          throw new Error(`Nenhum dado de áudio foi recebido da API para ${partName}`);
        }

        console.log(`✅ Áudio da ${partName} gerado: ${tempOutputFilename}`);
        return tempOutputPath;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Erro na tentativa ${attempt}/${this.maxRetries} para ${partName}:`, error);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ Aguardando ${this.retryDelay / 1000} segundos antes da próxima tentativa...`);
          await this.sleep(this.retryDelay);
        }
      }
    }

    console.error(`❌ Erro ao gerar áudio da ${partName} após todas as tentativas:`, lastError);
    throw lastError;
  }

  private async createConcatList(audioFilePaths: string[]): Promise<string> {
    const date = this.getCurrentDate();
    const concatListPath = path.join(this.tempDir, `concat_list_${date}.txt`);
    
    console.log('📝 Criando lista de concatenação...');
    
    const concatContent = audioFilePaths
      .map(filePath => `file '${path.resolve(filePath)}'`)
      .join('\n');
    
    await fs.promises.writeFile(concatListPath, concatContent, 'utf-8');
    console.log(`✅ Lista de concatenação criada: ${concatListPath}`);
    
    return concatListPath;
  }

  private async concatenateAudioFiles(concatListPath: string, outputFinalPath: string): Promise<void> {
    console.log('🔗 Concatenando arquivos de áudio com FFmpeg...');
    
    try {
      const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${concatListPath}" -c:a libmp3lame -q:a 2 "${outputFinalPath}"`;
      
      console.log('🔗 Concatenando e recodificando arquivos de áudio para MP3...');
      const { stdout, stderr } = await promisify(require('child_process').exec)(ffmpegCommand);

      if (stderr && !stderr.includes('frame=')) {
          console.warn('⚠️ FFmpeg warnings:', stderr);
      }

      console.log(`✅ Podcast final gerado com sucesso: ${outputFinalPath}`);
      
    } catch (error) {
      console.error('❌ Erro durante a concatenação com FFmpeg:', error);
      throw error;
    }
  }

  public async generatePodcast(): Promise<void> {
    const tempAudioPaths: string[] = [];
    let concatListPath: string | null = null;

    try {
      console.log('🎙️ Iniciando geração do podcast...');
      await sendTelegramMessage('🎙️ Iniciando geração do audio do podcast...');
      await this.createDirectories();

      const scriptFilename = this.getScriptFilename();
      console.log(`📖 Procurando roteiro: ${scriptFilename}`);

      if (!await this.checkFileExists(scriptFilename)) {
        throw new Error(`Arquivo de roteiro não encontrado: ${scriptFilename}`);
      }

      const scriptContent = await fs.promises.readFile(scriptFilename, 'utf-8');
      console.log('📝 Roteiro carregado com sucesso');

      // Dividir o roteiro em múltiplas partes
      const { parts } = this.splitScript(scriptContent);

      console.log(`🎙️ Gerando áudio para ${parts.length} partes...`);

      // Gerar áudio para cada parte
      for (let i = 0; i < parts.length; i++) {
        const partName = `parte${i + 1}`;
        console.log(`🎙️ Processando ${partName} (${i + 1}/${parts.length})...`);
        
        const tempAudioPath = await this.generateAudioPart(parts[i], partName);
        tempAudioPaths.push(tempAudioPath);
        
        // Pequena pausa entre gerações para evitar sobrecarga da API
        if (i < parts.length - 1) {
          console.log('⏳ Aguardando 2 segundos antes da próxima parte...');
          await this.sleep(2000);
        }
      }

      // Criar lista de concatenação
      concatListPath = await this.createConcatList(tempAudioPaths);

      // Concatenar os arquivos
      const date = this.getCurrentDate();
      const finalOutputFilename = `audio_${date}.mp3`;
      const finalOutputPath = path.join(this.outputDir, finalOutputFilename);

      await this.concatenateAudioFiles(concatListPath, finalOutputPath);

      console.log(`🎉 Podcast gerado com sucesso!`);
      console.log(`📁 Arquivo salvo em: ${finalOutputPath}`);
      await sendTelegramMessage('🎉 Audio do podcast gerado com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante a geração do podcast:', error);
      await sendTelegramMessage(`❌ Erro durante a geração do audio do podcast: ${error}`);
      process.exit(1);
    } finally {
      // Limpeza de todos os arquivos temporários
      for (const tempAudioPath of tempAudioPaths) {
        await this.cleanupTempFiles(tempAudioPath);
      }
      if (concatListPath) {
        await this.cleanupTempFiles(concatListPath);
      }
      
      await this.cleanupAllTempFiles();
    }
  }
}

export { AudioGenerator };