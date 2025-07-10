import { AudioImageMerger } from './merge-audio-image';

// Execução do script
async function main() {
  try {
    const merger = new AudioImageMerger();
    await merger.mergeAudioWithImage();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}