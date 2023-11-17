import { Events } from "discord.js";
import { Event } from "../../classes/Event";
import { Luma } from "../../classes/Luma";
import { IUser } from "../../interfaces/IUser";

module.exports = {
    event: new Event({
        event: Events.ClientReady,
        once: false,
        execute: async function exec(luma: Luma) {
            setInterval(async () => {
                luma.logger.log(`Checking for date decreases.`, `doDateDecreases`);
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

                users.forEach(async (user: IUser) => {
                    let now = new Date(Date.now());
                    if (user.unbanDate == null) { // if user is banned, dont decrease anything

                        if (user.offenseCount > 0) {
                            if (!user.offenseDecreaseDate) {
                                luma.logger.warn(`Offense decrease date is null for ${user.discordId}.`, `doDateDecreases`);
                            } else {
                                let decreaseDate = new Date(user.offenseDecreaseDate);
                                if (decreaseDate < now) {
                                    luma.offenseManager.decreaseOffense(user.discordId, `Offense Expired.`, luma.user.id);
                                }
                            }
                        }

                        if (user.rejectedMapCount > 0) {
                            let dateDecreases: Date[] = JSON.parse(user.rejectedMapDecreaseDate).dates;
                            let decreaseDate = new Date(dateDecreases[0]);
                            if (decreaseDate < now) {
                                luma.offenseManager.decreaseRejectedMap(user.discordId, `Rejected Map Expired.`, luma.user.id);
                            }
                        }

                    } else { // if the user is banned, check for their unban status

                        let unbanDate = new Date(user.unbanDate);
                        if (unbanDate < now) {
                            if (user.offenseCount >= 2) {
                                if (user.appealAccepted) {
                                    luma.offenseManager.unbanUser(user.discordId, `Appeal Accepted & Ban Expired.`, luma.user.id);
                                }
                            } else {
                                luma.offenseManager.unbanUser(user.discordId, `Ban Expired.`, luma.user.id);
                            }
                        }
                    }
                });
            }, 1000 * 60 * 60);
        },
    }),
};