import { ContextMenuCommandBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction, PermissionFlagsBits, Attachment } from "discord.js";
import { Luma } from "../../classes/Luma";
import { ContextMenu } from "../../classes/ContextMenu";
import { emitWarning } from "process";

module.exports = {
    cm: new ContextMenu({
        data: new ContextMenuCommandBuilder()
            .setName(`Set as Old Map URL`)
            .setDMPermission(false)
            .setType(ApplicationCommandType.Message)
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads),
        execute: async function exec(luma: Luma, interaction: MessageContextMenuCommandInteraction) {
            await interaction.deferReply({ ephemeral: true });
            if (interaction.targetMessage.attachments.size > 0) {
                interaction.targetMessage.attachments.forEach(async (attachment: Attachment) => {
                    if (attachment.contentType == `application/zip`) {
                        luma.logger.log(`Found zip file in ${interaction.targetMessage.url}. Posted by ${interaction.targetMessage.author.id} (<@${interaction.targetMessage.author.id}>)`, `postPreviewLink`);
                        luma.comparisonManager.oldMapURL = attachment.url;
                        return interaction.editReply({ content: `Using ${attachment.url}` });
                    }
                });
            } else {
                let beatSaverId = interaction.targetMessage.content.match(/(?<=https:\/\/beatsaver\.com\/maps\/)([abcdef12134567890]+)/g);
                if (beatSaverId != null) {
                    beatSaverId.forEach(async (id: string) => {
                        luma.logger.log(`Found beatsaver link ${id} in ${interaction.targetMessage.url}`, `postPreviewLink`);
                        let map = await luma.apiManager.beatSaver.getMap(id);
                        let mapURL = JSON.parse(map.body).versions[0].downloadURL;
                        luma.comparisonManager.oldMapURL = mapURL;
                        return interaction.editReply({ content: `Using ${mapURL}` });
                    });
                } else {
                    interaction.editReply({ content: `Couldn't Find URL.` });
                }
            }
        }
    })
}