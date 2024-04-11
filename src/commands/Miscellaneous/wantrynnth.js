const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const cc = require('../../../config.json');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('iwantrynnth')
        .setDescription('I want Rynnth for something')
        .addStringOption(option => option.setName('type')
            .setDescription('What type of problem are you having')
            .setRequired(true)
            .addChoices(
                { name: 'Bot Problems', value: 'b' },
                { name: 'Warlord Stuff', value: 'w' },
                { name: 'Im Lonely', value: 'l'}
            ))
        .addStringOption(option => option.setName('notes')
            .setDescription('Describe what you need rynnth for')
            .setRequired(true))
        .setDefaultPermission(false),
    async execute(i, bot){
        const notes = i.options.getString('notes');
        const type = i.options.getString('type');
        const channel = await i.guild.channels.cache.get(cc.Channels.WantRynnth);

        const embed = new EmbedBuilder()
                    .setTitle(`Someone wants you`)
                    .addFields(
                        { name: "User that wants you", value: `<@${i.member.id}> `, inline: false},
                        { name: "Type of request", value: `${type}`, inline: true},
                        { name: "Notes", value: `${notes}`, inline: false}
                        );

        await channel.send({ embeds: [embed] });
        switch(type){
            case 'b':
                return i.reply({ content: `See if someone else is online otherwise get to it soon, but i let rynnth know`, ephemeral: true});
            case 'w':
                return i.reply({ content: `There are 10 other warlords, but let rynnth know`, ephemeral: true});
            case 'l':
                return i.reply({ content: `Bruh, i let rynnth know`, ephemeral: true});
            default:
                return i.reply({ content: `Let Rynnth Know`, ephemeral: true});
        }

        

        


    }
}