const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const progress = require('string-progressbar');
const recruits = require('../../models/dbv2/wf_recruitData');
const farmcont = require('../../models/dbv2/wf_farmerContributions');
const cc = require('../../../config.json');
const utokens = require('../../models/dbv2/tokens_universal.js');



const clans = {
    "AK": cc.Roles.Clan.AnimeK,
    "IK": cc.Roles.Clan.ImoutoK,
    "HK": cc.Roles.Clan.HeavensK,
    "TK": cc.Roles.Clan.TsukiK,
    "WK": cc.Roles.Clan.WaifuK,
    "YK": cc.Roles.Clan.YuriK,
    "CK": cc.Roles.Clan.CowaiiK,
    "MK": cc.Roles.Clan.MangaK
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('udeptprogress')
        .setDescription('View the shop for specific departments')
        .addStringOption(option => option.setName('department')
            .setDescription('Which department shop you want to view')
            .setRequired(true)
            .addChoices(
                { name: 'Recruiter', value: 'Recruiter' },
                { name: 'Treasurer', value: 'Treasurer' },
                { name: 'Farmer', value: 'Farmer' }
            ))
        .addUserOption(option => option.setName('user').setDescription('Which user would you like to check.').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        const type = i.options.getString('department')
        const user = i.options.getUser('user');
        const avatarURL = user.avatarURL({ dynamic: true, format: "png", size: 4096 });
        const color = '#cfa3ff'; // Use a constant for the color to maintain consistency

        const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s ${type} Progress`)
        .setColor(color)
        .setThumbnail(avatarURL);

        await i.deferReply();
        // Specific handling for recruiter type
        if (type === 'Recruiter') {
            const totalRecruits = await recruits.find({ recruiter: user.id }).exec();
            let breakdown = await getRecruitBreakdown(totalRecruits, clans);
            const progressInfo = getRecruitProgressInfo(totalRecruits.length); // Get the progress information

            embed.setDescription(progressInfo.description)
                .addFields([
                    { name: 'Total Recruits', value: `${totalRecruits.length} :fire:`, inline: true },
                    { name: 'Breakdown', value: breakdown, inline: false },
                ]);

            await i.editReply({ embeds: [embed] });
        }
        if (type === 'Treasurer'){

            return i.editReply("not implemented");
        }
        if(type === 'Farmer'){
            const allFarmCont = await farmcont.find({ userID: user.id}).exec();
            const migrationInfo = await utokens.find({ userID: user.id});
            let totalAmount = 0;

            migrationInfo.forEach(transaction => {
                const { userID, transactions } = transaction;
                transactions.forEach(t => {
                    if (t.desc.includes("Farmer Migration")){
                        totalAmount += t.amount;
                    }
                    if (t.desc.includes("Farmer: Donated")){
                        totalAmount += t.amount;
                    }
                });
            });



            const progressInfo = getFarmerProgressInfo(totalAmount);

            embed.setDescription(progressInfo.description)
                .addFields([
                    { name: 'Contributions', value: `${totalAmount} :pick:`, inline: true },
                ]);

            await i.editReply({ embeds: [embed] });
        }
    }

    
}
async function getRecruitBreakdown(recruits, clans) {
    // Construct the breakdown string for recruits by clan
    let breakdown = "";
    for (let clan in clans) {
        const count = recruits.filter(r => r.kingdom === clans[clan]).length;
        breakdown += `**${clan}** - ${count}\n`;
    }
    return breakdown;
}

function getRecruitProgressInfo(recruitCount) {
    const levels = [
        { limit: cc.Milestones.RRecruiter, title: 'Recruiter' },
        { limit: cc.Milestones.RHonored, title: 'Honored' },
        { limit: cc.Milestones.RVeteran, title: 'Veteran' },
        { limit: cc.Milestones.RAce, title: 'Ace' },
        { limit: cc.Milestones.RNoble, title: 'Noble' },
        { limit: cc.Milestones.RCherished, title: 'Cherished' },
        { limit: cc.Milestones.RSnowy, title: 'Snowy' },
        { limit: Infinity, title: '???'}
    ];
    const level = levels.find(l => recruitCount < l.limit) || { limit: 9999, title: 'Snowys Goal' }; // Fallback to the last level
    return {
        description: `${level.title} progress ${recruitCount} / ${level.limit} \n${progress.filledBar(level.limit, recruitCount, 11, '▱', '▰')[0]}`
    };
}

function getFarmerProgressInfo(tokenAmount) {
    const levels = [
        { limit: cc.Milestones.FGraduate, title: 'Graduate' },
        { limit: cc.Milestones.FSpelunker, title: 'Spelunker' },
        { limit: cc.Milestones.FProspector, title: 'Prospector' },
        { limit: Infinity, title: '???'}
    ];
    const level = levels.find(l => tokenAmount < l.limit) || { limit: 9999, title: '???' }; // Fallback to the last level
    return {
        description: `${level.title} progress ${tokenAmount} / ${level.limit} \n${progress.filledBar(level.limit, tokenAmount, 11, '▱', '▰')[0]}`
    };
}