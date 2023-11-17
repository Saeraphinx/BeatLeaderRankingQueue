import { Channel, EmbedBuilder } from "discord.js";
import { IUserHistory } from "../interfaces/IUser";
import { Luma } from "./Luma";

//import * as Discord from "discord.js";


export class OffenseManager {
    public luma: Luma;
    public readonly unbannedRoleId = `1128065797126881280`; //test role 1130664286457434165
    public readonly guildId = `921820046345523311`; //test guild 348498115621552129
    public readonly loggingChannel = `1137885973921935372`; // test channel 1130647791207718973
    public readonly FOURM_CHANNEL_ID = `1034817071894237194`;

    constructor(luma: Luma) {
        this.luma = luma;
    }

    public async addRejectedMap(mapperId: string, rtMemberId: string, reason: string) {
        let tag = await this.getUserTag(mapperId);
        if (tag == null) {
            this.luma.logger.error(`Could not get tag.`, `decreaseRejectedMap`);
            throw new Error(`Could not get tag.`);
        }

        let mapper = this.luma.users.cache.get(mapperId);
        let rtMember = this.luma.users.cache.get(rtMemberId);

        let newRejectedCount = tag.rejectedMapCount + 1;

        let dateDecreases: Date[] = JSON.parse(tag.rejectedMapDecreaseDate).dates;
        let decreaseDate = new Date(Date.now());
        decreaseDate.setMonth(decreaseDate.getMonth() + 1);
        dateDecreases.push(decreaseDate);
        let newDateDecreases: { dates: Date[] } = { dates: dateDecreases };

        let affectedRows = 0;
        if (newRejectedCount >= 3) {
            affectedRows = await this.luma.database.users.update({ rejectedMapCount: newRejectedCount, rejectedMapDecreaseDate: JSON.stringify(newDateDecreases) }, { where: { discordId: mapperId } });
            this.decreaseRejectedMap(mapperId, `Oldest map removed due to 3rd Rejected Map`, this.luma.user.id);
            this.addOffense(mapperId, rtMemberId, `Automatic Offense for 3rd Rejected Map`);
        } else {
            affectedRows = await this.luma.database.users.update({ rejectedMapCount: newRejectedCount, rejectedMapDecreaseDate: JSON.stringify(newDateDecreases) }, { where: { discordId: mapperId } });
        }

        if (affectedRows > 0) {
            await this._addHistory(tag, ActionTypeTemplates.AddRejectedMap, reason, rtMemberId);
            this.luma.logger.log(`${rtMember.username} (<@${rtMemberId}>) added a rejected map to ${mapper.username} (<@${mapperId}>). newRejectedCount: ${newRejectedCount}.`, `addRejectedMap`);
        } else {
            this.luma.logger.warn(`Tag ${tag.id} - Could not add rejected map.`, `Sequalize`);
        }
    }


    public async addOffense(mapperId: string, rtMemberId: string, reason: string) {
        let tag = await this.getUserTag(mapperId);
        if (tag == null) {
            this.luma.logger.error(`Could not get tag.`, `addOffense`);
            throw new Error(`Could not get tag.`);
        }

        let mapper = this.luma.users.cache.get(mapperId);
        let rtMember = this.luma.users.cache.get(rtMemberId);

        let newOffenseCount = tag.offenseCount + 1;
        let affectedRows = await this.luma.database.users.update({ offenseCount: newOffenseCount }, { where: { discordId: mapperId } });

        if (affectedRows > 0) {
            await this._addHistory(tag, ActionTypeTemplates.AddOffense, reason, rtMemberId);
            this.luma.logger.log(`${rtMember.username} (<@${rtMemberId}>) added an offense to ${mapper.username} (<@${mapperId}>). newOffenseCount: ${newOffenseCount}.`, `addOffense`);
            this.applyOffense(mapperId);
        } else {
            this.luma.logger.warn(`Tag ${tag.id} - Could not add offense.`, `Sequalize`);
        }
    }

