import { Attachment, Events, ForumChannel, Message } from "discord.js";
import { Event } from "../../classes/Event";
import { Luma } from "../../classes/Luma";

module.exports = {
    event: new Event({
        event: Events.MessageCreate,
        once: false,
        execute: async function exec(luma: Luma, message: Message) {
            if (message.partial) {
                message.fetch().catch(e => {
                    luma.logger.error(`Error fetching message ${message.id}.\n${e}`, `limit3`);
                });
            }

            const ARC_VIEWER_BSR = `https://allpoland.github.io/ArcViewer/?id=`;
            const ARC_VIEWER_ZIP = `https://allpoland.github.io/ArcViewer/?url=`;
            const FOURM_CHANNEL_ID = luma.offenseManager.FOURM_CHANNEL_ID;
            let thread = message.thread;
            if (thread == null) {
                return;
            }

            if (thread.parentId != FOURM_CHANNEL_ID) {
                return;
            }

            let threadParentChannel = thread.parent;

            if (threadParentChannel == null || !(threadParentChannel instanceof ForumChannel)) {
                return;
            }

            let posterId = thread.ownerId;

            //check if user posted a beatsaver link
            if (message.author.id == posterId) {
                let beatSaverId = message.content.match(/(?<=https:\/\/beatsaver\.com\/maps\/)([0-9]+)/g);
                if (beatSaverId != null) {
                    beatSaverId.forEach(async (id: string) => {
                        message.reply({ content: `ArcViewer Link: ${ARC_VIEWER_BSR + id}`, allowedMentions: { repliedUser: false } });
                        return;
                    });
                } else if (message.attachments.size > 0) {
                    message.attachments.forEach(async (attachment: Attachment) => {
                        if (attachment.name.endsWith(`.zip`)) {
                            message.reply(`ArcViewer Link: ${ARC_VIEWER_ZIP + attachment.url}`);
                            return;
                        }
                    });
                }
            }
        }
    })
};