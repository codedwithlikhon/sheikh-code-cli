import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { getConfig } from '../lib/config.ts';

export async function handlePrompt(prompt: string) {
  try {
    const config = getConfig();
    const providerName = config.provider;
    const providerConfig = config.providers[providerName];

    if (!providerConfig || !providerConfig.api_key || providerConfig.api_key.startsWith('YOUR')) {
      console.error(`API key for provider "${providerName}" is not configured in config.toml`);
      return;
    }

    let model;
    switch (providerName) {
      case 'google':
        model = google('gemini-2.5-flash', { apiKey: providerConfig.api_key });
        break;
      case 'openai':
        model = openai('gpt-4', { apiKey: providerConfig.api_key });
        break;
      case 'anthropic':
        model = anthropic('claude-3-opus-20240229', { apiKey: providerConfig.api_key });
        break;
      default:
        console.error(`Unsupported provider: ${providerName}`);
        return;
    }

    const { text } = await generateText({
      model,
      prompt,
    });

    console.log(text);
  } catch (error) {
    if (error instanceof Error) {
        if (error.message.includes('file not found')) {
            console.error('Error: config.toml not found. Please create the file and add your API keys.');
        } else {
            console.error(error.message);
        }
    } else {
      console.error('An unknown error occurred.');
    }
  }
}
