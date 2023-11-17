import { CommandInteraction, Guild, GuildMember, SlashCommandBuilder, Routes, REST, RESTGetAPIApplicationCommandResult } from "discord.js";
import { ICommand } from "../interfaces/ICommand";
import { Luma } from "./Luma";
import { token, clientId, devcreds, useDevCreds } from "../config.json";

export class Command {
    public data: SlashCommandBuilder;
    public guilds: string[] = [];
    // eslint-disable-next-line @typescript-eslint/ban-types
    public execute: Function;
    // eslint-disable-next-line @typescript-eslint/ban-types
    public autocomplete?: Function;
    public id?: string;

    public userwl: string[] = [];
    public userbl: string[] = [];
    public guildwl: string[] = [];
    public guildbl: string[] = [];
    public devRolewl: string[] = [];

    constructor(command: ICommand) {
        this.data = command.data;
        this.execute = command.execute;
        if (command.guilds != undefined) {
            if (command.guilds.length != 0) {
                this.guilds = command.guilds;
            }
        }
        if (command.autocomplete) {
            this.autocomplete = command.autocomplete;
        }
        if (command.guildwl) {
            this.guildwl = command.guildwl;
        }
        if (command.guildbl) {
            this.guildbl = command.guildbl;
        }
        if (command.userwl) {
            this.userwl = command.userwl;
        }
        if (command.userbl) {
            this.userbl = command.userbl;
        }
    }

    public async updateCommand(luma: Luma) {
        let rest: REST;
        if (useDevCreds) {
            rest = new REST({ version: `10` }).setToken(devcreds.token);
        } else {
            rest = new REST({ version: `10` }).setToken(token);
        }

        if (useDevCreds) {
            rest.patch(Routes.applicationCommand(devcreds.clientId, this.id), { body: this.data.toJSON() })
                .then((response) => {
                    let response2: RESTGetAPIApplicationCommandResult = response as RESTGetAPIApplicationCommandResult;
                    this.id = response2.id;
                    luma.logger.log(`Patched command (${this.data.name})`, `Update Command`);
                })
                .catch(error => {
                    luma.logger.error(error, `Update Command`);
                }
                );
        } else {
            rest.patch(Routes.applicationCommand(clientId, this.id), { body: this.data.toJSON() })
                .then((response) => {
                    let response2: RESTGetAPIApplicationCommandResult = response as RESTGetAPIApplicationCommandResult;
                    this.id = response2.id;
                    luma.logger.log(`Patched command (${this.data.name})`, `Update Command`);
                })
                .catch(error => {
                    luma.logger.error(error, `Update Command`);
                }
                );
        }
    }

    public async runCommand(luma: Luma, interaction: CommandInteraction) {
        luma.logger.log(`<@!${interaction.user.id}> ran ${this.data.name}: ${interaction.commandName}`, `Interactions`);

        let errorString: string = `You are not allowed to run this command at the moment. Please contact <@!${luma.devId}> if you think you should be able to.`;

        let flag: boolean = true;
        let wlcount: number = this.userwl.length + this.guildwl.length;
        let blcount: number = this.userbl.length + this.guildbl.length;
        let permcount: number = wlcount + blcount + this.devRolewl.length;
        if (permcount != 0) {
            if (wlcount != 0) {
                flag = false;
                this.userwl.forEach(id => {
                    if (interaction.user.id == id) {
                        flag = true;
                    }
                });
                this.guildwl.forEach(id => {
                    if (interaction.guildId == id) {
                        flag = true;
                    }
                });
            } else if (blcount != 0) {
                this.userbl.forEach(id => {
                    if (interaction.user.id == id) {
                        flag = false;
                        errorString = `You are not allowed to run that command. Please contact <@!${luma.devId}> if you think you should be able to.`;
                    }
                });
                this.guildbl.forEach(id => {
                    if (interaction.guildId == id) {
                        flag = false;
                        errorString = `This server is not allowed to run that command. Please contact <@!${luma.devId}> if you think you should be able to.`;
                    }
                });
            } else {
                flag = false;
                let server: Guild = luma.guilds.cache.get(luma.devGuildId);
                let member: GuildMember = server.members.cache.find(member => member.id === interaction.user.id);
                if (member) {
                    member.roles.cache.forEach(role => {
                        if (role.id == this.devRolewl[0]) {
                            flag = true;
                        }
                    });
                }
            }
        }

        try {
            try {
                if (flag) {
                    await this.execute(luma, interaction);
                } else {
                    await interaction.reply({ content: errorString });
                }
            } catch (error: any) {
                // eslint-disable-next-line no-console
                console.error(error);
                luma.logger.warn(`Interaction (${interaction.commandName}) did not reply.`, `Interactions`);
                await interaction.reply({ content: `damn it broke. msg <@!213074932458979330>\nError: \`${error.name}: ${error.message}\`` }).catch(error => {
                    interaction.editReply(`damn it broke. msg <@!213074932458979330>\nError: \`${error.name}: ${error.message}\``).catch(() => {
                        luma.logger.warn(`Interaction (${interaction.commandName}) did not reply in time.`, `Interactions`);
                    });
                });
            }
        } catch (error) {
            luma.logger.error(error, `interactions`);
        }
    }
}