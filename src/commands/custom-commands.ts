import { ApplicationCommandType, Command, CommandContext, CommandOptionType, Permissions, SlashCreator } from "slash-create";
import CommandService from "../services/command";
import { Command as CommandPayload } from "../util/db";

export default class CustomCommandManager extends Command {
  service: CommandService;
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "command",
      description: "Manage custom commands",
      type: ApplicationCommandType.CHAT_INPUT,
      requiredPermissions: ["MANAGE_GUILD"],
      options: [
        { // create / update a command
          name: "set",
          type: CommandOptionType.SUB_COMMAND,
          description: "Create or update a command",
          options: [{
            name: "name",
            type: CommandOptionType.STRING,
            description: "The name of the command",
            required: true
          }, {
            name: "content",
            type: CommandOptionType.STRING,
            description: "The content of the command",
            required: true
          }]
        },
        { // delete a command
          name: "delete",
          type: CommandOptionType.SUB_COMMAND,
          description: "Delete a command",
          options: [{
            name: "name",
            type: CommandOptionType.STRING,
            description: "The name of the command",
            required: true
          }]
        },
        { // list all commands
          name: "list",
          type: CommandOptionType.SUB_COMMAND,
          description: "List all commands"
        },
        { // info about a command
          name: "info",
          type: CommandOptionType.SUB_COMMAND,
          description: "Get info about a command",
          options: [{
            name: "name",
            type: CommandOptionType.STRING,
            description: "The name of the command",
            required: true
          }]
        }
      ]
    });

    this.service = new CommandService(creator);
  }

  async run(ctx: CommandContext) {
    await ctx.defer();

    switch(ctx.subcommands[0]) {
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

  async setCommand(ctx: CommandContext) {
    const command = await this.service.findByName(ctx.guildID!, ctx.options.name);
    const payload: Omit<CommandPayload, '_id' | 'key'> = {
      guildID: ctx.guildID!,
      name: ctx.options.name,
      content: ctx.options.content,
      type: ctx.options.type,
      description: ctx.options.description
    }
    if (command) {
      await this.service.update({ ...command, ...payload });
      await ctx.send(`✅ \`${ctx.options.name}\` updated`);
    } else {
      await this.service.create(payload);
      await ctx.send(`✅ \`${ctx.options.name}\` created`);
    }
  }

  async deleteCommand(ctx: CommandContext) {
    const command = await this.service.findByName(ctx.guildID!, ctx.options.name);
    if (!command) {
      await ctx.send(`❌ \`${ctx.options.name}\` not found`);
    } else {
      await this.service.delete(command._id);
      await ctx.send(`✅ \`${ctx.options.name}\` deleted`);
    }
  }

  async listCommands(ctx: CommandContext) {
    const commands = await this.service.getAll(ctx.guildID!);
    if (commands.length === 0) {
      await ctx.send("No commands found");
    } else {
      const commandList = commands.map(c => `${c.name} (\`${c._id} - ${c._rev}\`)${c.description ? ` - ${c.description}` : ''}`);
      await ctx.send({
        embeds: [{
          title: `Custom Commands`,
          description: commandList.join('\n')
        }]
      });
    }
  }

  async infoCommand(ctx: CommandContext) {
    const command = await this.service.findByName(ctx.guildID!, ctx.options.name);
    if (!command) {
      await ctx.send(`❌ \`${ctx.options.name}\` not found`);
    } else {
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