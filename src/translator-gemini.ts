import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { sendTelegramMessage } from './telegram-provider';
import { getTodayISODate } from './utils/date-helper';

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

class TechCrunchTranslatorGemini {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private delay: number;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não encontrada nas variáveis de ambiente. Configure sua chave da API do Gemini.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.delay = 500; // 500ms entre traduções para evitar rate limiting
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async translateText(text: string): Promise<string> {
    try {
      console.log(`🔄 Traduzindo texto (${text.length} caracteres)...`);

      const prompt = `Traduza o seguinte texto do inglês para português brasileiro. Mantenha o tom e estilo original, mas adapte para soar natural em português:

"${text}"

Responda apenas com a tradução, sem explicações adicionais.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text().trim();
      
      console.log(`✅ Tradução concluída`);
      return translatedText || text; // Retorna o texto original se a tradução falhar

    } catch (error) {
      console.error(`❌ Erro na tradução:`, error);
      // Em caso de erro, retorna o texto original
      return text;
    }
  }

  private async loadArticles(): Promise<Article[]> {
    try {
      const today = getTodayISODate();
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
      const today = getTodayISODate();
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
        tradutor: 'gemini-ai',
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
      console.log('🚀 Iniciando tradução das notícias usando Gemini AI...');
      await sendTelegramMessage('🚀 *Tradução de notícias com Gemini AI iniciada...*');
      
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
      await sendTelegramMessage(`🎉 Tradução com Gemini AI concluída! ${translatedArticles.length} artigos processados.`);  
    } catch (error) {
      console.error('❌ Erro durante a tradução:', error);
      await sendTelegramMessage(`❌ Erro durante a tradução: ${error}`);
      throw error;
    }
  }
}

export { TechCrunchTranslatorGemini }; 