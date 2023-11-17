import { Sequelize, DataTypes } from "sequelize";

export class DatabaseManager {
    public sequelize:Sequelize;
    public users:any;
    public mapqueue:any;
    public lumastats:any;

    constructor() {
        this.sequelize = new Sequelize(`database`, `user`, `password`, {
            host: `localhost`,
            dialect: `sqlite`,
            logging: false,
            storage: `storage/database.sqlite`,
        });
        
        this.loadTables();
        this.users.sync();
        this.mapqueue.sync();
        this.lumastats.sync();
    }


    private loadTables() {
        this.users = this.sequelize.define(`users`, {
            discordId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
            },
            beatLeaderId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            beatSaverId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            rejectedMapCount: {
                type: DataTypes.NUMBER,
                defaultValue: 0,
                allowNull: false,
            },
            offenseCount: {
                type: DataTypes.NUMBER,
                defaultValue: 0,
                allowNull: false,
            },
            offenseDecreaseDate: {
                type: DataTypes.DATE,
                defaultValue: null,
                allowNull: true,
            },
            rejectedMapDecreaseDate: {
                type: DataTypes.STRING,
                defaultValue: `{"dates":[]}`,
                allowNull: false,
            },
            appealAccepted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            },
            unbanDate: {
                type: DataTypes.DATE,
                defaultValue: null,
                allowNull: true,
            },
            history: {
                type: DataTypes.STRING,
                defaultValue: `{"history":[]}`,
                allowNull: false,
            },
        });

        this.lumastats = this.sequelize.define(`lumastats`, {
            bot_id:{
                type: DataTypes.STRING,
                primaryKey: true,
                unique: true,
                allowNull: false,
            },
            processed_events: {
                type: DataTypes.NUMBER,
                defaultValue: 0,
                allowNull: false,
            },
            processed_interactions: {
                type: DataTypes.NUMBER,
                defaultValue: 0,
                allowNull: false,
            },
            processed_messages: {
                type: DataTypes.NUMBER,
                defaultValue: 0,
                allowNull: false,
            },
            times_started: {
                type: DataTypes.NUMBER,
                defaultValue: 0,
                allowNull: false,
            },
        });

        this.mapqueue = this.sequelize.define(`mapqueue`, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            discordId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            mapId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        });
    }
}