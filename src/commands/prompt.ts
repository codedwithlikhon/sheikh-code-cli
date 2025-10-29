import { OpenAI } from 'openai';
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
    prompt += "\nChoose one of the tools listed above if applicable.";
    return prompt;
}

export async function handlePrompt(prompt: string, options: { showThinking: boolean }) {
  try {
    const config = getConfig();
    const providerName = config.provider;
    const providerConfig = config.providers[providerName];

    if (!providerConfig || !providerConfig.api_key || providerConfig.api_key.startsWith('YOUR')) {
      console.error(`API key for provider "${providerName}" is not configured in config.toml`);
      return;
    }
    if (!providerConfig.base_url) {
        console.error(`base_url for provider "${providerName}" is not configured in config.toml`);
        return;
    }

    const openai = new OpenAI({
        apiKey: providerConfig.api_key,
        baseURL: providerConfig.base_url,
    });

    let modelName: string;
    switch (providerName) {
      case 'google':
        modelName = 'gemini-2.5-flash';
        break;
      case 'openai':
        modelName = 'gpt-4';
        break;
      case 'minimax':
        modelName = 'MiniMax-M2';
        break;
      case 'anthropic':
        // Anthropic is not yet supported with this implementation
        console.error(`Unsupported provider: ${providerName}`);
        return;
      default:
        console.error(`Unsupported provider: ${providerName}`);
        return;
    }

    const systemPrompt = buildSystemPrompt();
    
    const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
    });

    let message = response.choices[0].message.content || '';

    // Handle thinking process
    if (options.showThinking) {
        const thinkRegex = /<think>([\s\S]*?)<\/think>/;
        const match = message.match(thinkRegex);
        if (match) {
            console.log("Thinking...\n" + match[1].trim() + "\n");
            message = message.replace(thinkRegex, '').trim();
        }
    }


    // Strip markdown code block if present
    if (message.startsWith('```json')) {
        message = message.substring(7, message.length - 3).trim();
    }

    try {
        const toolCall = JSON.parse(message);
        if (toolCall.tool && typeof toolCall.args === 'string') {
            const args = toolCall.args.split(' ').filter(arg => arg.length > 0);
            const toolResult = await executeTool(toolCall.tool, args);
            
            const finalResponse = await openai.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: "You are a helpful assistant. Summarize the result of the tool call for the user." },
                    { role: 'user', content: `The user's original prompt was: "${prompt}". I ran the tool "${toolCall.tool}" and got this result:\n\n${toolResult}` }
                ],
            });

            console.log(finalResponse.choices[0].message.content);
            return;
        }
    } catch (e) {
        // Not a JSON tool call, so just print the text
    }

    console.log(message);

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
