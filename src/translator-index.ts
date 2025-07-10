import { TechCrunchTranslator } from './translator';

async function main() {
  try {
    const translator = new TechCrunchTranslator();
    await translator.translateArticles();
  } catch (error) {
    console.error('❌ Erro na execução do tradutor:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
} 