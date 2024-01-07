const cc = require('../../../config.json');

module.exports = {
    data: {
        name: 'deleteMessage'
    },
    async execute(i, bot) {
        if (!i.member.roles.cache.some(r=>["890240560458244176", "890240560542134274"].concat(cc.Roles.Mods).includes(r.id)))
            return await i.reply({ content: "You lack the permissions", ephemeral: true });

        if (i.channel.id !== "725883088281796698")  {
            i.message.delete();
            await i.reply({ content: "Deleted!", ephemeral: true });
        } else {
            await i.reply({ content: "Error!", ephemeral: true });
        }
    },
}