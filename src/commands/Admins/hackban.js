const { SlashCommandBuilder } = require('discord.js');
const db = require('../../models/moderation/hackban')
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hackban')
        .setDescription('Bans a user, and if theyre not in the server theyll be banned on join.')
        .addStringOption(option => 
            option.setName('id')
            .setDescription('ID of user')
            .setRequired(true))
        .setDefaultPermission(false),
        
    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Admin.includes(r.id)))
            return i.reply({ content: "You're not a admin", ephemeral: true});

        const user = i.options.getString('id');
        if (user == i.member.id)
            return i.reply({ content: "You cannot ban yourself.", ephemeral: true});

        try {
            const member = await i.guild.members.fetch(user);
            if (member)
                await member.ban({ days: 7, reason: "Hackbanned by an admin." });
                await i.reply({ content: "User was banned as they were still in the server.", ephemeral: true});
        } catch (err) {
            console.error(err);
            const hk = await db.findOne({ userID: user });
            if (!hk) {
                const ban = new db({
                    userID: user,
                    guildID: i.guild.id
                });
                ban.save().catch(e => console.error(e));
                await i.reply({ content: "User has been hackbanned.", ephemeral: true});
            } else {
                await i.reply({ content: "User has already been hackbanned.", ephemeral: true});
            }
        }
    },

    rolePerms: cc.Roles.Admin,
};