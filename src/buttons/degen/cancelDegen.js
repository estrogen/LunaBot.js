const shop = require("../../models/dbv2/stored_Data");
const orders = require('../../models/dbv2/wf_degenOrders');

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

        await orders.findOneAndRemove({
            userID: buyerId,
            part: item,
            fulfilled: false
        });
        if (i.channel.id !== "725883088281796698") {
            await i.reply({ content: "Order has been canceled", ephemeral: true })
            i.message.delete();
        } else {
            await i.reply({ content: "Error", ephemeral: true })
        }
    },
}