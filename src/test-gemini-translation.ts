import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testGeminiTranslation() {
  try {
    console.log('🧪 Testando tradução com Gemini AI...');
    
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY não encontrada nas variáveis de ambiente');
      console.log('💡 Adicione GEMINI_API_KEY=sua-chave no arquivo .env');
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Texto de teste
    const testText = "Apple's new iPhone 15 features groundbreaking technology that will revolutionize mobile photography.";
    
    console.log(`📝 Texto original: "${testText}"`);
    
    const prompt = `Traduza o seguinte texto do inglês para português brasileiro. Mantenha o tom e estilo original, mas adapte para soar natural em português:

"${testText}"

Responda apenas com a tradução, sem explicações adicionais.`;

    console.log('🔄 Traduzindo...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();
    
    console.log(`✅ Tradução: "${translatedText}"`);
    console.log('🎉 Teste concluído com sucesso! O Gemini está funcionando.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.log('💡 Verifique se a API Key está correta e se você tem créditos disponíveis.');
  }
}

testGeminiTranslation(); 