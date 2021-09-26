import { ApplicationCommand, SlashCreator } from "slash-create";
import { createNodeRedisClient } from 'handy-redis';

import { Command } from '../util/types';

export default class CommandService {
  static database = createNodeRedisClient();

  get db() { return CommandService.database; }

  constructor(public creator: SlashCreator) {

  }

  protected buildKey(command: Partial<Command>) {
    return `commands:${command.guildID || '*'}:${command.id || '*'}`;
  }

  protected isNotEmpty(value: any) {
    return value !== undefined && value !== null && value !== "" && value.length > 0;
  }

  public async hasOne(id: string): Promise<boolean> {
    return (await this.db.keys(this.buildKey({ id }))).length > 0;
  }

  public async getOne(guildID: string, id: string): Promise<Command | undefined> {
    return await this.db.get(this.buildKey({ id, guildID })).then(command => {
      if (typeof command === "string" && this.isNotEmpty(command)) {
        return JSON.parse(command);
      }

      return undefined;
    });
  }

  public async getAll(guildID: string): Promise<Command[]> {
    return this.db.keys(this.buildKey({ guildID })).then(keys => {
      if (this.isNotEmpty(keys)) {
        const commands = keys.map(async key => await this.db.get(key)) as Promise<string>[];
        return Promise.all(commands).then(values => values.map(value => JSON.parse(value)));
      }

      return [];
    });
  }

  public async findByName(guildID: string, name: string): Promise<Command | undefined> {
    return this.getAll(guildID).then(async commands => {
      for (const command of commands) {
        if (command.name === name) {
          return command;
        }
      }
    });
  }

  public async create(command: Omit<Command, "id">): Promise<ApplicationCommand> {
    // console log everything
    const response = await this.creator.api.createCommand({
      type: command.type,
      name: command.name,
      description: command.description,
      // options: command.options || [],
      // type: command.type
    }, command.guildID);

    const { id, guild_id: guildID } = response;

    await this.db.set(
      this.buildKey({ id, guildID }),
      JSON.stringify({ ...command, id })
    );

    return response;
  }


  public async update(command: Command): Promise<ApplicationCommand> {    
    // fetch the command
    command = { ...await this.getOne(command.guildID, command.id), ...command };

    const response = await this.creator.api.updateCommand(command.id, {
      name: command.name!,
      description: command.description!,
      // options: command.options || [],
      // default_permission: command.defaultPermission // boolean
    }, command.guildID);

    await this.db.set(this.buildKey(command), JSON.stringify(command));

    return response;
  }

  public async delete(command: Command): Promise<boolean> {
    try {
      await this.creator.api.deleteCommand(command.id, command.guildID);
      await this.db.del(this.buildKey(command));
      return true;
    } catch(e) {
      throw e;
    }
  }
}