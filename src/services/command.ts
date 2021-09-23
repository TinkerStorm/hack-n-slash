import { SlashCreator } from "slash-create";
import db, { Command } from '../util/db';

export default class CommandService {
  constructor(public creator: SlashCreator) {
    
  }

  public async getOne(id: string) {
    return db.get(id);
  }

  public async getAll(guildID: string) {
    return db.find({
      selector: {
        guildID
      }
    }).then(res => res.docs);
  }

  public async findByName(guildID: string, name: string) {
    return db.find({
      selector: {
        name, guildID
      }
    }).then(res => res.docs[0]);
  }

  public async create(command: Omit<Command, "_id" | 'key'>) {
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


  public async update(command: Command) {
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

  public async delete(id: string) {
    return db.remove(await this.getOne(id));
  }
}