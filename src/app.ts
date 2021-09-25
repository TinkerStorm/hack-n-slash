import { readFileSync } from 'node:fs';
import process from 'node:process';
import { resolve } from 'node:path';
const config = JSON.parse(readFileSync('./config.json', 'utf8'));

import { CommandContext, GatewayServer, InteractionRequestData, SlashCreator, Response } from "slash-create";
import { Client } from 'eris';
import CommandService from './services/command';
import { compile, transform } from 'tempura';

const client = new Client(config.token);

const creator = new SlashCreator({
  applicationID: config.applicationID,
  publicKey: config.publicKey
})

const service = new CommandService(creator);

creator
  .registerCommandsIn(resolve(process.cwd(), './dist/commands'))
  .withServer(new GatewayServer((handler) => {
    client.on('rawWS', (event) => {
      if (event.t === 'INTERACTION_CREATE')
        handler(event.d as InteractionRequestData);
    });
  }))

//creator.on('commandInteraction', async (interaction, respond, webserverMode) => {
//  const ctx = new CommandContext(creator, interaction, respond, webserverMode);

//  // determine if a custom command can be used for this interaction
//  const command = await service.getOne(ctx.commandID);
//  if (ctx.guildID && command) {
//    const script = compile(transform(command.content, {format: "cjs"}));

//    const result = await script(ctx);

//    ctx.send(result);
//  }
//});

// creator.startServer();
client.connect();