    private async applyOffense(mapperId: string) {
        let tag = await this.getUserTag(mapperId);
        if (tag == null) {
            this.luma.logger.error(`Could not get tag.`, `applyOffense`);
            throw new Error(`Could not get tag.`);
        }

        //let mapper = this.luma.users.cache.get(mapperId);
        let isAppealAutoAccepted = false;
        let newUnbanDate = new Date(Date.now());
        switch (tag.offenseCount) {
            case 1:
                isAppealAutoAccepted = true;
                newUnbanDate.setMonth(newUnbanDate.getMonth() + 1);
                break;
            case 2:
                newUnbanDate.setMonth(newUnbanDate.getMonth() + 3);
                break;
            case 3:
                newUnbanDate.setMonth(newUnbanDate.getMonth() + 6);
                break;
            default:
                newUnbanDate.setMonth(newUnbanDate.getMonth() + 12);
                break;
        }
        this.luma.database.users.update({ unbanDate: newUnbanDate, appealAccepted: isAppealAutoAccepted, offenseDecreaseDate: null }, { where: { discordId: mapperId } });
        this._banUser(mapperId);
    }

    public async decreaseOffense(mapperId: string, reason?: string, rtMemberId?: string) {
        let tag = await this.getUserTag(mapperId);
        if (tag == null) {
            this.luma.logger.error(`Could not get tag.`, `decreaseRejectedMap`);
            throw new Error(`Could not get tag.`);
        }

        //let mapper = this.luma.users.cache.get(mapperId);
        let newOffenseCount = tag.offenseCount - 1;
        let newDecreaseDate = this.calcOffenseDecreaseDate(newOffenseCount);
        await this._addHistory(tag, ActionTypeTemplates.RemoveOffense, reason, rtMemberId);
        await this.luma.database.users.update({ offenseCount: newOffenseCount, offenseDecreaseDate: newDecreaseDate }, { where: { discordId: mapperId } });
    }

    public async decreaseRejectedMap(mapperId: string, reason?: string, rtMemberId?: string) {
        let tag = await this.getUserTag(mapperId);
        if (tag == null) {
            this.luma.logger.error(`Could not get tag.`, `decreaseRejectedMap`);
            throw new Error(`Could not get tag.`);
        }

        //let mapper = this.luma.users.cache.get(mapperId);
        let newRejectedCount = tag.rejectedMapCount - 1;
        let dateDecreases: Date[] = JSON.parse(tag.rejectedMapDecreaseDate).dates;
        dateDecreases.shift();
        let newDateDecreases: { dates: Date[] } = { dates: dateDecreases };
        await this._addHistory(tag, ActionTypeTemplates.RemoveRejectedMap, reason, rtMemberId);
        await this.luma.database.users.update({ rejectedMapCount: newRejectedCount, rejectedMapDecreaseDate: JSON.stringify(newDateDecreases) }, { where: { discordId: mapperId } });
    }

    public async getUserTag(id: string): Promise<any> {
        let tag = await this.luma.database.users.findOne({ where: { discordId: id } });

        if (!tag) {
            this.luma.logger.log(`Could not find tag ${id}, User likely doesn't exist`, `Sequalize`);
            return null;
        } else {
            return tag;
        }
    }

    public async unbanUser(id: string, reason?: string, rtMemberId?: string) {
        let tag = await this.getUserTag(id);
        if (tag == null) {
            return this.luma.logger.error(`Could not get tag.`, `unbanUser`);
        }

        //let mapper = this.luma.users.cache.get(id);
        await this.luma.database.users.update({ appealAccepted: false, unbanDate: null, offenseDecreaseDate: this.calcOffenseDecreaseDate(tag.offenseCount) }, { where: { discordId: id } });
        this._unbanUser(id);
        await this._addHistory(tag, ActionTypeTemplates.Unbanned, reason, rtMemberId);
    }

