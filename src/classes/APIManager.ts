import { request } from "undici";
import { Luma } from "./Luma";

export class APIManager {
    public luma:Luma;
    public beatLeader:BeatLeaderAPI;
    public discord:DiscordAPI;
    public beatSaver:BeatSaverAPI;

    constructor(luma:Luma) {
        this.luma = luma;
        this.beatLeader = new BeatLeaderAPI(luma);
        this.discord = new DiscordAPI(luma);
        this.beatSaver = new BeatSaverAPI(luma);
    }

    public async getExternalIdsFromDiscordId(discordId:string):Promise<null|{blId:string, bsId:string}> {
        let response = await this.beatLeader.getPlayerFromDiscord(discordId);
        if (response.statusCode != 200) {
            return null;
        }
        let parsedBody = JSON.parse(response.body);
        return { blId: parsedBody.id, bsId: parsedBody.mapperId.toString() };
    }

}

export class API {
    public luma:Luma;

    constructor(luma:Luma) {
        this.luma = luma;
    }

    protected async sendRequest(baseurl:APIType, endpoint:string) {
        let result = await request(baseurl + endpoint);
        let text = await result.body.text();
        return { statusCode: result.statusCode, body: text };
    }
}

class BeatLeaderAPI extends API {
    constructor(luma:Luma) {
        super(luma);
    }

    public async getPlayer(id:string, getExtraInfo:boolean = false) {
        return await this.sendRequest(APIType.BeatLeader, `player/${id}?stats=${getExtraInfo}`);
    }

    public async getPlayerFromDiscord(discordId:string) {
        return await this.sendRequest(APIType.BeatLeader, `player/discord/${discordId}`);
    }

    public async getPlayerFromBeatSaver(beatSaverId:string) {
        return await this.sendRequest(APIType.BeatLeader, `player/beatsaver/${beatSaverId}`);
    }

    public async getRankedLeaderboards(afterDate:Date) {
        return await this.sendRequest(APIType.BeatLeader, `leaderboards?count=101&type=ranked&date_from=${(afterDate.getTime() / 1000).toFixed()}&sortBy=timestamp`);
    }

    public async getMapLeaderboard(id:string) {
        return await this.sendRequest(APIType.BeatLeader, `leaderboard/${id}`);
    }

    public async compareMaps(newMapLink:string, oldMapLink:string, charicteristc:string = `Standard`, difficulty:string = `ExpertPlus`) {
        return await this.sendRequest(APIType.BeatLeader_Staging, `mapscompare/text?oldMapLink=${oldMapLink}&newMapLink=${newMapLink}&charToCompare=${charicteristc}&diffToCompare=${difficulty}`);
    }
}

class DiscordAPI extends API {
    constructor(luma:Luma) {
        super(luma);
    }

    public async getUser(id:string) {
        try {
            let user = await this.luma.users.fetch(id);
            user.id;
            return user;
        } catch (error) {
            return null;
        }
    }
}

class BeatSaverAPI extends API {
    constructor(luma:Luma) {
        super(luma);
    }

    public async getMap(id:string) {
        return await this.sendRequest(APIType.BeatSaver, `maps/id/${id}`);
    }
}

export enum APIType {
    BeatLeader = `https://api.beatleader.xyz/`,
    BeatSaver = `https://api.beatsaver.com/`,
    BeatLeader_Staging = `https://stage.api.beatleader.net/`
}

export interface IAPIResponse {
    statusCode: number;
    body: string;
}

export enum DifficultyStatus
{
    Unranked = 0,
    Nominated = 1,
    Qualified = 2,
    Ranked = 3,
    Unrankable = 4,
    Outdated = 5,
    InEvent = 6
}