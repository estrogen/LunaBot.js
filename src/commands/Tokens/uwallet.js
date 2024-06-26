const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const wallet = require('../../models/dbv2/tokens_universal');
const getWallet = require('../../functions/funcWallet.js');
const getRanking = require('../../functions/funcWalletRank.js');
const permission = require('../../functions/funcPermissions.js');

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

        //Get Wallet
        let userWallet = await getWallet(i, user.id);

        //Additional Data for View
        const allTransactions = userWallet.transactions;
        const lastThreeItems = allTransactions.slice(-3);
        var formattedData;

        //Wallet Ranking
        const rank = await getRanking(userWallet);

        //Format Data

        function formatData(data) {
            return data.map(item => {
              const { date, identifier, desc, amount } = item;
              const simplifiedDate = new Date(date).toISOString().split('T')[0];
              const cleanedDesc = desc ? desc.replace(/\(\d+\)/g, '') : '';
              return `${simplifiedDate} | ${cleanedDesc.trim()} | ${amount}`;
            });
        }
        if(i.user.id == user || permission(i.member, "Manager")){
            formattedData = formatData(lastThreeItems).join('\n');
        }
        else{
            formattedData = "Hidden";
        }
        

        const embed = new EmbedBuilder()
            .setTitle(`${user.globalName}'s Wallet`)
            .setColor(color)
            .setThumbnail(avatarURL)
            .addFields(
                { name: 'Tokens', value: `${userWallet.tokens.toFixed(2)} :gem:`, inline: true },
                { name: 'Rank', value: `${rank} :medal:`, inline: true},
                { name: 'Recent Transactions', value: `\`\`\`haskell\n${formattedData}\`\`\``, inline: false},);
            

        await i.reply({ embeds: [embed] });
    }
    
}