const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const users = require('../../models/dbv2/usersSchema');
const cc = require('../../../config.json');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clantag')
        .setDescription('Give user the clantag role')
        .addUserOption(option => option.setName('user').setDescription('Warframe Player').setRequired(true))
        .addStringOption(option => option.setName('ign').setDescription('Updated IGN').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {

        
        const user = i.options.getUser('user');
        const ign = i.options.getString('ign');
        const member = await i.guild.members.fetch(user);
        let userData = await users.findOne({ userID: member.id });
        const color = '#ffb347';

        if(!userData){

            return i.reply({ content: "This user hasn't been recruited", ephemeral: true});
        }


        if(i.user.id != user && (!i.member.roles.cache.some(r => cc.Roles.Management.includes(r.id)))){
            return i.reply({ content: "You're not permitted to add clan tags!", ephemeral: true});
        }   
        if (!member){ 
            return i.reply({ content: 'Unable to find member.', ephemeral: true });
        }
        

        if(userData.wfIGN != ""){
            userData.wfPastIGN.push(userData.wfIGN);
        }
        userData.wfIGN = ign;
        await member.roles.add('890240560131104806', `Given clan tag by ${i.user.tag}`);
        await userData.save();
        
        await i.reply({ content: `${user} had their ign updated and clan tag added`, ephemeral: true});
    }
}
