# Project Overview

This project is an open-source command-line interface (CLI) that uses the AI SDK to interact with various large language models. It is written in TypeScript and can be configured to use different AI providers like Google, OpenAI, and Anthropic by editing the `config.toml` file.

## Building and Running

### Prerequisites

*   Node.js and npm
*   TypeScript

### Installation

1.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the CLI

1.  **Configure the AI provider:**
    *   Open the `config.toml` file.
    *   Set the `provider` to your desired AI provider (e.g., "google", "openai").
    *   Add your API key for the selected provider in the corresponding section.

2.  **Run the CLI:**
    The `package.json` file defines a `bin` entry, allowing the CLI to be run using the name `sheikh`.
    ```bash
    sheikh "Your prompt here"
    ```
    For example:
    ```bash
    sheikh "Hello, world!"
    ```

### Testing

There are no tests configured for this project yet.

```
TODO: Add a testing framework and write tests for the CLI.
```

## Development Conventions

*   The project uses TypeScript for static typing.
*   The code is written in a functional style.
*   The project uses the `toml` library to parse the configuration file.
*   The `dotenv` library is used to manage environment variables.
*   The `.gitignore` file is used to exclude `node_modules`, `.env`, and `config.toml` from the repository.

---

## Extending with MCP Servers (No API Keys Required)

This CLI can be extended by integrating with the Model Context Protocol (MCP), which provides a standardized way to interact with various tools and data sources. Below is a comprehensive list of **32 production-ready MCP servers** that work without requiring any API keys.

### Quick Start: Adding a Server

You can add these servers to extend the CLI's capabilities. For example, to add filesystem access:

```bash
# The command would look like this:
sheikh mcp add filesystem npx -y @modelcontextprotocol/server-filesystem /home/user/projects
```

### 📁 File & Data Management (5 servers)

| Server | Command | Description |
|---|---|---|
| **filesystem** | `npx -y @modelcontextprotocol/server-filesystem /path` | Secure file operations with access controls |
| **memory** | `npx -y @modelcontextprotocol/server-memory` | Knowledge graph-based persistent memory |
| **sqlite** | `uvx mcp-server-sqlite --db-path /path/db.db` | SQLite database operations and queries |
| **git** | `npx -y @modelcontextprotocol/server-git` | Read, search, and manipulate Git repos |
| **sequential-thinking** | `npx -y @modelcontextprotocol/server-sequential-thinking` | Problem-solving through thought sequences |

### 🔍 Web Search & Data (7 servers)

| Server | Command/URL | Description |
|---|---|---|
| **web-search** | `npx -y pskill9/web-search` | Free Google search (no API key) |
| **duckduckgo-search** | `npx -y @modelcontextprotocol/server-duckduckgo` | Privacy-friendly DuckDuckGo search |
| **fetch** | `npx -y @modelcontextprotocol/server-fetch` | Web content fetching & conversion |
| **wikipedia** | `npx -y @modelcontextprotocol/server-wikipedia` | Search Wikipedia articles |
| **hackernews** | `npx -y @modelcontextprotocol/server-hackernews` | Browse Hacker News |
| **reddit** | `npx -y @modelcontextprotocol/server-reddit` | Browse Reddit posts |
| **youtube-transcript** | `npx -y @modelcontextprotocol/server-youtube` | Get YouTube transcripts |

### 💻 Developer Tools (6 servers)

| Server | Command/URL | Description |
|---|---|---|
| **grep** | `https://mcp.grep.app` (HTTP) | Search 1M+ GitHub repositories |
| **shadcn** | `npx shadcn @latest mcp` | Browse/install shadcn/ui components |
| **context7** | `npx -y @upstash/context7-mcp` | Up-to-date library documentation |
| **package-docs** | `npx -y @modelcontextprotocol/server-package-docs` | Docs for JS/Python/Java packages |
| **playwright** | `npx -y @modelcontextprotocol/server-playwright` | Browser automation |
| **everything** | `npx -y @modelcontextprotocol/server-everything` | Reference server with tools |

### 💰 Finance & Crypto (3 servers)

| Server | Command/URL | Description |
|---|---|---|
| **coincap** | `https://mcp.coincap.io` (HTTP) | Real-time crypto market data |
| **crypto-prices** | `npx -y @modelcontextprotocol/server-crypto` | Multi-source crypto prices |
| **stock-data** | `npx -y @modelcontextprotocol/server-yfinance` | Yahoo Finance stock data |

### 🌐 Network & Infrastructure (4 servers)

| Server | Command/URL | Description |
|---|---|---|
| **globalping** | `https://mcp.globalping.io` (HTTP) | Network tools from 1000+ locations |
| **domain-search** | `npx -y domain-search-mcp` | Check domain availability |
| **ip-geolocation** | `npx -y @modelcontextprotocol/server-ip-geo` | IP geolocation data |
| **time** | `npx -y @modelcontextprotocol/server-time` | Time & timezone conversions |

### 🌦️ Weather & Travel (2 servers)

| Server | Command | Description |
|---|---|---|
| **openmeteo** | `npx -y @modelcontextprotocol/server-openmeteo` | Weather from Open-Meteo |
| **airbnb** | `npx -y @modelcontextprotocol/server-airbnb` | Search Airbnb listings |

### 🛠️ Utilities (5 servers)

| Server | Command | Description |
|---|---|---|
| **calculator** | `npx -y @modelcontextprotocol/server-calculator` | Mathematical calculations |
| **uuid-generator** | `npx -y @modelcontextprotocol/server-uuid` | Generate UUIDs |
| **qrcode** | `npx -y @modelcontextprotocol/server-qrcode` | Generate QR codes |
| **json-validator** | `npx -y @modelcontextprotocol/server-json` | Validate/format JSON |
| **markdown-converter** | `npx -y @modelcontextprotocol/server-markdown` | Markdown ↔ HTML conversion |