import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config(); // Carregar variáveis de ambiente

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Guarde seu token no .env
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;     // Guarde seu chat ID no .env

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn('⚠️ Variáveis de ambiente TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configuradas. Notificações do Telegram desativadas.');
}

/**
 * Escapa caracteres especiais para MarkdownV2 do Telegram
 */
function escapeMarkdownV2(text: string): string {
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  let escapedText = text;
  
  for (const char of specialChars) {
    escapedText = escapedText.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
  }
  
  return escapedText;
}

export async function sendTelegramMessage(message: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return; // Não envia se as credenciais não estiverem configuradas
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const escapedMessage = escapeMarkdownV2(message);
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: escapedMessage,
      parse_mode: 'MarkdownV2'
    });
    console.log('✅ Mensagem do Telegram enviada com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para o Telegram:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Resposta de erro do Telegram:', error.response.data);
    }
  }
}

// Exemplo de uso:
// sendTelegramMessage('Olá do meu script Node.js!');