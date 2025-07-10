import { YouTubeUploader } from './upload_to_youtube';

async function main() {
  try {
    const uploader = new YouTubeUploader();
    await uploader.upload();
  } catch (error) {
    console.error('Erro fatal:', error);
    process.exit(1);
  }
}

main(); 