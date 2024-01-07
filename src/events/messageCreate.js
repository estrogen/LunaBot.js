const { EmbedBuilder } = require('discord.js');
const off = require('../models/moderation/stfu');
const bl = require('../models/guild/blacklist');

let scamData;
let logsChannel;

module.exports = async (bot, m) => {
    if (m.author.bot || !['1193540893693710417'].includes(m.channel.id)) return;

    // Initialize the cache if not already done
    if (!scamData) scamData = await bl.findOne({ "name": "scam" });
    if (!logsChannel) logsChannel = await m.guild.channels.cache.get('890240562970624026');

    const stfu = await off.findOne({ userID: m.author.id });
    if (stfu) return m.delete();

    const parsed = m.content.replace(/\s+/g, '').toLowerCase();
    if (scamData.words.some(word => parsed.includes(word))) {
        const bEmbed = new EmbedBuilder()
            .setTitle(`Banned ${m.author.id}`)
            .setColor('#FF6961')
            .setTimestamp()
            .setDescription(`${m.content}`);

        await logsChannel.send({ embeds: [bEmbed] });
        await m.member.ban({days: 7, reason: "Typed in the do not type channel"});
        return;
    }
};