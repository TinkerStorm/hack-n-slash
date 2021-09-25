import { SlashCreator } from "slash-create";
import { Database } from "sqlite3";

import { Command } from '../util/types';
import Enamp from 'enmap';

export default class CommandService {
  db = new Enamp<string, Command>({ name: "commands" });

  constructor(public creator: SlashCreator) {

  }

  public async hasOne(id: string): Promise<boolean> {
    return !!this.getOne(id);
  }

  public async getOne(id: string): Promise<Command | undefined> {
    return this.db.get(id);
  }

  public async getAll(guildID: string): Promise<Command[]> {
    return this.db.findAll("guildID", guildID);
  }

  public async findByName(guildID: string, name: string): Promise<Command | undefined> {
    return this.db.find((command) => command.name === name && command.guildID === guildID);
  }

  public async create(command: Omit<Command, "id">): Promise<any> {
    const response = await this.creator.api.createCommand({
      name: command.name,
      description: command.description,
      // options: command.options || [],
      // type: command.type
    }, command.guildID);

    return this.db.set(response.id, {
      ...command,
      id: response.id
    });
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

    return this.db.set(command.id, command);
  }

  public async delete(command: Command): Promise<void> {
    // @ts-ignore
    await this.creator.api.deleteCommand(command.id, command.guildID);
    await this.db.delete(command.id);
  }
}