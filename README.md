# hack-n-slash
A slash commands bot using guild commands as a custom commands alternative.

This service uses [slash-create](https://slash-create.js.org) to handle slash commands and [redis](https://redis.js.org) as a storage provider.

Custom commands use [Tempura](https://github.com/lukeed/tempura) to handle the command logic.
> `{{#expect ...}}` is called before the rest of the template is compiled and run.

When searching for existing commands (update, info, delete), the service will return the top 20 matches.

## License

All I ask is that you follow the given [LICENSE](./LICENSE).

> Do **not** add your own instance to a bot list, while I won't actively hunt you down - most *or all* lists do not allow direct copies.

**Consider this your only warning.**

## Context (Incomplete listing)

> [Full list of data available in the context](https://github.com/sudojunior/hack-n-slash/blob/main/src/util/template-engine.ts#L64-82)

- `...data`: 
- [`interactionID`](https://slash-create.js.org/#/docs/main/latest/class/CommandContext?scrollTo=interactionID): The ID of the interaction.
- [`guildID`](https://slash-create.js.org/#/docs/main/latest/class/CommandContext?scrollTo=guildID): The ID of the guild.
- [`channelID`](https://slash-create.js.org/#/docs/main/latest/class/CommandContext?scrollTo=channelID): The ID of the channel.
- command: The command entry found from the database.

> - users, members, roles, channels, messages - all resolved by ID.
> - targetMember, targetUser, targetMessage - are dependent on the command being run (user, user, message respectively).

## Feature requests

- [ ] Additional [context blocks](https://github.com/lukeed/tempura/blob/master/docs/blocks.md)
- [ ] Custom [context blocks](https://github.com/lukeed/tempura/blob/master/docs/blocks.md#compiler-blocks)
- [ ] ~~Permission handling~~ - Discord has announced to rework the integration page, very unlikely that this will be implemented.
- [ ] ~~Command aliases~~ - Not physically possible.
- [ ] Command cooldowns - Maybe... though would end up being completely optional - set after creation.
- [ ] Message Options
  - [ ] Components
  - [ ] Command Arguments
  - [ ] Subcommands
  - [ ] Rich Embeds