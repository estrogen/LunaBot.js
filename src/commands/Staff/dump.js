const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const cc = require('../../../config.json');
const recruits = require('../../models/dbv2/wf_recruitData');
const orders = require('../../models/dbv2/wf_degenOrders');
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
        if(!i.member.roles.cache.some(r => Object.values(cc.Roles.Staff).includes(r.id)))
            return i.reply({ content: "You're not staff!", ephemeral: true});

        const type = i.options.getString('information')
        const days = i.options.getInteger('days');
        const startDate = new Date(Date.now() - days * 86400 * 1000);

        await i.deferReply();

        if (type === 'r') {
            const recruitsInPeriod = await recruits.find({
                joinDate: { $gte: startDate } // Use joinDate to filter documents
            });
    
            let total = [];
    
            recruitsInPeriod.forEach(doc => {
                const check = total.find(e => e.name === `<@${doc.recruiter}>`);
                if (check) {
                    check.total += 1;
                } else {
                    total.push({
                        name: `<@${doc.recruiter}>`,
                        total: 1
                    });
                }
            });
    
            total.sort((a, b) => b.total - a.total);
            const topRecruiters = total.slice(0, 10);
            const data = topRecruiters.map((user, i) => `${medals[i] ? medals[i] + " | " : ''}${user.name} - Total Recruits: ${user.total}`).join('\n');
    
            const embed = new EmbedBuilder()
                .setTitle(`Recruit Leaderboard for the past ${days} days`)
                .setColor(`#cfa3ff`)
                .setDescription(data);
    
            await i.editReply({ embeds: [embed] });
        } else {
            const aggregatedFulfilledOrders = await orders.aggregate([
                {
                    $match: {
                        date: { $gte: startDate },
                        fulfilled: true
                    }
                },
                {
                    $group: {
                        _id: "$part",
                        totalFulfilled: { $sum: 1 }
                    }
                },
                {
                    $sort: { totalFulfilled: -1 }
                }
            ]);

            const aggregatedPendingOrders = await orders.aggregate([
                {
                    $match: {
                        date: { $gte: startDate },
                        fulfilled: false
                    }
                },
                {
                    $group: {
                        _id: "$part",
                        totalPending: { $sum: 1 }
                    }
                },
                {
                    $sort: { totalPending: -1 }
                }
            ]);
    
            let combinedOrders = aggregatedFulfilledOrders.reduce((acc, order) => {
                acc[order._id] = { ...order, totalPending: 0 };
                return acc;
            }, {});
    
            aggregatedPendingOrders.forEach(order => {
                if (combinedOrders[order._id]) {
                    combinedOrders[order._id].totalPending = order.totalPending;
                } else {
                    combinedOrders[order._id] = { ...order, totalFulfilled: 0 };
                }
            });
    
            let ordersArray = Object.values(combinedOrders);
            ordersArray.sort((a, b) => b.totalFulfilled - a.totalFulfilled);

            let csvContent = "Part Name, Total Fulfilled, Total Pending\n";
            ordersArray.forEach(order => {
                csvContent += `${order._id}, ${order.totalFulfilled}, ${order.totalPending}\n`;
            });
    
            const attachment = new AttachmentBuilder(Buffer.from(csvContent, 'utf-8'), { name: 'OrderDump.csv' });
            await i.editReply({ files: [attachment] });
        }
    },

};