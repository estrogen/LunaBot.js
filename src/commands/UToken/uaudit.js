const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');

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
                {name: 'Treasury', value: 'treasury'},
                {name: 'Recruiter', value: 'recruiter'},
                {name: 'Decorator', value: 'decorator'},
                {name: 'Farmer', value: 'farmer'},
                {name: 'Events', value: 'events'},
                {name: 'Other', value: 'other'},
            ))
        .addStringOption(option => option.setName('amount').setDescription('Amount to change').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for audit').setRequired(true))
        .setDefaultPermission(false),


    async execute(i, bot) {

        const mode = i.options.getString('mode');
        const user = i.options.getUser('user');

        let amount = mode !== 'log' ? i.options.getString('amount') : null;
        amount = amount ? parseFloat(amount) : null;

        const userWallet = await wallet.findOne({ userID: user.id });
    
        if (!userWallet) {
            userWallet = new wallet({
                userID: user.id,
                tokens: 0,
                transactions: 
                    {date: i.createdAt,
                    identifier: 'Initialization',
                    desc: "Initialized Wallet",
                    amount: 0}
            });
        }
    
        if (mode === 'add') {
            userWallet.tokens += amount;
            userWallet.transactions.push({
                date: i.createdAt,
                identifier: i.options.getString('identifier'),
                desc: `Audit: ${i.member.user.username}(${i.member.id}) - ${i.options.getString('reason')}`,
                amount: amount
            });
        } 
        else {
            userWallet.tokens -= amount;
            userWallet.transactions.push({
                date: i.createdAt,
                identifier: i.options.getString('identifier'),
                desc: `Audit: ${i.member.user.username}(${i.member.id}) - ${i.options.getString('reason')}`,
                amount: -amount
            });
        }
    
        await userWallet.save();
        i.reply({content: `${mode === 'add' ? 'Added' : 'Removed'} ${amount} to the user's balance!`,ephemeral: true});
    }
}