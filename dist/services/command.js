"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../util/db"));
class CommandService {
    constructor(creator) {
        this.creator = creator;
    }
    async getOne(id) {
        return db_1.default.get(id);
    }
    async getAll(guildID) {
        return db_1.default.find({
            selector: {
                guildID
            }
        }).then(res => res.docs);
    }
    async findByName(guildID, name) {
        return db_1.default.find({
            selector: {
                name, guildID
            }
        }).then(res => res.docs[0]);
    }
    async create(command) {
        const response = await this.creator.api.createCommand({
            name: command.name,
            description: command.description,
            options: command.options || [],
            type: command.type
        }, command.guildID);
        return db_1.default.put({
            ...command,
            _id: response.id,
            key: `${response.type}:${response.guild_id}:${response.name}`
        });
    }
    async update(command) {
        await this.creator.api.updateCommand(command._id, {
            name: command.name,
            description: command.description,
            options: command.options || [],
            // default_permission: command.defaultPermission // boolean
        });
        return db_1.default.put({
            ...command
        });
    }
    async delete(id) {
        return db_1.default.remove(await this.getOne(id));
    }
}
exports.default = CommandService;
