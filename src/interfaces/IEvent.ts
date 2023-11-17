import { Events } from "discord.js";


export interface IEvent {
    event:Events;
    execute:Function;
    once?:boolean;
}