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

    let prompt = `Você é um roteirista de podcast de notícias de tecnologia. Crie um roteiro de podcast em português do Brasil para dois apresentadores (uma mulher como apresentadora 1 e um homem como apresentador 2) que discutirão as notícias mais recentes dos sites **TechCrunch e Gizmodo** de ${today}.

**INSTRUÇÕES DE CONSOLIDAÇÃO:**
Analise as notícias fornecidas abaixo. Se houver notícias sobre o MESMO TÓPICO ou TÓPICOS MUITO RELACIONADOS (por exemplo, várias notícias sobre IA, lançamentos de produtos da mesma empresa, ou regulamentação de criptomoedas), você deve **agrupá-las** e discuti-las como um **único segmento** no roteiro. O objetivo é criar uma discussão coesa sobre o tema, em vez de discutir cada artigo individualmente.

**ESTRUTURA DO ROTEIRO:**

1.  **INTRODUÇÃO (30-45 segundos):**
    -   Os apresentadores dão as boas-vindas.
    -   Explicam que o episódio é sobre as notícias do dia dos sites TechCrunch e Gizmodo de ${today}.
    -   Tom descontraído e amigável.

2.  **DISCUSSÃO DOS TÓPICOS CONSOLIDADOS:**
    -   Para cada tópico consolidado (ou notícia individual, se não houver similaridade), os apresentadores alternam falas.
    -   O apresentador geralmente apresenta o tópico, **incluindo os fatos mais relevantes e um breve histórico se necessário.**
    -   O outro apresentador comenta e adiciona contexto/impacto, **aprofundando-se nos detalhes chave, nas implicações para o mercado ou usuários, e possíveis desdobramentos futuros. Traga insights e uma análise mais aprofundada baseada nas informações do conteúdo fornecido.**
    -   A conversa deve ser dinâmica, como dois amigos discutindo tecnologia.
    -   Cada segmento de discussão (tópico consolidado) deve ter 1-2 minutos de duração, **permitindo aprofundamento.**

3.  **ENCERRAMENTO (15-20 segundos):**
    -   Agradecimentos e convite para o próximo episódio.

**ESTILO DA CONVERSA:**
-   Tom informal mas informativo.
-   Como dois amigos que entendem de tecnologia.
-   Usar expressões brasileiras naturais.
-   Evitar linguagem muito técnica.
-   Manter o interesse do ouvinte.

**NOTÍCIAS DO DIA:**

`;

    // Adicionar cada notícia ao prompt (aqui elas ainda estão separadas, mas a instrução acima pede a consolidação)
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
Apresentador 2: É isso mesmo! E hoje vamos mergulhar nas notícias mais quentes do dia, direto dos sites TechCrunch e Gizmodo de ${today}.
Apresentador 1: Para começar, temos um tópico super interessante sobre [TÓPICO CONSOLIDADO 1 - apresente o básico da notícia, os fatos centrais]. O que você achou disso?
Apresentador 2: Essa é realmente fascinante! [COMENTÁRIO SOBRE O TÓPICO 1, INCLUINDO DETALHES IMPORTANTES DAS NOTÍCIAS RELACIONADAS, IMPLICAÇÕES, E UMA ANÁLISE MAIS APROFUNDADA. EX: 'O que me chamou a atenção foi AQUELE DETALHE ESPECÍFICO que o artigo mencionou...' ou 'Isso pode significar X para o mercado por causa de Y...']!
Apresentador 1: Sim, e isso pode significar [CONSEQUÊNCIA/ANÁLISE ADICIONAL baseada em detalhes]. Agora vamos para a próxima...
Apresentador 2: [TÓPICO CONSOLIDADO 2 - apresente os fatos centrais da notícia/tópico]. Essa também é uma que promete bastante...
[... continuar para todos os tópicos/notícias, garantindo mais detalhes e análises nas falas dos apresentadores ...]

Apresentador 1: Bom, por hoje é só, pessoal!
Apresentador 2: Exato! Não esqueçam de nos acompanhar amanhã para mais novidades do mundo da tecnologia!
Apresentador 1: Até lá!
Apresentador 2: Tchau, tchau!

**INSTRUÇÕES FINAIS:**
-   Mantenha o formato exato com "Apresentador 1:" e "Apresentador 2:" no início de cada fala.
-   **Certifique-se de que cada apresentador traga informações detalhadas e insights aprofundados sobre o tópico discutido, não apenas um resumo superficial.**
-   Não use marcadores ou numeração na parte do diálogo.
-   Faça a conversa fluir naturalmente.
-   Inclua TODAS as notícias fornecidas, mas agrupadas por tema quando apropriado.
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