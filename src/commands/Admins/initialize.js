const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const cc = require('../../../config.json');
const recruits = require('../../models/dbv2/wf_recruitData');
const relicDataModel = require('../../models/dbv2/wf_relicData');
const wallet = require('../../models/dbv2/tokens_universal');
const recwallet = require('../../models/dbv2/tokens_recruit');
const trewallet = require('../../models/dbv2/tokens_treasure');
const decowallet = require('../../models/dbv2/tokens_deco');
const designwallet = require('../../models/dbv2/tokens_design');


const relicTypes = ['Lith', 'Meso', 'Neo', 'Axi'];
const baseUrl = 'https://api.warframestat.us/items/search/';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('initialize')
        .setDescription('Allows ally to initialize some important things')
        .addStringOption(option => 
            option.setName('embed')
            .setDescription('Which embed youll be setting')
            .setRequired(true)
            .addChoices(
                {name: 'Welcome Embed', value: 'we'},
                {name: 'Update Relic Data', value: 'rd'},
                {name: 'HK -> TK', value: 'uk'},
                {name: 'Convert Tokens', value: 'dest'},
                {name: 'Rynnth test', value: 'test'}
            ))
        .setDefaultPermission(false),
   
    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Admin.includes(r.id)))
            return i.reply({ content: "You're not a admin", ephemeral: true});

        const option = i.options.getString('embed');
        await i.deferReply();
        switch (option) {
            case 'we':
                await i.editReply({ content: "Embed getting created!", ephemeral: true});
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('applyWarframe')
                            .setLabel('Here for Warframe')
                            .setStyle(ButtonStyle.Success),
                    );

                const embed = new EmbedBuilder()
                    .setTitle("‿︵‿︵‿︵‿︵‿୨♡ Entrance ♡୧‿︵‿︵‿︵‿︵‿")
                    .setColor("#ff7ba3")
                    .setDescription("Welcome to **Anime Kingdom** :cherry_blossom:\nWe are a **private** Warframe community!\nIf you would like to join this community you have **two** options.")
                    .addFields([
                        { name: "Applying to join the warframe clan.", value: "Do you play Warframe? Do you want to join a clan full of anime lovers? Then Anime Kingdom is the place for you, simply hit the green button under this message to start an application, after the application is done you will be contacted by a recruiter. (Make sure you have enable server DMs on)", inline: false}, 
                        { name: "The guest system.", value: "Do you not play Warframe but still would like to be inside of the community? Well you can! We have a guest system which allows those not inside of the Warframe clan to join the community, simply hit the red button under this message and follow instructions in new channels!", inline: false},
                        { name: "Event Guest System", value: "If you were invited to participate in an event please press the {color} button below this message. You will need to answer a few questions before you can join the server. Once you join, you will be able to enjoy all our events! Have fun and welcome to our community!"}
                    ])
                    .setImage(i.guild.bannerURL({ dynamic: true, format: "png", size: 2048}))
                i.channel.send({ embeds: [embed], components: [row] });
                break;

            case 'rd':
                for (const type of relicTypes) {
                    const relicsData = await getRelicsDataForType(type);
                    await updateDatabaseWithRelics(type, relicsData);
                }
                i.editReply({ content: "Relic data updated successfully.", ephemeral: true});
                break;
            case 'uk':
                const idMappings = {
                    "1193510188955746394": "890240560248524857", // TK

                    };
    
                    for (const [oldId, newId] of Object.entries(idMappings)) {
                        await recruits.updateMany({ kingdom: oldId }, { $set: { kingdom: newId } });
                    }
    
                    break;
            case 'dest':
                i.editReply({ content: "Don't use this."});
                break;
                const oldwallet = await decowallet.find({ userID: { $exists: true }});
                for (const user of oldwallet) {
                    const newtokens = user.tokens ? user.tokens * 5 : 0;
                    let userWallet = await wallet.findOne({ userID: user.userID });
                    console.log(`${user.userID} - ${user.tokens}`);
                    if (!userWallet) {
                        userWallet = new wallet({
                            userID: user.userID,
                            tokens: newtokens,
                            transactions: [{
                                date: i.createdAt,
                                identifier: 'Init',
                                desc: "Init Wallet",
                                amount: 0
                            },
                            {
                                date: i.createdAt,
                                identifier: 'Other',
                                desc: `Migration: Decorator Tokens - ${user.tokens}`,
                                amount: newtokens
                            }
                            ]
                        });
                    } else {
                        userWallet.tokens += newtokens;
                        userWallet.transactions.push({
                            date: i.createdAt,
                            identifier: 'Other',
                            desc: `Migration: Decorator Tokens - ${user.tokens}`,
                            amount: newtokens
                        });
                    }
                    
                    await userWallet.save();
                }
                console.log(`Done merge.`);
                i.editReply({ content: "Data merged."});
                break;
        }
        console.log("Done.");
    },
};

const updateDatabaseWithRelics = async (type, relicsData) => {
    let relicTypeEntry = await relicDataModel.findOne({ type: type });

    if (!relicTypeEntry) {
        relicTypeEntry = new relicDataModel({ type: type, relics: [] });
    }

    for (const relic of relicsData) {
        const existingRelic = relicTypeEntry.relics.find(r => r.name === relic.name);

        if (!existingRelic) {
            relicTypeEntry.relics.push(relic);
        }
    }

    await relicTypeEntry.save();
};

const getRelicsDataForType = async (type) => {
    try {
        const response = await axios.get(`${baseUrl}${type.toLowerCase()}`);
        const data = response.data;

        return data
            .filter(item => item.category === 'Relics' && item.name.includes('Intact') && item.tradable)
            .map(relic => {
                const sortedRewards = relic.rewards.sort((a, b) => b.chance - a.chance);
                const categorizedRewards = sortedRewards.map((reward, index) => {
                    let rarity;
                    if (index < 3) {
                        rarity = 'Common';
                    } else if (index < 5) {
                        rarity = 'Uncommon';
                    } else {
                        rarity = 'Rare';
                    }

                    return {
                        part: reward.item.name || 'Unknown Part', 
                        rarity: rarity,
                    };
                });

                return {
                    name: relic.name.split(' ')[1],
                    vaulted: relic.vaulted || false,
                    rewards: categorizedRewards,
                };
            });
    } catch (error) {
        console.error(`Error fetching ${type} relics:`, error);
        return [];
    }
};