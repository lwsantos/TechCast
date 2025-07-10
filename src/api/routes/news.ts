import express from 'express';
import { TechCrunchScraper } from '../../scraper';
import { TechCrunchTranslator } from '../../translator';

const router = express.Router();

/**
 * @route GET /api/news/scrape
 * @desc Inicia o processo de web scraping das notícias do TechCrunch
 * @access Public
 */
router.get('/scrape', async (req, res) => {
  try {
    console.log('📰 Iniciando scraping de notícias...');
    
    const scraper = new TechCrunchScraper({
      maxArticles: 50,
      delay: 3000,
      timeout: 30000
    });

    await scraper.run();
    const articles = scraper.getArticles();

    res.json({
      success: true,
      message: `Scraping concluído com sucesso! ${articles.length} artigos extraídos.`,
      data: {
        articlesCount: articles.length,
        timestamp: new Date().toISOString(),
        articles: articles.slice(0, 5) // Retorna apenas os primeiros 5 artigos como exemplo
      }
    });

  } catch (error) {
    console.error('❌ Erro no scraping:', error);
    res.status(500).json({
      success: false,
      error: 'Erro durante o scraping',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * @route GET /api/news/translate
 * @desc Inicia o processo de tradução das notícias
 * @access Public
 */
router.get('/translate', async (req, res) => {
  try {
    console.log('🌐 Iniciando tradução de notícias...');
    
    const translator = new TechCrunchTranslator();
    await translator.translateArticles();

    res.json({
      success: true,
      message: 'Tradução concluída com sucesso!',
      data: {
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Erro na tradução:', error);
    res.status(500).json({
      success: false,
      error: 'Erro durante a tradução',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router; 