import Database from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import { ApplicationCommandType, ApplicationCommandOption } from 'slash-create'

export interface Command {
  readonly _id: string;
  readonly _rev?: string;
  key: string;
  guildID: string;
  name: string;
  content: string;
  description?: string;
  options?: ApplicationCommandOption[];
  // default_permission?: boolean
  type: ApplicationCommandType;
}

Database.plugin(PouchDBFind);

export default new Database<Command>('commands');