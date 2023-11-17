import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName(`addoffense`)
            .setDescription(`Add an offense to a user's record.`)
            .addUserOption(option => option.setName(`user`).setDescription(`The user to add an offense to.`).setRequired(true))
            .addStringOption(option => option.setName(`reason`).setDescription(`The reason for the offense.`).setRequired(false))
            .setDMPermission(false),
        execute: async function exec(luma: Luma, interaction: ChatInputCommandInteraction) {
            await interaction.deferReply({ ephemeral: true });
            let reason = interaction.options.getString(`reason`, false);
            if (reason == null) {
                reason = `No reason provided.`;
            }
            try {
                await luma.offenseManager.addOffense(interaction.options.getUser(`user`).id, interaction.user.id, reason);
                await interaction.editReply({ content: `An offense has been added to <@${interaction.options.getUser(`user`).id}>'s record.` });
            } catch (error) {
                luma.logger.error(error, `addoffense`);
                return await interaction.editReply({ content: `An error occurred while adding an offense to the users record. Please check the log for more details.` });
            }
        }
    })
};