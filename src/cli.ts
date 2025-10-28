import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { handlePrompt } from './commands/prompt.ts';
import { addMcpServer, listMcpServers, removeMcpServer } from './commands/mcp.ts';

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
          addMcpServer(argv.name as string, argv.command as string, argv.args as string[]);
      })
      .command('list', 'List all configured MCP servers.', {}, () => {
          listMcpServers();
      })
      .command('remove <name>', 'Remove an MCP server.', {}, (argv) => {
          removeMcpServer(argv.name as string);
      })
      .demandCommand(1, 'You need at least one command before moving on.')
      .help();
  })
  .help()
  .argv;
