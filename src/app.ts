import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync('./config.json', 'utf8'));

import process from 'node:process';
import { CommandContext, GatewayServer, InteractionRequestData, SlashCreator, Response } from "slash-create";
import { Client } from 'eris';
import CommandService from './services/command';
import { compile, transform } from 'tempura';

const client = new Client(process.env.DISCORD_TOKEN!);

const creator = new SlashCreator({
  applicationID: config.applicationID,
  publicKey: config.publicKey
})

const service = new CommandService(creator);

const server = new GatewayServer((handler) => {
  client.on('rawWS', (event) => {
    if (event.t === 'INTERACTION_CREATE')
      handler(event.d as InteractionRequestData);
  });
})

creator
  .registerCommandsIn('./commands')
  .withServer(server)

creator.on('commandInteraction', async (interaction) => {
  const ctx = new CommandContext(
    creator,
    interaction,
    async (response: Response) => {
      await creator.api.interactionCallback(interaction.id, interaction.token, response.body);
    },
    server.isWebserver
  );

  // determine if a custom command can be used for this interaction
  const command = await service.getOne(ctx.commandID);
  if (ctx.guildID && command) {
    const script = compile(transform(command.content, {format: "cjs"}));

    const result = await script(ctx);

    ctx.send(result);
  }
});

creator.startServer();
client.connect();