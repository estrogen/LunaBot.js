const { SlashCommandBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { Pagination } = require('pagination.djs');
const bl = require('../../models/guild/blacklist');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Blacklists words for certain channels/applications.')
        .addStringOption(option => 
            option.setName('list')
            .setDescription('Which blacklist you want to interact with')
            .setRequired(true)
            .addChoices(
                {name: 'Recruiter', value: 'recruiters'},
                {name: 'Scam Spam', value: 'scam'}
            )
        )
        .addStringOption(option => 
            option.setName('interaction')
            .setDescription('How you want to interact with the blacklist')
            .setRequired(true)
            .addChoices(
                {name: 'Add', value: 'add'},
                {name: 'Remove', value: 'remove'},
                {name: 'View', value: 'view'}
            )
        )
        .addStringOption(option => 
            option.setName('word')
            .setDescription('Word you may want to add/remove')
            .setRequired(true)
        )
        .setDefaultPermission(false),
    
    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Admin.includes(r.id)))
            return i.reply({ content: "You're not a admin", ephemeral: true});

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

        const list = i.options.getString('list');
        const type = i.options.getString('interaction');
        const word = i.options.getString('word');
        const data = [];
        data.push(await bl.findOne({ "name": list }));
        switch (type) {
            case "add":
                if (!word) return i.reply({ content: "No word has been provided.", ephemeral: true });
                data[0].words.push(word);
                data[0].save();
                i.reply({ content : `**${word}** has been blacklisted!`, ephemeral: true });
                break;
            case "remove":
                if (!word) return i.reply({ content: "No word has been provided.", ephemeral: true });
                data[0].words.pull(word);
                data[0].save();
                i.reply({ content : `**${word}** has been removed from the blacklist!`, ephemeral: true });
                break;
            case "view":
                const embeds = [];
                let k = 15;
                for (let l = 0; l < data[0].words.length; l += 15) {
                    const words = data[0].words.slice(l, k);
                    k += 15;
                    const msg = words.map(p => `${p}`).join('\n');
                    const embed = new EmbedBuilder()
                        .setTitle('Blacklisted words')
                        .setColor('#FF6961')
                        .setDescription(`${msg}`)
                    embeds.push(embed);
                }
                
                pagination.setEmbeds(embeds, (embed, index, array) => {
                    return embed.setFooter({ text: `Page: ${index + 1}/${array.length}` });
                });
                pagination.render();
                break;
        }
    },

    rolePerms: cc.Roles.Admin,
};