const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uwallet')
        .setDescription('See your current balance')
        .addUserOption(option => option.setName('user').setDescription('Check a users wallets').setRequired(false))
        .setDefaultPermission(false),

    async execute(i, bot) {
        
        const color = '#cfa3ff';
        var user = i.member.user;
        if(i.options.getUser('user') != null){
            user = i.options.getUser('user');
        }

        const avatarURL = user.avatarURL({ dynamic: true, format: "png", size: 4096 });

        let userWallet = await wallet.findOne({ userID: user.id });

        if (!userWallet) {
            userWallet = new wallet({
                userID: user.id,
                tokens: 0,
                transactions: 
                    {date: i.createdAt,
                    identifier: 'Initialization',
                    desc: "Initialized Wallet",
                    amount: 0}
            });
            await userWallet.save();
        }

        const embed = new EmbedBuilder()
            .setTitle(`${user.globalName}'s Wallet`)
            .setColor(color)
            .setThumbnail(avatarURL)
            .addFields({ name: 'Tokens', value: `${userWallet.tokens} :gem:`, inline: true });

        await i.reply({ embeds: [embed] });
    }
}