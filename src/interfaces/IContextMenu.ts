import { ContextMenuCommandBuilder } from "discord.js";

export interface IContextMenu {
    data:ContextMenuCommandBuilder;
    guilds?:string[];
    execute:Function;
    autocomplete?:Function;
    userwl?:string[];
    userbl?:string[];
    guildwl?:string[];
    guildbl?:string[];
    devRolewl?:string[];
}