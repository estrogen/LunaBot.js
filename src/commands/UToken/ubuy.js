const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const shop = require('../../models/dbv2/tokens_ushop');
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');
const buylogchannel =  "1193512882944610335";


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ubuy')
        .setDescription('Buy from the Kingdoms shop')
        .addStringOption(option => 
            option.setName('item')
                .setDescription('Item you want to buy')
                .setRequired(true)
                .setAutocomplete(false))
        .addNumberOption(option => option.setName('quantity').setDescription('Amount you want to buy').setRequired(true))
        .setDefaultPermission(false),


    async execute(i, bot) {
        const itemInput = i.options.getString('item');
        const shopItem = await shop.findOne({name: itemInput});
        const restriction = shopItem.restriction;
        const price = shopItem.price;
        const quantity = i.options.getNumber('quantity');
        const userWallet = await wallet.findOne({ userID: i.member.id });
        const total = price*quantity;

        if (quantity <= 0) {
            return await i.reply({ content: "Can't purchase a negative or zero amount of an item.", ephemeral: true });
        }
        if (!shopItem) {
            return await i.reply({ content: "The item you're trying to purchase doesn't exist.", ephemeral: true });
        }
        if (userWallet.tokens < total){
            return await i.reply({ content: "You don't have enough tokens to purchase this item", ephemeral: true });
        }

        userWallet.tokens -= total;
        userWallet.transactions.push({
            date: i.createdAt,
            identifier: "Shop",
            desc: `Shop Buy: ${quantity}x ${shopItem.name}`,
            amount: total
        });
        await userWallet.save();

        const embed = new EmbedBuilder()
            .setTitle(`Purchase Confirmation for ${shopItem.name}`)
            .setDescription(`**Amount**: ${quantity}\n**Total Cost**: ${shopItem.price * quantity} tokens\n**New Balance**: ${userWallet.tokens} tokens`)
            .setColor("#cfa3ff")
            .setThumbnail(i.member.user.avatarURL({ dynamic: true, format: "png", size: 4096 }))
            .setTimestamp();

        await i.reply({ embeds: [embed], ephemeral: true });

        const logChannel = i.guild.channels.cache.get(buylogchannel);
        await logChannel.send({ content: `New purchase by <@${i.member.id}>`, embeds: [embed] });
    }
}