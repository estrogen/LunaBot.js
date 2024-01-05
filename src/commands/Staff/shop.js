const { SlashCommandBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { Pagination } = require('pagination.djs');
const shop = require('../../models/shop/shop');
const cc = require('../../../config.json');
const walletModels = {
    recruiter: require('../../models/wallets/recruiterWallet'),
    treasury: require('../../models/wallets/treasuryWallet'),
    designer: require('../../models/wallets/designerWallet'),
    events: require('../../models/wallets/eventWallet'),
    decorator: require('../../models/wallets/decoratorWallet'),
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View the shop for specific departments')
        .addStringOption(option => option.setName('department')
            .setDescription('Which department shop you want to view')
            .setRequired(true)
            .addChoices(
                { name: 'Recruiter', value: 'recruiter' },
                { name: 'Treasury', value: 'treasury' },
                { name: 'Designer', value: 'designer' },
                { name: 'Events', value: 'events' },
                { name: 'Decorator', value: 'decorator' }
            ))
        .setDefaultPermission(false),

    async execute(i, bot) {
        const department = i.options.getString('department');
        const WalletModel = walletModels[department];
        if (!WalletModel) {
            return i.reply({ content: 'Invalid department selected', ephemeral: true });
        }

        const userWallet = await WalletModel.findOne({ userID: i.member.id });
        if (!userWallet || userWallet.tokens <= 0) {
            return i.reply({ content: 'You don’t have tokens for this department', ephemeral: true });
        }

        const balance = userWallet.tokens;
        const departmentShop = await shop.findOne({ "team": department });
        if (!departmentShop || !departmentShop.items || departmentShop.items.length === 0) {
            return i.reply({ content: 'No items in this shop department', ephemeral: true });
        }

        const embedColor = '#FFB347';
        const itemsPerPage = 10;
        const embeds = departmentShop.items.reduce((acc, item, index) => {
            const pageIndex = Math.floor(index / itemsPerPage);
            if (!acc[pageIndex]) {
                acc[pageIndex] = new EmbedBuilder()
                    .setTitle(`${department[0].toUpperCase() + department.slice(1)} Store`)
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

    rolePerms: cc.Roles.Staff,
};