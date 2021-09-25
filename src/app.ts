import { readFileSync } from 'node:fs';
import process from 'node:process';
import { resolve } from 'node:path';
import util from 'node:util';

import { CommandContext, GatewayServer, InteractionRequestData, SlashCreator, Response } from "slash-create";
import { Client } from 'eris';
import Mustache from 'mustache';

import CommandService from './services/command';
const config = JSON.parse(readFileSync('./config.json', 'utf8'));

const client = new Client(config.token);

const creator = new SlashCreator({
  applicationID: config.applicationID,
  publicKey: config.publicKey,
  token: config.token,
  handleCommandsManually: true
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

creator.on('commandInteraction', async (interaction, respond, webserverMode) => {
  const ctx = new CommandContext(creator, interaction, respond, webserverMode);
  await ctx.defer();
  // determine if a custom command can be used for this interaction
  const hasCoreCommand = creator.commands.has(`${ctx.commandType}:global:${ctx.commandName}`);

  if (hasCoreCommand) {
    const command = creator.commands.get(`${ctx.commandType}:global:${ctx.commandName}`);
    await command!.run(ctx);
    return;
  }

  try {
    const command = await service.getOne(ctx.commandID);
    // console.log(command._id, command.key, command.description);

    const content = Mustache.render(command.content, {ctx}, {}, {
      escape: (text) => text
    });
    // console.log(content);
    await ctx.send(content);
  } catch (e) {
    // console.log(e);
    await ctx.send(':x: Sorry, an error occurred.\n```' + e + '```');
  }
});

client.on('messageCreate', async (msg) => {
  if (msg.content.startsWith('!eval')) {
    const code = msg.content.substring(6);
    try {
      let start = msg.createdAt;
      let ev = await new Promise<any>((resolve) => {
        resolve(eval(code));
      });
      let end = Date.now();
      if (typeof ev !== 'string')
        ev = util.inspect(ev, {
          depth: 2,
          showHidden: true
        })
      ev = ev.replace(config.token, '1n-r1sk-w3-tru5t');
      if (ev.length > 1000) {
        client.createMessage(msg.channel.id, '**Output:** Success *with file upload*\nTime: ' + (end - start) / 1000, {
          file: ev,
          name: "evalresult.log"
        });
      } else {
        client.createMessage(msg.channel.id, '**Output:** Success\nTime: ' + (end - start) / 1000 + '\n```' + ev + '```');
      }
    } catch (err: any) {
      if ((err.stack?.length || 1337) > 1000) {
        client.createMessage(msg.channel.id, '**Output:** Error *with file upload*', {
          file: err.stack || err,
          name: "evalresult.log"
        });
      } else {
        client.createMessage(msg.channel.id, '**Output:** Failure\n```js\n' + (err.stack || err) + '```');
      }
    }
  }
});

// creator.startServer();
client.connect();
