const { SlashCommandBuilder } = require('discord.js');
const recruits = require('../../models/recruitment/recruit');
const moment = require("moment");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('convert')
        .setDescription('Converts all recruiter logs to unix')
        .setDefaultPermission(false),
   
    async execute(i, bot) {
        if(!i.member.roles.cache.has("575433746296209418")) 
            return i.reply({ content: "You're not ally", ephemeral: true});

        i.reply({ content: "Attempting to convert all timestamps!", ephemeral: true })
        var db = recruits.find();
        (await db).forEach(async function (doc) {
            if (isNaN(moment(doc.serverJoin).unix()) || isNaN(moment(doc.clanJoin).unix())) {
                return
            }
            let res = await recruits.updateOne(
                { _id: doc._id },
                { clanJoin: moment(doc.clanJoin).unix(), 
                serverJoin: moment(doc.serverJoin).unix() },
                { rawResult: true }
            );
            console.log('[Crescent]'.blue, res.modifiedCount);
        });
    },

    rolePerms: ["575433746296209418"],
};