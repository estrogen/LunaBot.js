const wfRuns = require('../../models/dbv2/wf_runs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: {
        name: 'lfgJoin'
    },
    async execute(i, bot) {
        const embedDescription = i.message.embeds[0]?.description || "";
        const mentionedUserId = embedDescription.match(/<@!?(\d+)>/)?.[1];
        const interactingUserId = i.user.id;
        const run = await wfRuns.findOne({ host: mentionedUserId });

        if (run && !run.participants.includes(interactingUserId)) {
            if (run.participants.length < 3) {
                run.participants.push(interactingUserId);
                await run.save();

                const updatedDescription = `${embedDescription}\n<@${interactingUserId}>`;
                const updatedEmbed = new EmbedBuilder(i.message.embeds[0]).setDescription(updatedDescription);

                if (run.participants.length >= 3) {
                    await i.update({ embeds: [updatedEmbed], components: [] });
                    // Send the followup here
                } else {
                    await i.update({ embeds: [updatedEmbed] });
                }
            } else {
                await i.update({ content: 'The run is already full.', components: [], ephemeral: true });
            }
        } else {
            await i.update({});
        }
    },
}