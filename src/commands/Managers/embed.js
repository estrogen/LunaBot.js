const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('../../../config.json');
const permission = require('../../functions/funcPermissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Allows staff to make custom embeds with json')
        .addStringOption(option => option.setName('json').setDescription('JSON of the embed you want to send').setRequired(true))
        .addStringOption(option => option.setName('id').setDescription('Message id of the embed you want to edit').setRequired(false))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!permission(i.member, "Manager"))
            return i.reply({ content: "You're not upper staff!", ephemeral: true});

        const text = i.options.getString('json');
        const json = JSON.parse(text);
        const message = i.options.getString('id');
        const embed = new EmbedBuilder(json);
        if (message) {
            await i.reply({ content: "Editing your custom embed...", ephemeral: true });
            const msg = await i.channel.messages.fetch(message);
            await msg.edit({ embeds: [embed] });
        } else {
            await i.reply({ content: "Sending your custom embed...", ephemeral: true });
            await i.channel.send({ embeds: [embed] });
        }
    },

};