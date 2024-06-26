const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const shop = require('../../models/dbv2/tokens_ushop');
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');
const getWallet = require('../../functions/funcWallet.js');

const restrictionID= {
    "Treasurer": cc.Roles.Staff.Treasurer,
    "Recruiter": cc.Roles.Staff.Recruiter,
    "Designer": cc.Roles.Staff.Designer,
    "Decorator": cc.Roles.Staff.Decorator,
    "Farmer": cc.Roles.Staff.Farmer,
    "Staff": Object.values(cc.Roles.Staff),
    "Merchant": cc.Roles.TreasuryMerchant,
    "Clan Member": Object.values(cc.Roles.Clan)
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ubuy')
        .setDescription('Buy from the Kingdoms shop')
        .addStringOption(option => 
            option.setName('item')
                .setDescription('Item you want to buy')
                .setRequired(true)
                .setAutocomplete(true))
        .addNumberOption(option => option.setName('quantity').setDescription('Amount you want to buy').setRequired(true))
        .addStringOption(option => option.setName('info').setDescription('Any Additional Notes').setRequired(false))
        .setDefaultPermission(false),
    async autocomplete(i, bot) {
        const focusedOption = i.options.getFocused(true);

        if (focusedOption.name === 'item') {

            const focusedValue = focusedOption.value.toLowerCase();
            let items = [];
            try {
                const store = await shop.find();
                if (store && store.length > 0) {
                    items = store
                        .filter(store => 
                            store.name.toLowerCase().includes(focusedValue) &&
                            (store.restriction == null || i.member.roles.cache.some(r => Object.values(restrictionID[store.restriction]).includes(r.id)))
                        )
                        .slice(0, 25)
                        .map(store => ({name: store.name, value: store.name}));
                    }
            } catch (error) {
                console.error(`Error fetching items from shop`, error);
            }

            await i.respond(items);
        }
    },


    async execute(i, bot) {
        const itemInput = i.options.getString('item');
        const shopItem = await shop.findOne({name: itemInput});
        if(!shopItem){
            return i.reply({ content: "This item doesn't exist", ephemeral: true});
        }
        const quantity = i.options.getNumber('quantity');
        const userWallet = await getWallet(i, i.member.id);
        const info = i.options.getString('info');
        const restriction = restrictionID[shopItem.restriction];


        var rate = 1;
        for(const modifiers of shopItem.modifier){
            if(i.member.roles.cache.some(r => r.id === restrictionID[modifiers])){
                rate = 0.80;
            }
        }
        const price = Math.ceil(shopItem.price * rate / 5) * 5;
        const total = price*quantity;

        if (quantity <= 0) {
            return await i.reply({ content: "Can't purchase a negative or zero amount of an item.", ephemeral: true });
        }
        if (!shopItem) {
            return await i.reply({ content: "The item you're trying to purchase doesn't exist.", ephemeral: true });
        }
        if (userWallet.tokens < total){
            return await i.reply({ content: "You don't have enough tokens to purchase this item.", ephemeral: true });
        }
        if (!(shopItem.restriction == null || i.member.roles.cache.some(r => Object.values(restriction.includes(r.id))))){
            return await i.reply({ content: `You are not allowed to purchase this item - requires ${shopItem.restriction}`, ephemeral: true });
        }
        if(itemInput == "6x Axi Fodder" && quantity > 2){
            return await i.reply({ content: "You can only purchase a maximum of 2 of this item at a time.", ephemeral: true});
        }

        userWallet.tokens -= total;
        userWallet.transactions.push({
            date: i.createdAt,
            identifier: "Shop",
            desc: `Shop Buy: ${quantity}x ${shopItem.name} - ${info}`,
            amount: -total
        });
        await userWallet.save();

        var title = null
        if(shopItem.restirction != null){
            title = `Purchase Confirmation for ${shopItem.name} (${shopItem.restriction})`;
        }
        else{
            title = `Purchase Confirmation for ${shopItem.name}`;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`**Amount:** ${quantity}\n**Total Cost:** ${total} tokens\n**New Balance:** ${userWallet.tokens} tokens\n**Notes:** ${info}`)
            .setColor("#cfa3ff")
            .setThumbnail(i.member.user.avatarURL({ dynamic: true, format: "png", size: 4096 }))
            .setTimestamp();

        await i.reply({ embeds: [embed], ephemeral: true });

        const logChannel = i.guild.channels.cache.get(cc.Channels.BuyLog);
        await logChannel.send({ content: `New purchase by <@${i.member.id}>`, embeds: [embed] });
    }
}