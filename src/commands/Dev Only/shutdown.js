const { SlashCommandBuilder } = require('discord.js');
const recruits = require('../../models/recruitment/recruit');
const moment = require("moment");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restarts the bot (Dev Only)')
        .setDefaultPermission(false),
   
    async execute(i, bot) {
        if(!i.member.id === '640629972817543195') 
            return i.reply({ content: "You're not ally", ephemeral: true});

        i.reply({ content: "Restarting bot..." })
        bot.destroy();
    },

    rolePerms: ["575433746296209418"],
};