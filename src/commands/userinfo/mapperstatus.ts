import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, ForumChannel } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";
import { IUser, IUserHistory } from "../../interfaces/IUser";
import { IMapQueue } from "../../interfaces/IMapQueue";
import { OffenseManager } from "../../classes/OffenseManager";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName(`mapperstatus`)
            .setDescription(`Check your standing in the ranking system.`)
            .addUserOption(option => option.setName(`user`).setDescription(`RT/NQT ONLY - The user to check.`).setRequired(false))
            .setDMPermission(false),
        execute: async function exec(luma: Luma, interaction: ChatInputCommandInteraction) {
            await interaction.deferReply({ ephemeral: true });
            if (interaction.guildId == null) {
                return;
            }

            let allowedToRun = false;

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

            let user = interaction.options.getUser(`user`, false);
            if (user == null) {
                user = interaction.user;
            } else if (!allowedToRun) {
                user = interaction.user;
            }

            let dbUser:IUser = await luma.offenseManager.getUserTag(user.id);
            if (dbUser == null) {
                return await interaction.reply({ content: `Could not get user.`, ephemeral: true });
            }

            let username:string = `unknown`;
            username = user.username;

            let embed = new EmbedBuilder()
                .setTitle(`${username}'s Mapper Status`)
                .addFields(
                    {
                        name: `Offenses`,
                        value: dbUser.offenseCount.toString()
                    },
                    {
                        name: `Rejected Maps`,
                        value: dbUser.rejectedMapCount.toString()
                    });

            if (allowedToRun) {
                let mapsinqueue = ``;
                let nomMaps: [IMapQueue] = await luma.database.mapqueue.findAll({ where: { discordId: user.id } });
                nomMaps.forEach((nomMap: IMapQueue) => {
                    mapsinqueue += `${nomMap.mapId} `;
                });
                if (mapsinqueue.length == 0) {
                    mapsinqueue = `No Maps in QueueDB.`;
                }
                embed.addFields({ name: `Maps in QueueDB`, value: mapsinqueue });

                let posterId = user.id;
                let numofUnlockedThreads = 0;
                let fourmChannel = await luma.channels.fetch(luma.offenseManager.FOURM_CHANNEL_ID);
                if (fourmChannel instanceof ForumChannel) {
                    luma.logger.log(`Checking threads for ${posterId} in <#${fourmChannel.id}> (${fourmChannel.id}) with input as ${luma.offenseManager.FOURM_CHANNEL_ID}`, `mapperstatus`);
                    await fourmChannel.threads.fetch().then(threads => {
                        luma.logger.log(`Found ${threads.threads.size} threads in ${threads.threads.at(0).parentId}.`, `mapperstatus`);
                        threads.threads.forEach(thread => {
                            if (thread.ownerId == posterId && !thread.locked) {
                                numofUnlockedThreads++;
                                luma.logger.log(`Unlocked Thread: ${thread.url}`, `mapperstatus`);
                            }
                        });
                    });
                    embed.addFields({ name: `Unlocked Threads`, value: numofUnlockedThreads.toString() });
                }
            }

            if (dbUser.unbanDate != null) {
                //<t:1689814440:D>
                embed.addFields({ name: `Unban Date`, value: `<t:${(new Date(dbUser.unbanDate).getTime() / 1000).toFixed()}:D>` });
                embed.setColor(0xFF0000);
                embed.setDescription(`This user is currently banned from ranking maps.`);
            } else if (dbUser.offenseDecreaseDate != null) {
                embed.addFields({ name: `Offense Decrease Date`, value: `<t:${(new Date(dbUser.offenseDecreaseDate).getTime() / 1000).toFixed()}:D>` });
                embed.setColor(0xFFFF00);
                embed.setDescription(`This user has offenses that will decrease in the future.`);
            } else if (dbUser.offenseCount == 0 && dbUser.rejectedMapCount == 0) {
                embed.setColor(0x00FF00);
                embed.setDescription(`This user has no offenses and is in good standing.`);
            } else if (dbUser.rejectedMapCount > 0) {
                embed.setColor(0xFFFF00);
                embed.setDescription(`This user has rejected maps, but is otherwise in good standing.`);
            }

            if (dbUser.history.length > 0) {
                let historyString = ``;
                let history:IUserHistory[] = JSON.parse(dbUser.history).history;
                history.forEach((entry) => {
                    historyString += `<t:${(new Date(entry.date).getTime() / 1000).toFixed()}>: ${entry.action} ${entry.reason ? `(${entry.reason})` : ``}\n`;
                });
                embed.setDescription(`${embed.data.description}\n\n**History**\n${historyString}`);
            }
            await interaction.editReply({ embeds: [embed] });

        }
    })
}
