#!/usr/bin/env ts-node

import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as toml from 'toml';

dotenv.config();

// Define the structure of the config file
interface Config {
  provider: string;
  providers: {
    [key: string]: {
      api_key: string;
    };
  };
}

async function main() {
  try {
    // Read and parse the config.toml file
    const configContent = fs.readFileSync('./config.toml', 'utf-8');
    const config: Config = toml.parse(configContent);

    // Get the selected provider and its API key
    const providerName = config.provider;
    const providerConfig = config.providers[providerName];

    if (!providerConfig || !providerConfig.api_key) {
      console.error(`API key for provider "${providerName}" is not configured in config.toml`);
      return;
    }

    // Select the model based on the provider
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

    // Get the prompt from the command line arguments
    const prompt = process.argv.slice(2).join(' ');
    if (!prompt) {
      console.error('Please provide a prompt.');
      return;
    }

    // Generate text using the selected model
    const { text } = await generateText({
      model,
      prompt,
    });

    console.log(text);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('An unknown error occurred.');
    }
  }
}

main();
