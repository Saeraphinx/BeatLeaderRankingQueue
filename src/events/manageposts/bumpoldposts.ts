import { Events, ForumChannel } from "discord.js";
import { Event } from "../../classes/Event";
import { Luma } from "../../classes/Luma";

module.exports = {
    event: new Event({
        event: Events.ClientReady,
        once: false,
        execute: async function exec(luma: Luma) {
            setInterval(async () => {
                luma.logger.log(`Checking for old posts`, `bumpoldposts`);
                const FOURM_CHANNEL_ID = luma.offenseManager.FOURM_CHANNEL_ID;

                const channel = luma.channels.cache.get(FOURM_CHANNEL_ID);
                if (channel == null) {
                    return;
                }

                if (!(channel instanceof ForumChannel)) {
                    return;
                }

                let threads = await channel.threads.fetch();

                threads.threads.forEach(async (thread) => {
                    if (thread.archived) {
                        return;
                    }
                    if (thread.locked) {
                        return;
                    }
                    if (thread.sendable) {
                        luma.logger.warn(`Unable to send messages in thread ${thread.url}`, `bumpoldposts`);
                        return;
                    }

                    if (thread.ownerId == luma.user.id || thread.ownerId == `138596754592497664`) {
                        return;
                    }
                    let now = new Date(Date.now());
                    if (now.getTime() - thread.createdTimestamp > 1000 * 60 * 60 * 24 * 14) {
                        luma.logger.log(`Bumping thread ${thread.url}`, `bumpoldposts`);
                        //thread.send({ content: `2 Week Inactivity Bump`, allowedMentions: { parse: [] } });
                    }
                });
            }, 1000 * 60 * 60 * 24);
        }
    })
}