const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const progress = require('string-progressbar');
const recruits = require('../../models/dbv2/wf_recruitData');



const clans = {
    "AK": "890240560248524859",
    "IK": "890240560248524858",
    "HK": "890240560248524857",
    "TK": "1193510188955746394",
    "WK": "890240560248524856",
    "YK": "890240560273702932",
    "CK": "1192922910751473736",
    "MK": "1192923627419619419"
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('udeptprogress')
        .setDescription('View the shop for specific departments')
        .addStringOption(option => option.setName('department')
            .setDescription('Which department shop you want to view')
            .setRequired(true)
            .addChoices(
                { name: 'Recruiter', value: 'recruiter' },
                { name: 'Treasurer', value: 'treasurer' },
                { name: 'Farmer', value: 'farmer' }
            ))
        .addUserOption(option => option.setName('user').setDescription('Which user would you like to check.').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        const type = i.options.getString('department')
        const user = i.options.getUser('user');
        const avatarURL = user.avatarURL({ dynamic: true, format: "png", size: 4096 });
        const color = '#cfa3ff'; // Use a constant for the color to maintain consistency

        const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s ${type} Wallet`)
        .setColor(color)
        .setThumbnail(avatarURL);

        await i.deferReply();
        // Specific handling for recruiter type
        if (type === 'recruiter') {
            const totalRecruits = await recruits.find({ recruiter: user.id }).exec();
            let breakdown = await getRecruitBreakdown(totalRecruits, clans);
            const progressInfo = getProgressInfo(totalRecruits.length); // Get the progress information

            embed.setDescription(progressInfo.description)
                .addFields([
                    { name: 'Total Recruits', value: `${totalRecruits.length} :fire:`, inline: true },
                    { name: 'Breakdown', value: breakdown, inline: false },
                ]);

            await i.editReply({ embeds: [embed] });
        }
        if (type === 'treasurer'){
            return i.editReply("not implemented");
        }
        if(type === 'farmer'){
            return i.editReply("not implemented");
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
function getProgressInfo(recruitCount) {
    const levels = [
        { limit: 25, title: 'Recruiter' },
        { limit: 75, title: 'Honored' },
        { limit: 150, title: 'Veteran' },
        { limit: 300, title: 'Ace' },
        { limit: 1000, title: 'Noble' },
        { limit: 3000, title: 'Cherished' },
        { limit: 9999, title: '???' }
    ];
    const level = levels.find(l => recruitCount < l.limit) || { limit: 9999, title: '???' }; // Fallback to the last level
    return {
        description: `${level.title} progress ${recruitCount} / ${level.limit} \n${progress.filledBar(level.limit, recruitCount, 11, '▱', '▰')[0]}`
    };
}