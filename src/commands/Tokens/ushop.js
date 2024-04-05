const { SlashCommandBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { Pagination } = require('pagination.djs');
const shop = require('../../models/dbv2/tokens_ushop.js');
const cc = require('../../../config.json');
const wallet = require('../../models/dbv2/tokens_universal.js');
const getWallet = require('../../functions/funcWallet.js');

const restrictionID= {
    "Treasurer": cc.Roles.Staff.Treasurer,
    "Recruiter": cc.Roles.Staff.Recruiter,
    "Designer": cc.Roles.Staff.Designer,
    "Decorator": cc.Roles.Staff.Decorator,
    "Farmer": cc.Roles.Staff.Farmer,
    "Staff": Object.values(cc.Roles.Staff),
    "Merchant": cc.Roles.TreasuryMerchant,
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('ushop')
        .setDescription('View the shop')
        .setDefaultPermission(false),

    async execute(i, bot) {
        
        var userWallet = await getWallet(i, i.member.id);
        const balance = userWallet.tokens;
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


            var rate = 1;
            for(const modifiers of item.modifier){
                if(i.member.roles.cache.some(r => r.id === restrictionID[modifiers])){
                    rate = 0.80;
                }
            }
            const itemRealPrice = Math.ceil(item.price * rate / 5) * 5;

            var itemRestriction = "";
            if(item.restriction != null){
                itemRestriction = ` (${item.restriction})`;
            }

            acc[pageIndex].addFields({ name: item.name +` ${itemRestriction}`, value: `${itemStatus} ${itemRealPrice}` });
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