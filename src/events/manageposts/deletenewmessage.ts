import { Events, Message } from "discord.js";
import { Event } from "../../classes/Event";
import { Luma } from "../../classes/Luma";

module.exports = {
    event: new Event({
        event: Events.MessageCreate,
        once: false,
        execute: async function exec(luma: Luma, message: Message) {
            if (message.partial) {
                try {
                    await message.fetch(); // message might be deleted
                } catch (error) {
                    luma.logger.error(`Something went wrong when fetching the message: ${error}`, `deleteMessageInPinnedThread`);
                    return;
                }
            }

            let channel = message.channel;
            if (!channel.isThread()) {
                return;
            }

            // rules thread
            if (channel.id == `1128760870000918619` && (message.author.id != `138596754592497664` && message.author.id != `1137892193227505754`)) {
                message.delete().catch(e => {
                    luma.logger.error(`Error deleting message ${message.id}.\n${e}`, `deleteMessageInPinnedThread`);
                });
                luma.logger.log(`Deleted message ${message.id} in rules thread.`, `deleteMessageInPinnedThread`);
            }
        }
    })
};
