module.exports = {
    data: {
        name: 'joinGuest'
    },
    async execute(i, bot) {
        if (i.member.roles.cache.has("890240560131104807")) {
            await i.member.roles.remove("890240560131104807", "No longer visiting!");
            await i.reply({ content: "Hope you enjoyed your stay!", ephemeral: true })
        } else {
            await i.member.roles.add("890240560131104807", "Visiting!");
            await i.reply({ content: "Hope you enjoy your stay!", ephemeral: true })
        }
    },
}