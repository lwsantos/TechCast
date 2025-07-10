import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import { sendTelegramMessage } from './telegram-provider';

interface YouTubeCredentials {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

interface YouTubeTokens {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

interface VideoMetadata {
  snippet: {
    title: string;
    description: string;
    tags: string[];
    categoryId: string;
  };
  status: {
    privacyStatus: string;
    selfDeclaredMadeForKids: boolean;
  };
}

class YouTubeUploader {
  private oauth2Client: OAuth2Client;
  private youtube: any;

  constructor() {
    this.oauth2Client = new OAuth2Client();
  }

  /**
   * Carrega as credenciais OAuth2 do arquivo de configuração
   */
  private async loadCredentials(): Promise<void> {
    try {
      console.log('📁 Carregando credenciais OAuth2...');
      
      const credentialsPath = path.join(__dirname, '..', 'credentials', 'oAuthCredentials.json');
      const credentialsData = await fs.promises.readFile(credentialsPath, 'utf8');
      const credentials: YouTubeCredentials = JSON.parse(credentialsData);

      this.oauth2Client = new google.auth.OAuth2(
        credentials.installed.client_id,
        credentials.installed.client_secret,
        credentials.installed.redirect_uris[0]
      );

      console.log('✅ Credenciais OAuth2 carregadas com sucesso');
    } catch (error) {
      throw new Error(`❌ Erro ao carregar credenciais OAuth2: ${error}`);
    }
  }

  /**
   * Carrega os tokens de acesso do arquivo de tokens
   */
  private async loadTokens(): Promise<void> {
    try {
      console.log('🔑 Carregando tokens de acesso...');
      
      const tokensPath = path.join(__dirname, '..', 'credentials', 'youtube_token.json');
      const tokensData = await fs.promises.readFile(tokensPath, 'utf8');
      const tokens: YouTubeTokens = JSON.parse(tokensData);

      if (!tokens.refresh_token) {
        throw new Error('Refresh token não encontrado. Execute npm run token primeiro.');
      }

      this.oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token || null,
        expiry_date: tokens.expiry_date || null
      });

      console.log('✅ Tokens de acesso carregados com sucesso');
    } catch (error) {
      throw new Error(`❌ Erro ao carregar tokens: ${error}`);
    }
  }

  /**
   * Obtém o caminho do arquivo de vídeo baseado na data atual
   */
  private getVideoPath(): string {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const videoPath = path.join(__dirname, '..', 'output', 'video', `podcast_video_${dateString}.mp4`);
    
    console.log(`🎬 Procurando vídeo: ${videoPath}`);
    return videoPath;
  }

