const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const welcomes = require("../../models/guild/welcome");
const cc = require('../../../config.json');
const ewal = require('../../models/wallets/eventWallet');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eventrecruit')
        .setDescription('Allows event hosters/recruiters to invite players')
        .addStringOption(option => option.setName('user').setDescription('Username').setRequired(true))
        .addStringOption(option => option.setName('inviter').setDescription('Inviter').setRequired(true))
        .addStringOption(option => option.setName('event').setDescription('Event').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.EventRecruiters.includes(r.id)))
			return i.reply({ content: "You're not a Event Recruiter!", ephemeral: true});

        const user = i.options.getString('user');
        const inviter = i.options.getString('inviter');
        const curevent = i.options.getString('event');

        const member = await i.guild.members.fetch(user);
        if (!member) return i.reply({ content: 'Unable to find member.', ephemeral: true });
        const imember = await i.guild.members.fetch(inviter);
        if (!imember) return i.reply({ content: 'Unable to find inviter.', ephemeral: true });

        const general = await i.guild.channels.cache.get('521850636887916595');
        const eventlog = await i.guild.channels.cache.get('1067154532301279283');

        const wallet = await ewal.findOne({ userID: i.member.id }); // Change to event wallet

        const welmsg = await welcomes.findOne({ team: "events" });
        const nEmbed = new EmbedBuilder()
            .setTitle("Event Invite Succesful")
            .setColor("#d7342a")
            .setDescription(`<@!${user}>, was invited by ${imember.user.tag}!`)
            .setThumbnail(i.user.avatarURL({ dynamic: true, format: "png", size: 4096 }))
        i.reply({ embeds: [nEmbed] });

        await member.roles.add(cc.Roles.Events, `Invited by ${imember.user.tag}!`);

        if (!wallet) {
            const newR = new ewal({ userID: imember.id, guildID: i.guild.id, tokens: 0.0});
            newR.save();
        }

        const wEmbed = new EmbedBuilder()
            .setColor("#d7342a")
            .setTitle(`Welcome to Anime Empire, ${member.displayName}`)
            .setDescription(`<@!${member.id}>, ${welmsg.message}`)
            .setFooter({ text: `Invited by ${imember.displayName} for ${curevent} event` });
        const welcome = await general.send({ content: `Incoming event invite... <@!${member.id}>`});
        await welcome.edit({ content: "\u200B", embeds: [wEmbed] });
        await eventlog.send({ content: `**Inviter:** ${inviter} | **User:** ${user} | **Event:** ${curevent}` })
        wallet.save();
        
    },

};