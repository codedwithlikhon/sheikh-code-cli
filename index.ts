#!/usr/bin/env ts-node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as toml from 'toml';
import * as path from 'path';
import { fileURLToPath } from 'url';

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

// Define the structure for MCP server configuration
interface McpServer {
    command: string;
    args: string[];
    description: string;
}

interface McpConfig {
    [key: string]: McpServer;
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mcpConfigPath = path.join(__dirname, '.mcp-servers.json');


async function handlePrompt(prompt: string) {
  try {
    // Read and parse the config.toml file
    const configContent = fs.readFileSync('./config.toml', 'utf-8');
    const config: Config = toml.parse(configContent);

    // Get the selected provider and its API key
    const providerName = config.provider;
    const providerConfig = config.providers[providerName];

    if (!providerConfig || !providerConfig.api_key || providerConfig.api_key.startsWith('YOUR')) {
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

    // Generate text using the selected model
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

function getMcpServers(): McpConfig {
    if (!fs.existsSync(mcpConfigPath)) {
        return {};
    }
    const content = fs.readFileSync(mcpConfigPath, 'utf-8');
    return JSON.parse(content);
}

function saveMcpServers(servers: McpConfig) {
    fs.writeFileSync(mcpConfigPath, JSON.stringify(servers, null, 2));
}

yargs(hideBin(process.argv))
  .command(
    '$0 <prompt...>',
    'Generate text using the configured AI provider.',
    (yargs) => {
      return yargs.positional('prompt', {
        describe: 'The prompt to send to the AI',
        type: 'string',
        demandOption: true,
      });
    },
    (argv) => {
      handlePrompt(argv.prompt.join(' '));
    }
  )
  .command('mcp <command> [args...]', 'Manage MCP servers.', (yargs) => {
    yargs
      .command('add <name> <command> [args...]', 'Add a new MCP server.', {}, (argv) => {
          const servers = getMcpServers();
          servers[argv.name as string] = {
              command: argv.command as string,
              args: argv.args as string[],
              description: '', // You can add a way to provide a description
          };
          saveMcpServers(servers);
          console.log(`MCP server "${argv.name}" added.`);
      })
      .command('list', 'List all configured MCP servers.', {}, () => {
          const servers = getMcpServers();
          console.log('Configured MCP servers:');
          for (const name in servers) {
              console.log(`- ${name}`);
          }
      })
      .command('remove <name>', 'Remove an MCP server.', {}, (argv) => {
            const servers = getMcpServers();
            if (servers[argv.name as string]) {
                delete servers[argv.name as string];
                saveMcpServers(servers);
                console.log(`MCP server "${argv.name}" removed.`);
            } else {
                console.error(`MCP server "${argv.name}" not found.`);
            }
      })
      .demandCommand(1, 'You need at least one command before moving on.')
      .help();
  })
  .help()
  .argv;
