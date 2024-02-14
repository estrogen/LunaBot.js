const { InteractionCollector, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

const welcomes = require("../../models/dbv2/embed_templates");
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_recruit');
const users = require('../../models/dbv2/usersSchema');
const recruit = require('../../models/dbv2/wf_recruitData');
const moment = require("moment");

module.exports = {
    data: {
        name: 'recruitment'
    },
    async execute(i, bot) {
        const ign = i.message.embeds[0].fields[0].value;
        const id = i.message.embeds[0].footer.text.split(' | ')[0];
        const select = new StringSelectMenuBuilder()
            .setCustomId('recruitClan')
            .setPlaceholder('Clan to recruit to')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel( 'Imouto Kingdom')
                    .setDescription( "They'll be joining Imouto Kingdom")
                    .setValue( '890240560248524858'),

                new StringSelectMenuOptionBuilder()
                    .setLabel( 'Tsuki Kingdom')
                    .setDescription( "They'll be joining Tsuki Kingdom")
                    .setValue( '1193510188955746394'),

                new StringSelectMenuOptionBuilder()
                    .setLabel( 'Waifu Kingdom')
                    .setDescription( "They'll be joining Waifu Kingdom")
                    .setValue( '890240560248524856'),

                new StringSelectMenuOptionBuilder()
                    .setLabel( 'Yuri Kingdom')
                    .setDescription( "They'll be joining Yuri Kingdom")
                    .setValue( '890240560273702932'),

                new StringSelectMenuOptionBuilder()
                    .setLabel( 'Cowaii Kingdom')
                    .setDescription( "They'll be joining Cowaii Kingdom")
                    .setValue( '1192922910751473736'),

                new StringSelectMenuOptionBuilder()
                    .setLabel( 'Manga Kingdom')
                    .setDescription( "They'll be joining Manga Kingdom")
                    .setValue( '1192923627419619419'),
            )

        const row = new ActionRowBuilder().addComponents(select);
        await i.reply({ content: `Which kingdom will ${ign} be joining?`, components: [row], ephemeral: true });

        const filter = m => m.isSelectMenu() && m.member.id === i.member.id;
        const collector = new InteractionCollector(bot, { filter, max: 2, time: 30000 })

        collector.on("collect", async (m) => {
            const member = await i.guild.members.fetch(id);
            if (!member) return await m.reply({ content: 'Unable to find member.', ephemeral: true });

            const kingdom = await i.guild.roles.cache.find(r => r.id === m.values[0]);
            await member.roles.set([kingdom.id], `Recruited into the clan by ${i.user.tag}`);
            await member.setNickname(ign, `Recruited into the clan by ${i.user.tag}`);

            let recruiterWallet = await wallet.findOne({ userID: i.user.id });
            if (!recruiterWallet) {
                recruiterWallet = new Wallet({
                    userID: i.user.id,
                    guildID: i.guild.id,
                    tokens: 0.5
                });
                await recruiterWallet.save();
            }

            let recruitData = await recruit.findOne({ userID: member.id });
            let userData = await users.findOne({ userID: member.id });
            if (!recruitData) {
                recruitData = new recruit({
                    userID: member.id,
                    recruiter: i.user.id,
                    joinDate: i.createdAt,
                    kingdom: m.values[0]
                });
                await recruitData.save();
                if (!userData) {
                    userData = new users({
                        userID: member.id, 
                        serverJoinDate: member.joinedAt,
                        wfIGN: ign,
                        wfPastIGN: []
                    });
                    await userData.save();
                }
                recruiterWallet.tokens += 0.5;
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

            await m.update({ content: `Recruiter: <@${i.user.id}>\nRecruit: <@${member.id}> (${ign})`, components: [], ephemeral: true });
        });

    },
}