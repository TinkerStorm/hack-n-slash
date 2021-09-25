import { SlashCreator } from "slash-create";
import db, { Command } from '../util/db';

export default class CommandService {
  constructor(public creator: SlashCreator) {
    
  }

  public async hasOne(id: string): Promise<boolean> {
    return db.get(id).then(res => !!res);
  }

  public async getOne(id: string): Promise<Command> {
    return db.get(id);
  }

  public async getAll(guildID: string): Promise<Command[]> {
    return db.find({
      selector: {
        guildID
      }
    }).then(res => res.docs);
  }

  public async findByName(guildID: string, name: string): Promise<Command | null> {
    return db.find({
      selector: {
        name, guildID
      }
    }).then(res => res.docs[0]);
  }

  public async create(command: Omit<Command, "_id" | '_rev' | 'key'>): Promise<any> {
    const response = await this.creator.api.createCommand({
      name: command.name,
      description: command.description,
      options: command.options || [],
      type: command.type
    }, command.guildID);

    return db.put({
      ...command,
      _id: response.id,
      key: `${response.type}:${response.guild_id}:${response.name}`
    });
  }


  public async update(command: Command): Promise<any> {
    await this.creator.api.updateCommand(command._id, {
      name: command.name!,
      description: command.description!,
      options: command.options || [],
      // default_permission: command.defaultPermission // boolean
    });
    
    return db.put({
      ...command
    });
  }

  public async delete(id: string): Promise<boolean> {
    const command = await this.getOne(id);
    // @ts-ignore
    const result = await db.remove(command);
    await this.creator.api.deleteCommand(command._id, command.guildID);
    return result.ok
  }
}