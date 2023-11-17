import { SlashCommandBuilder, ChatInputCommandInteraction, ButtonStyle, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName(`dropadduserbutton`)
            .setDescription(`Drop a button that adds users to the database.`)
            .addStringOption(option => option.setName(`buttonlabel`).setDescription(`Label of the button`).setRequired(true))
            .addStringOption(option => option.setName(`messagecontent`).setDescription(`Content of the message the button is attached to`).setRequired(false))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .setDMPermission(false),
        execute: async function exec(luma: Luma, interaction: ChatInputCommandInteraction) {
            let messageContent = interaction.options.getString(`messagecontent`, false);
            let buttonLabel = interaction.options.getString(`buttonlabel`, true);

            let buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setLabel(buttonLabel)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(false)
                    .setCustomId(`newuserbutton`));
                
            
            await interaction.channel.send({ content: messageContent, components: [buttonRow] });
            await interaction.reply({ content: `fuck`, ephemeral: true });
        }
    })
}