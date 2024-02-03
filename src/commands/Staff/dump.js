const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const cc = require('../../../config.json');
const recruits = require('../../models/recruitment/recruit');
const orderHistory = require('../../models/shop/orderhistory');
const pendingOrders = require('../../models/shop/pendingOrders');
const medals = [":first_place:", ":second_place:", ":third_place:"]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dump')
        .setDescription('Dumps information')
        .addIntegerOption(option => option.setName('days').setDescription('Amount of days').setRequired(true))
        .addStringOption(option =>
            option.setName('information')
                .setDescription('Which information you want to dump')
                .setRequired(true)
                .addChoices(
                    { name: 'Recruits', value: 'r' },
                    { name: 'Degen Orders', value: 't' }
                ))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id)))
            return i.reply({ content: "You're not upper staff!", ephemeral: true});

        const type = i.options.getString('information')
        const days = i.options.getInteger('days');
        const calc = Math.round(new Date().getTime() / 1000) - (days * 86400);
        await i.deferReply();
        if (type === 'r') {
            var db = recruits.find();
            var total = [];
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
            await i.editReply({ embeds: [embed] });
        } else {
            const now = Math.round(new Date().getTime() / 1000);
            const startDate = now - (days * 86400);

            const aggregatedOrders = await orderHistory.aggregate([
                { $unwind: "$history" },
                { $match: { "history.orderDate": { $gte: startDate.toString() } } },
                { $group: { _id: "$history.itemName", totalSales: { $sum: 1 } } },
                { $sort: { totalSales: -1 } }
            ]);

            const aggregatedPending = await pendingOrders.aggregate([
                { $unwind: "$pending" },
                { $match: { "pending.orderDate": { $gte: startDate.toString() } } },
                { $group: { _id: "$pending.itemName", totalPending: { $sum: 1 } } },
                { $sort: { totalPending: -1 } }
            ]);

            const pendingMap = aggregatedPending.reduce((acc, cur) => {
                acc[cur._id] = cur.totalPending;
                return acc;
            }, {});
            
            aggregatedOrders.forEach(order => {
                order.totalPending = pendingMap[order._id] || 0;
            });

            let csvContent = "Set Name, Pending, Total Sales\n";
            aggregatedOrders.forEach(order => {
                csvContent += `${order._id}, ${order.totalPending}, ${order.totalSales}\n`;
            });

            const attachment = new AttachmentBuilder(Buffer.from(csvContent, 'utf-8'), { name: 'DegenDump.csv' });
            await i.editReply({ files: [attachment], ephemeral: true });
        }
    },

};