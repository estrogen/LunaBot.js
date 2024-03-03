const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const shop = require('../../models/dbv2/tokens_ushop');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shoptool')
        .setDescription('Null')
        .addStringOption(option => option.setName('name').setDescription('name').setRequired(true))
        .addNumberOption(option => option.setName('price').setDescription('price').setRequired(true))
        .addStringOption(option => 
            option.setName('restriction')
            .setDescription('restriction')
            .setRequired(false)
            .addChoices(
                {name: 'Treasurer', value: 'Treasurer'},
                {name: 'Recruiter', value: 'Recruiter'},
                {name: 'Decorator', value: 'Decorator'},
                {name: 'Farmer', value: 'Farmer'},
                {name: 'Designer', value: 'Designer'},
                {name: 'Staff', value: 'Staff'},
                {name: 'Merchant', value: 'Merchant'},
                {name: 'Clan Member', value: 'Clan Member'}
            ))
        .addStringOption(option => option.setName('modifier').setDescription('modifiers').setRequired(false)
            .addChoices(
                {name: 'TF', value: "tf"},
                {name: 'RD', value: "rd"}
            ))
        .setDefaultPermission(false),

    async execute(i, bot) {

        const itemName = i.options.getString('name');
        const itemPrice = i.options.getNumber('price');
        const itemRestrictions = i.options.getString('restriction');
        const modInput = i.options.getString('modifier')
        var itemModifier = [];
        if(modInput === "tf"){
            itemModifier = ["Treasurer", "Farmer"];
        }
        if(modInput === "rd"){
            itemModifier = ["Recruiter", "Decorator"];
        }

        const shopItem = new shop({
            name: itemName,
            price: itemPrice,
            restriction: itemRestrictions,
            modifier: itemModifier
        });
        await shopItem.save();
        return i.reply("done");
    }
}