import { PodcastGenerator } from './podcast-generator';

async function main() {
    try {
      const generator = new PodcastGenerator();
      await generator.generatePodcast();
    } catch (error) {
      console.error('❌ Erro na execução do gerador de podcast:', error);
      process.exit(1);
    }
  }

if (require.main === module) {
  main().catch(console.error);
} 