const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const welcomes = require("../../models/dbv2/embed_templates");
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_recruit');
const users = require('../../models/dbv2/usersSchema');
const recruit = require('../../models/dbv2/wf_recruitData');
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
                //{name: 'Anime', value: '890240560248524859'},
                {name: 'Imouto', value: '890240560248524858'},
                {name: 'Heaven', value: '890240560248524857'},
                {name: 'Tsuki', value: '1193510188955746394'},
                {name: 'Waifu', value: '890240560248524856'},
                {name: 'Yuri', value: '890240560273702932'},
                {name: 'Cowaii', value: '1192922910751473736'},
                {name: 'Manga', value: '1192923627419619419'}
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

        const general = await i.guild.channels.cache.get('890240569165639771');
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

        let recruiterWallet = await wallet.findOne({ userID: i.member.id });
        if (!recruiterWallet) {
            recruiterWallet = new wallet({
                userID: i.user.id,
                guildID: i.guild.id,
                tokens: 0.5
            });
            await recruiterWallet.save();
        }

        let recruitData = await recruit.findOne({ userID: member.id });
        let userData = await users.findOne({ userID: member.id });
        if (!userData) {
            userData = new users({
                userID: member.id, 
                serverJoinDate: member.joinedAt,
                wfIGN: name,
                wfPastIGN: []
            });
            await userData.save();
        }
        if (!recruitData) {
            recruitData = new recruit({
                userID: member.id,
                recruiter: i.user.id,
                joinDate: i.createdAt,
                kingdom: clan
            });
            await recruitData.save();
            recruiterWallet.tokens += 6.25;
            recruiterWallet.transactions.push({
                date: i.createdAt,
                identifier: 'Recruiter',
                desc: `New recruit`,
                amount: 6.25
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
