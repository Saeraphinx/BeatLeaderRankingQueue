import { BaseInteraction, Events, Interaction } from "discord.js";
import { Event } from "../../classes/Event";
import { Luma } from "../../classes/Luma";

module.exports = {
    event: new Event({
        event: Events.InteractionCreate,
        once: false,
        execute: async function exec(luma: Luma, interaction: BaseInteraction) {
            if (interaction.isChatInputCommand()) {
                luma.statsTag.increment('processed_interactions');
                const command = luma.commands.get(interaction.commandName);
                if (!command) return;
                await command.runCommand(luma, interaction);
            } else if(interaction.isAutocomplete()) {
                const command = luma.commands.get(interaction.commandName);
                if (!command) return;
                try {
                    command.autocomplete(luma, interaction);
                } catch (error) {
                    
                }
            } else if (interaction.isContextMenuCommand()) {
                const command = luma.contextMenus.get(interaction.commandName);
                if (!command) return;
                await command.runCommand(luma, interaction);
            }
        }
    })
}