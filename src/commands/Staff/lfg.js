const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const users = require('../../models/dbv2/usersSchema');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lfg')
        .setDescription('sets up a looking for group embed')
        .addStringOption(option => 
            option.setName('type')
            .setDescription('Which type of run this will be')
            .setRequired(true)
            .addChoices(
                {name: 'Treasury', value: 'treasury'},
                {name: 'Bois', value: 'boys'},
                {name: 'Farmer', value: 'farmer'}
            ))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id))){
            return i.reply({ content: "You're not a staff!", ephemeral: true});
        }

        
    }
}
