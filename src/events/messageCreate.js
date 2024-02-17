const { EmbedBuilder } = require('discord.js');
const wf_runs = require('../models/dbv2/wf_runs');

module.exports = async (bot, m) => {
    if (m.reference && m.reference.messageId) {
        const originalMessage = await m.channel.messages.fetch(m.reference.messageId);

        if (originalMessage.author.bot && originalMessage.embeds.length > 0) {
            const commandRegex = /^(add|remove)\s+(.+)$/i;
            const match = m.content.match(commandRegex);

            if (match) {
                const action = match[1].toLowerCase();
                const partNameKeyword = match[2].trim().toLowerCase();

                const embedTitle = originalMessage.embeds[0].title;
                const relicRegex = /Treasury Run for \d+x (\w+ \w+)/;
                const relicMatch = embedTitle.match(relicRegex);

                if (relicMatch) {
                    const relic = relicMatch[1];
                    const run = await wf_runs.findOne({ host: m.author.id, relic: relic, status: "active" });

                    if (run) {
                        const relicDataField = originalMessage.embeds[0].fields.find(field => field.name.includes(relic));
                        if (!relicDataField) {
                            m.react('❌');
                            return;
                        }

                        const relicDataLines = relicDataField.value.split('\n');
                        const matchingLine = relicDataLines.find(line => line.toLowerCase().includes(partNameKeyword));

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
                    } else {
                        m.react('❌');
                    }
                }
            }
        }
    }
};