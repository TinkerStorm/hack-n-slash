import { readFileSync } from 'node:fs';
import process from 'node:process';
import { resolve } from 'node:path';
import util from 'node:util';

import { CommandContext, GatewayServer, InteractionRequestData, SlashCreator, Response, ApplicationCommandType } from "slash-create";
import { Client } from 'eris';
import R from 'ramda';

import CommandService from './services/command';
import TemplateEngine from './util/template-engine';
const config = JSON.parse(readFileSync('./config.json', 'utf8'));

const client = new Client(config.token);

const creator = new SlashCreator({
  applicationID: config.applicationID,
  publicKey: config.publicKey,
  token: config.token,
  handleCommandsManually: true
})

const service = new CommandService(creator);
const engine = new TemplateEngine();

creator
  // .on('debug', console.log)
  .registerCommandsIn(resolve(process.cwd(), './dist/commands'))
  .withServer(new GatewayServer((handler) => {
    client.on('rawWS', (event) => {
      if (event.t === 'INTERACTION_CREATE')
        handler(event.d as InteractionRequestData);
    });
  }));

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
    // require guild context
    if (!ctx.guildID) {
      await ctx.send(':x: Custom commands can only be used in a guild.');
      return;
    }

    const command = await service.getOne(ctx.guildID, ctx.commandID);

    if (!command) {
      return ctx.send(`:x: Command not found.`);
    }
    // console.log(command._id, command.key, command.description);

    // omit methods that are not meant to be used by the user

    let data: Record<string, any> = {
      ...R.omit(['token'], ctx.data),
      interactionID: ctx.interactionID,
      guildID: ctx.guildID,
      channelID: ctx.channelID,
      commandID: ctx.commandID,
      users: Object.fromEntries(ctx.users),
      members: Object.fromEntries(ctx.members),
      roles: Object.fromEntries(ctx.roles),
      channels: Object.fromEntries(ctx.channels),
      messages: Object.fromEntries(ctx.messages),
      command: command,
      member: ctx.member,
      user: ctx.user,
      targetMessage: ctx.targetMessage || null,
      targetUser: ctx.targetUser || null,
      targetMember: ctx.targetMember || null,
      channel: ctx.channels.get(ctx.channelID) || null,
    }

    const expect = `{{#expect ${Object.keys(data).filter(key => data[key] !== undefined)} }}`;
    
    const content = await engine.render(expect + command.content, data);
    // console.log(content);
    await ctx.send(content);
    console.log(`[${ctx.guildID}/${ctx.commandID}] ${command.name} was run by ${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id})`);
  } catch (e) {
    // console.log(e);
    await ctx.send(':x: Sorry, an error occurred.\n```' + e + '```');
  }
});

client.on('messageCreate', async (msg) => {
  if (msg.content.startsWith('!eval') && config.admins.includes(msg.author.id)) {
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
