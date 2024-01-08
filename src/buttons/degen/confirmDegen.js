const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'confirmDegen'
    },
    async execute(i, bot) {
        await i.reply({ content: 'Fulfilling...', ephemeral: true })
        const log = await i.guild.channels.cache.get("890240568670716026");
        i.message.embeds[0].data.title = `Buy order fulfilled by ${i.user.tag}`
        i.message.embeds[0].data.color = 5763719
        await log.send({ embeds: [i.message.embeds[0]]});
        if (i.channel.id !== "725883088281796698") i.message.delete();
    },
}