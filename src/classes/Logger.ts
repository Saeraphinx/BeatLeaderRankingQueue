/* eslint-disable no-console */
import { WebhookClient, EmbedBuilder, ColorResolvable, time, TimestampStyles } from "discord.js";

import { logging, useDevCreds, devcreds } from "../config.json";


export class Logger {
    //private static webhook:WebhookClient = new WebhookClient({id: logging.id, token: logging.token});
    private static webhook:WebhookClient;
    
    constructor() {
        if (useDevCreds) {
            Logger.webhook = new WebhookClient({ url: devcreds.logging.url });
        } else {
            Logger.webhook = new WebhookClient({ url: logging.url });
        }
    }
    
    public rawlog(message:any) {
        console.log(message);
        this.sendWebhookLog(message);
    }

    public log(message:any, moduleName:string) {
        console.log(`[LUMA ${moduleName}] ${new Date(Date.now()).toLocaleString()} > ${message}`);
        this.sendWebhookLog(`[LUMA ${moduleName}] ${time(new Date(Date.now()), TimestampStyles.LongTime)} > ${message}`);
    }

    public warn(message:any, source:string) {
        console.warn(`[WARN] ${new Date(Date.now()).toLocaleString()} > ${message}`);
        this.sendWebhookEmbed(`Warning`, message, 0xFF9900, source);
    }

    public error(message:any, source:string) {
        console.error(`[ERROR] ${new Date(Date.now()).toLocaleString()} > ${message}`);
        this.sendWebhookEmbed(`Error`, message, 0xFF0000, source);
    }
    

    private sendWebhookEmbed(title:string, message:any, color:ColorResolvable, source?:string) {
        let loggingEmbed:EmbedBuilder = new EmbedBuilder()
            .setTitle(title)
            .setDescription(message.toString())
            .setColor(color)
            .setFooter({
                text: `${source}`,
            })
            .setTimestamp();

        Logger.webhook.send({ embeds: [loggingEmbed], allowedMentions: { users: [`213074932458979330`], roles: [] } });
    }
    private sendWebhookLog(message:any) {
        Logger.webhook.send({ content: message, allowedMentions: { users: [], roles: [] } }).catch(console.error);
    }
}