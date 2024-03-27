const { InteractionCollector, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

const welcomes = require("../../models/dbv2/embed_templates");
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');
const users = require('../../models/dbv2/usersSchema');
const recruit = require('../../models/dbv2/wf_recruitData');
const moment = require("moment");

module.exports = {
    data: {
        name: 'recruitment'
    },
    async execute(i, bot) {
        const ign = i.message.embeds[0].fields.find(field => field.name.includes("In-Game")).value;
        console.log(ign);
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
                    .setLabel( 'Heavens Kingdom')
                    .setDescription( "They'll be joining Heavens Kingdom")
                    .setValue( '890240560248524857'),

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
            
            await m.update({ content: `<@${id}> has been recruited to <@&${m.values[0]}>`, components: [], ephemeral: true })
            const general = await i.guild.channels.cache.get('890240569165639771');
            const kingdom = await i.guild.roles.cache.find(r => r.id === m.values[0]);
            await member.roles.remove(cc.Roles.Recruit, `Recruited into the clan by ${i.user.tag}`);
            await member.setNickname(ign, `Recruited into the clan by ${i.user.tag}`);
            await member.roles.add(kingdom.id, `Recruited into the clan by ${i.user.tag}`);

            let recruiterWallet = await wallet.findOne({ userID: i.user.id });
            if (!recruiterWallet) {
                recruiterWallet = new wallet({
                    userID: user.id,
                    tokens: 0,
                    transactions: 
                        {date: i.createdAt,
                        identifier: 'Init',
                        desc: "Init Wallet",
                        amount: 0}
                });
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
                userData = new users({
                    userID: member.id, 
                    serverJoinDate: member.joinedAt,
                    wfIGN: `${ign}`,
                    wfPastIGN: []
                });
                await userData.save();
                
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
                    .setTitle(`Welcome to ${kingdom.name}, ${ign}`)
                    .setDescription(`<@!${member.id}>, ${welmsg.message}`)
                    .setFooter({ text: `Recruited by ${i.user.username}` });
                const welcome = await general.send({ content: `Incoming recruit... <@!${member.id}>`});
                await welcome.edit({ content: "\u200B", embeds: [wEmbed] });
            } else {
                recruitData.kingdom = kingdom.id;
                recruitData.save();
            }

            await i.channel.send({ content: `Recruiter: <@${i.user.id}>\nRecruit: <@${member.id}> (${ign})`, components: []});
            collector.stop();
        });

    },
}