const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const farmerCont = require('../../models/dbv2/wf_farmerContributions');

const resourceList = [
    {name: 'Credits', value: 'Credits'},
    {name: 'Alloy Plate', value: 'Alloy Plate'},
    {name: 'Asterite', value: 'Asterite'},
    {name: 'Aucrux Capacitors', value: 'Aucrux Capacitors'},
    {name: 'Bracoid', value: 'Bracoid'},
    {name: 'Carbides', value: 'Carbides'},
    {name: 'Circuits', value: 'Circuits'},
    {name: 'Control Module', value: 'Control Module'},
    {name: 'Copernics', value: 'Copernics'},
    {name: 'Cryotic', value: 'Cryotic'},
    {name: 'Cubic Diodes', value: 'Cubic Diodes'},
    {name: 'Detonite Ampule', value: 'Detonite Ampule'},
    {name: 'Ferrite', value: 'Ferrite'},
    {name: 'Fieldron Sample', value: 'Fieldron Sample'},
    {name: 'Forma', value: 'Forma'},
    {name: 'Fresnels', value: 'Fresnels'},
    {name: 'Gallium', value: 'Gallium'},
    {name: 'Gallos Rods', value: 'Gallos Rods'},
    {name: 'Hexenon', value: 'Hexenon'},
    {name: 'Isos', value: 'Isos'},
    {name: 'Kesslers', value: 'Kesslers'},
    {name: 'Komms', value: 'Komms'},
    {name: 'Morphics', value: 'Morphics'},
    {name: 'Mutagen Sample', value: 'Mutagen Sample'},
    {name: 'Nano Spores', value: 'Nano Spores'},
    {name: 'Neural Sensors', value: 'Neural Sensors'},
    {name: 'Neurodes', value: 'Neurodes'},
    {name: 'Nitain Extract', value: 'Nitain Extract'},
    {name: 'Nullstones', value: 'Nullstones'},
    {name: 'Orokin Cell', value: 'Orokin Cell'},
    {name: 'Oxium', value: 'Oxium'},
    {name: 'Plastids', value: 'Plastids'},
    {name: 'Polymer Bundle', value: 'Polymer Bundle'},
    {name: 'Pustrels', value: 'Pustrels'},
    {name: 'Rubedo', value: 'Rubedo'},
    {name: 'Salvage', value: 'Salvage'},
    {name: 'Tellurium', value: 'Tellurium'},
    {name: 'Ticor Plate', value: 'Ticor Plate'},
    {name: 'Titanium', value: 'Titanium'},
    {name: 'Trachons', value: 'Trachons'},
    {name: 'Detonite Injector', value: 'Detonite Injector'},
    {name: 'Mutagen Mass', value: 'Mutagen Mass'},
    {name: 'Fieldron', value: 'Fieldron'}];


module.exports = {
    data: new SlashCommandBuilder()
        .setName('farmcontribute')
        .setDescription('Null')
        .addUserOption(option => option.setName('user').setDescription('User Donating').setRequired(true))
        .addStringOption(option => option.setName('clan')
            .setDescription('Clan')
            .setRequired(true)
            .addChoices(
                {name: 'Andromeda Kingdom', value: 'Andromeda'},
                {name: 'Imouto Kingdom', value: 'Imouto'},
                {name: 'Heavens Kingdom', value: 'Heavens'},
                {name: 'Tsuki Kingdom', value: 'Tsuki'},
                {name: 'Waifu Kingdom', value: 'Waifu'},
                {name: 'Yuri Kingdom', value: 'Yuri'},
                {name: 'Cowaii Kingdom', value: 'Cowaii'},
                {name: 'Manga Kingdom', value: 'Manga'}
            ))
        .addStringOption(option => option.setName('resource')
            .setDescription('Resource')
            .setRequired(true)
            .setAutocomplete(true))
        .addNumberOption(option => option.setName('amount').setDescription('Amount of Resources Donate').setRequired(true))
        .setDefaultPermission(false),
    async autocomplete(i, bot){


        

        const focusedOption = i.options.getFocused(true);
        const focusedValue = focusedOption.value.toLowerCase();


        if (focusedOption.name === 'resource') {
            let choices = [];

            items = resourceList.filter(item => item.name.toLowerCase().startsWith(focusedValue)).slice(0, 25);
            return await i.respond(items);
        }
    },
    async execute(i, bot) {
        if(resourceList.some(({name}) => name === (i.options.getString('resource')))){

            const clan = i.options.getString('clan');
            const user = i.options.getUser('user');
            const amount = i.options.getNumber('amount');
            const resource = i.options.getString('resource');
            var userContributions = await farmerCont.findOne({ userID: user.id, clan: clan });
            if(!userContributions){
                userContributions = new farmerCont({
                    userID: user.id,
                    clan: clan,
                    contributions: {
                        date: i.createdAt,
                        resource: resource,
                        amount: amount,
                        inputUser: i.member.id
                    }
                })
            }
            else{
                userContributions.contributions.push({
                    date: i.createdAt,
                    resource: resource,
                    amount: amount,
                    inputUser: i.member.id
                });
            }

            await userContributions.save();

            await i.reply({content: `Logged that ${user} has donated ${amount} ${resource} to ${clan}`,ephemeral: true});
        }
        else{
            await i.reply({content: `Invalid Resource`,ephemeral: true});
        }

    }
}