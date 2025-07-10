export interface ArticleInfo {
  url: string;
  title: string;
}

export interface Article {
  titulo: string;
  url: string;
  dataPublicacao: string;
  autor: string;
  conteudo: string;
}

export interface ScraperConfig {
  baseUrl: string;
  delay: number;
  maxArticles: number;
  timeout: number;
  retries: number;
} 