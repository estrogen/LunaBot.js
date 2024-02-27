const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('udeptprogress')
        .setDescription('Null')
        .setDefaultPermission(false),

    async execute(i, bot) {
        return i.reply("not implemented");
    }
}