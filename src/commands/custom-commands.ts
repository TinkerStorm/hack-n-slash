import { ApplicationCommandType, Command, CommandContext, CommandOptionType, Permissions, SlashCreator } from "slash-create";
import { AutocompleteContext } from "slash-create/lib/structures/interfaces/autocompleteContext";
import CommandService from "../services/command";
import { Command as CommandPayload } from "../util/types";

const humanizedCommandTypes = [null, "Chat", "User", "Message"];

export default class CustomCommandManager extends Command {
  service: CommandService;
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "command",
      description: "Manage custom commands",
      type: ApplicationCommandType.CHAT_INPUT,
      requiredPermissions: ["MANAGE_GUILD"],
      options: [{
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
        }, {
          name: "description",
          type: CommandOptionType.STRING,
          description: "The description of the command.",
          required: false
        }]
      }, {
        name: "update",
        type: CommandOptionType.SUB_COMMAND,
        description: "Update an existing command",
        options: [{
          name: "ref",
          type: CommandOptionType.STRING,
          description: "The reference of the command",
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
      }, { // delete a command
        name: "delete",
        type: CommandOptionType.SUB_COMMAND,
        description: "Delete a command",
        options: [{
          name: "ref",
          type: CommandOptionType.STRING,
          description: "The reference of the command",
          required: true,
          autocomplete: true
        }]
      }, { // list all commands
        name: "list",
        type: CommandOptionType.SUB_COMMAND,
        description: "List all commands"
      }, { // info about a command
        name: "info",
        type: CommandOptionType.SUB_COMMAND,
        description: "Get info about a command",
        options: [{
          name: "ref",
          type: CommandOptionType.STRING,
          description: "The reference of the command",
          required: true,
          autocomplete: true
        }]
      }]
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
      .filter((c: CommandPayload) => c.name.toLowerCase().startsWith(ctx.options[ctx.subcommands[0]].ref))
      .map((c: CommandPayload) => ({ name: `${c.name} (${humanizedCommandTypes[c.type]})`, value: c.id }));
  }

  async run(ctx: CommandContext) {
    // kill early if this is not a guild
    if (!ctx.guildID) {
      await ctx.send(`This command can only be used in a guild.`);
      return;
    }

    await ctx.defer();

    console.log(`Running command ${ctx.guildID}:${ctx.commandID}/${ctx.commandName}/${ctx.subcommands[0]}`);

    try {
      switch (ctx.subcommands[0]) {
        case "create":
          return this.createCommand(ctx);
        case "update":
          return this.updateCommand(ctx);
        case "delete":
          return this.deleteCommand(ctx);
        case "list":
          return this.listCommands(ctx);
        case "info":
          return this.infoCommand(ctx);
        default:
          await ctx.send(`❌ Invalid subcommand (\`${ctx.subcommands[0]} -> ${JSON.stringify(ctx.options || {})}\`)`);
      }
    } catch (error: any) {
      ctx.send(`❌ An error occured...\n\`\`\`${error}\`\`\``);
    }
  }

  async createCommand(ctx: CommandContext) {
    const { name, content, description, type } = ctx.options.create;
    if (!this.validateName(type, name)) {
      throw [
        `Invalid command name!`,
        `> Must match the pattern of \`^[\\w-]{1,32}$\``,
        `> *Mixed case and spaces are allowed for **non-chat commands**.`
      ].join('\n');
    }

    // ensure that the command doesn't already exist
    try {
      const command = await this.service.findByName(ctx.guildID!, name);
      if (command) {
        throw [
          `\`${name}\` already exists!`,
          `> Existing type: \`${command.type}\``,
          `> Requested type: \`${type}\``
          // does not check per type *yet*...
        ].join("\n");
      }
    } catch (_e) { }

    if (type === ApplicationCommandType.CHAT_INPUT && !description) {
      throw `You must provide a description for chat commands!`;
    }

    // name, content, type and guildID are required
    // description is required only by chat commands
    const payload: Omit<CommandPayload, 'id'> = {
      name, content, type,
      description: type === ApplicationCommandType.CHAT_INPUT ? description || 'This is a custom command.' : undefined,
      guildID: ctx.guildID!
    };

    try {
      const response = await this.service.create(payload);
      console.log(`[${response.guild_id}/${response.id}] Created command: ${name}`);
      return ctx.send(`✅ \`${name} (${response.id})\` created!`);
    } catch (e) {
      throw `An error occured...\n\`\`\`${e}\n\n${inspect(payload)}\`\`\``;
    }
  }

  async updateCommand(ctx: CommandContext) {
    const { ref, content, description } = ctx.options.update;

    // ensure that the command exists
    const command = await this.service.getOne(ctx.guildID!, ref);
    if (!command) {
      throw `\`${ref}\` does not exist`;
    }

    // update command
    const payload: CommandPayload = {
      ...command, content, description, type
    }

    await this.service.update(payload);
    console.log(`Updated command ${command.guildID}:${command.id}/${command.name}`);
    return ctx.send(`✅ \`${ref}\` updated!`);
  }

  async deleteCommand(ctx: CommandContext) {
    const { ref } = ctx.options.delete;
    const command = await this.service.getOne(ctx.guildID!, ref);

    if (!command) {
      throw `\`${ref}\` not found!`;
    }

    await this.service.delete(command);
    console.log(`Deleted command ${command.guildID}:${command.id}/${command.name}`);
    return ctx.send(`✅ \`${ref}\` deleted`);
  }

  async listCommands(ctx: CommandContext) {
    const commands = await this.service.getAll(ctx.guildID!);
    if (commands.length === 0) {
      throw "No commands found.";
    }

    console.log(`Found ${commands.length} commands`);
    const commandList = commands.map(c => `${c.name} (${humanizedCommandTypes[c.type]} \`${c.id}\`)${c.description ? ` - ${c.description}` : ''}`);
    return ctx.send({
      embeds: [{
        title: `Custom Commands`,
        description: commandList.join('\n')
      }]
    });
  }

  async infoCommand(ctx: CommandContext) {
    const { ref } = ctx.options.info;
    const command = await this.service.findByName(ctx.guildID!, ref);
    if (!command) {
      throw `\`${ref}\` not found.`;
    }

    await ctx.send({
      embeds: [{
        title: `Custom Command (${humanizedCommandTypes[command.type]})`,
        description: `\`${command.name}\`${command.description ? ` - ${command.description}` : ''}`
      }],
      file: {
        file: Buffer.from(command.content.trim(), 'utf8'),
        name: `${command.name}.hbs`
      }
    });
  }
}