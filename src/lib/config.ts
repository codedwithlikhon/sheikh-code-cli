import * as fs from 'fs';
import * as toml from 'toml';
import * as path from 'path';

// Define the structure of the config file
export interface Config {
  provider: string;
  providers: {
    [key: string]: {
      api_key: string;
    };
  };
}

export function getConfig(): Config {
  const configPath = path.resolve(process.cwd(), 'config.toml');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  return toml.parse(configContent);
}
