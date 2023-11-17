import { SlashCommandBuilder } from "discord.js";

export interface ICommand {
    data:SlashCommandBuilder;
    guilds?:string[];
    execute:Function;
    autocomplete?:Function;
    userwl?:string[];
    userbl?:string[];
    guildwl?:string[];
    guildbl?:string[];
    devRolewl?:string[];
}