const { SlashCommandBuilder } = require('discord.js');

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
        if(!i.member.roles.cache.has("575433746296209418")) 
            return i.reply({ content: "You're not ally", ephemeral: true});

        bot.user.setPresence({
            activities: [{
                type: ActivityType.Custom,
                name: "custom", // name is exposed through the API but not shown in the client for ActivityType.Custom
                state: `${i.options.getString('status')}`
            }],
            status: "online"
        })
    },

    rolePerms: ["575433746296209418"],
};