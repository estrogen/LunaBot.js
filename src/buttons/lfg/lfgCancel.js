const wf_runs = require('../../models/dbv2/wf_runs');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: {
        name: 'lfgCancel'
    },
    async execute(i, bot) {
        const embed = i.message.embeds[0];
        let embedDescription = embed.description || "";
        const mentionedUserId = embedDescription.match(/<@!?(\d+)>/)?.[1];
        const interactingUserId = i.user.id;
        const runId = i.message.embeds[0].footer.text.replace('Run ID: ', '');
        if (mentionedUserId === interactingUserId) {
            await wf_runs.findOneAndDelete({ runId: runId, host: mentionedUserId, status: "active" })
                .then((deletedRun) => {
                    const title = i.message.embeds[0]?.title || "";
                    const match = title.match(/Treasury Run for (\d+)x (.*)/);
                    const amount = match?.[1] || 'unknown amount of';
                    const relic = match?.[2] || 'unknown relic';
            
                    i.reply({ content: `<@${interactingUserId}> has canceled the \`${amount}x ${relic}\` run.` });
                })
                .catch(err => {
                    console.error(err);
                    i.reply({ content: "An error occurred while deleting the run.", ephemeral: true });
                });
            i.message.delete();
        } else {
            const run = await wf_runs.findOne({ host: mentionedUserId, status: "lfg" });
            if (run && run.participants.includes(interactingUserId)) {
                const updatedParticipants = run.participants.filter(id => id !== interactingUserId);
                run.participants = updatedParticipants;
                await run.save();

                embedDescription = embedDescription.replace(new RegExp(`\n<@!?${interactingUserId}>`, 'g'), '').trim();
                const updatedEmbed = new EmbedBuilder(embed).setDescription(embedDescription);

                await i.message.edit({ embeds: [updatedEmbed] });
            } 
            i.update({})
        }
    },
}