import { chromium, Browser, Page } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { Article, ArticleInfo, ScraperConfig } from './types';
import { sendTelegramMessage } from './telegram-provider';
import { getTodayISODate, getTimezone, isToday } from './utils/date-helper';

class GizmodoScraper {
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
      baseUrl: 'https://gizmodo.com',
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
    console.log('🚀 Inicializando navegador para Gizmodo...');
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    this.page.setDefaultTimeout(this.timeout);
    
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

    const url = this.baseUrl + '/tech';
    
    console.log(`📰 Navegando para a página ${url}...`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Esperar o body carregar
    try {
      await this.page.waitForSelector('body', { timeout: 10000 });
    } catch (error) {
      console.log('⚠️ Timeout aguardando carregamento da página, tentando continuar...');
    }

    // Rolagem automática até o final da página para carregar mais artigos
    console.log('⬇️ Rolando a página para carregar mais artigos...');
    await this.page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    });
    await this.page.waitForTimeout(2000); // Esperar mais um pouco para garantir carregamento

    // Salvar HTML para debug
    const html = await this.page.content();
    const debugPath = path.join(process.cwd(), 'output', 'news', 'gizmodo_tech_debug.html');
    await fs.writeFile(debugPath, html, 'utf-8');
    console.log(`🐞 HTML da página salvo para debug em: ${debugPath}`);

    console.log('🔍 Coletando links dos artigos do Gizmodo...');
    
    const articleLinks = await this.page.evaluate(() => {
      const links: { url: string, title: string }[] = [];
      // Novo seletor robusto para Gizmodo
      const elements = document.querySelectorAll('a.block[data-mrf-link*="gizmodo.com/"]');
      elements.forEach((element) => {
        const link = element as HTMLAnchorElement;
        const href = link.href;
        const title = link.textContent?.trim();
        if (href && title && href.includes('/')) {
          if (!links.find(l => l.url === href)) {
            links.push({ url: href, title });
          }
        }
      });
      return links.slice(0, 50);
    });
    
    console.log(`✅ Encontrados ${articleLinks.length} artigos no Gizmodo`);
    return articleLinks;
  }

  private async scrapeArticle(articleInfo: ArticleInfo): Promise<Article | null> {
    if (!this.page) throw new Error('Página não inicializada');
    
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📄 Processando Gizmodo: ${articleInfo.title} (tentativa ${attempt}/${maxRetries})`);
        
        await this.page.goto(articleInfo.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        
        try {
          await this.page.waitForSelector('article', { timeout: 8000 });
        } catch (timeoutError) {
          console.log(`⚠️ Timeout aguardando conteúdo, tentando continuar...`);
        }
        
        const articleData = await this.page.evaluate(() => {
          // Extrair título
          let titulo = '';
          const titleElement = document.querySelector('h1');
          if (titleElement) {
            titulo = titleElement.textContent?.trim() || '';
          }
          // Extrair data de publicação
          let dataPublicacao = '';
          let originalDatetime = '';
          const timeElement = document.querySelector('time[datetime]');
          if (timeElement) {
            const datetime = timeElement.getAttribute('datetime') || timeElement.textContent;
            if (datetime) {
              originalDatetime = datetime;
              let dateMatch = datetime.match(/\d{4}-\d{2}-\d{2}/);
              if (dateMatch) {
                dataPublicacao = dateMatch[0];
              } else {
                const date = new Date(datetime);
                if (!isNaN(date.getTime())) {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  dataPublicacao = `${year}-${month}-${day}`;
                }
              }
            }
          }
          // Extrair autor
          let autor = '';
          const authorElement = document.querySelector('a[data-ga*="Byline"]') || document.querySelector('.sc-16r8icm-6');
          if (authorElement) {
            autor = authorElement.textContent?.trim() || '';
          }
          // Extrair conteúdo principal
          let conteudo = '';
          const article = document.querySelector('article');
          if (article) {
            const paragraphs = Array.from(article.querySelectorAll('p'))
              .map(el => el.textContent?.trim())
              .filter(text => text && text.length > 50)
              .join(' ');
            if (paragraphs.length > 100) {
              conteudo = paragraphs;
            }
          }
          return { titulo, dataPublicacao, autor, conteudo, originalDatetime };
        });
        
        // Verificar se é um artigo de hoje
        const today = getTodayISODate();
        console.log(`📅 Comparando Gizmodo: artigo (${articleData.dataPublicacao}) vs hoje (${today})`);
        console.log(`🔍 Datetime original: ${articleData.originalDatetime}`);
        
        if (!isToday(articleData.dataPublicacao)) {
          console.log(`⏰ Artigo do Gizmodo não é de hoje (${articleData.dataPublicacao}), pulando...`);
          return null;
        }
        
        console.log(`✅ Artigo do Gizmodo aceito: ${articleData.dataPublicacao} (de hoje)`);
        
        return {
          titulo: articleData.titulo || articleInfo.title,
          url: articleInfo.url,
          dataPublicacao: articleData.dataPublicacao,
          autor: articleData.autor,
          conteudo: articleData.conteudo
        };
        
      } catch (error) {
        console.error(`❌ Erro ao processar artigo do Gizmodo ${articleInfo.url} (tentativa ${attempt}/${maxRetries}):`, error instanceof Error ? error.message : 'Erro desconhecido');
        
        if (attempt === maxRetries) {
          console.log(`⚠️ Desistindo do artigo do Gizmodo após ${maxRetries} tentativas`);
          return null;
        }
        
        console.log(`🔄 Aguardando 2 segundos antes da próxima tentativa...`);
        await this.sleep(2000);
      }
    }
    
    return null;
  }

  public async run(): Promise<void> {
    try {
      const today = getTodayISODate();
      console.log('🎯 Iniciando scraper do Gizmodo com Playwright...');
      console.log(`📅 Buscando artigos da data: ${today}`);
      console.log(`🔍 Timezone configurado: ${getTimezone()}`);
      await sendTelegramMessage('🚀 *Scraping do Gizmodo iniciado...*');
      
      await this.initializeBrowser();
      
      const articleLinks = await this.collectArticleLinks();
      
      if (articleLinks.length === 0) {
        console.log('⚠️ Nenhum artigo encontrado no Gizmodo');
        return;
      }
      
      let processedCount = 0;
      for (const articleLink of articleLinks) {
        if (processedCount >= this.maxArticles) {
          console.log(`✅ Limite de ${this.maxArticles} artigos do Gizmodo atingido`);
          break;
        }
        
        const article = await this.scrapeArticle(articleLink);
        if (article) {
          this.articles.push(article);
          processedCount++;
          console.log(`✅ Artigo do Gizmodo processado: ${article.titulo}`);
        }
        
        await this.sleep(this.delay);
      }
      
      await this.saveResults();
      
      console.log(`🎉 Scraping do Gizmodo concluído! ${this.articles.length} artigos coletados.`);
      await sendTelegramMessage(`🎉 Scraping do Gizmodo concluído! ${this.articles.length} artigos coletados.`);

    } catch (error) {
      console.error('❌ Erro durante o scraping do Gizmodo:', error);
      await sendTelegramMessage(`❌ Erro durante o scraping do Gizmodo: ${error}`);
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
    
    let existingArticles: Article[] = [];
    let existingData: any = {};
    
    // Tentar ler arquivo existente
    try {
      const existingContent = await fs.readFile(outputPath, 'utf-8');
      existingData = JSON.parse(existingContent);
      existingArticles = existingData.artigos || [];
      console.log(`📖 Arquivo existente encontrado com ${existingArticles.length} artigos`);
    } catch (error) {
      console.log('📄 Criando novo arquivo de notícias');
      existingData = {
        dataColeta: new Date().toISOString(),
        totalArtigos: 0,
        artigos: []
      };
    }
    
    // Combinar artigos existentes com novos do Gizmodo
    const allArticles = [...existingArticles, ...this.articles];
    
    const output = {
      dataColeta: new Date().toISOString(),
      totalArtigos: allArticles.length,
      artigos: allArticles
    };
    
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`💾 Resultados do Gizmodo salvos em: ${outputPath}`);
    console.log(`📊 Total de artigos no arquivo: ${allArticles.length} (${existingArticles.length} existentes + ${this.articles.length} do Gizmodo)`);
  }

  public getArticles(): Article[] {
    return this.articles;
  }
}

export { GizmodoScraper }; 