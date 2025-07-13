import { GizmodoScraper } from './scraper_gizmodo';

async function main() {
  try {
    const scraper = new GizmodoScraper();
    await scraper.run();
    
    const articles = scraper.getArticles();
    console.log(`\n🎉 Scraping do Gizmodo finalizado com sucesso!`);
    console.log(`📊 Total de artigos coletados: ${articles.length}`);
    
    if (articles.length > 0) {
      console.log(`\n📰 Artigos coletados do Gizmodo:`);
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ${article.titulo}`);
        console.log(`   📅 ${article.dataPublicacao} | 👤 ${article.autor || 'N/A'}`);
        console.log(`   🔗 ${article.url}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante a execução do scraper do Gizmodo:', error);
    process.exit(1);
  }
}

main(); 