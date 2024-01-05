const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('../../../config.json');
const recruits = require('../../models/recruitment/recruit');
const medals = [":first_place:", ":second_place:", ":third_place:"]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dump')
        .setDescription('Dumps recruits from the past amount of days')
        .addIntegerOption(option => option.setName('days').setDescription('Amount of days').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id)))
            return i.reply({ content: "You're not upper staff!", ephemeral: true});

        const days = i.options.getInteger('days');
        const calc = Math.round(new Date().getTime() / 1000) - (days * 86400);
        var db = recruits.find();
        var total = [];
        await i.reply({ content: "Acquiring Data...", ephemeral: true });
        (await db).forEach(async function (doc) {
            let clan = parseInt(doc.clanJoin);
            if (clan >= calc) {
                const check = total.find(e => e.name === `<@${doc.recruiter}>`);
                if (check) {
                    check.total += 1;
                } else {
                    total.push({
                        name: `<@${doc.recruiter}>`,
                        total: 1
                    })
                }
            }
        });
        total.sort(function (a, b) {
            return b.total - a.total;
        })
        const info = await total.slice(0, 10);
        const data = await info.map((user, i) => `${medals[i] ? medals[i]+" | " : ''}${user.name} - Total Recruits: ${user.total}`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle(`Recruit Leaderboard for past ${days} days`)
            .setColor(`#FFB347`)
            .setDescription(`${data}`)
        await i.channel.send({ embeds: [embed] });
    },

    rolePerms: cc.Roles.Staff,
};