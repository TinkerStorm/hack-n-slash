import Database from 'pouchdb';
import { ApplicationCommandType, ApplicationCommandOption } from 'slash-create'

export interface Command {
  readonly _id: string;
  key: string;
  guildID: string;
  name: string;
  content: string;
  description?: string;
  options?: ApplicationCommandOption[];
  // default_permission?: boolean
  type: ApplicationCommandType;
}

export default new Database<Command>('commands');