const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const farmerCont = require('../../models/dbv2/wf_farmerContributions');
const stored_Data = require('../../models/dbv2/stored_Data');
const wallet = require('../../models/dbv2/tokens_universal');


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

        if (focusedOption.name === 'resource') {

            const focusedValue = focusedOption.value.toLowerCase();
            let resources = [];
            
            try {
                const rdata = await stored_Data.findOne({ "team": 'farmerresources' });
                if (rdata && rdata.items && rdata.items.length > 0) {
                    resources = rdata.items
                        .filter(item => item.name.toLowerCase().includes(focusedValue))
                        .slice(0, 25)
                        .map(item => ({ name: item.name, value: item.name })); 
                }
            } catch (error) {
                console.error(`Error fetching resources for farmers`, error);
            }

            await i.respond(resources);
        }
    },
    async execute(i, bot) {
        const clan = i.options.getString('clan');
        const user = i.options.getUser('user');
        const amount = i.options.getNumber('amount');
        const resource = i.options.getString('resource');
        const dbresource = await stored_Data.findOne({ "team": "farmerresources", "items.name": resource.toLowerCase() });
        const resourceVal = dbresource.items.find(item => item.name === resource.toLowerCase())

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
        //Token stuff

        var userWallet =  await wallet.findOne({ userID: user.id });
        const rvalue = amount /resourceVal.amount;

        if (!userWallet) {
            userWallet = new wallet({
                userID: user.id,
                tokens: 0,
                transactions: 
                    {date: i.createdAt,
                    identifier: 'Init',
                    desc: "Init Wallet",
                    amount: 0}
            });
        }

        userWallet.tokens += rvalue;
        userWallet.transactions.push({
            date: i.createdAt,
            identifier: 'Farmer',
            desc: `Farmer: Donated ${amount} ${resource} to ${clan} - ${i.member.user.username}(${i.member.id})`,
            amount: rvalue
        });
        await userWallet.save();

        await i.reply({content: `Logged that ${user} has donated ${amount} ${resource} to ${clan} and receieved ${rvalue} tokens`,ephemeral: true});
    }


}
async function findItem(itemName) {
    const normalizedItemName = itemName.toLowerCase(); 
    const store = await stored_Data.findOne({ "team": "farmerresources", "items.name": normalizedItemName });
    if (!store) return null;
    const storeItem = store.items.find(item => item.name === normalizedItemName);
    console.log(storeItem);
    return {storeItem};
}