/**
 * Helper centralizado para gerenciamento de datas no projeto TechCast
 * Garante consistência de timezone e formato em todo o sistema
 */

export class DateHelper {
  private static timezone = process.env.CRON_TIMEZONE || 'America/Sao_Paulo';

  /**
   * Retorna a data atual no formato YYYY-MM-DD usando o timezone configurado
   * @returns string - Data no formato YYYY-MM-DD
   */
  static getTodayISODate(): string {
    const now = new Date();
    
    // Usar timezone de São Paulo para garantir consistência
    const options: Intl.DateTimeFormatOptions = {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    const dateString = now.toLocaleDateString('en-CA', options); // en-CA retorna YYYY-MM-DD
    return dateString;
  }

  /**
   * Retorna a data atual no formato DD/MM/YYYY para exibição
   * @returns string - Data no formato DD/MM/YYYY
   */
  static getTodayDisplayDate(): string {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { 
      timeZone: this.timezone,
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }

  /**
   * Retorna a data atual no formato DD/MM/YYYY para uso em prompts
   * @returns string - Data no formato DD/MM/YYYY
   */
  static getTodayPromptDate(): string {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { 
      timeZone: this.timezone,
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }

  /**
   * Retorna a data/hora atual formatada para logs
   * @returns string - Data/hora no formato DD/MM/YYYY HH:MM:SS
   */
  static getCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleString('pt-BR', { 
      timeZone: this.timezone,
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Retorna o timezone configurado
   * @returns string - Nome do timezone
   */
  static getTimezone(): string {
    return this.timezone;
  }

  /**
   * Verifica se uma data é de hoje
   * @param dateString - Data no formato YYYY-MM-DD
   * @returns boolean - true se for hoje
   */
  static isToday(dateString: string): boolean {
    return dateString === this.getTodayISODate();
  }

  /**
   * Verifica se uma data é de ontem
   * @param dateString - Data no formato YYYY-MM-DD
   * @returns boolean - true se for ontem
   */
  static isYesterday(dateString: string): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Usar timezone de São Paulo para garantir consistência
    const options: Intl.DateTimeFormatOptions = {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    const yesterdayString = yesterday.toLocaleDateString('en-CA', options);
    return dateString === yesterdayString;
  }

  /**
   * Verifica se uma data é recente (hoje ou ontem)
   * @param dateString - Data no formato YYYY-MM-DD
   * @returns boolean - true se for recente
   */
  static isRecent(dateString: string): boolean {
    return this.isToday(dateString) || this.isYesterday(dateString);
  }

  /**
   * Gera nome de arquivo com data atual
   * @param prefix - Prefixo do arquivo
   * @param extension - Extensão do arquivo (com ponto)
   * @returns string - Nome do arquivo com data
   */
  static getFileNameWithDate(prefix: string, extension: string): string {
    const date = this.getTodayISODate();
    return `${prefix}_${date}${extension}`;
  }

  /**
   * Gera caminho completo de arquivo com data
   * @param directory - Diretório do arquivo
   * @param prefix - Prefixo do arquivo
   * @param extension - Extensão do arquivo (com ponto)
   * @returns string - Caminho completo do arquivo
   */
  static getFilePathWithDate(directory: string, prefix: string, extension: string): string {
    const fileName = this.getFileNameWithDate(prefix, extension);
    return `${directory}/${fileName}`;
  }
}

// Exportar funções de conveniência para uso direto
export const getTodayISODate = () => DateHelper.getTodayISODate();
export const getTodayDisplayDate = () => DateHelper.getTodayDisplayDate();
export const getTodayPromptDate = () => DateHelper.getTodayPromptDate();
export const getCurrentDateTime = () => DateHelper.getCurrentDateTime();
export const getTimezone = () => DateHelper.getTimezone();
export const isToday = (dateString: string) => DateHelper.isToday(dateString);
export const isYesterday = (dateString: string) => DateHelper.isYesterday(dateString);
export const isRecent = (dateString: string) => DateHelper.isRecent(dateString);
export const getFileNameWithDate = (prefix: string, extension: string) => DateHelper.getFileNameWithDate(prefix, extension);
export const getFilePathWithDate = (directory: string, prefix: string, extension: string) => DateHelper.getFilePathWithDate(directory, prefix, extension); 