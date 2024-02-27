const { SlashCommandBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { Pagination } = require('pagination.djs');
const shop = require('../../models/dbv2/tokens_ushop');
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ushop')
        .setDescription('View the shop')
        .setDefaultPermission(false),

    async execute(i, bot) {
        
        const userWallet = await wallet.findOne({ userID: i.member.id });
        console.log(userWallet);
        const balance = userWallet.tokens;
        console.log(balance);
        const items = await shop.find();

        const embedColor = '#cfa3ff';
        const itemsPerPage = 10;
        const embeds = items.reduce((acc, item, index) => {
            const pageIndex = Math.floor(index / itemsPerPage);
            if (!acc[pageIndex]) {
                acc[pageIndex] = new EmbedBuilder()
                    .setTitle(`Store`)
                    .setColor(embedColor);
            }
            const itemStatus = balance >= item.price ? ':white_check_mark:' : ':x:';
            acc[pageIndex].addFields({ name: item.name, value: `${itemStatus} ${item.price}` });
            return acc;
        }, []);

        const pagination = new Pagination(i, {
            firstEmoji: '⏮', // First button emoji
            prevEmoji: '◀️', // Previous button emoji
            nextEmoji: '▶️', // Next button emoji
            lastEmoji: '⏭', // Last button emoji
            idle: 60000, // idle time in ms before the pagination closes
            ephemeral: true, // ephemeral reply
            buttonStyle: ButtonStyle.Secondary, // button style
            loop: true // loop through the pages
        });

        pagination.setEmbeds(embeds).render();
    },

};