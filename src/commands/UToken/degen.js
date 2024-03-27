const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment');
const stored_Data = require('../../models/dbv2/stored_Data');
const orders = require('../../models/dbv2/wf_degenOrders');
const cc = require('../../../config.json');

// Configurable channel IDs for purchases and logs
const degenChannelId = "1193672601579565157"; // Channel for 'degen' purchases
const degenLogChannelId = "890240568339341341"; // Log channel for 'degen' purchase announcements


module.exports = {
    data: new SlashCommandBuilder()
        .setName('degen')
        .setDescription('Allows you to purchase items from the degen shop')
        .addStringOption(option => 
            option.setName('item')
                .setDescription('Item you want to buy')
                .setRequired(true)
                .setAutocomplete(true))
        .setDefaultPermission(false),
    async autocomplete(i, bot) {
        const focusedOption = i.options.getFocused(true);

        if (focusedOption.name === 'item') {

            const focusedValue = focusedOption.value.toLowerCase();
            let items = [];
            
            try {
                const store = await stored_Data.findOne({ "team": 'degen' });
                if (store && store.items && store.items.length > 0) {
                    items = store.items
                        .filter(item => item.name.toLowerCase().startsWith(focusedValue))
                        .slice(0, 25)
                        .map(item => ({ name: item.name, value: item.name })); 
                }
            } catch (error) {
                console.error(`Error fetching items for degen`, error);
            }

            await i.respond(items);
        }
    },
    async execute(i, bot) {
        const itemName = i.options.getString('item');
        const item = await findItem(itemName);
        if (item.price === 0) {
            return await i.reply({ content: "This item is currently out of stock!", ephemeral: true });
        }
        
    
        const data = await stored_Data.findOne({ "team": 'degen', "items.name": itemName });
        if (!data){
            return await i.reply({ content: "Error: Item not found in the store.", ephemeral: true });
        }
        const userOrderHistory = await orders.find({ userID: i.user.id });
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
    
        const degenLogChannel = i.guild.channels.cache.get(degenLogChannelId);
        const embed = new EmbedBuilder()
            .setTitle("Degen Discount Order")
            .setDescription(`${additionalMessage}`)
            .addFields([
                { name: "Item", value: `${itemName}`, inline: false}, 
                { name: "Buyer", value: `<@${i.user.id}> (${i.user.tag})`, inline: false},
            ])
            .setColor("#cfa3ff")
            .setTimestamp();
    
        await degenLogChannel.send({ embeds: [embed], components: [row] });
        newOrder = new orders({
            userID: i.user.id,
            part: itemName,
            fulfilled: false,
            date: i.createdAt,
        });
        await newOrder.save();
        return await i.reply({ content: `You've successfully ordered ${itemName}.`, ephemeral: true });

    }

    
}
async function findItem(itemName) {
    const normalizedItemName = itemName.toLowerCase(); 
    const store = await stored_Data.findOne({ "team": "degen", "items.name": normalizedItemName });
    if (!store) return null;
    const itemIndex = store.items.findIndex(item => item.name === normalizedItemName);
    if (itemIndex === -1) return null;
    return { store, item: store.items[itemIndex] };
}