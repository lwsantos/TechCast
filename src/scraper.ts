import { chromium, Browser, Page } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { Article, ArticleInfo, ScraperConfig } from './types';
import { sendTelegramMessage } from './telegram-provider';
import { getTodayISODate, getTimezone, isToday } from './utils/date-helper';

class TechCrunchScraper {
  private baseUrl: string;
  private articles: Article[];
  private delay: number;
  private timeout: number;
  private retries: number;
  private maxArticles: number;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(config?: Partial<ScraperConfig>) {
    const defaultConfig: ScraperConfig = {
      baseUrl: 'https://techcrunch.com',
      delay: 2000,
      maxArticles: 50,
      timeout: 30000,
      retries: 3
    };
    const finalConfig = { ...defaultConfig, ...config };
    this.baseUrl = finalConfig.baseUrl;
    this.articles = [];
    this.delay = finalConfig.delay;
    this.timeout = finalConfig.timeout;
    this.retries = finalConfig.retries;
    this.maxArticles = finalConfig.maxArticles;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async initializeBrowser(): Promise<void> {
    console.log('🚀 Inicializando navegador...');
    this.browser = await chromium.launch({
      headless: true, // true para produção, false para debug
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Configurar timeout da página
    this.page.setDefaultTimeout(this.timeout);
    
    // Configurar user agent
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  private async collectArticleLinks(): Promise<ArticleInfo[]> {
    if (!this.page) throw new Error('Página não inicializada');

    const url = this.baseUrl + '/latest';
    
    console.log(`📰 Navegando para a página ${url}...`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Aguardar carregamento dos artigos
    await this.page.waitForSelector('article, .post-block, .loop-card', { timeout: 10000 });
    
    console.log('🔍 Coletando links dos artigos...');
    
    const articleLinks = await this.page.evaluate(() => {
      const links: ArticleInfo[] = [];
      
      // Seletores para encontrar artigos na página inicial
      const selectors = [
        'article a[href*="/202"]',
        '.post-block__title__link',
        '.loop-card__title-link',
        'h2 a[href*="/202"]',
        'h3 a[href*="/202"]',
        '.river--homepage .post-block a[href*="/202"]'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          const link = element as HTMLAnchorElement;
          const href = link.href;
          const title = link.textContent?.trim();
          
          if (href && title && href.includes('/202') && !href.includes('/events/')) {
            // Verificar se é um link único
            if (!links.find(l => l.url === href)) {
              links.push({ url: href, title });
            }
          }
        });
      }
      
      return links.slice(0, 50); // Limitar a 50 artigos
    });
    
    console.log(`✅ Encontrados ${articleLinks.length} artigos`);
    return articleLinks;
  }

  private async scrapeArticle(articleInfo: ArticleInfo): Promise<Article | null> {
    if (!this.page) throw new Error('Página não inicializada');
    
    const maxRetries = 2; // Tentar até 2 vezes para cada artigo
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📄 Processando: ${articleInfo.title} (tentativa ${attempt}/${maxRetries})`);
        
        // Navegar para o artigo com timeout mais curto
        await this.page.goto(articleInfo.url, { 
          waitUntil: 'domcontentloaded', // Mais rápido que networkidle
          timeout: 15000 // 15 segundos em vez de 30
        });
        
        // Aguardar carregamento do conteúdo principal (mais tolerante)
        try {
          await this.page.waitForSelector('article, .article-content, .post-content, .article__content, main', { 
            timeout: 8000 // 8 segundos em vez de 15
          });
        } catch (timeoutError) {
          console.log(`⚠️ Timeout aguardando conteúdo, tentando continuar...`);
          // Continuar mesmo sem encontrar o seletor específico
        }
        
        // Extrair dados do artigo
        const articleData = await this.page.evaluate(() => {
          // Extrair título
          const titleSelectors = [
            'h1.article__title',
            'h1.post-block__title',
            'h1',
            '.article__title',
            '.post-block__title'
          ];
          let titulo = '';
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              titulo = element.textContent?.trim() || '';
              break;
            }
          }
          
          // Extrair data de publicação
          const dateSelectors = [
            'time[datetime]',
            '.article__date',
            '.post-block__time',
            '.post-block__date',
            '.article__byline time',
            '.byline time',
            'time',
            '.post-block__content time',
            '.river-byline__time'
          ];
          let dataPublicacao = '';
          let originalDatetime = '';
          for (const selector of dateSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              const datetime = element.getAttribute('datetime') || element.textContent;
              if (datetime) {
                originalDatetime = datetime;
                // Tentar extrair data de diferentes formatos
                let dateMatch = datetime.match(/\d{4}-\d{2}-\d{2}/);
                if (dateMatch) {
                  dataPublicacao = dateMatch[0];
                  break;
                }
                // Se não encontrou, tentar converter timestamp ou outras datas
                const date = new Date(datetime);
                if (!isNaN(date.getTime())) {
                  // Usar o helper para formatar a data
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  dataPublicacao = `${year}-${month}-${day}`;
                  break;
                }
              }
            }
          }
          
          // Extrair autor
          const authorSelectors = [
            '.article__byline .river-byline__authors a',
            '.byline a',
            '.article__byline a',
            '.post-block__author a',
            '.author a',
            '.river-byline__authors a'
          ];
          let autor = '';
          for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              autor = element.textContent?.trim() || '';
              break;
            }
          }
          
          // NOVO: Lista ampliada de seletores para o conteúdo principal
          const contentSelectors = [
            'article .article-content',
            'article .article__content',
            'article .post-content',
            'article .post-block__content',
            'article .content',
            'article',
            '.article-content',
            '.article__content',
            '.post-content',
            '.post-block__content',
            '.content',
            'main article',
            'main .article-content',
            'main .article__content',
            'main .post-content',
            'main .post-block__content',
            'main .content'
          ];
          let conteudo = '';
          for (const selector of contentSelectors) {
            const elements = document.querySelectorAll(selector + ' p');
            if (elements.length > 0) {
              const paragraphs = Array.from(elements)
                .map(el => el.textContent?.trim())
                .filter(text => text && text.length > 50)
                .join(' ');
              if (paragraphs.length > 100) {
                conteudo = paragraphs;
                break;
              }
            }
          }
          // Se não encontrou, pega todos os <p> dentro de <article> ou <main>
          if (!conteudo || conteudo.length < 100) {
            let fallbackParagraphs: string[] = [];
            const articlePs = document.querySelectorAll('article p');
            if (articlePs.length > 0) {
              fallbackParagraphs = Array.from(articlePs)
                .map(el => el.textContent?.trim() || '')
                .filter(text => text.length > 50);
            } else {
              const mainPs = document.querySelectorAll('main p');
              fallbackParagraphs = Array.from(mainPs)
                .map(el => el.textContent?.trim() || '')
                .filter(text => text.length > 50);
            }
            conteudo = fallbackParagraphs.join(' ');
          }
          
          return { titulo, dataPublicacao, autor, conteudo, originalDatetime };
        });
        
        // Verificar se é um artigo de hoje
        const today = getTodayISODate();
        console.log(`📅 Comparando: artigo (${articleData.dataPublicacao}) vs hoje (${today})`);
        console.log(`🔍 Datetime original: ${articleData.originalDatetime}`);
        
        // Usar o helper para verificar se é de hoje (não recente)
        if (!isToday(articleData.dataPublicacao)) {
          console.log(`⏰ Artigo não é de hoje (${articleData.dataPublicacao}), pulando...`);
          return null;
        }
        
        console.log(`✅ Artigo aceito: ${articleData.dataPublicacao} (de hoje)`);
        
        return {
          titulo: articleData.titulo || articleInfo.title,
          url: articleInfo.url,
          dataPublicacao: articleData.dataPublicacao,
          autor: articleData.autor,
          conteudo: articleData.conteudo
        };
        
      } catch (error) {
        console.error(`❌ Erro ao processar artigo ${articleInfo.url} (tentativa ${attempt}/${maxRetries}):`, error instanceof Error ? error.message : 'Erro desconhecido');
        
        if (attempt === maxRetries) {
          console.log(`⚠️ Desistindo do artigo após ${maxRetries} tentativas`);
          return null;
        }
        
        // Aguardar um pouco antes da próxima tentativa
        console.log(`🔄 Aguardando 2 segundos antes da próxima tentativa...`);
        await this.sleep(2000);
      }
    }
    
    return null;
  }

  public async run(): Promise<void> {
    try {
      const today = getTodayISODate();
      console.log('🎯 Iniciando scraper do TechCrunch com Playwright...');
      console.log(`📅 Buscando artigos da data: ${today}`);
      console.log(`🔍 Timezone configurado: ${getTimezone()}`);
      await sendTelegramMessage('🚀 *Scraping do TechCrunch iniciado...*');
      
      await this.initializeBrowser();
      
      // Coletar links dos artigos
      const articleLinks = await this.collectArticleLinks();
      
      if (articleLinks.length === 0) {
        console.log('⚠️ Nenhum artigo encontrado');
        return;
      }
      
      // Processar cada artigo
      let processedCount = 0;
      for (const articleLink of articleLinks) {
        if (processedCount >= this.maxArticles) {
          console.log(`✅ Limite de ${this.maxArticles} artigos atingido`);
          break;
        }
        
        const article = await this.scrapeArticle(articleLink);
        if (article) {
          this.articles.push(article);
          processedCount++;
          console.log(`✅ Artigo processado: ${article.titulo}`);
        }
        
        // Delay entre requisições
        await this.sleep(this.delay);
      }
      
      // Salvar resultados
      await this.saveResults();
      
      console.log(`🎉 Scraping concluído! ${this.articles.length} artigos coletados.`);
      await sendTelegramMessage(`🎉 Scraping do TechCrunch concluído! ${this.articles.length} artigos coletados.`);

    } catch (error) {
      console.error('❌ Erro durante o scraping:', error);
      await sendTelegramMessage(`❌ Erro durante o scraping: ${error}`);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }

  private async saveResults(): Promise<void> {
    const today = getTodayISODate();
    const outputPath = path.join(process.cwd(), 'output', 'news', `news_${today}.json`);
    
    // Criar diretório se não existir
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    const output = {
      dataColeta: new Date().toISOString(), // Mantido como ISO para timestamp
      totalArtigos: this.articles.length,
      artigos: this.articles
    };
    
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 Resultados salvos em: ${outputPath}`);
  }

  public getArticles(): Article[] {
    return this.articles;
  }
}

export { TechCrunchScraper }; 