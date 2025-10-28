import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { getConfig } from '../lib/config.ts';
import { getMcpServers } from './mcp.ts';
import { z } from 'zod';
import { spawn } from 'child_process';

async function executeTool(toolName: string, args: readonly any[]): Promise<string> {
    const servers = getMcpServers();
    const server = servers[toolName];

    if (!server) {
        return `Tool "${toolName}" not found.`;
    }

    return new Promise((resolve) => {
        const child = spawn(server.command, [...server.args, ...args.map(String)]);
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data;
        });

        child.stderr.on('data', (data) => {
            stderr += data;
        });

        child.on('close', (code) => {
            if (code !== 0) {
                resolve(`Tool "${toolName}" exited with code ${code}:\n${stderr}`);
            } else {
                resolve(stdout);
            }
        });

        child.on('error', (err) => {
            resolve(`Failed to start tool "${toolName}": ${err.message}`);
        });
    });
}


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

    const mcpServers = getMcpServers();
    const tools:any = {};
    for (const serverName in mcpServers) {
        tools[serverName] = tool({
            description: mcpServers[serverName].description,
            parameters: z.object({
                args: z.string().describe('A string of arguments to pass to the command'),
            }),
            execute: async ({ args }: { args: string }) => {
                return await executeTool(serverName, args.split(' '));
            }
        })
    }

    const messages = [{ role: 'user' as const, content: prompt }];

    for (let i = 0; i < 5; i++) { // Loop to allow for multiple tool calls
        const { text, toolCalls } = await generateText({
            model,
            messages: messages,
            tools
        });

        if (toolCalls && toolCalls.length > 0) {
            messages.push({
                role: 'assistant',
                content: '',
                toolCalls: toolCalls
            });

            for (const toolCall of toolCalls) {
                const result = await toolCall.execute();
                messages.push({
                    role: 'tool',
                    toolCallId: toolCall.toolCallId,
                    content: result
                });
            }
        } else {
            console.log(text);
            return;
        }
    }
    console.log("Loop limit reached. The AI may be stuck in a tool-calling loop.");


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
