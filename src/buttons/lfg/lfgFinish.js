const wf_runs = require('../../models/dbv2/wf_runs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: {
        name: 'lfgFinish'
    },
    async execute(i, bot) {
        const embed = i.message.embeds[0];
        const mentionedUserId = embed.description.match(/<@!?(\d+)>/)?.[1];
        const interactingUserId = i.user.id;

        if (mentionedUserId === interactingUserId) {
            const runId = i.message.embeds[0].footer.text.replace('Run ID: ', '');
            const run = await wf_runs.findOneAndUpdate({ runId: runId, host: mentionedUserId, status: "active" }, { status: "Complete" }, { new: true });

            if (run) {
                const newButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('lfgActivate').setLabel('Re-activate').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('lfgExport').setLabel('Export Run').setStyle(ButtonStyle.Secondary),
                    );
                const followUpEmbed = new EmbedBuilder(embed).setTitle(`Completed ${embed.title}`);
                await i.update({ embeds: [followUpEmbed], components: [newButtons] });
            } else {
                i.reply({ content: "No active run found or unable to update the run status.", ephemeral: true });
            }
        } else {
            i.reply({ content: "You are not the host.", ephemeral: true });
        }
    },
}