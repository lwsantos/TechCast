import { TechCrunchScraper } from './scraper';
import { GizmodoScraper } from './scraper_gizmodo';
import { TechCrunchTranslator } from './translator';
import { PodcastGenerator } from './podcast-generator';
import { AudioGenerator } from './audio-generator';
import { AudioImageMerger } from './merge-audio-image';
import { YouTubeUploader } from './upload_to_youtube';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

class FullPipeline {
  private scraper: TechCrunchScraper;
  private scraperGizmodo: GizmodoScraper;
  private translator: TechCrunchTranslator;
  private podcastGenerator: PodcastGenerator;
  private audioGenerator: AudioGenerator;
  private videoMerger: AudioImageMerger;
  private youtubeUploader: YouTubeUploader;

  constructor() {
    this.scraper = new TechCrunchScraper({
        maxArticles: 50, // Limitar a 50 artigos
        delay: 3000, // 3 segundos entre requisições
        timeout: 30000 // 30 segundos de timeout
    });
    this.scraperGizmodo = new GizmodoScraper({
      maxArticles: 50, // Limitar a 50 artigos
      delay: 3000, // 3 segundos entre requisições
      timeout: 30000 // 30 segundos de timeout
    });
    this.translator = new TechCrunchTranslator();
    this.podcastGenerator = new PodcastGenerator();
    this.audioGenerator = new AudioGenerator();
    this.videoMerger = new AudioImageMerger();
    this.youtubeUploader = new YouTubeUploader();
  }

  public async run(): Promise<void> {
    try {
      console.log('🚀 Iniciando pipeline completo do TechCrunch...\n');

      // Etapa 1: Scraping
      console.log('📰 Etapa 1: Extraindo notícias do TechCrunch...');
      await this.scraper.run();
      const articles = this.scraper.getArticles();
      console.log(`✅ ${articles.length} artigos extraídos com sucesso!\n`);

      console.log('📰 Etapa 1: Extraindo notícias do Gizmodo...');
      await this.scraperGizmodo.run();
      const articlesGizmodo = this.scraperGizmodo.getArticles();
      console.log(`✅ ${articlesGizmodo.length} artigos extraídos com sucesso!\n`);

      // Etapa 2: Tradução
      console.log('🌐 Etapa 2: Traduzindo artigos para português...');
      await this.translator.translateArticles();
      console.log('✅ Artigos traduzidos com sucesso!\n');

      // Etapa 3: Geração do roteiro do podcast
      console.log('🎙️ Etapa 3: Gerando roteiro do podcast...');
      await this.podcastGenerator.generatePodcast();
      console.log('✅ Roteiro do podcast gerado com sucesso!\n');

      // Etapa 4: Geração do áudio
      console.log('🎵 Etapa 4: Convertendo roteiro em áudio...');
      await this.audioGenerator.generatePodcast();
      console.log('✅ Áudio do podcast gerado com sucesso!\n');

      // Etapa 5: Geração do vídeo para YouTube
      console.log('🎬 Etapa 5: Gerando vídeo para YouTube...');
      await this.videoMerger.mergeAudioWithImage();
      console.log('✅ Vídeo para YouTube gerado com sucesso!\n');

      // Etapa 6: Upload para YouTube (opcional)
      console.log('📤 Etapa 6: Fazendo upload para YouTube...');
      try {
        await this.youtubeUploader.upload();
        console.log('✅ Upload para YouTube concluído com sucesso!\n');
      } catch (error) {
        console.log('⚠️ Upload para YouTube falhou, mas o pipeline continuou:');
        console.log(`   ${error}\n`);
        console.log('💡 Para fazer upload manualmente, execute: npm run upload\n');
      }

      console.log('🎉 Pipeline completo finalizado com sucesso!');
      console.log('📁 Arquivos gerados:');
      console.log('   - output/news/news_YYYY-MM-DD.json (artigos originais e traduzidos)');
      console.log('   - output/roteiro/roteiro_podcast_YYYY-MM-DD.txt (roteiro do podcast)');
      console.log('   - output/audio/audio_YYYY-MM-DD.mp3 (áudio do podcast)');
      console.log('   - output/video/podcast_video_YYYY-MM-DD.mp4 (vídeo para YouTube)');

    } catch (error) {
      console.error('❌ Erro durante a execução do pipeline:', error);
      process.exit(1);
    }
  }
}

// Execução do pipeline
async function main() {
  const pipeline = new FullPipeline();
  await pipeline.run();
}

if (require.main === module) {
  main().catch(console.error);
}

export { FullPipeline }; 