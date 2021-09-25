"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const config = JSON.parse((0, node_fs_1.readFileSync)('./config.json', 'utf8'));
const node_process_1 = __importDefault(require("node:process"));
const node_path_1 = require("node:path");
const slash_create_1 = require("slash-create");
new slash_create_1.SlashCreator({
    applicationID: config.applicationID,
    publicKey: config.publicKey,
    token: config.token
})
    .registerCommandsIn((0, node_path_1.resolve)(node_process_1.default.cwd(), './dist/commands'))
    .syncGlobalCommands();
