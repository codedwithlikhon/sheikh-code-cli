#!/usr/bin/env ts-node

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const { text } = await generateText({
    model: google('gemini-2.5-flash'),
    prompt: process.argv.slice(2).join(' '),
  });

  console.log(text);
}

main();
