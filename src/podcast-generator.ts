import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { sendTelegramMessage } from './telegram-provider';
import { getTodayISODate, getTodayPromptDate } from './utils/date-helper';

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

class PodcastGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY não está configurada. Configure a variável de ambiente com sua API Key do Google AI Studio.');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  private async loadArticles(): Promise<TranslatedArticle[]> {
    try {
      const today = getTodayISODate();
      const inputPath = path.join(process.cwd(), 'output', 'news', `news_${today}.json`);
      console.log(`📖 Carregando artigos de: ${inputPath}`);
      
      const fileContent = await fs.readFile(inputPath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // Verificar se é o formato esperado (array direto ou objeto com 'artigos')
      const articles = Array.isArray(data) ? data : data.artigos || [];
      
      // Filtrar apenas artigos que têm tradução
      const translatedArticles = articles.filter((article: any) => 
        article.tituloTraduzido && article.conteudoTraduzido
      ) as TranslatedArticle[];
      
      console.log(`✅ ${translatedArticles.length} artigos traduzidos carregados`);
      return translatedArticles;
    } catch (error) {
      console.error(`❌ Erro ao carregar artigos para gerar o roteiro:`, error);
      throw error;
    }
  }

  private buildPrompt(articles: TranslatedArticle[]): string {
    const today = getTodayPromptDate();

    let prompt = `Você é um roteirista de podcast de notícias de tecnologia. Crie um roteiro de podcast em português do Brasil para dois apresentadores (uma mulher como apresentadora 1 e um homem como apresentador 2) que discutirão as notícias mais recentes do site TechCrunch de ${today}.

**ESTRUTURA DO ROTEIRO:**

1.  **INTRODUÇÃO (30-45 segundos):**
    -   Os apresentadores dão as boas-vindas.
    -   Explicam que o episódio é sobre as notícias do dia do TechCrunch de ${today}.
    -   Tom descontraído e amigável.

2.  **DISCUSSÃO DAS NOTÍCIAS:**
    -   Para cada notícia, os apresentadores alternam falas.
    -   O apresentador geralmente apresenta a notícia.
    -   O outro apresentador comenta e adiciona contexto/impacto.
    -   A conversa deve ser dinâmica, como dois amigos discutindo tecnologia.
    -   Cada notícia deve ter 1-2 minutos de discussão.

3.  **ENCERRAMENTO (15-20 segundos):**
    -   Agradecimentos e convite para o próximo episódio.

**ESTILO DA CONVERSA:**
-   Tom informal mas informativo.
-   Como dois amigos que entendem de tecnologia.
-   Usar expressões brasileiras naturais.
-   Evitar linguagem muito técnica.
-   Manter o interesse do ouvinte.

**NOTÍCIAS DO DIA DO TECHCRUNCH:**

`;

    // Adicionar cada notícia ao prompt
    articles.forEach((article, index) => {
      prompt += `---
NOTÍCIA ${index + 1}:
Título: ${article.tituloTraduzido}
Conteúdo: ${article.conteudoTraduzido}
Data: ${article.dataPublicacao}
---

`;
    });

    prompt += `**FORMATO DE SAÍDA ESPERADO:**

Apresentador 1: Olá, pessoal! Sejam muito bem-vindos ao nosso bate-papo diário sobre tecnologia!
Apresentador 2: É isso mesmo! E hoje vamos mergulhar nas notícias mais quentes do dia, direto do TechCrunch de ${today}.
Apresentador 1: Para começar, temos uma notícia super interessante sobre [TÍTULO DA NOTÍCIA 1]. O que você achou disso?
Apresentador 2: Essa é realmente fascinante! [COMENTÁRIO SOBRE A NOTÍCIA 1]. O que me chamou a atenção foi [DETALHE/IMPACTO]!
Apresentador 1: Sim, e isso pode significar [CONSEQUÊNCIA/ANÁLISE]. Agora vamos para a próxima...
Apresentador 2: [TÍTULO DA NOTÍCIA 2] é outra que está dando o que falar...
[... continuar para todas as notícias ...]

Apresentador 1: Bom, por hoje é só, pessoal!
Apresentador 2: Exato! Não esqueçam de nos acompanhar amanhã para mais novidades do mundo da tecnologia!
Apresentador 1: Até lá!
Apresentador 2: Tchau, tchau!

**INSTRUÇÕES FINAIS:**
-   Mantenha o formato exato com "Apresentador 1:" e "Apresentador 2:" no início de cada fala.
-   Não use marcadores ou numeração na parte do diálogo.
-   Faça a conversa fluir naturalmente.
-   Inclua TODAS as notícias fornecidas.
-   Mantenha o tom descontraído e envolvente.
-   A saída deve ser texto puro, sem formatação Markdown adicional para o roteiro final.
`;

    return prompt;
  }

  private async generatePodcastScript(prompt: string): Promise<string> {
    try {
      console.log('🤖 Gerando roteiro de podcast com Gemini...');
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Roteiro gerado com sucesso!');
      return text;
    } catch (error) {
      console.error('❌ Erro ao gerar roteiro:', error);
      throw error;
    }
  }

  private async savePodcastScript(script: string): Promise<void> {
    try {
      const today = getTodayISODate();
      const fileName = `roteiro_podcast_${today}.txt`;
      const outputPath = path.join(process.cwd(), 'output', 'roteiro', fileName);
      
      // Criar diretório se não existir
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      console.log(`💾 Salvando roteiro em: ${outputPath}`);
      
      const header = `ROTEIRO DE PODCAST - TECHCRUNCH
Data: ${new Date().toLocaleDateString('pt-BR')}
Gerado automaticamente com Gemini AI
=====================================

`;
      
      await fs.writeFile(outputPath, header + script, 'utf-8');
      console.log(`✅ Roteiro salvo com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao salvar roteiro:', error);
      throw error;
    }
  }

  public async generatePodcast(): Promise<void> {
    try {
      console.log('🎙️ Iniciando geração de roteiro de podcast...');
      await sendTelegramMessage('🎙️ Iniciando geração de roteiro de podcast...');
      // Carregar artigos traduzidos
      const articles = await this.loadArticles();
      
      if (articles.length === 0) {
        console.log('⚠️ Nenhum artigo traduzido encontrado. Execute o tradutor primeiro.');
        return;
      }

      console.log(`📰 Processando ${articles.length} notícias...`);
      
      // Construir prompt
      const prompt = this.buildPrompt(articles);
      
      // Gerar roteiro
      const script = await this.generatePodcastScript(prompt);
      
      // Salvar roteiro
      await this.savePodcastScript(script);
      
      console.log('\n🎉 Roteiro de podcast gerado com sucesso!');
      console.log('📁 Arquivo salvo como: roteiro_podcast_YYYY-MM-DD.txt');
      await sendTelegramMessage('🎉 Roteiro de podcast gerado com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante a geração do podcast:', error);
      await sendTelegramMessage(`❌ Erro durante a geração do podcast: ${error}`);
      throw error;
    }
  }
}

export { PodcastGenerator };