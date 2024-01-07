const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const welcomes = require("../../models/guild/welcome");
const cc = require('../../../config.json');
const rwal = require('../../models/wallets/recruiterWallet');
const recruit = require('../../models/recruitment/recruit');
const moment = require("moment");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('Allows recruiters to invite warframe players into the clan')
        .addStringOption(option => option.setName('user').setDescription('Warframe Player').setRequired(true))
        .addStringOption(option => 
            option.setName('clan')
            .setDescription('Which clan theyll be joining.')
            .setRequired(true)
            .addChoices(
                {name: 'Anime', value: '521854159390113793'},
                {name: 'Imouto', value: '566032412618784768'},
                {name: 'Heavens', value: '604195078973554698'},
                {name: 'Waifu', value: '606538892547457027'},
                {name: 'Yuri', value: '874903017445535754'},
                {name: 'Cowaii', value: '931364353213595709'},
                {name: 'Manga', value: '937244226721300532'}
            ))
        .addStringOption(option => option.setName('name').setDescription('Warframe players name').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Recruiter.includes(r.id)))
            return i.reply({ content: "You're not a recruiter!", ephemeral: true});

        const user = i.options.getString('user');
        const clan = i.options.getString('clan');
        const name = i.options.getString('name');

        const member = await i.guild.members.fetch(user);
        if (!member) 
            return i.reply({ content: 'Unable to find member.', ephemeral: true });

        const general = await i.guild.channels.cache.get('521850636887916595');
        const wallet = await rwal.findOne({ userID: i.member.id });
        const data = await recruit.findOne({ userID: member.id });
        const welmsg = await welcomes.findOne({ team: "recruiter" });
        const kingdom = await i.guild.roles.cache.find(r => r.id === clan);
        const nEmbed = new EmbedBuilder()
            .setTitle("Recruit Succesful")
            .setColor(kingdom.hexColor)
            .setDescription(`${name} was recruited to ${kingdom.name}!`)
            .setThumbnail(i.user.avatarURL({ dynamic: true, format: "png", size: 4096 }))
        i.reply({ embeds: [nEmbed] });

        await member.roles.remove(cc.Roles.Recruit, `Recruited into the clan by ${i.user.tag}`);
        await member.setNickname(name, `Recruited into the clan by ${i.user.tag}`);
        await member.roles.add(kingdom.id, `Recruited into the clan by ${i.user.tag}`);

        if (!wallet) {
            const newR = new rwal({ userID: i.user.id, guildID: i.guild.id, tokens: 0.5});
            newR.save();
        }

        if (!data) {
            const newRecruit = new recruit({
                userID: member.id,
                guildID: i.guild.id,
                kingdom: clan,
                recruiter: i.user.id,
                clanJoin: moment(i.createdAt).unix(),
                serverJoin: moment(member.joinedAt).unix()
            });
            newRecruit.save();
            wallet.tokens += 0.5;
            wallet.save();

            const wEmbed = new EmbedBuilder()
                .setColor(kingdom.hexColor)
                .setTitle(`Welcome to ${kingdom.name}, ${name}`)
                .setDescription(`<@!${member.id}>, ${welmsg.message}`)
                .setFooter({ text: `Recruited by ${i.user.username}` });
            const welcome = await general.send({ content: `Incoming recruit... <@!${member.id}>`});
            await welcome.edit({ content: "\u200B", embeds: [wEmbed] });

        } else {
            data.kingdom = kingdom.id;
            data.save();
        }
        await i.channel.send({ content: `Recruiter: <@${i.user.id}>\nRecruit: <@${member.id}> (${name})`});
    },

    rolePerms: cc.Roles.Recruiter,
};