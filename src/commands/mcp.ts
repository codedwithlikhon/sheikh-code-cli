import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mcpConfigPath = path.resolve(__dirname, '../../../.mcp-servers.json');

interface McpServer {
    command: string;
    args: string[];
    description: string;
}

interface McpConfig {
    [key: string]: McpServer;
}

export export function getMcpServers(): McpConfig {
    if (!fs.existsSync(mcpConfigPath)) {
        return {};
    }
    const content = fs.readFileSync(mcpConfigPath, 'utf-8');
    return JSON.parse(content);
}

function saveMcpServers(servers: McpConfig) {
    fs.writeFileSync(mcpConfigPath, JSON.stringify(servers, null, 2));
}

export function addMcpServer(name: string, command: string, args: string[]) {
    const servers = getMcpServers();
    servers[name] = {
        command,
        args,
        description: '', // You can add a way to provide a description
    };
    saveMcpServers(servers);
    console.log(`MCP server "${name}" added.`);
}

export function listMcpServers() {
    const servers = getMcpServers();
    console.log('Configured MCP servers:');
    for (const name in servers) {
        console.log(`- ${name}`);
    }
}

export function removeMcpServer(name: string) {
    const servers = getMcpServers();
    if (servers[name]) {
        delete servers[name];
        saveMcpServers(servers);
        console.log(`MCP server "${name}" removed.`);
    } else {
        console.error(`MCP server "${name}" not found.`);
    }
}
