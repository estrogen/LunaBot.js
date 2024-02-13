const shop = require("../../models/shop/shop");
const pendingOrders = require('../../models/shop/pendingOrders');

module.exports = {
    data: {
        name: 'cancelDegen'
    },
    async execute(i, bot) {
        const embed = i.message.embeds[0];
        const item = embed.fields[0].value.toLowerCase();
        const data = await shop.findOne({ "team": "degen", "items.name" : item});
        const index = data.items.findIndex(i => i.name === item);
        data.items[index].price += 1;
        data.save()
        const buyerMention = embed.fields.find(field => field.name === "Buyer").value;
        const buyerId = buyerMention.match(/<@(\d+)>/)[1];

        await pendingOrders.findOneAndUpdate(
            { guildID: i.guild.id, userID: buyerId },
            { $pull: { pending: { itemName: item } } }
        )
        if (i.channel.id !== "725883088281796698") {
            await i.reply({ content: "Order has been canceled", ephemeral: true })
            i.message.delete();
        } else {
            await i.reply({ content: "Error", ephemeral: true })
        }
    },
}