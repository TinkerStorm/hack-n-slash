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
        {
          name: "create",
          type: CommandOptionType.SUB_COMMAND,
          description: "Create new a command",
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
            description: "The description of the command (only required for **Chat Command** type).",
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
        {
          name: "update",
          type: CommandOptionType.SUB_COMMAND,
          description: "Update an existing command",
          options: [{
            name: "name",
            type: CommandOptionType.STRING,
            description: "The name of the command",
            required: true,
            autocomplete: true
          }, {
            name: "content",
            type: CommandOptionType.STRING,
            description: "The content of the command",
            required: false
          }, {
            name: "description",
            type: CommandOptionType.STRING,
            description: "The description of the command",
            required: false
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
    return commands // it's only the name that matters at this moment... not to say that it's the best way to do it
      .filter((c: CommandPayload) => c.name.toLowerCase().startsWith(ctx.options[ctx.subcommands[0]].name))
      .map((c: CommandPayload) => ({ name: `${c.name} (${humanizedCommandTypes[c.type]})`, value: c.name }));
  }

  async run(ctx: CommandContext) {
    // kill early if this is not a guild
    if (!ctx.guildID) {
      return `❌ This command can only be used in a guild.`;
    }

    await ctx.defer();

    try {
      switch (ctx.subcommands[0]) {
        case "create":
          return await this.createCommand(ctx);
        case "update":
          return await this.updateCommand(ctx);
        case "delete":
          return await this.deleteCommand(ctx);
        case "list":
          return await this.listCommands(ctx);
        case "info":
          return await this.infoCommand(ctx);
        default:
          return ":x: Invalid subcommand";
      }
    } catch (error: any) {
      return `❌ An error occured...\n\`\`\`${error}\`\`\``;
    }
  }

  async createCommand(ctx: CommandContext) {
    const { name, content, description, type } = ctx.options.create;
    if (!this.validateName(type, name)) {
      return [
        `❌ Invalid command name!`,
        `> Must match the pattern of \`^[\\w-]{1,32}$\``,
        `> *Mixed case and spaces are allowed for **non-chat commands**.`
      ]
    }

    // ensure that the command doesn't already exist
    try {
      const command = await this.service.findByName(ctx.guildID!, name);
      if (command) {
        return [
          `❌ \`${name}\` already exists!`,
          `> Existing type: \`${command.type}\``,
          `> Requested type: \`${type}\`)`
          // does not check per type *yet*...
        ].join("\n");
      }
    } catch (_e) { }

    const payload: Omit<CommandPayload, '_id' | '_rev' | 'key'> = {
      name, content, type,
      description: type === ApplicationCommandType.CHAT_INPUT ? description : undefined,
      guildID: ctx.guildID!
    }

    await this.service.create(payload);
    await ctx.send(`✅ \`${name}\` created!`);
  }

  async updateCommand(ctx: CommandContext) {
    const { name, content, description, type } = ctx.options.update;

    // ensure that the command exists
    const command = await this.service.findByName(ctx.guildID!, name);
    if (!command) {
      await ctx.send(`❌ \`${name}\` does not exist`);
      return;
    }

    // update command
    const payload: CommandPayload = {
      ...command, content, description, type
    }

    await this.service.update(payload);
    return `✅ \`${name}\` updated!`;
  }

  async deleteCommand(ctx: CommandContext) {
    const { name } = ctx.options.delete;
    const command = await this.service.getOne(name);

    if (!command) {
      // ensure that the command exists
      // autocomplete will have already validated this - probably not needed
      return `❌ \`${name}\` not found!`;
    }

    await this.service.delete(command._id);
    return `✅ \`${name}\` deleted`;
  }

  async listCommands(ctx: CommandContext) {
    const commands = await this.service.getAll(ctx.guildID!);
    if (commands.length === 0) {
      return ":x: No commands found.";
    }

    const commandList = commands.map(c => `${c.name} (\`${c._id} - ${c._rev}\`)${c.description ? ` - ${c.description}` : ''}`);
    await ctx.send({
      embeds: [{
        title: `Custom Commands`,
        description: commandList.join('\n')
      }]
    });
  }

  async infoCommand(ctx: CommandContext) {
    const { name } = ctx.options.info;
    const command = await this.service.findByName(ctx.guildID!, name);
    if (!command) {
      return `❌ \`${name}\` not found.`;
    }

    await ctx.send({
      embeds: [{
        title: `Custom Command`,
        description: `\`${command.name}\`${command.description ? ` - ${command.description}` : ''}`
      }],
      file: {
        file: Buffer.from(command.content.trim(), 'utf8'),
        name: `${command.name}-${command._rev}.hbs`
      }
    });
  }
}