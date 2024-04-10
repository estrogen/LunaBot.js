const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const cc = require('../../../config.json');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('farmimage')
        .setDescription('Upload your farmer contributions using this')
        .addStringOption(option => option.setName('image')
            .setDescription('Your image url')
            .setRequired(true))
        .setDefaultPermission(false),
    async execute(i, bot){
        const image = i.options.getString('image');
        const channel = await i.guild.channels.cache.get(cc.Channels.Contributions);

        await channel.send({content: `Farmer: <@${i.user.id}>\n ${image})`});

        return i.reply({ content: `Successfully uploaded the log`, ephemeral: true});


    }
}