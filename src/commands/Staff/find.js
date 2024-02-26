const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const users = require('../../models/dbv2/usersSchema');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('find')
        .setDescription('Find a user based on their IGN')
        .addStringOption(option => option.setName('ign').setDescription('Users IGN').setRequired(false))
        .setDefaultPermission(false),

    async execute(i, bot) {
        const ign = i.options.getString('ign');
        let userData = await users.findOne({ wfIGN: ign });
        const color = '#ffb347';

        if(!userData){
            return i.reply({ content: "This users IGN isn't listed", ephemeral: true});
        }
        else{
            const embed = new EmbedBuilder()
                .setTitle(`User ${ign} found`)
                .setColor(color)
                .addFields([
                    {name: 'User', value: `<@${userData.userID}>`, inline: true},
                    {name: 'DiscordID', value: `${userData.userID}`, inline: true }
                ]);
            return i.reply({ embeds: [embed] });
        }

    }
}