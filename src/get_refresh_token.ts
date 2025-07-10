import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as readline from 'readline'; // Para ler a entrada do usuário
import * as path from 'path';

// Carregar as credenciais do cliente OAuth do arquivo JSON
const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials', 'oAuthCredentials.json'); // Assumindo que está na raiz ou um nível acima

async function getAuthenticatedClient() {
  const credentials = await fs.promises.readFile(CREDENTIALS_PATH);
  const { client_id, client_secret, redirect_uris } = JSON.parse(credentials.toString()).installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0] // Usar 'urn:ietf:wg:oauth:2.0:oob'
  );

  // Definir os escopos de permissão necessários (youtube.upload é essencial)
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly' // Opcional, se precisar de outras operações
  ];

  // Gerar a URL de autorização
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // MUITO IMPORTANTE: para obter um refresh_token
    scope: scopes.join(' '),
  });

  console.log('Autorize este aplicativo visitando esta URL:');
  console.log(authUrl);

  // Abrir a URL no navegador padrão (requer `open` em macOS/Linux ou `start` em Windows)
  // Isso é apenas para conveniência, o usuário pode copiar e colar a URL
  try {
    const open = require('open'); // npm install open
    await open(authUrl);
  } catch (err) {
    console.warn('Não foi possível abrir a URL automaticamente. Por favor, copie e cole no seu navegador.');
  }

  // Criar interface para ler a entrada do usuário
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<OAuth2Client>((resolve, reject) => {
    rl.question('Digite o código de autorização daquela página aqui: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        console.log('\n--- AUTENTICAÇÃO BEM-SUCEDIDA ---');
        console.log('Seu token de atualização (refresh_token):', tokens.refresh_token);
        console.log('Guarde este token de forma SEGURA. Ele permitirá uploads futuros sem reautorização.');
        
        // Opcional: Salvar o refresh_token em um arquivo separado para uso futuro
        const TOKEN_PATH = path.join(__dirname, '..', 'credentials', 'youtube_token.json');
        await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
        console.log(`Tokens salvos em: ${TOKEN_PATH}`);

        resolve(oauth2Client);
      } catch (err) {
        console.error('Erro ao obter tokens:', err);
        reject(err);
      }
    });
  });
}

// Executar a função principal
getAuthenticatedClient().catch(console.error);