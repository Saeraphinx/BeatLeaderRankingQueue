import { BaseInteraction, Events } from "discord.js";
import { Event } from "../../classes/Event";
import { Luma } from "../../classes/Luma";

module.exports = {
    event: new Event({
        event: Events.InteractionCreate,
        once: false,
        execute: async function exec(luma: Luma, interaction: BaseInteraction) {
            if (!interaction.isButton()) {
                return;
            }

            if (interaction.customId != `newuserbutton`) {
                return;
            }
            await interaction.deferReply({ ephemeral: true });
            let userId = interaction.user.id;
            let blResponse = await luma.apiManager.beatLeader.getPlayerFromDiscord(userId);
            if (blResponse.statusCode != 200) {
                luma.logger.log(`User ${userId} does not have a BeatLeader account.`, `newuserbutton`);
                await interaction.editReply({ content: `You do not have your discord account linked to a BeatLeader account.\nPlease link your account at https://www.beatleader.xyz/signin/socials.` });
                return;
            }
            let BLJSONResponse = JSON.parse(blResponse.body);
            if (BLJSONResponse.mapperId == null || BLJSONResponse.mapperId == 0) {
                luma.logger.log(`User ${userId} does not have a BeatSaver account linked.`, `newuserbutton`);
                await interaction.editReply({ content: `You do not have your BeatLeader account linked to a BeatSaver account.\nPlease link your account at https://www.beatleader.xyz/signin/socials.` });
                return;
            }

            //try to add new user
            try {
                let newUser = await luma.database.users.create({
                    discordId: userId,
                    beatLeaderId: BLJSONResponse.id,
                    beatSaverId: BLJSONResponse.mapperId.toString(),
                    rejectedMapCount: 0,
                    offenseDecreaseDate: null,
                    rejectedMapDecreaseDate: `{"dates":[]}`,
                    offenseCount: 0,
                    appealAccepted: false,
                    unbanDate: null,
                    history: `{"history":[]}`
                });

                let guild = luma.guilds.cache.get(interaction.guildId);
                let member = guild.members.cache.find(member => member.id === interaction.user.id);
                try {
                    if (member) {
                        member.roles.add(luma.offenseManager.unbannedRoleId);
                    } else {
                        luma.logger.error(`Could not find member ${interaction.user.id} in guild ${guild.id}`, `newuserbutton`);
                    }
                } catch (error) {
                    luma.logger.error(error, `newuserbutton`);
                }
            } catch (error: any) {
                if (error.name === `SequelizeUniqueConstraintError`) {
                    let tag = await luma.database.users.findOne({ where: { discordId: userId } });
                    if (tag) {
                        if (tag.unbanDate != null) { //user is banned
                            luma.logger.log(`User ${userId} is banned.`, `newuserbutton`);
                            return interaction.editReply(`You are currently banned from submitting maps for rank. Your ban/offense will expire on <t:${(new Date(tag.unbanDate).getTime() / 1000).toFixed()}:D>.`);
                        } else { // refreshing user logins
                            luma.database.users.update({ beatLeaderId: BLJSONResponse.id, beatSaverId: BLJSONResponse.mapperId.toString(), }, { where: { discordId: tag.discordId } });
                            let guild = luma.guilds.cache.get(interaction.guildId);
                            let member = guild.members.cache.find(member => member.id === interaction.user.id);
                            try {
                                if (member) {
                                    member.roles.add(luma.offenseManager.unbannedRoleId);
                                } else {
                                    luma.logger.error(`Could not find member ${interaction.user.id} in guild ${guild.id}`, `newuserbutton`);
                                }
                            } catch (error) {
                                luma.logger.error(error, `newuserbutton`);
                            }
                        }
                    }
                    luma.logger.log(`User ${userId} already exists in the database.`, `newuserbutton`);
                    return interaction.editReply(`Your accounts have been relinked and you are ready to submit maps for rank!`);
                }// something went roally wrong
                luma.logger.error(`Error adding user ${userId} to the database.\n${error}`, `newuserbutton`);
                return interaction.editReply(`Something went wrong with adding you to the database. Please contact a developer.`);
            } // success
            luma.logger.log(`User ${userId} added to the database.`, `newuserbutton`);
            await interaction.editReply({ content: `You're now able to submit maps for rank!` });
        }
    })
};
