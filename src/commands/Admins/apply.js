const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const apps = require('../../models/dbv2/applications');
const cc = require('../../../config.json');
const permission = require('../../functions/funcPermissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Lets admins create a button for an application (Must exist in the db already')
        .addStringOption(option => 
            option.setName('name')
            .setDescription('Name of the application from database')
            .setRequired(true))
        .setDefaultPermission(false),
   
    async execute(i, bot) {
        if(!permission(i.member, "Admin"))
            return i.reply({ content: "You're not a admin", ephemeral: true});

        const name = i.options.getString('name');
        const data = [];
        data.push(await apps.findOne({ name: name }));
        if (!data[0])
            return i.reply({ content: "That button doesn't exist in the database.", ephemeral: true })

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`${data[0].name}`)
                    .setLabel(`${data[0].description}`)
                    .setStyle(ButtonStyle.Success),
        );

        await i.reply({ content: "Button getting deployed", ephemeral: true});
        await i.channel.send({ content: '\u200B', components: [row] })
    },
};