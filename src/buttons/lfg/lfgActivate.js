const wf_runs = require('../../models/dbv2/wf_runs');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'lfgActivate'
    },
    async execute(i, bot) {
        const runId = i.message.embeds[0].footer.text.replace('Run ID: ', '');
        const mentionedUserId = i.message.embeds[0].description.match(/<@!?(\d+)>/)?.[1];
        const interactingUserId = i.user.id;

        if (mentionedUserId === interactingUserId) {
            const run = await wf_runs.findOneAndUpdate({ runId: runId, host: mentionedUserId }, { status: "active" }, { new: true });

            if (run) {
                const lfgButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId('lfgFinish').setLabel('Complete').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('lfgExport').setLabel('Export Run').setStyle(ButtonStyle.Secondary),
                    );

                const updatedEmbed = new EmbedBuilder(i.message.embeds[0])
                    .setFooter({ text: `Run ID: ${runId}` });

                await i.update({ embeds: [updatedEmbed], components: [lfgButtons] });

                i.followUp({ content: "The run has been re-activated.", ephemeral: true });
            } else {
                i.reply({ content: "No run found with the provided ID or you're not the host.", ephemeral: true });
            }
        } else {
            i.reply({ content: "You are not authorized to activate this run.", ephemeral: true });
        }
    },
};
