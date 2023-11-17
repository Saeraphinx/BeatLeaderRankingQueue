import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, ButtonStyle, ActionRowBuilder, ButtonBuilder } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName('addbottodb')
            .setDescription("Adds the bot to the database. (For Testing)")
            .setDMPermission(false),
        execute: async function exec(luma: Luma, interaction: ChatInputCommandInteraction) {
            if (interaction.user.id == "138596754592497664" || interaction.user.id == "213074932458979330") {
                luma.database.users.create({
                    discordId: "1130649128523800707", //test bot
                    beatLeaderId: "165749", // cyberramen
                    beatSaverId: "4234947", // cc bs account
                    rejectedMapCount: 0,
                    offenseCount: 0,
                    offenseDecreaseDate: null,
                    rejectedMapDecreaseDate: `{"dates":[]}`,
                    appealAccepted: false,
                    unbanDate: null,
                    history: `{"history":[]}`
                })
                await interaction.reply({ content: "fuck" });
            }
        }
    })
}