import { Events } from "discord.js";
import { Event } from "../../classes/Event";
import { Luma } from "../../classes/Luma";
import { IUser } from "../../interfaces/IUser";

module.exports = {
    event: new Event({
        event: Events.ClientReady,
        once: false,
        execute: async function exec(luma: Luma) {
            let lastChecked = new Date(Date.now());
            setInterval(async () => {
                luma.logger.log(`Checking for new ranked maps.`, `doNewRankedMap`);
                if (lastChecked.getDay() != 5) {
                    return;
                }

                let response = await luma.apiManager.beatLeader.getRankedLeaderboards(lastChecked);

                if (response.statusCode != 200) {
                    return luma.logger.error(`Could not get ranked leaderboards.\n${response.body}`, `doNewRankedMap`);
                }

                let parsedBody: {metadata:any, data:any[]} = JSON.parse(response.body);
                if (parsedBody.data.length == 0) {
                    return luma.logger.log(`No new ranked maps`, `doNewRankedMap`);
                }

                const taglist = await luma.database.users.findAll();
                const users: IUser[] = [];
                taglist.forEach((tag: IUser) => {
                    users.push({
                        discordId: tag.discordId,
                        beatLeaderId: tag.beatLeaderId,
                        beatSaverId: tag.beatSaverId,
                        rejectedMapCount: tag.rejectedMapCount,
                        offenseDecreaseDate: tag.offenseDecreaseDate,
                        rejectedMapDecreaseDate: tag.rejectedMapDecreaseDate,
                        offenseCount: tag.offenseCount,
                        appealAccepted: tag.appealAccepted,
                        unbanDate: tag.unbanDate,
                        history: tag.history
                    });
                });

                parsedBody.data.forEach(map => {
                    let mapperId = map.song.mapperId.toString();
                    let mapper = users.find(user => user.beatSaverId == mapperId);
                    if (mapper == null) {
                        return luma.logger.warn(`Could not find mapper ${mapperId}`, `doNewRankedMap`);
                    }
                    if (mapper.rejectedMapCount > 0) {
                        luma.offenseManager.decreaseRejectedMap(mapper.discordId, `New Ranked map (${map.song.id})`, luma.user.id);
                    }
                        
                });
                lastChecked = new Date(Date.now());
            }, 1000 * 60 * 60 * 12);
        }
    })
};