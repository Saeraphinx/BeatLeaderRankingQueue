/* eslint-disable quotes */
import * as Discord from "discord.js";
import { REST } from '@discordjs/rest';
import { Logger } from "./Logger";
import { devId, devGuildId, token, clientId, devcreds, useDevCreds } from "../config.json";
import { Command } from "./Command";
import { loadCommands } from "../commands/commandLoader";
import { loadEvents } from "../events/eventLoader";
import { DatabaseManager } from "./DatabaseManager";
import path from "node:path";
import { OffenseManager } from "./OffenseManager";
import { APIManager } from "./APIManager";
import { ComparisonManager } from "./ComparisonManager";
import { ContextMenu } from "./ContextMenu";

export class Luma extends Discord.Client {
    public commands = new Discord.Collection<string, Command>();
    public contextMenus = new Discord.Collection<string, ContextMenu>();
    public database: DatabaseManager;
    public statsTag: any;
    public logger: Logger;
    public readonly devId: string = devId;
    public readonly devGuildId: string = devGuildId;
    public proccessedEvents: number;
    public readonly storagePath: string = path.resolve(`storage`);

    public offenseManager: OffenseManager;
    public apiManager: APIManager;
    public comparisonManager: ComparisonManager;

    constructor(options: Discord.ClientOptions) {
        super(options);
        this.logger = new Logger();
        this.database = new DatabaseManager();

        if (!this.statsTag) {
            this.statsTag = null;
        }

        /*this.on(Discord.Events.Warn, m => {
            this.logger.warn(m, "Client");
        });

        this.on(Discord.Events.Error, m => {
            this.logger.error(m, "Client");
        });*/

        this.offenseManager = new OffenseManager(this);
        this.apiManager = new APIManager(this);
        this.comparisonManager = new ComparisonManager(this);
    }

    public async pushCommands() {
        let rest: REST;
        if (useDevCreds) {
            rest = new REST({ version: `10` }).setToken(devcreds.token);
        } else {
            rest = new REST({ version: `10` }).setToken(token);
        }
        let guildIDs: string[] = this.guilds.cache.map(guild => guild.id);
        let serverCommands: Discord.Collection<string, Array<Discord.RESTPostAPIChatInputApplicationCommandsJSONBody | Discord.RESTPostAPIContextMenuApplicationCommandsJSONBody>> = new Discord.Collection<string, Array<Discord.RESTPostAPIChatInputApplicationCommandsJSONBody | Discord.RESTPostAPIContextMenuApplicationCommandsJSONBody>>();
        let globalCommands: Array<Discord.RESTPostAPIChatInputApplicationCommandsJSONBody | Discord.RESTPostAPIContextMenuApplicationCommandsJSONBody> = [];

        guildIDs.forEach(gid => {
            serverCommands.set(gid, []);
        });

        this.commands.forEach(command => {
            if (command.guilds.length != 0) {
                command.guilds.forEach(gid => {
                    try {
                        serverCommands.get(gid).push(command.data.toJSON());
                    } catch (error) {
                        this.logger.error(error, `pushServerCommands`);
                    }
                });
            } else {
                globalCommands.push(command.data.toJSON());
            }
        });

        this.contextMenus.forEach(contextmenu => {
            if (contextmenu.guilds.length != 0) {
                contextmenu.guilds.forEach(gid => {
                    try {
                        serverCommands.get(gid).push(contextmenu.data.toJSON());
                    } catch (error) {
                        this.logger.error(error, "pushServerCommands");
                    }
                })
            } else {
                globalCommands.push(contextmenu.data.toJSON());
            }
        });
        if (useDevCreds) {
            rest.put(Discord.Routes.applicationCommands(devcreds.clientId), { body: globalCommands })
                .then((response) => {
                    let response2: Discord.RESTGetAPIApplicationCommandResult[] = response as Discord.RESTGetAPIApplicationCommandResult[];
                    response2.forEach(apicommand => {
                        this.commands.forEach(command => {
                            if (command.data.name == apicommand.name) {
                                command.id = apicommand.id;
                            }
                        });
                    });
                    this.logger.log(`Global commands pushed.`, `Luma.pushCommands()`);
                })
                .catch(error => {
                    this.logger.error(error, `Luma.pushCommands()`);
                }
                );

            serverCommands.forEach((value, key) => {
                rest.put(Discord.Routes.applicationGuildCommands(devcreds.clientId, key), { body: value })
                    .then((response) => this.logger.log(`Pushed commands for ${key}`, `Luma.pushCommands()`))
                    .catch(error => {
                        this.logger.error(error, `Luma.pushCommands()`);
                    }
                    );
            });
        } else {
            rest.put(Discord.Routes.applicationCommands(clientId), { body: globalCommands })
                .then((response) => {
                    let response2: Discord.RESTGetAPIApplicationCommandResult[] = response as Discord.RESTGetAPIApplicationCommandResult[];
                    response2.forEach(apicommand => {
                        this.commands.forEach(command => {
                            if (command.data.name == apicommand.name) {
                                command.id = apicommand.id;
                            }
                        });
                    });
                    this.logger.log(`Global commands pushed.`, `Luma.pushCommands()`);
                })
                .catch(error => {
                    this.logger.error(error, `Luma.pushCommands()`);
                }
                );

            serverCommands.forEach((value, key) => {
                rest.put(Discord.Routes.applicationGuildCommands(clientId, key), { body: value })
                    .then((response) => this.logger.log(`Pushed commands for ${key}`, `Luma.pushCommands()`))
                    .catch(error => {
                        this.logger.error(error, `Luma.pushCommands()`);
                    }
                    );
            });
        }
    }
    public loadCommands() {
        loadCommands(this);
    }
    public loadEvents() {
        loadEvents(this);
    }
}