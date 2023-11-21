import { Luma } from "./Luma";

export class ComparisonManager {
    private luma: Luma;
    public oldMapURL: string;
    public newMapURL: string;

    constructor(luma: Luma) {
        this.luma = luma;
    }

    public async getMapComparison(charicteristc: Charicteristic|string = Charicteristic.Standard, difficulty:Diffculty|string = Diffculty.ExpertPlus) : Promise<string|null> {
        if (this.oldMapURL == null || this.newMapURL == null) {
            return null;
        }

        let response = await this.luma.apiManager.beatLeader.compareMaps(this.oldMapURL, this.newMapURL, charicteristc, difficulty);
        if (response.statusCode != 200) {
            return null;
        } else {
            return response.body;
        }
    }

    public clearSavedMaps() {
        this.oldMapURL = null;
        this.newMapURL = null;
    }
}

export enum Diffculty {
    ExpertPlus = `ExpertPlus`,
    Expert = `Expert`,
    Hard = `Hard`,
    Normal = `Normal`,
    Easy = `Easy`,
}

export enum Charicteristic {
    Standard = `Standard`,
    OneSaber = `OneSaber`,
    NoArrows = `NoArrows`,
    NinetyDegree = `90Degree`,
    ThreeSixtyDegree = `360Degree`,
    Lightshow = `Lightshow`,
    Lawless = `Lawless`,
    Legacy = `Legacy`
}

