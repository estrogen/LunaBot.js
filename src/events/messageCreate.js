const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const wf_runs = require('../models/dbv2/wf_runs');
const users = require('../models/dbv2/usersSchema');

module.exports = async (bot, m) => {
    if (m.reference && m.reference.messageId) {
        const originalMessage = await m.channel.messages.fetch(m.reference.messageId);

        if (originalMessage.author.bot && originalMessage.embeds.length > 0) {
            const commandRegex = /^(add|remove|guest)\s+(.+)$/i;
            const match = m.content.match(commandRegex);

            if (match) {
                const action = match[1].toLowerCase();
                const partNameKeyword = match[2].trim().toLowerCase();

                const embedTitle = originalMessage.embeds[0].title;
                const relicRegex = /Treasury Run for \d+x (\w+ \w+)/;
                const relicMatch = embedTitle.match(relicRegex);
                const runId = originalMessage.embeds[0].footer.text.replace('Run ID: ', '');

                if (relicMatch) {
                    const relic = relicMatch[1];
                    const run = await wf_runs.findOne({ runId: runId });

                    if (run) {
                        const relicDataField = originalMessage.embeds[0].fields.find(field => field.name.includes(relic));
                        if (!relicDataField) {
                            m.react('❌');
                            return;
                        }

                        const relicDataLines = relicDataField.value.split('\n');
                        const matchingLine = relicDataLines.find(line => line.toLowerCase().includes(partNameKeyword));
                        
                        if (run.status === "lfg") {
                            if (action === 'guest') {
                                const mentions = m.mentions.users.filter(user => user.id !== bot.user.id);
                                if (mentions.size > 0) {
                                    const firstMention = mentions.first();
                                    const embedDescription = originalMessage.embeds[0]?.description || "";
                                    if (!run.participants.includes(firstMention.id)) {
                                        run.participants.push(firstMention.id);
                                        await run.save();
                                        const updatedDescription = `${embedDescription}\n<@${firstMention.id}>`;
                                        const updatedEmbed = new EmbedBuilder(originalMessage.embeds[0]).setDescription(updatedDescription);
                                        if (run.participants.length >= 3) {
                                            await originalMessage.edit({ embeds: [updatedEmbed], components: [] });
                                            
                                            const mentionString = `<@${run.host}> ${run.participants.map(id => `<@${id}>`).join(' ')}`;
                        
                                            const hostIGN = await getIGN(run.host);
                                            const participantsIGNs = await Promise.all(run.participants.map(async (id) => ({ id, ign: await getIGN(id) })));
                        
                                            const descriptionWithIGNs = participantsIGNs.reduce((desc, participant) => {
                                                return `${desc}\n<@${participant.id}> /inv ${participant.ign}`;
                                            }, `<@${run.host}> /inv ${hostIGN}`);
                        
                                            const relic = originalMessage.embeds[0].title.split(' for ')[1].split(' ')[1];
                                            const fissures = await getFissuresForRelic(relic) || 'No Ideal Fissures';
                        
                                            const lfgButtons = new ActionRowBuilder()
                                                .addComponents(
                                                    new ButtonBuilder().setCustomId('lfgFinish').setLabel('Complete').setStyle(ButtonStyle.Success),
                                                    new ButtonBuilder().setCustomId('lfgCancel').setLabel('Cancel').setStyle(ButtonStyle.Danger),
                                                    new ButtonBuilder().setCustomId('lfgExport').setLabel('Export Run').setStyle(ButtonStyle.Secondary),
                                                );
                        
                                            const followUpEmbed = new EmbedBuilder()
                                                .setTitle(originalMessage.embeds[0].title)
                                                .setDescription(descriptionWithIGNs)
                                                .addFields(
                                                    { name: 'Fissures', value: fissures },
                                                    { name: originalMessage.embeds[0].fields[1].name, value: originalMessage.embeds[0].fields[1].value }
                                                )
                                                .setColor("#ffb347")
                                                .setFooter({ text: `Run ID: ${runId}` });
                                                
                                            await originalMessage.reply({ content: mentionString, embeds: [followUpEmbed], components: [lfgButtons] });
                                            run.status = "active";
                                            await run.save();
                                            try {
                                                if (originalMessage.deletable) {
                                                    await originalMessage.delete();
                                                }
                                            } catch (error) {
                                                console.error('Failed to delete the original interaction message:', error);
                                            }
                        
                                        } else {
                                            await originalMessage.edit({ embeds: [updatedEmbed] });
                                        }
                                    }
                                } else {
                                    m.react('❌');
                                }
                            } else {
                                m.react('❌');
                            }
                        } else {
                            if (action === 'add' && matchingLine) {
                                const parts = matchingLine.split('|').map(part => part.trim());
                                let partName = parts[2];
                                partName = partName.replace(/\s*{[^}]*}\s*$/, '');

                                run.rewards.push(partName);
                                await run.save();
                                await m.delete();
                            } else if (action === 'remove') {
                                const index = run.rewards.findIndex(name => name.toLowerCase().includes(partNameKeyword));
                                if (index !== -1) {
                                    run.rewards.splice(index, 1);
                                    await run.save();
                                    await m.delete();
                                } else {
                                    m.react('❌');
                                }
                            } else {
                                m.react('❌');
                            }
                        }
                    } else {
                        m.react('❌');
                    }
                }
            }
        }
    }
};

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