  /**
   * Verifica se o arquivo de vídeo existe
   */
  private async checkVideoFile(videoPath: string): Promise<void> {
    try {
      await fs.promises.access(videoPath, fs.constants.F_OK);
      const stats = await fs.promises.stat(videoPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Arquivo de vídeo encontrado: ${fileSizeMB} MB`);
    } catch (error) {
      throw new Error(`❌ Arquivo de vídeo não encontrado: ${videoPath}`);
    }
  }

  /**
   * Cria os metadados do vídeo
   */
  private createVideoMetadata(): VideoMetadata {
    const today = new Date();
    const dateString = today.toLocaleDateString('pt-BR');
    
    const metadata: VideoMetadata = {
      snippet: {
        title: `TechCast: Notícias do dia ${dateString}`,
        description: `Seu resumo diário das notícias de tecnologia mais importantes do TechCrunch. (https://techcrunch.com)

📰 Principais tópicos de hoje:
• Notícias mais recentes do mundo da tecnologia
• Análises e insights sobre startups e inovação
• Tendências em IA, blockchain e outras tecnologias emergentes

🎧 TechCast - Seu podcast diário de tecnologia
📅 Data: ${dateString}

🔗 Siga-nos para mais conteúdo de tecnologia!

#TechCast #TechCrunch #Podcast #Tecnologia #NotíciasTech #IA #Startup #DailyTechNews`,
        tags: [
          'TechCast',
          'TechCrunch', 
          'Podcast',
          'Tecnologia',
          'Notícias Tech',
          'IA',
          'Startup',
          'Daily Tech News',
          'Inovação',
          'Tecnologia Emergente'
        ],
        categoryId: '28' // Ciência e Tecnologia
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false
      }
    };

    console.log(`📝 Metadados criados: "${metadata.snippet.title}"`);
    return metadata;
  }

  /**
   * Inicializa a API do YouTube
   */
  private initializeYouTubeAPI(): void {
    try {
      console.log('🎥 Inicializando API do YouTube...');
      
      this.youtube = google.youtube({ 
        version: 'v3', 
        auth: this.oauth2Client 
      });

      console.log('✅ API do YouTube inicializada com sucesso');
    } catch (error) {
      throw new Error(`❌ Erro ao inicializar API do YouTube: ${error}`);
    }
  }

  /**
   * Faz o upload do vídeo para o YouTube
   */
  private async uploadVideo(videoPath: string, metadata: VideoMetadata): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('🚀 Iniciando upload do vídeo...');
      
      const fileSize = fs.statSync(videoPath).size;
      let uploadedBytes = 0;
      let lastProgress = 0;

      const media = {
        body: fs.createReadStream(videoPath)
          .on('data', (chunk) => {
            uploadedBytes += chunk.length;
            const progress = Math.round((uploadedBytes / fileSize) * 100);
            
            // Mostra progresso a cada 5%
            if (progress >= lastProgress + 5) {
              console.log(`📤 Upload progresso: ${progress}% (${(uploadedBytes / (1024 * 1024)).toFixed(1)} MB)`);
              lastProgress = progress;
            }
          })
      };

      const requestBody = {
        snippet: metadata.snippet,
        status: metadata.status
      };

      this.youtube.videos.insert({
        part: 'snippet,status',
        requestBody,
        media
      }, (error: any, response: any) => {
        if (error) {
          console.error('❌ Erro durante o upload:', error.message);
          reject(new Error(`Falha no upload: ${error.message}`));
        } else {
          const videoId = response.data.id;
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          console.log(`✅ Upload concluído com sucesso!`);
          console.log(`🔗 URL do vídeo: ${videoUrl}`);
          resolve(videoId);
        }
      });
    });
  }

  /**
   * Executa o processo completo de upload
   */
  public async upload(): Promise<void> {
    try {
      console.log('🎬 === UPLOAD PARA YOUTUBE ===');
      await sendTelegramMessage('🎬 Iniciando upload para YouTube...');

      // 1. Carregar credenciais
      await this.loadCredentials();

      // 2. Carregar tokens
      await this.loadTokens();

      // 3. Inicializar API do YouTube
      this.initializeYouTubeAPI();

      // 4. Obter caminho do vídeo
      const videoPath = this.getVideoPath();

      // 5. Verificar se o arquivo existe
      await this.checkVideoFile(videoPath);

      // 6. Criar metadados
      const metadata = this.createVideoMetadata();

      // 7. Fazer upload
      const videoId = await this.uploadVideo(videoPath, metadata);

      console.log('');
      console.log('🎉 === UPLOAD CONCLUÍDO COM SUCESSO ===');
      console.log(`📺 ID do vídeo: ${videoId}`);
      console.log(`🔗 URL: https://www.youtube.com/watch?v=${videoId}`);
      console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
      await sendTelegramMessage('🎉 Upload para YouTube concluído com sucesso!');
    } catch (error) {
      console.error('');
      console.error('💥 === ERRO NO UPLOAD ===');
      console.error(`❌ ${error}`);
      console.error('');
      console.error('🔧 Possíveis soluções:');
      console.error('• Verifique se o arquivo de vídeo existe para a data atual');
      console.error('• Execute "npm run token" para renovar as credenciais');
      console.error('• Verifique se a YouTube Data API v3 está habilitada');
      console.error('• Verifique se as credenciais OAuth2 estão corretas');
      await sendTelegramMessage(`❌ Erro durante o upload: ${error}`);
      process.exit(1);
    }
  }
}

export { YouTubeUploader }; 