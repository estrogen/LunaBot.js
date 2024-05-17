const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const data = require('../../models/dbv2/wf_migrationdata.js');
const permission = require('../../functions/funcPermissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('migration')
        .setDescription('Add raw values to a users deptprogress')
        .addUserOption(option => option.setName('user').setDescription('User to update').setRequired(true))
        .addStringOption(option => 
            option.setName('identifier')
            .setDescription('What type of data are we migrating')
            .setRequired(true)
            .addChoices(
                {name: 'Runner', value: 'run'},
                {name: 'Radder', value: 'rad'},
                {name: 'Merchant', value: 'merch'},
                {name: 'Farmer', value: 'farm'},
            ))
        .addNumberOption(option => option.setName('amount').setDescription('Amount to change').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {

        if(!permission(i.member, "Manager")){return i.reply({ content: "You're not a recruiter!", ephemeral: true});}
            
        const identifier = i.options.getString('identifier');
        const user = i.options.getUser('user');
        let amount = i.options.getNumber('amount');

        let userData = await data.findOne({userID: user.id});

        if (!userData) {
            userData = new data({
                userID: user.id,
                farmer: 0,
                runner: 0,
                radder: 0,
                merchant: 0
            });
            
        }
        if(identifier == 'run'){
            userData.runner += amount;
        }
        if(identifier == 'rad'){
            userData.radder += amount;
        }
        if(identifier == 'merch'){
            userData.merchant += amount;
        }
        if(identifier == 'farm'){
            userData.farmer += amount;
        }
        await userData.save();
        i.reply({content: `Added ${amount} to the user's ${identifier} progress!`,ephemeral: true});
    }
}
