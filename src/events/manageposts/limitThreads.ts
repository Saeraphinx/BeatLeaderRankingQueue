import { Events, ForumChannel, ThreadChannel, User } from "discord.js";
import { Event } from "../../classes/Event";
import { Luma } from "../../classes/Luma";
import { DifficultyStatus } from "../../classes/APIManager";
import { IMapQueue } from "../../interfaces/IMapQueue";

module.exports = {
    event: new Event({
        event: Events.ThreadCreate,
        once: false,
        execute: async function exec(luma: Luma, thread: ThreadChannel, newlyCreated: boolean) {
            if (thread.partial) {
                thread.fetch().catch(e => {
                    luma.logger.error(`Error fetching message ${thread.id}.\n${e}`, `limit3`);
                });
            }

            const FOURM_CHANNEL_ID = luma.offenseManager.FOURM_CHANNEL_ID;
            let threadParentChannel = thread.parent;

            if (thread.parentId != FOURM_CHANNEL_ID || !newlyCreated) {
                return;
            }

            if (threadParentChannel == null || !(threadParentChannel instanceof ForumChannel)) {
                return;
            }

            let posterId = thread.ownerId;
            let numofUnlockedThreads = 0;
            let numOfMapsInQueue = 0;
            await threadParentChannel.threads.fetch().then(threads => {
                threads.threads.forEach(thread => {
                    if (thread.ownerId == posterId && !thread.locked) {
                        numofUnlockedThreads++;
                    }
                });
            });
            numOfMapsInQueue += numofUnlockedThreads;

            luma.logger.log(`New thread - User ${posterId} has ${numofUnlockedThreads} unlocked threads.`, `limit3`);
            if (numofUnlockedThreads > 3) {
                await deleteThread(luma, thread);
            } else {
                luma.logger.log(`User ${posterId} under 4 threads. Checking MapQueue & BeatLeader.`, `limit3`);

                let nomMaps: [IMapQueue] = await luma.database.mapqueue.findAll({ where: { discordId: posterId } });
                nomMaps.forEach(async (nomMap: IMapQueue) => {
                    let response = await luma.apiManager.beatLeader.getMapLeaderboard(nomMap.mapId);
                    if (response.statusCode == 200) {
                        let responseJson = await JSON.parse(response.body);
                        await responseJson.leaderboardGroup.forEach(async (leaderboard: any) => {
                            switch (leaderboard.status) {
                                case DifficultyStatus.Ranked:
                                case DifficultyStatus.Unrankable:
                                    luma.logger.log(`User ${posterId} has a ranked or unrankable map in the queue. Removing ${nomMap.mapId} from queue.`, `limit3`);
                                    await luma.database.mapqueue.destroy({ where: { mapId: nomMap.mapId } });
                                    break;
                                case DifficultyStatus.Nominated:
                                case DifficultyStatus.Qualified:
                                    numOfMapsInQueue++;
                                    luma.logger.log(`User ${posterId} has a nominated or qualified map (${nomMap.mapId}) in the queue. Increased to ${numOfMapsInQueue}`, `limit3`);
                                    break;
                                case DifficultyStatus.Outdated:
                                default:
                                    break;
                            }
                        });
                        if (numOfMapsInQueue > 3) {
                            luma.logger.log(`${posterId} has ${numOfMapsInQueue} maps in queue.`, `limit3`);
                            await deleteThread(luma, thread);
                        }
                    } else {
                        luma.logger.error(`Error fetching leaderboard for ${nomMap.mapId}.\n${response.statusCode} - ${response.body}`, `limit3`);
                    }
                });
            }

            //make sure user information in database is still accurate
            let blResponse = await luma.apiManager.beatLeader.getPlayerFromDiscord(posterId);
            if (blResponse.statusCode != 200) {
                luma.logger.log(`User ${posterId} does not have a BeatLeader account.`, `limit3`);
                await deleteThread(luma, thread, `You do not have your discord account linked to a BeatLeader account.\nPlease link your account at https://www.beatleader.xyz/signin/socials.`);
                removeThreadAccessRole(luma, thread.guildId, posterId);
                return;
            } else {
                let BLJSONResponse = JSON.parse(blResponse.body);
                if (BLJSONResponse.mapperId == null || BLJSONResponse.mapperId == 0) {
                    luma.logger.log(`User ${posterId} does not have a BeatSaver account linked.`, `limit3`);
                    await deleteThread(luma, thread, `You do not have your BeatLeader account linked to a BeatSaver account.\nPlease link your account at https://www.beatleader.xyz/signin/socials.`);
                    removeThreadAccessRole(luma, thread.guildId, posterId);
                    return;
                }
                let user = await luma.database.users.findOne({ where: { discordId: posterId } });
                if (user == null) {
                    luma.logger.log(`User ${posterId} does not exist in the database.`, `limit3`);
                    await deleteThread(luma, thread, `You are not registered with Luma. Please contact a developer.`);
                    removeThreadAccessRole(luma, thread.guildId, posterId);
                    return;
                }
                if (user.beatLeaderId != BLJSONResponse.id) {
                    luma.logger.log(`User ${posterId} has a different BeatLeader ID than the database.`, `limit3`);
                    await deleteThread(luma, thread, `Your BeatLeader account does not match the one registered with Luma. Please contact a developer.`);
                    removeThreadAccessRole(luma, thread.guildId, posterId);
                    return;
                }
                if (user.beatSaverId != BLJSONResponse.mapperId.toString()) {
                    luma.logger.log(`User ${posterId} has a different BeatSaver ID than the database.`, `limit3`);
                    await deleteThread(luma, thread, `Your BeatSaver account does not match the one registered with Luma. Please contact a developer.`);
                    removeThreadAccessRole(luma, thread.guildId, posterId);
                    return;
                }
            }
        }
    })
}

async function deleteThread(luma: Luma, thread: ThreadChannel, message?: string) {
    if (message == null) {
        message = `You already have 3 maps in the queue.`;
    }
    await thread.fetchOwner().then(owner => {
        owner.user.send({ content: message }).catch(e => {
            luma.logger.error(`Error sending message to ${owner.user.id}.\n${e}`, `limit3`);
        });
    }).catch(e => {
        luma.logger.error(`Error fetching owner of thread ${thread.id}.\n${e}`, `limit3`);
    });
    //await thread.setLocked(true, `User has 3 maps in the queue.`);
    await thread.delete(message);
    luma.logger.log(`Removed new thread: ${message}.`, `limit3`);
}

async function removeThreadAccessRole(luma:Luma, guildId:string, userId:string) {
    let guild = luma.guilds.cache.get(guildId);
    let member = guild.members.cache.find(member => member.id === userId);
    await member.roles.remove(luma.offenseManager.unbannedRoleId).catch(e => {
        luma.logger.error(`Error removing thread access role from ${member.id}.\n${e}`, `limit3`);
    });
}