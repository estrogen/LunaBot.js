const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const shop = require('../../models/dbv2/tokens_shop');
const orders = require('../../models/dbv2/wf_degenOrders');
const cc = require('../../../config.json');
const moment = require("moment");

const walletByDepartment = {
    recruiter: require('../../models/dbv2/tokens_recruit'),
    treasury: require('../../models/dbv2/tokens_treasure'),
    designer: require('../../models/dbv2/tokens_design'),
    decorator: require('../../models/dbv2/tokens_deco')
};

const managerByDepartment = {
    treasury: '890240560496017476',
    recruiter: '890240560542134274',
    designer: '890240560496017477',
    decorator: '890240560542134272'
}

// Configurable channel IDs for purchases and logs
const degenChannelId = "1193672601579565157"; // Channel for 'degen' purchases
const degenLogChannelId = "890240568339341341"; // Log channel for 'degen' purchase announcements
const purchaseLogChannelIds = { // Log channels for each department's purchase announcements
    default: "1193512882944610335", // Default channel ID for other purchases
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Allows you to purchase items from department shops')
        .addStringOption(option => 
            option.setName('department')
            .setDescription('Which shop you want to purchase from.')
            .setRequired(true)
            .addChoices(
                {name: 'Recruiter', value: 'recruiter'},
                {name: 'Treasury', value: 'treasury'},
                {name: 'Designer', value: 'designer'},
                {name: 'Degen', value: 'degen'},
                {name: 'Decorator', value: 'decorator'}
            ))
        .addStringOption(option => 
            option.setName('item')
                .setDescription('Item you want to buy')
                .setRequired(true)
                .setAutocomplete(true))
        .addNumberOption(option => option.setName('amount').setDescription('Amount you want to buy').setRequired(true)),
    async autocomplete(i, bot) {
        const focusedOption = i.options.getFocused(true);

        if (focusedOption.name === 'item') {
            const department = i.options.getString('department');
            if (!department) {
                return await i.respond([]);
            }

            const focusedValue = focusedOption.value.toLowerCase();
            let items = [];
            
            try {
                const store = await shop.findOne({ "team": department });
                if (store && store.items && store.items.length > 0) {
                    items = store.items
                        .filter(item => item.name.toLowerCase().startsWith(focusedValue))
                        .slice(0, 25)
                        .map(item => ({ name: item.name, value: item.name })); 
                }
            } catch (error) {
                console.error(`Error fetching items for department ${department}:`, error);
            }

            await i.respond(items);
        }
    },
    async execute(i, bot) {
        const department = i.options.getString('department');
        const itemName = i.options.getString('item');
        const amount = i.options.getNumber('amount');

        if (amount <= 0) {
            return await i.reply({ content: "Can't purchase a negative or zero amount of an item.", ephemeral: true });
        }

        if (department !== "degen" && !i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id))) {
            return await i.reply({ content: "You're not authorized to make purchases from this department.", ephemeral: true });
        }

        const storeItem = await findItemInShop(department, itemName);

        if (!storeItem) {
            return await i.reply({ content: "The item you're trying to purchase doesn't exist.", ephemeral: true });
        }

        if (department === "degen") {
            if(amount > 1){
                return await interaction.reply({ content: "You can only purchase one 'degen' item at a time.", ephemeral: true });
            }
            await handleDegenPurchase(i, itemName, storeItem.store, storeItem.item);
        } else {
            await handleRegularPurchase(i, department, itemName, amount, storeItem.item);
        }
    },
};

async function findItemInShop(department, itemName) {
    const normalizedItemName = department === "degen" ? itemName.toLowerCase() : itemName; 
    const store = await shop.findOne({ "team": department, "items.name": normalizedItemName });
    if (!store) return null;
    const itemIndex = store.items.findIndex(item => item.name === normalizedItemName);
    if (itemIndex === -1) return null;
    return { store, item: store.items[itemIndex] };
}

async function handleDegenPurchase(interaction, itemName, store, item) {
    if (interaction.channel.id !== degenChannelId) {
        return await interaction.reply({ content: "You can only purchase 'degen' items in the specified 'degen' channel.", ephemeral: true });
    }

    if (item.price === 0) {
        return await interaction.reply({ content: "This item is currently out of stock!", ephemeral: true });
    }
    

    const data = await shop.findOne({ _id: store._id, "items.name": itemName });
    if (!data)
        return await interaction.reply({ content: "Error: Item not found in the store.", ephemeral: true });

    const userOrderHistory = await orders.find({ userID: interaction.user.id });
    let hasOrderedBefore = false;
    let hasPendingOrder = false;
    if (userOrderHistory.length > 0) {
        userOrderHistory.forEach(order => {
            if (order.part === itemName) {
                if (!order.fulfilled) {
                    hasPendingOrder = true;
                } else {
                    hasOrderedBefore = true;
                }
            }
        });
    }
        
    
    let additionalMessage = '.';
    if (hasOrderedBefore) {
        additionalMessage = ':warning: Buyer previously ordered this item.';
    }
    if (hasPendingOrder) {
        additionalMessage += ' :hourglass_flowing_sand: Buyer currently has a pending order for this item.';
    }

    const index = data.items.findIndex(i => i.name === itemName);
    data.items[index].price = Math.max(0, data.items[index].price - 1);
    await data.save();

    const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('confirmDegen').setLabel('Confirm').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('cancelDegen').setLabel('Cancel').setStyle(ButtonStyle.Danger),
        );

    const degenLogChannel = interaction.guild.channels.cache.get(degenLogChannelId);
    const embed = new EmbedBuilder()
        .setTitle("Degen Discount Order")
        .setDescription(`${additionalMessage}`)
        .addFields([
            { name: "Item", value: `${itemName}`, inline: false}, 
            { name: "Buyer", value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false},
        ])
        .setColor("#ffb347")
        .setTimestamp();

    await degenLogChannel.send({ embeds: [embed], components: [row] });
    newOrder = new orders({
        userID: interaction.user.id,
        part: itemName,
        fulfilled: false,
        date: interaction.createdAt,
    });
    await newOrder.save();
    return await interaction.reply({ content: `You've successfully ordered ${itemName}.`, ephemeral: true });
}

async function handleRegularPurchase(interaction, department, itemName, quantity, item) {
    const walletModel = walletByDepartment[department];
    const userWallet = await walletModel.findOne({ userID: interaction.user.id });

    if (userWallet.tokens < item.price * quantity) {
        return await interaction.reply({ content: "You have insufficient tokens to make this purchase.", ephemeral: true });
    }

    const managerPing = 0;
    switch(department){
        case recruiter:
            managerPing = 890240560542134274;
        case treasury:
            managerPing = 890240560542134274;
        case designer:
            managerPing = 890240560496017477;
        case decorator:
            managerPing = 890240560542134272;
    };

    userWallet.tokens -= item.price * quantity;
    await userWallet.save();

    const embed = new EmbedBuilder()
        .setTitle(`Purchase Confirmation for ${itemName}`)
        .setDescription(`**Amount**: ${quantity}\n**Total Cost**: ${item.price * quantity} tokens\n**New Balance**: ${userWallet.tokens} tokens \n <@${managerPing}>`)
        .setColor("#ffb347")
        .setThumbnail(interaction.user.avatarURL({ dynamic: true, format: "png", size: 4096 }))
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    const logChannel = interaction.guild.channels.cache.get(purchaseLogChannelIds.default);
    await logChannel.send({ content: `New purchase by <@${interaction.user.id}>, <@&${managerByDepartment[department]}>`, embeds: [embed] });
}
