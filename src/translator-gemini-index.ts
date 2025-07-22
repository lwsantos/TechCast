import { TechCrunchTranslatorGemini } from './translator-gemini';

async function main() {
  try {
    const translator = new TechCrunchTranslatorGemini();
    await translator.translateArticles();
  } catch (error) {
    console.error('❌ Erro na execução do tradutor Gemini:', error);
    process.exit(1);
  }
}

main(); 