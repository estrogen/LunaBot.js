const { InteractionCollector, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

const welcomes = require("../../models/guild/welcome");
const cc = require('../../../config.json');
const wallet = require('../../models/wallets/recruiterWallet');
const recruit = require('../../models/recruitment/recruit');
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
/*               new StringSelectMenuOptionBuilder()
                    .setLabel( 'Anime Kingdom')
                    .setDescription( "They'll be joining Anime Kingdom")
                    .setValue( '521854159390113793'),
*/
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

        const member = await i.guild.members.fetch(id);
        if (!member) return await i.reply({ content: 'Unable to find member.', ephemeral: true });
        const general = await i.guild.channels.cache.get('890240569165639771');
        const wal = await wallet.findOne({ userID: i.member.id });
        const data = await recruit.findOne({ userID: member.id });
        const welmsg = await welcomes.findOne({ team: "recruiter" });

        collector.on("collect", async (m) => {
            await m.update({ content: `<@${id}> has been recruited to <@&${m.values[0]}>`, components: [], ephemeral: true })
            const kingdom = await i.guild.roles.cache.find(r => r.id === m.values[0]);
            const recruitEmbed = new EmbedBuilder()
                .setAuthor({ name: `Successful Recruit (Click to go to app)`, url: `https://discord.com/channels/890240560131104798/${i.channel.id}/${i.message.id}` })
                .setColor(kingdom.color)
                .setDescription(`${ign} was recruited to ${kingdom.name}!`)
                .setThumbnail(i.user.avatarURL({ dynamic: true, format: "png", size: 4096 }))
            await m.channel.send({ embeds: [recruitEmbed] })

            await member.roles.remove(cc.Roles.Recruit, `Recruited into the clan by ${i.user.tag}`);
            await member.setNickname(ign, `Recruited into the clan by ${i.user.tag}`);
            await member.roles.add(kingdom.id, `Recruited into the clan by ${i.user.tag}`);

            if (!wal) {
                const newR = new wallet({ userID: i.user.id, guildID: i.guild.id, tokens: 0.0});
                newR.save();
            }
    
            if (!data) {
                const newRecruit = new recruit({
                    userID: member.id,
                    guildID: i.guild.id,
                    kingdom: m.values[0],
                    recruiter: i.user.id,
                    clanJoin: moment(i.createdAt).unix(),
                    serverJoin: moment(member.joinedAt).unix()
                });
                newRecruit.save();
                wal.tokens += 0.5;
                wal.save();
    
                const wEmbed = new EmbedBuilder()
                    .setColor(kingdom.color)
                    .setTitle(`Welcome to ${kingdom.name}, ${ign}`)
                    .setDescription(`<@!${member.id}>, ${welmsg.message}`)
                    .setFooter({ text: `Recruited by ${i.user.username}` });
                const welcome = await general.send({ content: `Incoming recruit... <@!${member.id}>`});
                await welcome.edit({ content: "\u200B", embeds: [wEmbed] });
    
            } else {
                data.kingdom = kingdom.id;
                data.save();
            }
            await m.channel.send({ content: `Recruiter: <@${i.user.id}>\nRecruit: <@${member.id}> (${ign})`});
        })

    },
}