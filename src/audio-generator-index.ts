import { AudioGenerator } from './audio-generator';

// Execução do script
async function main() {
  const generator = new AudioGenerator();
  await generator.generatePodcast();
}

if (require.main === module) {
  main().catch(console.error);
} 