const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const roleBlock = require('../../models/dbv2/roleblock');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleblock')
        .setDescription('Allows you to create/modify role blocks')
        .addStringOption(option => 
            option.setName('id')
            .setDescription('Role ID')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('mode')
            .setDescription('Which mode will you be using this command')
            .setRequired(true)
            .addChoices(
                {name: 'Add', value: 'add'},
                {name: 'Remove', value: 'remove'},
                {name: 'Bulk Add', value: 'bulk'},
                {name: 'View', value: 'view'}
            ))
        .addStringOption(option => 
            option.setName('roles')
            .setDescription('Roles')
            .setRequired(false))
        .setDefaultPermission(false),
   
    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => Object.values(cc.Roles.Admin).includes(r.id)))
            return i.reply({ content: "You're not a admin", ephemeral: true});

        const target = i.options.getString('id');
        const mode = i.options.getString('mode');
        const blocked = i.options.getString('roles');
        const roleList = await roleBlock.findOne({ role: target })

        if (!roleList) {
            const data = new roleBlock({ guildID: i.guild.id, role: target, blocked: [] });
            data.save();
        }

        switch (mode) {
            case 'add':
                roleList.blocked.push(blocked);
                roleList.save();
                await i.reply({ content: `Added **${blocked}** to the block list of ${target}`, ephemeral: true });
                break;
            case 'remove':
                roleList.blocked.pull(blocked);
                roleList.save();
                await i.reply({ content: `Removed **${blocked}** from the block list of ${target}`, ephemeral: true });
                break;
            case 'bulk':
                roleList.blocked.push(...blocked.split(','))
                roleList.save();
                await i.reply({ content: `Bulk added **${blocked.split(',')}** into the block list of ${target}`, ephemeral: true });
                break;
            case 'view':
                const embed = new EmbedBuilder()
                    .setColor('#000000')
                    .setDescription(`Role Block for <@&${target}>: <@&${roleList.blocked.join('> <@&')}>`)
                await i.reply({embeds: [embed], ephemeral: true});
                break;
        }
    },
};