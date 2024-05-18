const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const wallet = require('../../models/dbv2/tokens_universal');
const getWallet = require('../../functions/funcWallet.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uaudit')
        .setDescription('Update user wallets')
        .addUserOption(option => option.setName('user').setDescription('User to update').setRequired(true))
        .addStringOption(option => 
            option.setName('mode')
            .setDescription('Add or remove')
            .setRequired(true)
            .addChoices(
                {name: 'Add', value: 'add'},
                {name: 'Remove', value: 'remove'},
            ))
        .addStringOption(option => 
            option.setName('identifier')
            .setDescription('Where is this transaction coming from')
            .setRequired(true)
            .addChoices(
                {name: 'Treasury', value: 'Treasury'},
                {name: 'Recruiter', value: 'Recruiter'},
                {name: 'Decorator', value: 'Decorator'},
                {name: 'Farmer', value: 'Farmer'},
                {name: 'Designer', value: 'Designer'},
                {name: 'Events', value: 'Events'},
                {name: 'Shop Purchase', value: 'Shop'},
                {name: 'Other', value: 'Other'},
            ))
        .addStringOption(option => option.setName('amount').setDescription('Amount to change').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for audit').setRequired(true))
        .setDefaultPermission(false),


    async execute(i, bot) {

        if(!permission(i.member, "Manager")){
            return i.reply({ content: 'You do not have permission to do this', ephemeral: true});
        }
        const mode = i.options.getString('mode');
        const user = i.options.getUser('user');

        let amount = mode !== 'log' ? i.options.getString('amount') : null;
        amount = amount ? parseFloat(amount) : null;

        var userWallet = await getWallet(i, user.id);
    
        if (mode === 'add') {
            userWallet.tokens += amount;
            userWallet.transactions.push({
                date: i.createdAt,
                identifier: i.options.getString('identifier'),
                desc: `Audit: ${i.options.getString('reason')}-${i.member.user.username}(${i.member.id})`,
                amount: amount
            });
        } 
        else {
            userWallet.tokens -= amount;
            userWallet.transactions.push({
                date: i.createdAt,
                identifier: i.options.getString('identifier'),
                desc: `Audit: ${i.options.getString('reason')}-${i.member.user.username}(${i.member.id})`,
                amount: -amount
            });
        }
    
        await userWallet.save();
        i.reply({content: `${mode === 'add' ? 'Added' : 'Removed'} ${amount} to the user's balance!`,ephemeral: true});
    }
}