const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('../../../config.json');
const recruits = require('../../models/dbv2/wf_recruitData');
const users = require('../../models/dbv2/usersSchema');
const moment = require('moment');
const permission = require('../../functions/funcPermissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log')
        .setDescription('Allows you to see who invited someone, when they joined, etc')
        .addUserOption(option => option.setName('user').setDescription('Mentioned user').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!permission(i.member, "Staff"))
            return i.reply({ content: "You're not staff!", ephemeral: true});

        const user = i.options.getUser('user');
        const recruitData = await recruits.findOne({ userID: user.id });
        const userData = await users.findOne({ userID: user.id });

        if (!recruitData || !userData)
            return i.reply({ content: 'Unable to find member in database.', ephemeral: true });

        const clan = i.guild.roles.cache.find(r => r.id === recruitData.kingdom);
        const joinDateUnix = moment(recruitData.joinDate).unix();
        const previousIGNs = userData.wfPastIGN.length > 0 ? userData.wfPastIGN.join('\n') : 'None';

        const embed = new EmbedBuilder()
            .setColor(clan ? clan.hexColor || '#cfa3ff' : '#cfa3ff')
            .addFields([
                { name: 'User', value: `<@${user.id}> (${userData.wfIGN || 'Unknown'})`, inline: true },
                { name: 'Kingdom', value: `${clan ? clan.name || 'Unknown' : 'Unknown'}`, inline: true },
                { name: 'Recruiter', value: `<@${recruitData.recruiter}>`, inline: true },
                { name: 'Clan Join Date', value: `<t:${joinDateUnix}>`, inline: true },
                { name: 'Previous IGNs', value: `\`\`\`haskell\n${previousIGNs}\`\`\``, inline: false }
            ]);
        if(userData.otherIGN != null){
            const otherIGNs = userData.otherIGN.length > 0 ? userData.otherIGN.join('\n') : 'None';
            embed.addFields([{ name: 'Other IGNs', value:`\`\`\`haskell\n${otherIGNs}\`\`\``, inline: false}])
        }

        await i.reply({ embeds: [embed] });
    },

};