const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const shop = require('../../models/shop/shop');
const orderHistory = require('../../models/shop/orderhistory');
const cc = require('../../../config.json');

// Wallet models mapped by department for easy reference
const walletByDepartment = {
    treasury: require('../../models/wallets/treasuryWallet'),
    recruiter: require('../../models/wallets/recruiterWallet'),
    designer: require('../../models/wallets/designerWallet'),
    events: require('../../models/wallets/eventWallet'),
    decorator: require('../../models/wallets/decoratorWallet'),
    // Assuming 'degen' uses a separate or same wallet model, which should be created accordingly
};

// Configurable channel IDs for purchases and logs
const degenChannelId = "1193672601579565157"; // Channel for 'degen' purchases
const degenLogChannelId = "890240568339341341"; // Log channel for 'degen' purchase announcements
const purchaseLogChannelIds = { // Log channels for each department's purchase announcements
    events: "1193512882944610335", // Channel ID for 'events' purchases
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
                {name: 'Events', value: 'events'},
                {name: 'Decorator', value: 'decorator'}
            ))
        .addStringOption(option => option.setName('item').setDescription('Item you want to buy (Case Sensitive)').setRequired(true))
        .addNumberOption(option => option.setName('amount').setDescription('Amount you want to buy').setRequired(true))
        .setDefaultPermission(true),

    async execute(i, bot) {
        const department = i.options.getString('department');
        const itemName = i.options.getString('item');
        const amount = i.options.getNumber('amount');

        if (amount <= 0) {
            return await i.reply({ content: "Can't purchase a negative or zero amount of an item.", ephemeral: true });
        }

        if (department !== "degen" && department !== "events" && !i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id))) {
            return await i.reply({ content: "You're not authorized to make purchases from this department.", ephemeral: true });
        }

        const storeItem = await findItemInShop(department, itemName);

        if (!storeItem) {
            return await i.reply({ content: "The item you're trying to purchase doesn't exist.", ephemeral: true });
        }

        if (department === "degen") {
            await handleDegenPurchase(i, itemName, amount, storeItem.store, storeItem.item);
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

async function handleDegenPurchase(interaction, itemName, quantity, store, item) {
    if (interaction.channel.id !== degenChannelId) {
        return await interaction.reply({ content: "You can only purchase 'degen' items in the specified 'degen' channel.", ephemeral: true });
    }

    if (item.price === 0) {
        return await interaction.reply({ content: "This item is currently out of stock!", ephemeral: true });
    }
    

    const data = await shop.findOne({ _id: store._id, "items.name": itemName });
    if (!data)
        return await interaction.reply({ content: "Error: Item not found in the store.", ephemeral: true });

    const userOrderHistory = await orderHistory.findOne({ userID: interaction.user.id });
    let hasOrderedBefore = false;
    if (userOrderHistory)
        hasOrderedBefore = userOrderHistory.history.some(order => order.itemName === itemName);

    const additionalMessage = hasOrderedBefore ? `:warning: Buyer previously ordered this item.` : '';

    const index = data.items.findIndex(i => i.name === itemName);
    data.items[index].price = Math.max(0, data.items[index].price - quantity);
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
    return await interaction.reply({ content: `You've successfully purchased ${quantity} of ${itemName}.`, ephemeral: true });
}

async function handleRegularPurchase(interaction, department, itemName, quantity, item) {
    const walletModel = walletByDepartment[department];
    const userWallet = await walletModel.findOne({ userID: interaction.user.id });

    if (userWallet.tokens < item.price * quantity) {
        return await interaction.reply({ content: "You have insufficient tokens to make this purchase.", ephemeral: true });
    }

    userWallet.tokens -= item.price * quantity;
    await userWallet.save();

    const embed = new EmbedBuilder()
        .setTitle(`Purchase Confirmation for ${itemName}`)
        .setDescription(`**Amount**: ${quantity}\n**Total Cost**: ${item.price * quantity} tokens\n**New Balance**: ${userWallet.tokens} tokens`)
        .setColor("#ffb347")
        .setThumbnail(interaction.user.avatarURL({ dynamic: true, format: "png", size: 4096 }))
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    const logChannelId = department === "events" ? purchaseLogChannelIds.events : purchaseLogChannelIds.default;
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    await logChannel.send({ content: `New purchase by <@${interaction.user.id}>`, embeds: [embed] });
}
