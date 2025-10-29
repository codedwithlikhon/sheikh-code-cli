import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { getConfig } from '../lib/config.ts';
import { getMcpServers } from './mcp.ts';
import { spawn } from 'child_process';

async function executeTool(toolName: string, args: string[]): Promise<string> {
    const servers = getMcpServers();
    const server = servers[toolName];

    if (!server) {
        return `Error: Tool "${toolName}" not found.`;
    }

    return new Promise((resolve) => {
        const child = spawn(server.command, [...server.args, ...args]);
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (data) => (stdout += data));
        child.stderr.on('data', (data) => (stderr += data));
        child.on('close', (code) => {
            if (code !== 0) {
                resolve(`Error: Tool "${toolName}" exited with code ${code}:\n${stderr}`);
            } else {
                resolve(stdout);
            }
        });
        child.on('error', (err) => {
            resolve(`Error: Failed to start tool "${toolName}": ${err.message}`);
        });
    });
}

function buildSystemPrompt(): string {
    const servers = getMcpServers();
    let prompt = "You are a helpful assistant that can use tools. To use a tool, you must respond with ONLY a JSON object in the format: {\"tool\": \"tool_name\", \"args\": \"arguments_as_a_string\"}. Do not add any other text, explanation, or formatting. Your response must be a valid JSON object and nothing else.\n\nYour available tools are:\n";
    for (const name in servers) {
        prompt += `- tool: ${name}, description: ${servers[name].description}\n`;
    }
    prompt += "\nChoose one of the tools listed above.";
    return prompt;
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

    const systemPrompt = buildSystemPrompt();
    
    // First call to the AI
    let { text } = await generateText({
        model,
        system: systemPrompt,
        prompt,
    });

    try {
        const toolCall = JSON.parse(text);
        if (toolCall.tool && toolCall.args) {
            console.log(`AI wants to run tool "${toolCall.tool}" with args "${toolCall.args}"`);
            const toolResult = await executeTool(toolCall.tool, toolCall.args.split(' '));
            
            // Second call to the AI with the tool's result
            const finalResult = await generateText({
                model,
                prompt: `The user asked: "${prompt}". I ran the tool "${toolCall.tool}" and got this result:\n\n${toolResult}\n\nPlease summarize this result for the user.`,
            });

            console.log(finalResult.text);
            return;
        }
    } catch (e) {
        // Not a JSON tool call, so just print the text
    }

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