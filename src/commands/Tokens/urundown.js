const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const moment = require('moment');
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');
const { Transaction } = require('mongodb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('urundown')
        .setDescription('Give a rundown for all transactions')
        .addNumberOption(option => option.setName('timeframe').setDescription('Show the last x months').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {

        const color = '#cfa3ff';

        const timeframe = i.options.getNumber('timeframe');
        const monthDate = new Date(Date.now() - timeframe * 30 * 86400 * 1000); 

        

        const allTransactions = await wallet.find({}).exec();
        let recruiterAmount = 0;
        let treasuryAmount = 0;
        let decoratorAmount = 0;
        let farmerAmount = 0;
        let designerAmount = 0;
        let eventAmount = 0;
        let shopAmount = 0;
        let otherAmount = 0;
        allTransactions.forEach(transaction => {
            const { userID, transactions } = transaction;
            transactions.forEach(t => {
                if (monthDate < new Date(t.date)){
                        switch(t.identifier){
                            case 'Recruiter':
                                recruiterAmount += t.amount;
                                break;
                            case 'Treasury':
                                treasuryAmount += t.amount;
                                break;
                            case 'Farmer':
                                farmerAmount += t.amount;
                                break;
                            case 'Decorator':
                                decoratorAmount += t.amount;
                                break;
                            case 'Designer':
                                designerAmount += t.amount;
                                break;
                            case 'Events':
                                eventAmount += t.amount;
                                break;
                            case 'Shop':
                                shopAmount += t.amount;
                                break;
                            case 'Other':
                                otherAmount += t.amount;
                                break;
                            default:

                        }
                    }
            });
        });


        const embed = new EmbedBuilder()
        .setTitle(`Rundown since ${monthDate.toISOString().slice(0, 10)}`)
        .setColor(color)
        .addFields(
            { name: 'Recruit', value: `${recruiterAmount.toFixed(2)}`, inline: true},
            { name: 'Treasury', value: `${treasuryAmount.toFixed(2)}`, inline: true},
            { name: 'Farm', value: `${farmerAmount.toFixed(2)}`, inline: true},
            { name: 'Design', value: `${designerAmount.toFixed(2)}`, inline: true},
            { name: 'Decorate', value: `${decoratorAmount.toFixed(2)}`, inline: true},
            { name: 'Event', value: `${eventAmount.toFixed(2)}`, inline: true},
            { name: 'Shop', value: `${shopAmount.toFixed(2)}`, inline: true},
            { name: 'Other', value: `${otherAmount.toFixed(2)}`, inline: true},
            { name: 'Circulation', value: `${(recruiterAmount + treasuryAmount + designerAmount + farmerAmount + decoratorAmount+ eventAmount).toFixed(2)}`, inline: true}

        )
        
        await i.reply({ embeds: [embed] });
        
    }
}