    private _banUser(id: string) {
        let guild = this.luma.guilds.cache.get(this.guildId);
        let member = guild.members.cache.find(member => member.id === id);
        try {
            if (member) {
                member.roles.remove(this.unbannedRoleId);
            } else {
                this.luma.logger.error(`Could not find member ${id} in guild ${guild.id}`, `banUser`);
            }
        } catch (error) {
            this.luma.logger.error(error, `banUser`);
        }
    }

    private _unbanUser(id: string) {
        let guild = this.luma.guilds.cache.get(this.guildId);
        let member = guild.members.cache.find(member => member.id === id);
        try {
            if (member) {
                member.roles.add(this.unbannedRoleId);
            } else {
                this.luma.logger.error(`Could not find member ${id} in guild ${guild.id}`, `banUser`);
            }
        } catch (error) {
            this.luma.logger.error(error, `banUser`);
        }
    }

    public calcOffenseDecreaseDate(offenseCount: number) {
        let decreaseDate = new Date(Date.now());
        switch (offenseCount) {
            case 0:
                decreaseDate = null;
                break;
            case 1:
                decreaseDate.setMonth(decreaseDate.getMonth() + 3);
                break;
            case 2:
                decreaseDate.setMonth(decreaseDate.getMonth() + 6);
                break;
            case 3:
                decreaseDate.setMonth(decreaseDate.getMonth() + 12);
                break;
            default:
                decreaseDate.setMonth(decreaseDate.getMonth() + 12);
                break;
        }
        return decreaseDate;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async _addHistory(tag: any, action: string, reason?: string, rtId?: string) {
        let logs: IUserHistory[] = JSON.parse(tag.history).history;
        let newLog: IUserHistory = {
            rtId: rtId,
            action: action,
            reason: reason,
            date: new Date(Date.now()),
        };
        logs.push(newLog);
        //this.luma.logger.rawlog(`Added history to ${tag.discordId}: ${JSON.stringify(newLog)}`);
        let newLogs: { history: IUserHistory[] } = { history: logs };
        let effectedRows = await this.luma.database.users.update({ history: JSON.stringify(newLogs) }, { where: { discordId: tag.discordId } });
        if (effectedRows == 0) {
            this.luma.logger.warn(`Could not add history to ${tag.discordId}.`, `Sequalize`);
        }

        let embed = new EmbedBuilder()
            .setTitle(action)
            .setDescription(`**User:** <@${tag.discordId}>\n**Reason:** ${reason}\n**RT Member:** <@${rtId}>`)
            .setTimestamp(new Date(Date.now()))
            .setFooter({ text: `ID: ${tag.discordId}`, iconURL: this.luma.user.avatarURL({ size: 64 }) })
            .setThumbnail((await this.luma.apiManager.discord.getUser(tag.discordId)).avatarURL({ size: 256 }));

        if (rtId != null) {
            let rtMember = await this.luma.apiManager.discord.getUser(rtId);
            embed.setAuthor({ name: rtMember.username, iconURL: rtMember.avatarURL({ size: 64 }) });
        }

        if (action == ActionTypeTemplates.AddRejectedMap) {
            embed.setColor(0xFFFF00);
        } else if (action == ActionTypeTemplates.AddOffense) {
            embed.setColor(0xFF0000);
        } else if (action == ActionTypeTemplates.RemoveRejectedMap || action == ActionTypeTemplates.RemoveOffense) {
            embed.setColor(0x00FF00);
        }

        let channel:Channel = await this.luma.channels.fetch(this.loggingChannel);
        if (!channel.isTextBased()) {
            return;
        }
        channel.send({ embeds: [embed] });
    }
}

export enum ActionTypeTemplates {
    AddRejectedMap = `Added Rejected Map`,
    RemoveRejectedMap = `Removed Rejected Map`,
    AddOffense = `Added Offense`,
    RemoveOffense = `Removed Offense`,
    Unbanned = `Unbanned`
}