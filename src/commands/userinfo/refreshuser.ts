import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";
import { IUser } from "../../interfaces/IUser";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName(`refreshuser`)
            .setDescription(`Refresh the link between your BeatSaver and BeatLeader accounts.`)
            .addUserOption(option => option.setName(`user`).setDescription(`RT/NQT Only - User to refresh`).setRequired(false))
            .setDMPermission(true),
        execute: async function exec(luma: Luma, interaction: ChatInputCommandInteraction) {
            await interaction.deferReply({ ephemeral: true });

            let allowedToRun = false;
            if (interaction.guildId != null) {
                await interaction.guild.members.fetch(interaction.user.id).then(member => {
                    member.roles.cache.forEach(role => {
                        if (role.id == `1020801190210060349` || role.id == `1064783598206599258`) {
                            allowedToRun = true;
                        }
                    });
                });

                if (interaction.user.id == luma.devId) {
                    allowedToRun = true;
                }
            }

            let user = interaction.options.getUser(`user`, false);
            if (user == null) {
                user = interaction.user;
            } else if (!allowedToRun) {
                user = interaction.user;
            }

            let dbUser: IUser = await luma.offenseManager.getUserTag(user.id);
            if (dbUser == null) {
                return await interaction.editReply({ content: `Could not get user.` });
            }

            //update BeatSaver and BeatLeader ids
            let blIdResponse = await luma.apiManager.getExternalIdsFromDiscordId(user.id);
            if (blIdResponse == null) {
                return await interaction.editReply({ content: `You do not have your discord account linked to a BeatLeader account.\nPlease link your account at https://www.beatleader.xyz/signin/socials.` });
            } else if (blIdResponse.bsId == null || blIdResponse.bsId == `0`) {
                return await interaction.editReply({ content: `You do not have your BeatLeader account linked to a BeatSaver account.\nPlease link your account at https://www.beatleader.xyz/signin/socials.` });
            }

            //update user in database
            try {
                await luma.database.users.update({ beatLeaderId: blIdResponse.blId, beatSaverId: blIdResponse.bsId }, { where: { discordId: user.id } });
            } catch (error: any) {
                luma.logger.error(`Error updating user ${user.id} in the database.\n${error}`, `refreshuser`);
                return await interaction.editReply({ content: `Something went wrong with updating you in the database. Please contact a developer.` });
            }

        }
    })
}