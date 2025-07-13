import { FullPipeline } from './full-pipeline';
import * as dotenv from 'dotenv';
import cron from 'node-cron';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do cron
const CRON_EXECUTION_TIME = process.env.CRON_EXECUTION_TIME || '20:00';
const CRON_TIMEZONE = process.env.CRON_TIMEZONE || 'America/Sao_Paulo';

// Extrair hora e minuto da string de tempo
const [cronHour, cronMinute] = CRON_EXECUTION_TIME.split(':').map(Number);

// Variável para controlar se o pipeline está em execução
let isPipelineRunning = false;

/**
 * Script para execução via cron
 * Executa o pipeline completo e sai
 */
async function runPipeline() {
    if (isPipelineRunning) {
        console.log('⚠️ Pipeline já está em execução. Aguardando...');
        return;
      }
    
      try {
        isPipelineRunning = true;
        console.log('');
        console.log('🕐 ==========================================');
        console.log('🕐 EXECUÇÃO CRON INICIADA');
        console.log(`📅 Data/Hora: ${getCurrentTimeInSaoPaulo().toLocaleString('pt-BR', { timeZone: CRON_TIMEZONE })}`);
        console.log('🕐 ==========================================');
        
        const pipeline = new FullPipeline();
        await pipeline.run();
        
        console.log('✅ ==========================================');
        console.log('✅ EXECUÇÃO CRON CONCLUÍDA COM SUCESSO');
        console.log(`📅 Data/Hora: ${getCurrentTimeInSaoPaulo().toLocaleString('pt-BR', { timeZone: CRON_TIMEZONE })}`);
        console.log('✅ ==========================================');
        console.log('');
        
      } catch (error) {
        console.error('❌ ==========================================');
        console.error('❌ ERRO NA EXECUÇÃO CRON');
        console.error(`📅 Data/Hora: ${getCurrentTimeInSaoPaulo().toLocaleString('pt-BR', { timeZone: CRON_TIMEZONE })}`);
        console.error('❌ Erro:', error);
        console.error('❌ ==========================================');
        console.log('');
      } finally {
        isPipelineRunning = false;
      }
}

/**
 * Obtém a data/hora atual no timezone configurado
 */
function getCurrentTimeInSaoPaulo(): Date {
    const now = new Date();
    const configuredTime = new Date(now.toLocaleString('en-US', { timeZone: CRON_TIMEZONE }));
    return configuredTime;
}

/**
 * Retorna a próxima execução do cron considerando o horário atual
 */
export function getNextCronExecution(): string {
    // Obter data/hora atual no timezone configurado
    const now = getCurrentTimeInSaoPaulo();
    const next = new Date(now);
    next.setHours(cronHour, cronMinute, 0, 0);
    
    if (now.getHours() > cronHour || (now.getHours() === cronHour && now.getMinutes() > cronMinute)) {
      // Já passou do horário configurado, próxima execução é amanhã
      next.setDate(next.getDate() + 1);
    } else if (now.getHours() === cronHour && now.getMinutes() === cronMinute && now.getSeconds() === 0) {
      // Exatamente no horário configurado, próxima execução é hoje
      // (não altera a data)
    } else if (now.getHours() < cronHour || (now.getHours() === cronHour && now.getMinutes() < cronMinute)) {
      // Antes do horário configurado, próxima execução é hoje
      // (não altera a data)
    }
    
    return next.toLocaleString('pt-BR', { timeZone: CRON_TIMEZONE });
  }

  /**
 * Configura o cron job para executar o pipeline
 */
export function setupCronJob(): void {
    // Criar expressão cron dinâmica baseada nas configurações
    const cronExpression = `${cronMinute} ${cronHour} * * *`;
    
    // Debug: Mostrar informações de timezone
    console.log(`🌍 ==========================================`);
    console.log(`🌍 CONFIGURAÇÃO DE TIMEZONE`);
    console.log(`🌍 CRON_TIMEZONE: ${CRON_TIMEZONE}`);
    console.log(`🌍 TZ (env): ${process.env.TZ || 'não definido'}`);
    console.log(`🌍 Data/hora atual (UTC): ${new Date().toISOString()}`);
    console.log(`🌍 Data/hora atual (São Paulo): ${new Date().toLocaleString('pt-BR', { timeZone: CRON_TIMEZONE })}`);
    console.log(`🌍 ==========================================`);
    
    // Agendar execução no horário configurado
    cron.schedule(cronExpression, runPipeline, {
      timezone: CRON_TIMEZONE
    });
  
    console.log(`⏰ Cron job configurado: Pipeline executará todos os dias às ${CRON_EXECUTION_TIME} (timezone: ${CRON_TIMEZONE})`);
    console.log(`⏰ Expressão cron: ${cronExpression}`);
    console.log(`⏰ Próxima execução: ${getNextCronExecution()}`);
    console.log('');
}