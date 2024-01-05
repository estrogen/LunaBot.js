const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responds with the bots ping!')
        .setDefaultPermission(true),

    async execute(i, bot) {
        const pEmbed = new EmbedBuilder()
            .setColor('#7289DA')
            .setTitle('Latency')
            .addFields([
                { name: 'Bot', value: `${Date.now() - i.createdTimestamp}`, inline: true },
                { name: 'Api', value: `${Math.round(bot.ws.ping)}`, inline: true },
                { name: 'Total', value: `${Math.round(bot.ws.ping + (Date.now() - i.createdTimestamp))}`, inline: true },
            ])
        await i.reply({embeds: [pEmbed], ephemeral: true});
    },
};