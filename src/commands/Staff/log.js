const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('../../../config.json');
const recruits = require('../../models/recruitment/recruit');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log')
        .setDescription('Allows you to see who invited someone, when they joined, etc')
        .addUserOption(option => option.setName('user').setDescription('Mentioned user').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id)))
            return i.reply({ content: "You're not staff!", ephemeral: true});

        const user = i.options.getUser('user');
        const data = await recruits.findOne({ userID: user.id });
        if (!data)
            return i.reply({ content: 'Unable to find member in database.', ephemeral: true });

        const clan = i.guild.roles.cache.find(r => r.id === data.kingdom);
        const embed = new EmbedBuilder()
            .setColor(clan.hexColor || '#ffb347')
            .addFields([
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'Kingdom', value: `${clan.name}`, inline: true },
                { name: 'Recruiter', value: `<@${data.recruiter}>`, inline: true },
                { name: 'Clan Join Date', value: `<t:${data.clanJoin}>`, inline: true },
                { name: 'Server Join Date', value: `<t:${data.serverJoin}>`, inline: true },
            ])
        await i.reply({ embeds: [embed] });
    },

};