import { ApplicationCommandType, Command, CommandContext, CommandOptionType, Permissions, SlashCreator } from "slash-create";
import { AutocompleteContext } from "slash-create/lib/structures/interfaces/autocompleteContext";
import CommandService from "../services/command";
import { Command as CommandPayload } from "../util/db";

const humanizedCommandTypes = [null, "Chat", "User", "Message"];

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
          }, {
            name: "description",
            type: CommandOptionType.STRING,
            description: "The description of the command",
            required: true
          }, {
            name: "type",
            type: CommandOptionType.INTEGER,
            description: "The type of the command",
            required: true,
            choices: [
              {
                name: "Chat Command",
                value: ApplicationCommandType.CHAT_INPUT
              },
              {
                name: "User Command",
                value: ApplicationCommandType.USER
              },
              {
                name: "Message Command",
                value: ApplicationCommandType.MESSAGE
              }
            ]
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
            required: true,
            autocomplete: true
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
            required: true,
            autocomplete: true
          }]
        }
      ]
    });

    this.service = new CommandService(creator);
  }

  validateName(type: ApplicationCommandType, input: string): boolean {
    const testPattern = type === ApplicationCommandType.CHAT_INPUT ? /^[a-z\d\-]{1,32}$/ : /^[\w- ]{1,32}$/;
    return testPattern.test(input);
  }


  async autocomplete(ctx: AutocompleteContext) {
    const commands = await this.service.getAll(ctx.guildID!);
    const commandNames = commands // it's only the name that matters at this moment... not to say that it's the best way to do it
      .filter((c: Command) => c.name.startsWith(ctx.options[ctx.subcommands[0]].name))
      .map((c: Command) => ({ name: `${c.name} (${humanizedCommandTypes[c.type]})`, value: c.name }));

    ctx.sendResults(commandNames);
  }

  async run(ctx: CommandContext) {
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
    } catch(e: any) {
      await ctx.send(`❌ ${e.message}`);
    }
  }

  async setCommand(ctx: CommandContext) {
    const { name, type, content } = ctx.options.set;

    // check name format matches with requirements
    if (!this.validateName(type, name)) {
      await ctx.send(`❌ Invalid command name\n> Must match the pattern of \`^[\\w-]{1,32}$\`: mixed case and spaces are allowed for **non-chat commands**.`);
      return;
    }
    console.log(ctx.interactionID, name, type, content, 'validated');
    const command = await this.service.findByName(ctx.guildID!, ctx.options.name);
    const payload: Omit<CommandPayload, '_id' | 'key'> = {
      guildID: ctx.guildID!,
      name, content, type,
      description: ctx.options.description
    }
    if (command) {
      console.log(ctx.interactionID, name, 'found');
      await this.service.update({ ...command, ...payload });
      await ctx.send(`✅ \`${name}\` updated`);
    } else {
      console.log(ctx.interactionID, name, 'creating');
      await this.service.create(payload);
      await ctx.send(`✅ \`${name}\` created`);
    }
  }

  async deleteCommand(ctx: CommandContext) {
    const { name } = ctx.options.delete;
    const command = await this.service.findByName(ctx.guildID!, name);
    if (!command) {
      await ctx.send(`❌ \`${name}\` not found`);
    } else {
      await this.service.delete(command._id);
      await ctx.send(`✅ \`${name}\` deleted`);
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
    const { name } = ctx.options.info;
    const command = await this.service.findByName(ctx.guildID!, name);
    if (!command) {
      await ctx.send(`❌ \`${name}\` not found`);
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