import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync('./config.json', 'utf8'));

import process from 'node:process';
import { resolve } from 'node:path';
import { SlashCreator } from 'slash-create';

new SlashCreator({
  applicationID: config.applicationID,
  publicKey: config.publicKey,
  token: config.token
})
  .registerCommandsIn(resolve(process.cwd(), './dist/commands'))
  .syncGlobalCommands();