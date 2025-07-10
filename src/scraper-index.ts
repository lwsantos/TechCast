import { TechCrunchScraper } from './scraper';

async function main() {
  const scraper = new TechCrunchScraper({
    maxArticles: 20, // Limitar a 20 artigos para teste
    delay: 3000, // 3 segundos entre requisições
    timeout: 30000 // 30 segundos de timeout
  });
  
  try {
    await scraper.run();
  } catch (error) {
    console.error('❌ Erro na execução do scraper:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
} 