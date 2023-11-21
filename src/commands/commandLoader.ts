import { Collection } from "discord.js";
import { Luma } from "../classes/Luma";
import * as fs from "node:fs";
import { Command } from "../classes/Command";
import path from "node:path";
import { ContextMenu } from "../classes/ContextMenu";


export function loadCommands(luma: Luma, commandsPath?: string) {
    luma.commands = new Collection<string, Command>();

    let commandsDirectory: string;
    if (commandsPath) {
        commandsDirectory = commandsPath
    } else {
        commandsDirectory = path.resolve(__dirname);
    }

    let commandCategories: string[] = fs.readdirSync(commandsDirectory, { withFileTypes: true })
        .filter(item => item.isDirectory() && item.name != "contextmenus")
        .map((item) => item.name);

    commandCategories.forEach(dir => {
        fs.readdirSync(path.join(commandsDirectory, dir), { withFileTypes: true })
            .filter((item) => !item.isDirectory() && item.name.endsWith(".js"))
            .forEach(item => {
                let fileName: string = item.name;
                let filePath = path.join(commandsDirectory, dir, fileName);
                try {
                    const commandFile = require(filePath);
                    let command: Command = commandFile.command;
                    luma.commands.set(command.data.name, command);
                } catch (error) {
                    luma.logger.error(`Error when trying to load \`${filePath}\`\n\`\`\`${error}\`\`\``, "commandLoader")
                }
            });
    })

    fs.readdirSync(path.join(commandsDirectory, "contextmenus"), { withFileTypes: true })
        .filter((item) => !item.isDirectory() && item.name.endsWith(".js"))
        .forEach(item => {
            let fileName: string = item.name;
            let filePath = path.join(commandsDirectory, "contextmenus", fileName);
            try {
                const commandFile = require(filePath);
                let command: ContextMenu = commandFile.cm;
                luma.contextMenus.set(command.data.name, command);
            } catch (error) {
                luma.logger.error(`Error when trying to load \`${filePath}\`\n\`\`\`${error}\`\`\``, "commandLoader")
            }
        });
}