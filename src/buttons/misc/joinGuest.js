module.exports = {
    data: {
        name: 'joinGuest'
    },
    async execute(i, bot) {
        if (i.member.roles.cache.has("572246269989355550")) {
            await i.member.roles.remove("572246269989355550", "No longer visiting!");
            await i.reply({ content: "Hope you enjoyed your stay!", ephemeral: true })
        } else {
            await i.member.roles.add("572246269989355550", "Visiting!");
            await i.reply({ content: "Hope you enjoy your stay!", ephemeral: true })
        }
    },
}