import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName(`manageuser`)
            .setDescription(`Manage a users entry in the Database. Changes here will not be logged.`)
            .addSubcommand(subcommand => subcommand
                .setName(`unbanuser`)
                .setDescription(`Unbans a user, but keeps their offenses.`)
                .addUserOption(option => option.setName(`user`).setDescription(`The user to unban.`).setRequired(true)))
            .addSubcommand(subcommand => subcommand
                .setName(`resetuser`)
                .setDescription(`Resets a users offenses & rejected maps.`)
                .addUserOption(option => option.setName(`user`).setDescription(`The user to reset.`).setRequired(true)))
            .addSubcommand(subcommand => subcommand
                .setName(`setunbandate`)
                .setDescription(`Overrides the unban date for a user.`)
                .addUserOption(option => option.setName(`user`).setDescription(`The user to set the unban date for.`).setRequired(true))
                .addStringOption(option => option.setName(`date`).setDescription(`The date to set the unban date to.`).setRequired(true)))
            .addSubcommand(subcommand => subcommand
                .setName(`manageappeal`)
                .setDescription(`Overrides the appeal status for a user.`)
                .addUserOption(option => option.setName(`user`).setDescription(`The user to set the appeal status for.`).setRequired(true))
                .addBooleanOption(option => option.setName(`status`).setDescription(`The appeal status to set.`).setRequired(true)))
            .addSubcommand(subcommand => subcommand
                .setName(`setrejectedmapcount`)
                .setDescription(`Overrides the rejected map count for a user.`)
                .addUserOption(option => option.setName(`user`).setDescription(`The user to set the rejected map count for.`).setRequired(true))
                .addIntegerOption(option => option.setName(`count`).setDescription(`The rejected map count to set.`).setRequired(true).setMinValue(0).setMaxValue(3)))
            .addSubcommand(subcommand => subcommand
                .setName(`setoffensecount`)
                .setDescription(`Overrides the offense count for a user.`)
                .addUserOption(option => option.setName(`user`).setDescription(`The user to set the offense count for.`).setRequired(true))
                .addIntegerOption(option => option.setName(`count`).setDescription(`The offense count to set.`).setRequired(true).setMinValue(0)))
            .addSubcommand(subcommand => subcommand
                .setName(`adduserbydiscord`)
                .setDescription(`Manually adds a user to the Database.`)
                .addUserOption(option => option.setName(`user`).setDescription(`The user to set the offense count for.`).setRequired(true)))
            .addSubcommand(subcommand => subcommand
                .setName(`discordonlyadd`)
                .setDescription(`Manually adds a user to the database using only their Discord ID (WILL BREAK THINGS).`)
                .addUserOption(option => option.setName(`user`).setDescription(`The user to set the offense count for.`).setRequired(true)))
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .setDMPermission(false),
        execute: async function exec(luma: Luma, interaction: ChatInputCommandInteraction) {
            const user = interaction.options.getUser(`user`);

            try {
                if (interaction.options.getSubcommand(true) == `unbanuser`) {
                    await luma.offenseManager.unbanUser(user.id);
                } else if (interaction.options.getSubcommand(true) == `resetuser`) {
                    await luma.database.users.destroy({ where: { discordId: user.id } });
                } else if (interaction.options.getSubcommand(true) == `setunbandate`) {
                    const date = new Date(interaction.options.getString(`date`, true));
                    await luma.database.users.update({ unbanDate: date }, { where: { discordId: user.id } });
                } else if (interaction.options.getSubcommand(true) == `manageappeal`) {
                    let appealStatus = interaction.options.getBoolean(`status`, true);
                    await luma.database.users.update({ appealAccepted: appealStatus }, { where: { discordId: user.id } });
                } else if (interaction.options.getSubcommand(true) == `setrejectedmapcount`) {
                    let count = interaction.options.getInteger(`count`, true);
                    let tag = await luma.offenseManager.getUserTag(user.id);
                    if (tag == null) {
                        return interaction.reply({ content: `Could not get tag.` });
                    }

                    tag.rejectedMapCount = count;
                    let dateDecreases: Date[] = JSON.parse(tag.rejectedMapDecreaseDate).dates;
                    if (dateDecreases.length > count) {
                        dateDecreases.length = count;
                    }
                    let newDateDecreases: { dates: Date[] } = { dates: dateDecreases };

                    await luma.database.users.update({ rejectedMapCount: count, rejectedMapDecreaseDate: JSON.stringify(newDateDecreases) }, { where: { discordId: user.id } });
                } else if (interaction.options.getSubcommand(true) == `setoffensecount`) {
                    let count = interaction.options.getInteger(`count`, true);
                    let tag = await luma.offenseManager.getUserTag(user.id);
                    if (tag == null) {
                        return interaction.reply({ content: `Could not get tag.` });
                    }

                    let newOffenseCount = count;
                    let newOffenseDecreaseDate = luma.offenseManager.calcOffenseDecreaseDate(count);
                    await luma.database.users.update({ offenseCount: newOffenseCount, offenseDecreaseDate: newOffenseDecreaseDate }, { where: { discordId: user.id } });
                } else if (interaction.options.getSubcommand(true) == `adduserbydiscord`) {

                    await interaction.deferReply({ ephemeral: true });
                    let blResponse = await luma.apiManager.beatLeader.getPlayerFromDiscord(user.id);
                    if (blResponse.statusCode != 200) {
                        luma.logger.log(`User ${user.id} does not have a BeatLeader account.`, `manageuser`);
                        await interaction.editReply({ content: `Couldn't find a beatleader account for ${user.id}` });
                        return;
                    }
                    let BLJSONResponse = JSON.parse(blResponse.body);
                    if (BLJSONResponse.mapperId == null || BLJSONResponse.mapperId == 0) {
                        luma.logger.log(`User ${user.id} does not have a BeatSaver account linked.`, `newuserbutton`);
                        await interaction.editReply({ content: `${user.id} does not have their BeatLeader account linked to a BeatSaver account.\nPlease link your account at https://www.beatleader.xyz/signin/socials.` });
                        return;
                    }
                    try {
                        await luma.database.users.create({
                            discordId: user.id,
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
                        let member = guild.members.cache.find(member => member.id === user.id);
                        if (member) {
                            member.roles.add(luma.offenseManager.unbannedRoleId);
                        } else {
                            luma.logger.error(`Could not find member ${interaction.user.id} in guild ${guild.id}`, `newuserbutton`);
                        }
                    } catch (error: any) {
                        if (error.name === `SequelizeUniqueConstraintError`) {
                            luma.logger.log(`User ${user.id} already exists in the database.`, `newuserbutton`);
                            return interaction.editReply(`${user.id} is already ready to submit maps for rank!`);
                        }
                        luma.logger.error(`Error adding user ${user.id} to the database.\n${error}`, `newuserbutton`);
                        return interaction.editReply(`Something went wrong with adding ${user.id} to the database. Please contact a developer.`);
                    }
                    return interaction.editReply({ content: `maybe it worked, maybe it didn't. who tf knows at this point (it probably did tho)` });
                } else if (interaction.options.getSubcommand(true) == `discordonlyadd`) {
                    try {
                        await luma.database.users.create({
                            discordId: user.id,
                            beatLeaderId: `0`,
                            beatSaverId: `0`,
                            rejectedMapCount: 0,
                            offenseDecreaseDate: null,
                            rejectedMapDecreaseDate: `{"dates":[]}`,
                            offenseCount: 0,
                            appealAccepted: false,
                            unbanDate: null,
                            history: `{"history":[]}`
                        });
                    } catch (error: any) {
                        if (error.name === `SequelizeUniqueConstraintError`) {
                            luma.logger.log(`User ${user.id} already exists in the database.`, `newuserbutton`);
                            return interaction.editReply(`${user.id} is already in here.`);
                        }
                        luma.logger.error(`Error adding user ${user.id} to the database.\n${error}`, `newuserbutton`);
                        return interaction.editReply(`oh no.`);
                    }
                    interaction.editReply({ content: `god youre trying to break stuff today, aren't you... well this one worked.` });
                }
                interaction.reply({ content: `maybe it worked, maybe it didn't. who tf knows at this point` });
            } catch (error: any | Error) {
                if (error instanceof Error) {
                    luma.logger.error(`${error}\n${error.stack}`, `manageuser`);
                } else {
                    luma.logger.error(error, `manageuser`);
                }
                return interaction.reply({ content: `~~maybe it worked, maybe it didn't. who tf knows at this point~~ it didn't work. whoops.` });
            }
        }
    })
}