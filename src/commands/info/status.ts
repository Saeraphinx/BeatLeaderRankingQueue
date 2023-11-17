import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Command } from "../../classes/Command";
import { Luma } from "../../classes/Luma";
import * as os from "os";
import { version } from "../../config.json";

module.exports = {
    command: new Command({
        data: new SlashCommandBuilder()
            .setName('status')
            .setDescription("status"),
        execute: async function exec(luma: Luma, interaction: CommandInteraction) {
            function toHHMMSS(anumber: any) {
                var sec_num = parseInt(anumber, 10); // don't forget the second param
                var hours: any = Math.floor(sec_num / 3600);
                var minutes: any = Math.floor((sec_num - (hours * 3600)) / 60);
                var seconds: any = sec_num - (hours * 3600) - (minutes * 60);

                if (hours < 10) { hours = "0" + hours; }
                if (minutes < 10) { minutes = "0" + minutes; }
                if (seconds < 10) { seconds = "0" + seconds; }
                return hours + ':' + minutes + ':' + seconds;
            }

            luma.statsTag = await luma.database.lumastats.findOne({ where: { bot_id: luma.user.id } });

            const embed = new EmbedBuilder()
                .setTitle("Ranking Overseer Status")
                .setDescription("Ranking Overseer is developed by <@!213074932458979330> and is based off of the core her bot, **Luma**. You can find more information about her at https://saeraphinx.dev")
                .addFields(
                    {
                        name: "Server OS",
                        value: `${process.platform}`,
                        inline: true
                    },
                    {
                        name: "Server Uptime",
                        value: `${toHHMMSS(Math.floor(os.uptime()))}`,
                        inline: true
                    },
                    {
                        name: "Luma Uptime",
                        value: `${toHHMMSS(Math.floor(process.uptime()))}`,
                        inline: true
                    },
                    {
                        name: "Last Connection",
                        value: `${luma.readyAt.toUTCString()}`,
                        inline: true
                    },
                    {
                        name: "Ping",
                        value: `${luma.ws.ping}ms`,
                        inline: true
                    },
                    {
                        name: "Load Average (1m, 5m, 15m)",
                        value: `${os.loadavg()}`,
                        inline: true
                    },
                    {
                        name: "Loaded Commands",
                        value: `${luma.commands.size}`,
                        inline: true
                    },
                    {
                        name: "Guild Count",
                        value: `${luma.guilds.cache.size}`,
                        inline: true
                    },
                    {
                        name: "Times Started",
                        value: `${luma.statsTag.get('times_started')}`,
                        inline: true
                    },
                    {
                        name: "Processed Events",
                        value: `${luma.statsTag.get('processed_events')}`,
                        inline: true
                    },
                    {
                        name: "Processed Messages",
                        value: `${luma.statsTag.get('processed_messages')}`,
                        inline: true
                    },
                    {
                        name: "Processed Interactions",
                        value: `${luma.statsTag.get('processed_interactions')}`,
                        inline: true
                    },
                )
                .setThumbnail(luma.user.displayAvatarURL({ size: 512 }))
                .setColor("#00ff00")
                .setFooter({
                    text: `Developed by Saera • Running ${version}`,
                    iconURL: "https://cdn.discordapp.com/avatars/213074932458979330/a3f5f55d27f93171374524a4f389527e?size=1024",
                });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    })
}