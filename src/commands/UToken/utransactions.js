const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const moment = require('moment');
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');
const { Transaction } = require('mongodb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('utransactions')
        .setDescription('See transactions based on your filters')
        .addUserOption(option => option.setName('user').setDescription('Filter by user').setRequired(false))
        .addStringOption(option => option.setName('identifier')
            .setDescription('Filter by identifier')
            .setRequired(false)
            .addChoices(
                {name: 'Treasury Audit', value: 'Treasury'},
                {name: 'Recruiter Audit', value: 'Recruiter'},
                {name: 'Decorator Audit', value: 'Decorator'},
                {name: 'Farmer Audit', value: 'Farmer'},
                {name: 'Designer Audit', value: 'Designer'},
                {name: 'Events Audit', value: 'Events'},
                {name: 'Shop Purchases', value: 'Shop'},
                {name: 'Other', value: 'Other'},
            ))
        .addNumberOption(option => option.setName('timeframe').setDescription('Filter with the last x days').setRequired(false))
        .addBooleanOption(option => option.setName('csv').setDescription('Get Output as a CSV').setRequired(false))
        .setDefaultPermission(false),

    async execute(i, bot) {

        const color = '#cfa3ff';

        const filterIdentifier = i.options.getString('identifier');
        const filterUser = i.options.getUser('user');
        const timeframe = i.options.getNumber('timeframe');

        const days = i.options.getInteger('days');
        const startDate = new Date(Date.now() - timeframe * 86400 * 1000); 

        

        const allTransactions = await wallet.find({}).exec();
        let output = 'userID | date | identifier | desc | amount\n';
        allTransactions.forEach(transaction => {
            const { userID, transactions } = transaction;
            transactions.forEach(t => {
                if((filterIdentifier == null || filterIdentifier == t.identifier) && 
                (filterUser == null || filterUser.id == userID) &&
                (timeframe == null || startDate < new Date(t.date))){
                    const formattedDate = t.date.toISOString().slice(0, 10);
                    const formattedDesc = t.desc.replace(/\(\d+\)/g, '');
                    output += `${userID} | ${formattedDate} | ${t.identifier} | ${formattedDesc} | ${t.amount}\n`;
                }
            });
        });

        if(i.options.getBoolean('csv')){
            const attachment = new AttachmentBuilder(Buffer.from(output, 'utf-8'), { name: 'TransactionData.csv' });
            await i.reply({ files: [attachment]});
        }
        else{
            if(output.length > 1024){
                return await i.reply({ content: "Too many transactions. Try using CSV format", ephemeral: true });
            }
            const embed = new EmbedBuilder()
            .setTitle(`Transactions Logs`)
            .setColor(color)
            .addFields(
                { name: 'Identifier', value: `${filterIdentifier}`, inline: true },
                { name: 'User', value: `${filterUser}`, inline: true },
                { name: 'Start Date', value: `${startDate.toISOString().slice(0, 10)}`, inline: true },
                { name: 'Transactions', value: `\`\`\`haskell\n${output}\`\`\``, inline: false},);
            
    
            await i.reply({ embeds: [embed] });
        }
        
    }
}