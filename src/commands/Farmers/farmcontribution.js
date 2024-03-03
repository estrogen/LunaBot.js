const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('farmercontribution')
        .setDescription('Null')
        .setDefaultPermission(false),

    async execute(i, bot) {
        return i.reply("not implemented");
    }
}