const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const welcomes = require("../../models/dbv2/embed_templates");
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');
const users = require('../../models/dbv2/usersSchema');
const recruit = require('../../models/dbv2/wf_recruitData');
const moment = require("moment");
const getWallet = require('../../functions/funcWallet.js');
const permission = require('../../functions/funcPermissions.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('Allows recruiters to invite warframe players into the clan')
        .addUserOption(option => option.setName('user').setDescription('Warframe Player').setRequired(true))
        .addStringOption(option => 
            option.setName('clan')
            .setDescription('Which clan theyll be joining.')
            .setRequired(true)
            .addChoices(
                //{name: 'Anime', value: cc.Roles.Clan.AnimeK},
                {name: 'Imouto', value: cc.Roles.Clan.ImoutoK},
                {name: 'Heaven', value: cc.Roles.Clan.AnimeK},
                {name: 'Tsuki', value: cc.Roles.Clan.TsukiK},
                {name: 'Waifu', value: cc.Roles.Clan.WaifuK},
                {name: 'Yuri', value: cc.Roles.Clan.YuriK},
                {name: 'Cowaii', value: cc.Roles.Clan.CowaiiK},
                {name: 'Manga', value: cc.Roles.Clan.MangaK}
            ))
        .addStringOption(option => option.setName('name').setDescription('Warframe players name').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!permission(i.member, "Recruiter"))
            return i.reply({ content: "You're not a recruiter!", ephemeral: true});

        const user = i.options.getUser('user');
        const clan = i.options.getString('clan');
        const name = i.options.getString('name');

        const member = await i.guild.members.fetch(user);
        if (!member) 
            return i.reply({ content: 'Unable to find member.', ephemeral: true });

        const general = await i.guild.channels.cache.get(cc.Channels.General);
        const kingdom = await i.guild.roles.cache.find(r => r.id === clan);
        const nEmbed = new EmbedBuilder()
            .setTitle("Recruit Succesful")
            .setColor(kingdom.hexColor)
            .setDescription(`${name} was recruited to ${kingdom.name}!`)
            .setThumbnail(i.user.avatarURL({ dynamic: true, format: "png", size: 4096 }))
        i.reply({ embeds: [nEmbed] });

        await member.roles.remove(Object.values(cc.Roles.Clan).concat(Object.values(cc.Roles.Identifier)), `Recruited into the clan by ${i.user.tag}`);
        await member.setNickname(name, `Recruited into the clan by ${i.user.tag}`);
        await member.roles.add(kingdom.id, `Recruited into the clan by ${i.user.tag}`);


        let recruiterWallet = await getWallet(i, i.member.id);
        let recruitData = await recruit.findOne({ userID: member.id });
        let userData = await users.findOne({ userID: member.id });
        if (!recruitData) {
            //Create User Data on Recruit
            recruitData = new recruit({
                userID: member.id,
                recruiter: i.user.id,
                joinDate: i.createdAt,
                kingdom: clan
            });
            await recruitData.save();
            userData = new users({
                userID: member.id, 
                serverJoinDate: member.joinedAt,
                wfIGN: `${name}`,
                wfPastIGN: [],
                otherIGN: []
            });
            if(userData.wfIGN != ""){
                userData.wfPastIGN.push(userData.wfIGN);
            }
            await userData.save();
            
            //Update Recruiters Wallet
            recruiterWallet.tokens += cc.Tokens.RecruiterRecruitT;
            recruiterWallet.transactions.push({
                date: i.createdAt,
                identifier: 'Recruiter',
                desc: `New recruit`,
                amount: cc.Tokens.RecruiterRecruitT
            });
            await recruiterWallet.save();

            const welmsg = await welcomes.findOne({ team: "recruiter" });
            const wEmbed = new EmbedBuilder()
                .setColor(kingdom.hexColor)
                .setTitle(`Welcome to ${kingdom.name}, ${name}`)
                .setDescription(`<@!${member.id}>, ${welmsg.message}`)
                .setFooter({ text: `Recruited by ${i.user.username}` });
            const welcome = await general.send({ content: `Incoming recruit... <@!${member.id}>`});
            await welcome.edit({ content: "\u200B", embeds: [wEmbed] });
        } else {
            recruitData.kingdom = kingdom.id;
            recruitData.save();
        }
        await i.channel.send({ content: `Recruiter: <@${i.user.id}>\nRecruit: <@${member.id}> (${name})`});
    },

};
