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
        .addStringOption(option => option.setName('clan')
            .setDescription('Clan')
            .setRequired(true)
            .addChoices(
                {name: 'Andromeda Kingdom', value: 'Andromeda'},
                {name: 'Imouto Kingdom', value: 'Imouto'},
                {name: 'Heavens Kingdom', value: 'Heavens'},
                {name: 'Tsuki Kingdom', value: 'Tsuki'},
                {name: 'Waifu Kingdom', value: 'Waifu'},
                {name: 'Yuri Kingdom', value: 'Yuri'},
                {name: 'Cowaii Kingdom', value: 'Cowaii'},
                {name: 'Manga Kingdom', value: 'Manga'},
                {name: 'Activity', value: 'Activity'}
            ))
        .setDefaultPermission(false),
    async execute(i, bot){
        const image = i.options.getString('image');
        const channel = await i.guild.channels.cache.get(cc.Channels.Contributions);

        await channel.send({content: `Farmer: <@${i.user.id}> -- ${i.options.getString('clan')}\n ${image}`});

        return i.reply({ content: `Successfully uploaded the log`, ephemeral: true});


    }
}