import { TranslationServiceClient } from '@google-cloud/translate';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { sendTelegramMessage } from './telegram-provider';

// Carregar variáveis de ambiente
dotenv.config();

interface Article {
  titulo: string;
  url: string;
  dataPublicacao: string;
  autor: string;
  conteudo: string;
  tituloTraduzido?: string;
  conteudoTraduzido?: string;
}

interface TranslatedArticle extends Article {
  tituloTraduzido: string;
  conteudoTraduzido: string;
}

class TechCrunchTranslator {
  private translationClient: TranslationServiceClient;
  private projectId: string;
  private delay: number;

  constructor() {
    // Verificar se o arquivo de credenciais existe
    const credentialsPath = path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS || '');
    
    if (!fsSync.existsSync(credentialsPath)) {
      throw new Error(`Arquivo ${credentialsPath} não encontrado. Baixe o arquivo de credenciais do Google Cloud e coloque-o na raiz do projeto.`);
    }

    // Configurar o cliente com arquivo de credenciais
    this.translationClient = new TranslationServiceClient({
      keyFilename: credentialsPath
    });
    
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'podcast-tech-news';
    this.delay = 1000; // 1 segundo entre traduções para evitar rate limiting
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async translateText(text: string, mimeType: string = 'text/plain'): Promise<string> {
    try {
      console.log(`🔄 Traduzindo texto (${text.length} caracteres)...`);

      const request = {
        parent: `projects/${this.projectId}/locations/global`,
        contents: [text],
        mimeType: mimeType,
        sourceLanguageCode: 'en',
        targetLanguageCode: 'pt',
      };

      const [response] = await this.translationClient.translateText(request);
      
      if (response.translations && response.translations.length > 0) {
        const translatedText = response.translations[0].translatedText;
        console.log(`✅ Tradução concluída`);
        return translatedText || text; // Retorna o texto original se a tradução falhar
      }

      console.log(`⚠️ Nenhuma tradução retornada, mantendo texto original`);
      return text;

    } catch (error) {
      console.error(`❌ Erro na tradução:`, error);
      throw error;
    }
  }

  private async loadArticles(): Promise<Article[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const inputPath = path.join(process.cwd(), 'output', 'news', `news_${today}.json`);
      console.log(`📖 Carregando artigos de: ${inputPath}`);
      
      const fileContent = await fs.readFile(inputPath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // Verificar se é o formato esperado (array direto ou objeto com 'artigos')
      const articles = Array.isArray(data) ? data : data.artigos || [];
      
      console.log(`✅ ${articles.length} artigos carregados`);
      return articles;
    } catch (error) {
      console.error(`❌ Erro ao carregar artigos para traduzir:`, error);
      throw error;
    }
  }

  private async saveTranslatedArticles(articles: TranslatedArticle[]): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const outputPath = path.join(process.cwd(), 'output', 'news', `news_${today}.json`);
      console.log(`💾 Salvando artigos traduzidos em: ${outputPath}`);
      
      // Carregar metadados originais, se existirem
      let originalMeta: any = {};
      try {
        const originalContent = await fs.readFile(outputPath, 'utf-8');
        const originalJson = JSON.parse(originalContent);
        if (typeof originalJson === 'object' && !Array.isArray(originalJson)) {
          originalMeta = { ...originalJson };
          delete originalMeta.artigos;
        }
      } catch {}
      
      const output = {
        ...originalMeta,
        dataTraducao: new Date().toISOString(),
        totalArtigos: articles.length,
        artigos: articles
      };
      
      await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(`✅ Artigos traduzidos salvos com sucesso!`);
    } catch (error) {
      console.error(`❌ Erro ao salvar artigos traduzidos:`, error);
      throw error;
    }
  }

  public async translateArticles(): Promise<void> {
    try {
      console.log('🚀 Iniciando tradução das notícias do TechCrunch...');
      await sendTelegramMessage('🚀 *Tradução de notícias iniciada...*');
      console.log(`📁 Project ID: ${this.projectId}`);
      
      // Carregar artigos
      const articles = await this.loadArticles();
      
      if (articles.length === 0) {
        console.log('⚠️ Nenhum artigo encontrado para traduzir');
        return;
      }

      const translatedArticles: TranslatedArticle[] = [];
      let processedCount = 0;

      for (const article of articles) {
        try {
          console.log(`\n📄 Processando: ${article.titulo}`);
          
          // Traduzir título
          const tituloTraduzido = await this.translateText(article.titulo);
          await this.sleep(this.delay);
          
          // Traduzir conteúdo
          const conteudoTraduzido = await this.translateText(article.conteudo);
          await this.sleep(this.delay);
          
          // Criar artigo traduzido
          const translatedArticle: TranslatedArticle = {
            ...article,
            tituloTraduzido,
            conteudoTraduzido
          };
          
          translatedArticles.push(translatedArticle);
          processedCount++;
          
          console.log(`✅ Artigo ${processedCount}/${articles.length} traduzido`);
          
        } catch (error) {
          console.error(`❌ Erro ao traduzir artigo "${article.titulo}":`, error);
          
          // Adicionar artigo com texto original em caso de erro
          const fallbackArticle: TranslatedArticle = {
            ...article,
            tituloTraduzido: article.titulo,
            conteudoTraduzido: article.conteudo
          };
          translatedArticles.push(fallbackArticle);
        }
      }

      // Salvar artigos traduzidos
      await this.saveTranslatedArticles(translatedArticles);
      
      console.log(`\n🎉 Tradução concluída! ${translatedArticles.length} artigos processados.`);
      await sendTelegramMessage(`🎉 Tradução concluída! ${translatedArticles.length} artigos processados.`);  
    } catch (error) {
      console.error('❌ Erro durante a tradução:', error);
      await sendTelegramMessage(`❌ Erro durante a tradução: ${error}`);
      throw error;
    }
  }
}

export { TechCrunchTranslator }; 