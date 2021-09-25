"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_process_1 = __importDefault(require("node:process"));
const node_path_1 = require("node:path");
const config = JSON.parse((0, node_fs_1.readFileSync)('./config.json', 'utf8'));
const slash_create_1 = require("slash-create");
const eris_1 = require("eris");
const command_1 = __importDefault(require("./services/command"));
const client = new eris_1.Client(config.token);
const creator = new slash_create_1.SlashCreator({
    applicationID: config.applicationID,
    publicKey: config.publicKey
});
const service = new command_1.default(creator);
creator
    .registerCommandsIn((0, node_path_1.resolve)(node_process_1.default.cwd(), './dist/commands'))
    .withServer(new slash_create_1.GatewayServer((handler) => {
    client.on('rawWS', (event) => {
        if (event.t === 'INTERACTION_CREATE')
            handler(event.d);
    });
}))
    .on('debug', (message) => console.log(message.replace(creator.options.publicKey, '***')));
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
