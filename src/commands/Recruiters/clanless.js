const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const users = require('../../models/dbv2/usersSchema');
const cc = require('../../../config.json');
const moment = require('moment');
const permission = require('../../functions/funcPermissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clanless')
        .setDescription('Set a user to clanless')
        .addStringOption(option => option.setName('ign').setDescription('Users IGN').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!permission(i.member, "Recruiter")){
            return i.reply({ content: "You're not a recruiter!", ephemeral: true});
        }

        const inactive = await i.guild.channels.cache.get(cc.Channels.Inactive);
        const target = i.options.getString('ign');
        var user = "";
        var newIGN = false;

        let userTarget = await users.findOne({ wfIGN: { $regex: target , $options: 'i' } });


        //Check if name listed in DB
        if(userTarget != null){
            user = await i.guild.members.fetch(userTarget.userID)
        }

        //Check if nickname alligns
        if(user == ""){
            const members = await i.guild.members.fetch();
            userTarget = members.find(m => m.nickname && m.nickname.toLowerCase() == target.toLowerCase());
            if(userTarget != null){
                user = userTarget;
                //Push found IGN
                newIGN = true;
                let userData = await users.findOne({ userID: user.id });
                if(userData.wfIGN != ""){
                    userData.wfPastIGN.push(userData.wfIGN);
                }
                userData.wfIGN = target;
                await userData.save();
            }
        } 
        //check if global name alligns
        if(user == ""){
            const members = await i.guild.members.fetch();
            userTarget = members.find(m => m.globalName && m.globalName.toLowerCase() == target.toLowerCase());
            if(userTarget != null){
                user = userTarget;
                //Push found IGN
                newIGN = true;
                let userData = await users.findOne({ userID: user.id });
                if(userData.wfIGN != ""){
                    userData.wfPastIGN.push(userData.wfIGN);
                }
                userData.wfIGN = target;
                await userData.save();
            }
        } 

        //Check if their username alligns
        if(user == ""){
            const members = await i.guild.members.fetch();
            userTarget = members.find(m => m.username && m.username.toLowerCase() == target.toLowerCase());
            if(userTarget != null){
                user = userTarget;
                //Push found IGN
                newIGN = true;
                let userData = await users.findOne({ userID: user.id });
                if(userData.wfIGN != ""){
                    userData.wfPastIGN.push(userData.wfIGN);
                }
                userData.wfIGN = target;
                await userData.save();
            }
        }

        if(user == ""){
            return i.reply({content: `Could not find user ${target}, may not be in discord`})
        }


        await user.roles.add(cc.Roles.Identifier.Clanless, `Set Clanless by ${i.user.tag}`);
        await user.roles.remove(cc.Roles.DegenShop, `Lost through Clanless by ${i.user.tag}`);
        await inactive.send({ 
            content: `**Inactivity Notification**\n<@${user.id}> you have crossed the inactivity threshold, to rejoin the clan please see <#${cc.Channels.ClanHelp}>`});
        if(newIGN == false){
            await i.reply({content: `<@${user.id}> (${target}) has been marked clanless and notified`, ephemeral: true});
        }
        else{
            await i.reply({content: `<@${user.id}> (${target}) has been marked clanless, notified, and IGN was updated`, ephemeral: true});
        }
        

    }
}