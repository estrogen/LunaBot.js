const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const moment = require('moment');
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');
const medals = [":first_place:", ":second_place:", ":third_place:"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uleaderboard')
        .setDescription('See top token balances')
        .setDefaultPermission(false),

    async execute(i, bot) {

        const sortedWallets = await wallet.find({}).sort({ tokens: -1 });
        const totalTokens = sortedWallets.reduce((sum, wallet) => {
            // Check if item.dollar is a valid number
            if (typeof wallet.tokens === 'number' && !isNaN(wallet.tokens)) {
                return sum + wallet.tokens;
            } else {
                return sum; // Skip invalid values
            }
        }, 0);


        const topWallets = sortedWallets.slice(0,10);
        const data = topWallets.map((user, i) => `${medals[i] ? medals[i] + " | " : ''}<@${user.userID}> - Tokens: ${user.tokens}`).join('\n');

        const embed = new EmbedBuilder()
                .setTitle(`Highest Token Counts`)
                .setColor(`#cfa3ff`)
                .addFields({ name:`Total Tokens`, value: `${totalTokens.toFixed(0)}`})
                .addFields({ name:`Leaderboard`, value: data});
    

        return i.reply({ embeds: [embed] });;
    }
}
