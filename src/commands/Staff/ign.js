const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const users = require('../../models/dbv2/usersSchema');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ign')
        .setDescription('get or update the ign of a clan member')
        .addUserOption(option => option.setName('user').setDescription('Warframe Player').setRequired(true))
        .addStringOption(option => option.setName('ign').setDescription('Updated IGN').setRequired(true))
        .addStringOption(option => option.setName('nickname').setDescription('Update Users Nickname').setRequired(false)
            .addChoices(
                {name: 'True', value: '1'},
                {name: 'False', value: '0'}
                ))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id))){
            return i.reply({ content: "You're not a staff!", ephemeral: true});
        }

        const user = i.options.getUser('user');
        const ign = i.options.getString('ign');

        const member = await i.guild.members.fetch(user);
        if (!member){ 
            return i.reply({ content: 'Unable to find member.', ephemeral: true });
        }
       
        if(i.options.getString('nickname') == 1){
            await member.setNickname(ign, `In game name updated by ${i.user.tag}`);
        }
        
        let userData = await users.findOne({ userID: member.id });
        if(!userData){
            return i.reply({ content: "This user hasn't been recruited", ephemeral: true});
        }
        if(userData.wfIGN != ""){
            userData.wfPastIGN.push(userData.wfIGN);
        }
        userData.wfIGN = ign;
        await userData.save();
        
        await i.reply({ content: `User: ${user} had their ign updated to (${ign})`, ephemeral: true});
    }
}
