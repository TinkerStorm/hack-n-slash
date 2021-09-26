import { ApplicationCommandType, ButtonStyle, CommandContext, CommandOptionType, ComponentType, SlashCommand, SlashCreator } from 'slash-create';

export default class AboutCommand extends SlashCommand {
  responses: Record<string, string | object>;

  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'about',
      description: 'About the bot',
      type: ApplicationCommandType.CHAT_INPUT,
      options: [{
        name: 'me',
        description: 'What am I?',
        type: CommandOptionType.SUB_COMMAND
      }, {
        name: 'creator',
        description: 'What are you?',
        type: CommandOptionType.SUB_COMMAND
      }, {
        name: 'future',
        description: 'What is my future?',
        type: CommandOptionType.SUB_COMMAND
      }]
    });

    this.responses = {
      me: {
        content: 'I am a bot that can help you with your daily tasks. I can help you with your tasks, and I can help you with your tasks.',
        embeds: [{
          title: "What is Hack n' Slash?",
          description: [
            "A bot to manage custom slash commands in a guild, with autocompletion to help manage commands and templating with [Tempura](https://github.com/lukeed/tempura).",
            "My responses are stored in a database, and can be edited and deleted by anyone with the `Manage Server` permission."
          ],
          components: [{
            type: ComponentType.ACTION_ROW,
            components: [{
              type: ComponentType.BUTTON,
              label: "Invite",
              url: "https://discord.com/api/oauth2/authorize?client_id=891363778808152125&permissions=0&scope=bot%20applications.commands",
              style: ButtonStyle.LINK
            }, {
              type: ComponentType.BUTTON,
              label: "GitHub",
              url: "https://github.com/sudojunior/hack-n-slash",
              style: ButtonStyle.LINK
            }, {
              type: ComponentType.BUTTON,
              label: "Support Server",
              url: "https://discord.gg/Bb3JQQG",
              style: ButtonStyle.LINK
            }, {
              type: ComponentType.BUTTON,
              label: "Sponsor",
              url: "https://github.com/sponsors/sudojunior",
              style: ButtonStyle.LINK
            }]
          }]
        }]
      },
      creator: {
        embeds: [{
          color: 1778498,
          title: "What is TinkerStorm?",
          url: "https://github.com/TinkerStorm",
          description: [
            "An organization dedicated to researching the decisions of communities and their players (and to develop some tools along the way).",
            "We drive our research and development based on the feedback of our peers and the obstacles we face.",
            "Feel free to join us in our discussions and our project endevours.",
            "",
            "We have also made some projects available to use and/or contribute to:",
            ":satellite_orbital: [channel-backup (npm)](https://npm.im/channel-backup)",
            ":pencil: [discord-markdown-syntax](https://github.com/TinkerStorm/discord-markdown-syntax)",
            ":passport_control: [access-groups (action)](https://github.com/sudojunior/access-groups)"
          ].join('\n'),
          components: [{
            type: ComponentType.ACTION_ROW,
            components: [{
              type: ComponentType.BUTTON,
              label: "Discord",
              url: "https://discord.gg/Bb3JQQG",
              style: ButtonStyle.LINK
            }, {
              type: ComponentType.BUTTON,
              label: "GitHub",
              url: "https://github.com/TinkerStorm",
              style: ButtonStyle.LINK
            }]
          }]
        }]
      },
      future: {
        embeds: [{
          color: 1778498,
          title: "What is my future?",
          description: [
            "My future is very dependant on where Discord takes their API next...",
            "But, for now, I am here to stay.",
            "",
            "Here are some of my [planned features](https://github.com/sudojunior/hack-n-slash#feature-requests):",
            "- Command Arguments and Subcommands",
            "- Message Components",
            "- Message Embeds",
            "- Custom Blocks",
            "- Cooldowns"
          ]
        }],
        components: [{
          type: ComponentType.ACTION_ROW,
          components: [{
            type: ComponentType.BUTTON,
            label: "Feature Requests",
            url: "https://github.com/sudojunior/hack-n-slash#feature-requests",
            style: ButtonStyle.LINK
          }]
        }]
      }
    }
  }

  async run(ctx: CommandContext) {
    const command = ctx.subcommands[0];

    if (!this.responses[command]) {
      await ctx.send({
        content: 'I don\'t know what you mean.'
      });
      return;
    }

    return ctx.send(this.responses[command]);
  }
}