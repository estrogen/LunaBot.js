const { SlashCommandBuilder, ActivityType } = require('discord.js');
const cc = require('../../../config.json');
const permission = require('../../functions/funcPermissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('sets the bots status')
        .addStringOption(option => 
            option.setName('status')
            .setDescription('status you want.')
            .setRequired(true))
        .setDefaultPermission(false),
   
    async execute(i, bot) {
        if(permission(i.member, "Admin"))
            return i.reply({ content: "You're not a admin", ephemeral: true});

        const status = i.options.getString('status');

        bot.user.setPresence({
            activities: [{
                type: ActivityType.Custom,
                name: "custom",
                state: `${status}`
            }],
            status: "online"
        })
        await i.reply({ content: `Status has been changed to ${status}` });
    },
};