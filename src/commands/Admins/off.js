const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const off = require('../../models/moderation/stfu');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('off')
        .setDescription('Allows you to turn off a user.')
        .addStringOption(option => 
            option.setName('id')
            .setDescription('User you want to turn off.')
            .setRequired(true))
        .setDefaultPermission(false),
   
    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Admin.includes(r.id)))
            return i.reply({ content: "You're not a admin", ephemeral: true});

        const target = i.options.getString('id');
        const member = await i.guild.members.fetch(target);
        if (!member)
            return i.reply({ content: "User doesn't exist", ephemeral: true});

        const stfu = await off.findOne({ userID: member.id });
        if (!stfu) {
            if (member.voice.channel) member.voice.disconnect("User got off'd");
            const data = new off({ userID: member.id, guildID: i.guild.id });
            data.save();
            await i.reply({ content: "User has been offed.", ephemeral: true });
        } else {
            await i.reply({ content: "User has been turned back on.", ephemeral: true });
            stfu.deleteOne();
        }
    },
};