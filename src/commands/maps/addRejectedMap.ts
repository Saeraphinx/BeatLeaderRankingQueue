import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName(`dropmap`)
            .setDescription(`Add a dropped map to a user's record & penalizes them if necessary.`)
            .addUserOption(option => option.setName(`user`).setDescription(`The user to add a dropped map to.`).setRequired(true))
            .addBooleanOption(option => option.setName(`suitableforrank`).setDescription(`Whether the map was suitable for rank without major changes.`).setRequired(true))
            .addStringOption(option => option.setName(`reason`).setDescription(`The reason for the dropped map.`).setRequired(false))
            .setDMPermission(false),
        execute: async function exec(luma: Luma, interaction: ChatInputCommandInteraction) {
            await interaction.deferReply({ ephemeral: true });
            let reason = interaction.options.getString(`reason`, false);
            if (reason == null) {
                reason = `No reason provided.`;
            }
            try {
                if (interaction.options.getBoolean(`suitableforrank`, true)) {
                    await luma.offenseManager.addOffense(interaction.options.getUser(`user`).id, interaction.user.id, reason);
                    interaction.editReply({ content: `An offense has been applied to <@${interaction.options.getUser(`user`).id}>.` });
                } else {
                    await luma.offenseManager.addRejectedMap(interaction.options.getUser(`user`).id, interaction.user.id, reason);
                    interaction.editReply({ content: `A rejected map has been added to <@${interaction.options.getUser(`user`).id}>'s record.` });
                }
            } catch (error) {
                luma.logger.error(error, `dropmap`);
                return interaction.editReply({ content: `An error occurred while adding the map to the users record. Please check the log for more details.` });
            }
        }
    })
};