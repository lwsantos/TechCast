# Tradução com Gemini AI

## Por que usar o Gemini para tradução?

O Google Translate pode ser muito caro para projetos com muitos artigos. O Gemini AI oferece uma alternativa mais econômica com qualidade similar.

## Configuração

### 1. Obter API Key do Gemini

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar variável de ambiente

Adicione no seu arquivo `.env`:

```bash
GEMINI_API_KEY=sua-chave-do-gemini-aqui
```

## Como usar

### Executar tradução com Gemini

```bash
npm run translate:gemini
```

### Comparação de custos

| Serviço | Custo por 1M caracteres | Qualidade |
|---------|------------------------|-----------|
| Google Translate | ~$20 USD | Excelente |
| Gemini AI | ~$0.50 USD | Muito boa |

**Economia: ~97.5% menos custo!**

## Diferenças entre os tradutores

### Tradutor Original (Google Translate)
- **Comando**: `npm run translate`
- **Custo**: Alto
- **Configuração**: Arquivo de credenciais de conta de serviço
- **Qualidade**: Excelente

### Tradutor Gemini
- **Comando**: `npm run translate:gemini`
- **Custo**: Muito baixo
- **Configuração**: API Key simples
- **Qualidade**: Muito boa

## Vantagens do Gemini

1. **Custo muito menor**: ~97.5% de economia
2. **Configuração simples**: Apenas uma API Key
3. **Qualidade similar**: Traduções naturais e precisas
4. **Rate limiting**: Implementado para evitar problemas
5. **Fallback**: Em caso de erro, mantém o texto original

## Limitações

- Pode ser ligeiramente mais lento que o Google Translate
- Rate limits mais restritivos (por isso o delay de 500ms)
- Depende da disponibilidade da API do Gemini

## Troubleshooting

### Erro: "GEMINI_API_KEY não encontrada"
- Verifique se a variável está no arquivo `.env`
- Reinicie o terminal após adicionar a variável

### Erro de rate limiting
- O sistema já implementa delays automáticos
- Se persistir, aumente o delay no código (linha 35 do `translator-gemini.ts`)

### Tradução com qualidade inferior
- O Gemini pode ocasionalmente produzir traduções menos precisas
- Para artigos críticos, considere usar o Google Translate original

## Migração

Para migrar completamente do Google Translate para o Gemini:

1. Configure a `GEMINI_API_KEY`
2. Teste com alguns artigos: `npm run translate:gemini`
3. Avalie a qualidade das traduções
4. Se satisfeito, pode remover a dependência `@google-cloud/translate` do `package.json`

## Suporte

Se encontrar problemas com o Gemini, você pode sempre voltar ao tradutor original:

```bash
npm run translate
``` 