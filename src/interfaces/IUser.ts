export interface IUser {
    discordId: string;
    beatLeaderId: string;
    beatSaverId: string;
    rejectedMapCount: number;
    offenseCount: number;
    offenseDecreaseDate: Date;
    rejectedMapDecreaseDate: string;
    appealAccepted: boolean;
    unbanDate: Date;
    history: string;
}

export interface IUserHistory {
    rtId: string,
    action: string,
    reason: string,
    date: Date
}

export interface IUserRejectedMapDecreaseDate {
    dates: Date[]
}