import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";
import { Charicteristic } from "../../classes/ComparisonManager";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName(`comparemaps`)
            .setDescription(`Compare maps loaded into the ComparisonManager through ContextMenus.`)
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads)
            .addStringOption(option => option.setName(`charicteristic`).setDescription(`The charicteristic to compare.`).setRequired(true).addChoices(
                { name: `Standard`, value: `Standard` },
                { name: `NoArrows`, value: `NoArrows` },
                { name: `OneSaber`, value: `OneSaber` },
                { name: `90 Degrees`, value: `90Degree` },
                { name: `360 Degrees`, value: `360Degree` },
                { name: `Lightshow`, value: `Lightshow` },
                { name: `Lawless`, value: `Lawless` },
                { name: `Legacy`, value: `Legacy` }
            ))
            .addStringOption(option => option.setName(`difficulty`).setDescription(`The difficulty to compare.`).setRequired(true).addChoices(
                { name: `Easy`, value: `Easy` },
                { name: `Normal`, value: `Normal` },
                { name: `Hard`, value: `Hard` },
                { name: `Expert`, value: `Expert` },
                { name: `Expert+`, value: `ExpertPlus` }
            ))
            .setDMPermission(false),
        execute: async function exec(luma: Luma, interaction: ChatInputCommandInteraction) {
            await interaction.deferReply({ ephemeral: false });
            let response = await luma.comparisonManager.getMapComparison(interaction.options.getString(`charicteristic`, true), interaction.options.getString(`difficulty`, true));
            if (response == null) {
                return interaction.editReply({ content: `Failed to compare maps.` });
            }

            if (response.length < 1980) {
                await interaction.editReply({ content: `\`\`\`diff\n${response}\`\`\`` });
            } else {
                await interaction.editReply({ content: `Message contents is too long. Sending in multiple messages...` });
                for (; response.length > 1980;) {
                    response = response.substring(0, 1980);
                    await interaction.channel.send({ content: `\`\`\`diff\n${response}...\`\`\`` });
                }
            }
            setTimeout(() => {
                luma.comparisonManager.clearSavedMaps();
            }, 1000 * 10);
        }
    })
};