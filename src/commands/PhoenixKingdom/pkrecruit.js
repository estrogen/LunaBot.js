const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('../../../config.json');
const users = require('../../models/dbv2/usersSchema');
const moment = require("moment");
const permission = require('../../functions/funcPermissions.js');
const recruit = require('../../models/dbv2/wf_recruitData');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('pkrecruit')
        .setDescription('Recruit people into phoenix kingdom')
        .addUserOption(option => option.setName('user').setDescription('Player').setRequired(true))
        .addStringOption(option => option.setName('name').setDescription('Username').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        const user = i.options.getUser('user');
        const name = i.options.getString('name');

        const member = await i.guild.members.fetch(user.id);
        if(!permission(i.member, "Manager")){
            return i.reply({ content: 'You do not have permission to do this', ephemeral: true});
        }
        if (!member) 
            return i.reply({ content: 'Unable to find member.', ephemeral: true });

        const general = await i.guild.channels.cache.get(cc.Channels.General);
        var newmember = false;
        if(member.roles.cache.some(r => Object.values(cc.Roles.Identifier).includes(r.id))){
            newmember = true;
            await member.roles.remove(Object.values(cc.Roles.Identifier), `Recruited to PK by ${i.user.tag}`);
        }
        if(newmember){
            await member.setNickname(name, `Recruited to PK by ${i.user.tag}`);
            await member.roles.add(cc.Roles.Identifier.Guest, `Recruited into PK by ${i.user.tag}`);
        }
        
        await member.roles.add(cc.Roles.PhoenixK, `Recruited into PK by ${i.user.tag}`);

        let recruitData = await recruit.findOne({ userID: member.id });
        let userData = await users.findOne({ userID: member.id });
        if (!recruitData) {
            //Create User Data on Recruit
            recruitData = new recruit({
                userID: member.id,
                recruiter: i.user.id,
                joinDate: i.createdAt,
                kingdom: "Phoenix Kingdom"
            });
            await recruitData.save();

            userData = new users({
                userID: member.id, 
                serverJoinDate: member.joinedAt,
                wfIGN: `${name}`,
                wfPastIGN: [],
                otherIGN: []
            });
            await userData.save();
            const wEmbed = new EmbedBuilder()
                .setColor('#ee6958')
                .setTitle(`Welcome to Phoenix Kingdom, ${name}`)
                .setDescription(`<@!${member.id}>, `)
                .setFooter({ text: `Recruited by ${i.user.username}` });
            const welcome = await general.send({ content: `Incoming recruit... <@!${member.id}>`});
            await welcome.edit({ content: "\u200B", embeds: [wEmbed] });
        }

        userData.otherIGN.push(`${cc.Other.PKGame} - ${name}`);
        await userData.save();
        return i.reply({ content: `PK Verified By: <@${i.user.id}>\nRecruit: <@${member.id}> (${name})`});
    },

};
