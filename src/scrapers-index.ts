import { TechCrunchScraper } from './scraper';
import { GizmodoScraper } from './scraper_gizmodo';

async function runTechCrunchScraper(): Promise<void> {
  console.log('\n🚀 Iniciando scraper: TechCrunch');
  
  try {
    const scraper = new TechCrunchScraper({
      maxArticles: 20,
      delay: 3000,
      timeout: 30000
    });
    
    await scraper.run();
    console.log('✅ Scraper TechCrunch concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar scraper TechCrunch:', error);
    throw error;
  }
}

async function runGizmodoScraper(): Promise<void> {
  console.log('\n🚀 Iniciando scraper: Gizmodo');
  
  try {
    const scraper = new GizmodoScraper();
    await scraper.run();
    
    const articles = scraper.getArticles();
    console.log(`✅ Scraper Gizmodo concluído com sucesso!`);
    console.log(`📊 Total de artigos coletados: ${articles.length}`);
  } catch (error) {
    console.error('❌ Erro ao executar scraper Gizmodo:', error);
    throw error;
  }
}

async function runAllScrapers(): Promise<void> {
  console.log('📰 Iniciando execução de todos os scrapers...');
  console.log('⏰ Data/Hora:', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
  
  try {
    await runTechCrunchScraper();
  } catch (error) {
    console.error('❌ Falha no scraper TechCrunch:', error);
  }
  
  try {
    await runGizmodoScraper();
  } catch (error) {
    console.error('❌ Falha no scraper Gizmodo:', error);
  }
  
  console.log('\n🎉 Execução de todos os scrapers concluída!');
  console.log('📁 Verifique os arquivos JSON em output/ para ver os resultados.');
}

// Executar se chamado diretamente
if (require.main === module) {
  runAllScrapers().catch((error) => {
    console.error('❌ Erro fatal na execução dos scrapers:', error);
    process.exit(1);
  });
}

export { runAllScrapers, runTechCrunchScraper, runGizmodoScraper }; 