import express from 'express';
import { getNextCronExecution } from '../../cron-pipeline';

const router = express.Router();

/**
 * @route GET /api/cron/next-execution
 * @desc Retorna a próxima execução programada do cron
 * @access Public
 */
router.get('/next-execution', async (req, res) => {
  try {
    const nextExecution = getNextCronExecution();
    
    res.json({
      success: true,
      message: 'Próxima execução do cron',
      data: {
        nextExecution,
        schedule: `Todos os dias no horário configurado (padrão: ${process.env.CRON_EXECUTION_TIME || '20:00'})`,
        timezone: process.env.CRON_TIMEZONE || 'America/Sao_Paulo',
        cronExpression: `${process.env.CRON_EXECUTION_TIME?.split(':')[1] || '0'} ${process.env.CRON_EXECUTION_TIME?.split(':')[0] || '20'} * * *`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter próxima execução do cron:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter próxima execução do cron',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router; 