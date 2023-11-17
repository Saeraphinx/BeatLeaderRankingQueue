import { GatewayIntentBits, Partials, Events, Collection, Client } from "discord.js";
import { token } from "./config.json";
import { Luma } from "./classes/Luma";

const LUMA: Luma = new Luma({
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

LUMA.on(Events.ClientReady, async c => {
    //console.log(c);
    LUMA.statsTag = await LUMA.database.lumastats.findOne({ where: { bot_id: c.user.id } });
    if (!LUMA.statsTag) {
        try {
            LUMA.statsTag = await LUMA.database.lumastats.create({
                bot_id: c.user.id,
                processed_events: 0,
                processed_interactions: 0,
                processed_messages: 0,
                times_started: 0,
            });
        }
        catch (error) {

        }
    }
    LUMA.logger.log(`${c.user.username} Logged In.`, "index");
    LUMA.statsTag.increment('times_started');
})

LUMA.loadCommands();
LUMA.pushCommands();
LUMA.loadEvents();

LUMA.login(token);

process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
    if (reason instanceof Error) {
        return LUMA.logger.error(`Unhandled promise rejection:${reason.name}\n${reason.message}\n${reason.stack}`, "node.js");
    } else {
        return LUMA.logger.error(`Unhandled promise rejection:${reason}\n`, "node.js");
    }
});