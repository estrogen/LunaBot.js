const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const users = require('../../models/dbv2/usersSchema');
const cc = require('../../../config.json');
const moment = require('moment');
const permission = require('../../functions/funcPermissions.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('clanrundown')
        .setDescription('Not Ready Yet')
        .addStringOption(option => 
            option.setName('clan')
            .setDescription('Which clan theyll be joining.')
            .setRequired(true)
            .addChoices(
                {name: 'Anime', value: cc.Roles.Clan.AnimeK},
                {name: 'Imouto', value: cc.Roles.Clan.ImoutoK},
                {name: 'Heaven', value: cc.Roles.Clan.AnimeK},
                {name: 'Tsuki', value: cc.Roles.Clan.TsukiK},
                {name: 'Waifu', value: cc.Roles.Clan.WaifuK},
                {name: 'Yuri', value: cc.Roles.Clan.YuriK},
                {name: 'Cowaii', value: cc.Roles.Clan.CowaiiK},
                {name: 'Manga', value: cc.Roles.Clan.MangaK},
                {name: 'Andromeda', value: cc.Roles.Clan.AndromedaK}
            ))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!permission(i.member, "Admin"))
            return i.reply({ content: "This function is not ready yet!", ephemeral: true});

        const clan = await i.guild.roles.cache.get(i.options.getString('clan'));
        console.log(clan);
        const clanMembers = await clan.members.map(m => m.user.tag);;
        console.log(clanMembers);
       

        const clanless = i.guild.roles.cache.get(cc.Roles.Identifier.Clanless);
        return i.reply('Jeff');
    }
}
