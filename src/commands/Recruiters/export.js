const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const db = require('../../models/recruitment/recruit')
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('export')
        .setDescription('Exports all recruits of a given user')
        .addUserOption(option => option.setName('target').setDescription('Mentioned user').setRequired(true))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Recruiter.includes(r.id)))
			return i.reply({ content: "You're not a recruiter!", ephemeral: true});

        const user = i.options.getUser('target');
        const data = await db.findOne({recruiter: user ? user.id : i.user.id });
        if (!data) 
            return i.reply({ content: "Unable to locate you within the database", ephemeral: true});

        let recruits = "Recruited, Kingdom, Recruiter, Clan Join, Server Join\n";
        db.find({ recruiter: user ? user.id : i.user.id }).exec( async (e, r) => {
            for (index = 0; index < r.length; index++) {
                recruits += `${r[index].userID}, ${r[index].kingdom}, ${r[index].recruiter}, ${r[index].clanJoin}, ${r[index].serverJoin}\n`;
            }
            const attachment = new AttachmentBuilder(Buffer.from(recruits, 'utf-8'), { name: 'ExportedData.csv' });
            await i.reply({ files: [attachment], ephemeral: true})
        });
    },

};