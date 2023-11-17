import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Channel } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName(`addtoqueue`)
            .setDescription(`Add a map to the nomination queue.`)
            .addStringOption(option => option.setName(`mapid`).setDescription(`The BeatSaver ID of the map to add to the queue.`).setRequired(true))
            .addUserOption(option => option.setName(`user1`).setDescription(`The user to add the map to.`).setRequired(true))
            .addUserOption(option => option.setName(`user2`).setDescription(`The user to add the map to.`).setRequired(false))
            .addUserOption(option => option.setName(`user3`).setDescription(`The user to add the map to.`).setRequired(false))
            .addUserOption(option => option.setName(`user4`).setDescription(`The user to add the map to.`).setRequired(false))
            .addUserOption(option => option.setName(`user5`).setDescription(`The user to add the map to.`).setRequired(false))
            .addUserOption(option => option.setName(`user6`).setDescription(`The user to add the map to.`).setRequired(false))
            .addUserOption(option => option.setName(`user7`).setDescription(`The user to add the map to.`).setRequired(false))
            .addUserOption(option => option.setName(`user8`).setDescription(`The user to add the map to.`).setRequired(false))
            .addUserOption(option => option.setName(`user9`).setDescription(`The user to add the map to.`).setRequired(false))
            .addUserOption(option => option.setName(`user10`).setDescription(`The user to add the map to.`).setRequired(false))

            .setDMPermission(false),

        execute: async function exec(luma: Luma, interaction: ChatInputCommandInteraction) {
            await interaction.deferReply({ ephemeral: true });
            let mapId = interaction.options.getString(`mapid`, true);
            let userArray = [
                interaction.options.getUser(`user1`, true),
                interaction.options.getUser(`user2`, false),
                interaction.options.getUser(`user3`, false),
                interaction.options.getUser(`user4`, false),
                interaction.options.getUser(`user5`, false),
                interaction.options.getUser(`user6`, false),
                interaction.options.getUser(`user7`, false),
                interaction.options.getUser(`user8`, false),
                interaction.options.getUser(`user9`, false),
                interaction.options.getUser(`user10`, false)
            ];

            let count = 0;
            let mapiconurl = "";
            await luma.apiManager.beatSaver.getMap(mapId).then(async response => {
                if (response.statusCode != 200) {
                    return await interaction.editReply({ content: `The map ID provided is invalid.` });
                } else {
                    userArray.forEach(user => {
                        if (user != null) {
                            luma.database.mapqueue.create({
                                mapId: mapId,
                                discordId: user.id
                            });
                            count++;
                        }
                    });
                    mapiconurl = JSON.parse(response.body).versions[0].coverURL;
                }
                await interaction.editReply({ content: `Added ${count} entries to the map queue.` });
            });

            let userping = ``;
            userArray.forEach(user => {
                if (user != null) {
                    userping += `<@${user.id}> `;
                }
            });


            let embed = new EmbedBuilder()
                .setTitle(`Map added to Queue`)
                .setDescription(`**Users:** ${userping}\n**Map:** [${mapId}](https://beatsaver.com/maps/${mapId})\n**RT Member:** <@${interaction.user.id}>`)
                .setTimestamp(new Date(Date.now()))
                .setFooter({ text: `Added ${count} entries`, iconURL: luma.user.avatarURL({ size: 64 }) })
                .setThumbnail(mapiconurl);

            if (interaction.user.id != null) {
                let rtMember = interaction.user;
                embed.setAuthor({ name: rtMember.username, iconURL: rtMember.avatarURL({ size: 64 }) });
            }

            embed.setColor(0x00FF00);
            

            let channel: Channel = await luma.channels.fetch(luma.offenseManager.loggingChannel);
            if (!channel.isTextBased()) {
                return;
            }
            channel.send({ embeds: [embed] });
        }
    })
}