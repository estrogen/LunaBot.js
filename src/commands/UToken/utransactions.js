const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('utransactions')
        .setDescription('See transactions based on your filters')

        .setDefaultPermission(false),

    async execute(i, bot) {
        return i.reply("not implemented");
    }
}