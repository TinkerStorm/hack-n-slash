import { SlashCreator } from "slash-create";
import { Tedis } from 'tedis';

import { Command } from '../util/types';

export default class CommandService {
  static database = new Tedis();

  get db() { return CommandService.database; }

  constructor(public creator: SlashCreator) {

  }

  protected buildKey(command: Partial<Command>) {
    return `commands:${command.guildID || '*'}:${command.id || '*'}`;
  }

  public async hasOne(id: string): Promise<boolean> {
    return !!this.getOne(id);
  }

  public async getOne(id: string): Promise<Command | undefined> {
    return this.db.get(this.buildKey({ id })).then(command => {
      if (typeof command === "string") {
        return JSON.parse(command);
      }

      return undefined;
    });
  }

  public async getAll(guildID: string): Promise<Command[]> {
    return this.db.get(this.buildKey({ guildID })).then(commands => {
      if (typeof commands === "string") {
        const keys = JSON.parse(commands) as string[];
        return Promise.all(keys.map(key => this.getOne(key))) as Promise<Command[]>;
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

  public async create(command: Omit<Command, "id">): Promise<any> {
    const response = await this.creator.api.createCommand({
      name: command.name,
      description: command.description,
      // options: command.options || [],
      // type: command.type
    }, command.guildID);

    const { id, guild_id: guildID } = response;

    return this.db.set(
      this.buildKey({ id, guildID }),
      JSON.stringify({ ...command, id })
    );
  }


  public async update(command: Command): Promise<any> {
    // fetch the command
    command = { ...await this.getOne(command.id), ...command };

    await this.creator.api.updateCommand(command.id, {
      name: command.name!,
      description: command.description!,
      // options: command.options || [],
      // default_permission: command.defaultPermission // boolean
    }, command.guildID);

    return this.db.set(this.buildKey(command), JSON.stringify(command));
  }

  public async delete(command: Command): Promise<void> {
    // @ts-ignore
    await this.creator.api.deleteCommand(command.id, command.guildID);
    await this.db.del(this.buildKey(command));
  }
}