const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Creates a poll for users to vote.')
        .addStringOption(option => option.setName('question').setDescription('Question you want voted on').setRequired(true))
        .setDefaultPermission(true),

    async execute(i, bot) {
        const question = i.options.getString('question');

        const pEmbed = new EmbedBuilder()
            .setColor('#7289DA')
            .setDescription(question)
        const poll = await i.reply({ embeds: [pEmbed], fetchReply: true });
        poll.react('👍');
        poll.react('👎');
    },
};