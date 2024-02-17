const wf_runs = require('../../models/dbv2/wf_runs');
const users = require('../../models/dbv2/usersSchema');
const axios = require('axios');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: {
        name: 'lfgJoin'
    },
    async execute(i, bot) {
        const embedDescription = i.message.embeds[0]?.description || "";
        const interactingUserId = i.user.id;
        const runId = i.message.embeds[0].footer.text.replace('Run ID: ', '');
        const run = await wf_runs.findOne({ runId: runId, status: "lfg" });

        if (run && !run.participants.includes(interactingUserId)) {
            if (run.participants.length < 3) {
                run.participants.push(interactingUserId);
                await run.save();

                const updatedDescription = `${embedDescription}\n<@${interactingUserId}>`;
                const updatedEmbed = new EmbedBuilder(i.message.embeds[0]).setDescription(updatedDescription);

                if (run.participants.length >= 3) {
                    await i.update({ embeds: [updatedEmbed], components: [] });
                    
                    const mentionString = `<@${run.host}> ${run.participants.map(id => `<@${id}>`).join(' ')}`;

                    const hostIGN = await getIGN(run.host);
                    const participantsIGNs = await Promise.all(run.participants.map(async (id) => ({ id, ign: await getIGN(id) })));

                    const descriptionWithIGNs = participantsIGNs.reduce((desc, participant) => {
                        return `${desc}\n<@${participant.id}> /inv ${participant.ign}`;
                    }, `<@${run.host}> /inv ${hostIGN}`);

                    const relic = i.message.embeds[0].title.split(' for ')[1].split(' ')[1];
                    const fissures = await getFissuresForRelic(relic) || 'No Ideal Fissures';

                    const lfgButtons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId('lfgFinish').setLabel('Complete').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('lfgCancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('lfgExport').setLabel('Export Run').setStyle(ButtonStyle.Secondary),
                        );

                    const followUpEmbed = new EmbedBuilder()
                        .setTitle(i.message.embeds[0].title)
                        .setDescription(descriptionWithIGNs)
                        .addFields(
                            { name: 'Fissures', value: fissures },
                            { name: i.message.embeds[0].fields[1].name, value: i.message.embeds[0].fields[1].value }
                        )
                        .setColor("#ffb347")
                        .setFooter({ text: `Run ID: ${runId}` });
                        
                    await i.followUp({ content: mentionString, embeds: [followUpEmbed], components: [lfgButtons] });
                    run.status = "active";
                    await run.save();
                    try {
                        if (i.message.deletable) {
                            await i.message.delete();
                        }
                    } catch (error) {
                        console.error('Failed to delete the original interaction message:', error);
                    }

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

async function getFissuresForRelic(relic) {
    const relicType = relic.split(' ')[0];
    const allowedMissionTypes = ['Extermination', 'Capture', 'Sabotage', 'Rescue'];
    const url = 'https://api.warframestat.us/pc/fissures/';
  
    try {
        const response = await axios.get(url);
        const fissures = response.data;
    
        let fissureString = '';

        fissures.forEach(fissure => {
        if (fissure.active && !fissure.isStorm && fissure.tier.toLowerCase() === relicType.toLowerCase() && allowedMissionTypes.includes(fissure.missionType)) {
            const spPrefix = fissure.isHard ? 'SP ' : '';
            const expiryUnix = Math.floor(new Date(fissure.expiry).getTime() / 1000);
            fissureString += `${spPrefix}${fissure.missionType} - ${fissure.node} - <t:${expiryUnix}:R>\n`;
        }
        });

        fissureString = fissureString.trim();

        return fissureString;
    } catch (error) {
      console.error('Error fetching fissures:', error);
      return [];
    }
}

async function getIGN(userId) {
    const user = await users.findOne({ userID: userId });
    return user ? user.wfIGN : 'Unknown';
}
