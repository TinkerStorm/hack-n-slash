import { ApplicationCommandType, ApplicationCommandOption } from 'slash-create'

export interface Command {
  readonly id: string;
  guildID: string;
  name: string;
  content: string;
  description?: string;
  // options?: ApplicationCommandOption[];
  // default_permission?: boolean
  type: ApplicationCommandType;
}