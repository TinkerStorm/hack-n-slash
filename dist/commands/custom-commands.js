"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const slash_create_1 = require("slash-create");
const command_1 = __importDefault(require("../services/command"));
const humanizedCommandTypes = [null, "Chat", "User", "Message"];
class CustomCommandManager extends slash_create_1.Command {
    constructor(creator) {
        super(creator, {
            name: "command",
            description: "Manage custom commands",
            type: slash_create_1.ApplicationCommandType.CHAT_INPUT,
            requiredPermissions: ["MANAGE_GUILD"],
            options: [
                {
                    name: "set",
                    type: slash_create_1.CommandOptionType.SUB_COMMAND,
                    description: "Create or update a command",
                    options: [{
                            name: "name",
                            type: slash_create_1.CommandOptionType.STRING,
                            description: "The name of the command",
                            required: true
                        }, {
                            name: "content",
                            type: slash_create_1.CommandOptionType.STRING,
                            description: "The content of the command",
                            required: true
                        }, {
                            name: "description",
                            type: slash_create_1.CommandOptionType.STRING,
                            description: "The description of the command",
                            required: true
                        }, {
                            name: "type",
                            type: slash_create_1.CommandOptionType.INTEGER,
                            description: "The type of the command",
                            required: true,
                            choices: [
                                {
                                    name: "Chat Command",
                                    value: slash_create_1.ApplicationCommandType.CHAT_INPUT
                                },
                                {
                                    name: "User Command",
                                    value: slash_create_1.ApplicationCommandType.USER
                                },
                                {
                                    name: "Message Command",
                                    value: slash_create_1.ApplicationCommandType.MESSAGE
                                }
                            ]
                        }]
                },
                {
                    name: "delete",
                    type: slash_create_1.CommandOptionType.SUB_COMMAND,
                    description: "Delete a command",
                    options: [{
                            name: "name",
                            type: slash_create_1.CommandOptionType.STRING,
                            description: "The name of the command",
                            required: true,
                            autocomplete: true
                        }]
                },
                {
                    name: "list",
                    type: slash_create_1.CommandOptionType.SUB_COMMAND,
                    description: "List all commands"
                },
                {
                    name: "info",
                    type: slash_create_1.CommandOptionType.SUB_COMMAND,
                    description: "Get info about a command",
                    options: [{
                            name: "name",
                            type: slash_create_1.CommandOptionType.STRING,
                            description: "The name of the command",
                            required: true,
                            autocomplete: true
                        }]
                }
            ]
        });
        this.service = new command_1.default(creator);
    }
    validateName(type, input) {
        const testPattern = type === slash_create_1.ApplicationCommandType.CHAT_INPUT ? /^[a-z\d\-]{1,32}$/ : /^[\w- ]{1,32}$/;
        return testPattern.test(input);
    }
    async autocomplete(ctx) {
        const commands = await this.service.getAll(ctx.guildID);
        const commandNames = commands // it's only the name that matters at this moment... not to say that it's the best way to do it
            .filter(c => c.name.startsWith(ctx.options[ctx.subcommands[0]].name))
            .map(c => ({ name: `${c.name} (${c.type})`, value: c.name }));
        ctx.sendResults(commandNames);
    }
    async run(ctx) {
        await ctx.defer();
        try {
            switch (ctx.subcommands[0]) {
                case "set":
                    await this.setCommand(ctx);
                    break;
                case "delete":
                    await this.deleteCommand(ctx);
                    break;
                case "list":
                    await this.listCommands(ctx);
                    break;
                case "info":
                    await this.infoCommand(ctx);
                    break;
                default:
                    await ctx.send("Invalid subcommand");
            }
        }
        catch (e) {
            await ctx.send(`❌ ${e.message}`);
        }
    }
    async setCommand(ctx) {
        const { name, type, content } = ctx.options.set;
        // check name format matches with requirements
        if (!this.validateName(type, name)) {
            await ctx.send(`❌ Invalid command name\n> Must match the pattern of \`^[\\w-]{1,32}$\`: mixed case and spaces are allowed for **non-chat commands**.`);
            return;
        }
        console.log(ctx.interactionID, name, type, content, 'validated');
        const command = await this.service.findByName(ctx.guildID, ctx.options.name);
        const payload = {
            guildID: ctx.guildID,
            name, content, type,
            description: ctx.options.description
        };
        if (command) {
            console.log(ctx.interactionID, name, 'found');
            await this.service.update({ ...command, ...payload });
            await ctx.send(`✅ \`${name}\` updated`);
        }
        else {
            console.log(ctx.interactionID, name, 'creating');
            await this.service.create(payload);
            await ctx.send(`✅ \`${name}\` created`);
        }
    }
    async deleteCommand(ctx) {
        const { name } = ctx.options.delete;
        const command = await this.service.findByName(ctx.guildID, name);
        if (!command) {
            await ctx.send(`❌ \`${name}\` not found`);
        }
        else {
            await this.service.delete(command._id);
            await ctx.send(`✅ \`${name}\` deleted`);
        }
    }
    async listCommands(ctx) {
        const commands = await this.service.getAll(ctx.guildID);
        if (commands.length === 0) {
            await ctx.send("No commands found");
        }
        else {
            const commandList = commands.map(c => `${c.name} (\`${c._id} - ${c._rev}\`)${c.description ? ` - ${c.description}` : ''}`);
            await ctx.send({
                embeds: [{
                        title: `Custom Commands`,
                        description: commandList.join('\n')
                    }]
            });
        }
    }
    async infoCommand(ctx) {
        const { name } = ctx.options.info;
        const command = await this.service.findByName(ctx.guildID, name);
        if (!command) {
            await ctx.send(`❌ \`${name}\` not found`);
        }
        else {
            await ctx.send({
                embeds: [{
                        title: `Custom Command`,
                        description: `\`${command.name}\`${command.description ? ` - ${command.description}` : ''}`
                    }],
                file: {
                    file: Buffer.from(command.content, 'utf8'),
                    name: `${command.name}-${command._rev}.hbs`
                }
            });
        }
    }
}
exports.default = CustomCommandManager;
