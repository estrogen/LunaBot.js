const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const progress = require('string-progressbar');
const cc = require('../../../config.json');
const wait = require('node:timers/promises').setTimeout;

// Models
const recruits = require('../../models/recruitment/recruit');
const walletModels = {
    r: require('../../models/wallets/recruiterWallet'),
    t: require('../../models/wallets/treasuryWallet'),
    d: require('../../models/wallets/designerWallet'),
    e: require('../../models/wallets/eventWallet'),
    c: require('../../models/wallets/decoratorWallet'),
};

const clans = {
    "AK": "890240560248524859",
    "IK": "890240560248524858",
    "TK": "1193510188955746394",
    "WK": "890240560248524856",
    "YK": "890240560273702932",
    "CK": "1192922910751473736",
    "MK": "1192923627419619419"
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wallet')
        .setDescription('View your wallet for specific department')
        .addStringOption(option =>
            option.setName('department')
                .setDescription('Which department shop you want to view')
                .setRequired(true)
                .addChoices(
                    { name: 'Recruiter', value: 'r' },
                    { name: 'Treasury', value: 't' },
                    { name: 'Designer', value: 'd' },
                    { name: 'Events', value: 'e' },
                    { name: 'Decorator', value: 'c' }
                ))
        .addUserOption(option => option.setName('user').setDescription('Mentioned user').setRequired(true))
        .setDefaultPermission(false),
    async execute(i, bot) {
        const type = i.options.getString('department')
        const user = i.options.getUser('user');
        const avatarURL = user.avatarURL({ dynamic: true, format: "png", size: 4096 });
        const color = '#ffb347'; // Use a constant for the color to maintain consistency

        // Initialize the wallet if not present
        const walletModel = walletModels[type] || walletModels.c;
        let data = await walletModel.findOne({ userID: user.id });

        if (!data) {
            data = new walletModel({
                userID: user.id,
                guildID: i.guild.id,
                tokens: 0,
                ...(type === 'd' && { sheet: "None", support: "None" }) // Only add extra fields for the 'd' type
            });
            await data.save();
            return i.reply({ content: "User's Wallet has been initialized", ephemeral: true });
        }

        // Construct the embed based on the department
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s ${departmentMap[type]} Wallet`)
            .setColor(color)
            .setThumbnail(avatarURL);

        await i.deferReply();
        // Specific handling for recruiter type
        if (type === 'r') {
            const totalRecruits = await recruits.find({ recruiter: user.id }).exec();
            let breakdown = await getRecruitBreakdown(totalRecruits, clans);
            const progressInfo = getProgressInfo(totalRecruits.length); // Get the progress information

            embed.setDescription(progressInfo.description)
                .addFields([
                    { name: 'Total Recruits', value: `${totalRecruits.length} :fire:`, inline: true },
                    { name: 'Tokens', value: `${data.tokens} :fire:`, inline: true },
                    { name: 'Breakdown', value: breakdown, inline: false },
                ]);
        } else {
            embed.addFields({ name: 'Tokens', value: `${data.tokens} :gem:`, inline: true });
        }
        await i.editReply({ embeds: [embed] });
    },

};

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

async function getRecruitBreakdown(recruits, clans) {
    // Construct the breakdown string for recruits by clan
    let breakdown = "";
    for (let clan in clans) {
        const count = recruits.filter(r => r.kingdom === clans[clan]).length;
        breakdown += `**${clan}** - ${count}\n`;
    }
    return breakdown;
}

const departmentMap = {
    r: 'Recruiter',
    t: 'Treasury',
    d: 'Designer',
    e: 'Events',
    c: 'Decorator'
};
