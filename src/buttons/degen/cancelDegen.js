const shop = require("../../models/shop/shop");

module.exports = {
    data: {
        name: 'cancelDegen'
    },
    async execute(i, bot) {
        const item = i.message.embeds[0].fields[0].value.toLowerCase();
        const data = await shop.findOne({ "team": "degen", "items.name" : item});
        const index = data.items.findIndex(i => i.name === item);
        data.items[index].price += 1;
        data.save()

        if (i.channel.id !== "725883088281796698") {
            i.reply({ content: "Order has been canceled", ephemeral: true })
            i.message.delete();
        } else {
            i.reply({ content: "Error", ephemeral: true })
        }
    },
}