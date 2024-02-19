const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, codeBlock, ButtonBuilder, ButtonStyle } = require('discord.js');
const cc = require('../../../config.json');
const relicDataModel = require('../../models/dbv2/wf_relicData');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('relic')
        .setDescription('acquires parts inside a relic and their stock information')
        .addStringOption(option => option.setName('relic').setDescription('Relic').setAutocomplete(true))
        .setDefaultPermission(false),
    async autocomplete(i, bot) {
        const focusedOption = i.options.getFocused(true);

        if (focusedOption.name === 'relic') {
            const focusedValue = focusedOption.value.toLowerCase();
            let relics = [];

            try {
                const allRelics = await getAllRelics();

                relics = allRelics
                    .filter(relic => `${relic.type} ${relic.name}`.toLowerCase().includes(focusedValue)) 
                    .slice(0, 25)
                    .map(relic => ({ name: `${relic.type} ${relic.name}`, value: `${relic.type} ${relic.name}` }));
            } catch (error) {
                console.error('Error fetching relics:', error);
            }

            await i.respond(relics);
        }
    },
    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id))){
            return i.reply({ content: "You're not a staff!", ephemeral: true});
        }
        
        const relicInput = i.options.getString('relic');
        const [relicType, relicName] = relicInput.split(' ');
        await i.deferReply();
        const relicData = await getRelicBreakdown(bot, relicType, relicName);

        if (!relicData) {
            return i.editReply({ content: "Failed to fetch data for the specified relic." });
        }

        const embed = new EmbedBuilder()
            .setTitle(relicData.name || 'Unknown')
            .setDescription(codeBlock('ml', relicData.rewards))
            .setColor("#cfa3ff");

        await i.editReply({ embeds: [embed] });
    }
}

async function getAllRelics() {
    try {
        const data = await relicDataModel.find({});
        let allRelics = [];

        data.forEach(doc => {
            doc.relics.forEach(relic => {
                allRelics.push({
                    type: doc.type,
                    name: relic.name,
                    vaulted: relic.vaulted,
                    rewards: relic.rewards
                });
            });
        });

        return allRelics;
    } catch (error) {
        console.error('Error fetching all relics:', error);
        return [];
    }
}

async function getRelicBreakdown(bot, relicType, relicName) {
    try {
        const relicData = await relicDataModel.findOne({
            type: relicType,
            'relics.name': relicName
        }).lean();

        if (!relicData) return null;

        const relicValues = await fetchRelicValues(bot.gsapi, process.env.treasury, [{ type: relicType, relics: [{ name: relicName }] }]);
        const relicValue = relicValues[`${relicType} ${relicName}`] || 'N/A';

        let details = {
            name: `${relicType} ${relicName} {${relicValue}}`,
            rewards: ''
        };

        let data = [];
        const rarityAbbreviation = {
            'Common': 'C',
            'Uncommon': 'UC',
            'Rare': 'RA'
        };
        
        relicData.relics.forEach(r => {
            if (r.name === relicName) {
                r.rewards.forEach(reward => {
                    const rarityAbbr = rarityAbbreviation[reward.rarity] || reward.rarity;
                    if (!reward.part.includes('Forma')) {
                        const breakdown = reward.part.split(' Prime ');
                        let itemName = breakdown[0]; // Remaining is the item name, e.g., "Latron"
                        let partName = breakdown[1].split(' ')[0]; // Last part is the part name, e.g., "Barrel"

                        data.push({
                            technicalName: reward.part,
                            name: itemName,
                            part: partName,
                            rarity: rarityAbbr,
                            color: '',
                            value: ''
                        });
                    } else {
                        data.push({
                            technicalName: reward.part,
                            name: 'Forma',
                            part: 'Blueprint',
                            rarity: rarityAbbr,
                            color: '',
                            value: ''
                        });
                    }
                });
            }
        });

        details.rewards = await fetchItemPartCount(bot.gsapi, process.env.sheet, data);
        return details;
    } catch (error) {
        console.error('Error in getRelicBreakdown:', error);
        return null;
    }
}

async function fetchRelicValues(gsapi, spreadsheetId, relics) {
    const range = 'RAW DATA!A:B';
    const response = await gsapi.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    const relicValues = {};

    relics.forEach(relic => {
        relic.relics.forEach(r => {
            const relicFullName = `${relic.type} ${r.name}`;
            const row = rows.find(row => row[0] === relicFullName);
            if (row) {
                relicValues[relicFullName] = row[1]; 
            }
        });
    });

    return relicValues;
}

async function fetchItemPartCount(gsapi, spreadsheetId, data) {
    const range = 'MANAGERS!Q:S';  
    const response = await gsapi.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    let results = [];

    const partsRequiringHalfCount = [
        "Afuris Barrel", "Afuris Receiver", "Akarius Barrel", "Akarius Receiver",
        "Akbolto Barrel", "Akbolto Receiver", "Akjagara Barrel", "Akjagara Receiver",
        "Aksomati Barrel", "Aksomati Receiver", "Akstiletto Barrel", "Akstiletto Receiver",
        "Ankyros Blade", "Ankyros Gauntlet", "Bo Ornament", "Dual Kamas Blade",
        "Dual Kamas Handle", "Dual Keres Blade", "Dual Keres Handle", "Fang Blade",
        "Fang Handle", "Glaive Blade", "Guandao Blade", "Gunsen Blade", "Gunsen Handle",
        "Hikou Pouch", "Hikou Stars", "Kogake Boot", "Kogake Gauntlet", "Kronen Blade",
        "Kronen Handle", "Nami Skyla Blade", "Nami Skyla Handle", "Ninkondi Handle",
        "Orthos Blade", "Spira Blade", "Spira Pouch", "Tekko Blade", "Tekko Gauntlet",
        "Tipedo Ornament", "Venka Blades", "Venka Gauntlet"
    ];

    data.forEach(item => {
        const row = rows.find(row => {
            let [itemName, partName] = row;

            const fullName = item.technicalName.includes('Prime') && !item.name.includes('Prime')
                ? `${item.name} Prime ${item.part}`
                : `${item.name} ${item.part}`;

            const rowName = `${itemName} ${partName}`;
            return fullName === rowName;
        });

        if (row) {
            let [_, __, countStr] = row;
            let count = parseInt(countStr, 10);
            if (isNaN(count)) count = 0;

            let countBefore = count;
            const fullPartName = `${item.name} ${item.part}`;
            if (partsRequiringHalfCount.includes(fullPartName)) {
                count = Math.ceil(count / 2);
            }

            const colorType = getColorType(count);
            const formattedPart = item.part.replace(/Neuroptics/g, 'Neuro').replace(/Blueprint/g, 'BP');
            const formattedName = item.name + (item.technicalName.includes('prime') ? ' Prime' : '');

            results.push({
                technicalName: `${formattedName} ${formattedPart}`,
                name: formattedName,
                part: formattedPart,
                rarity: item.rarity,
                color: colorType,
                value: countBefore 
            });
        }
    });

    data.forEach(item => {
        if (item.technicalName.includes('Forma')) {
            results.push({
                ...item,
                color: '',
                value: '' 
            });
        }
    });

    const rarityOrder = { 'C': 1, 'UC': 2, 'RA': 3 };
    results.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

    let message = '';
    results.forEach(item => {
        const paddedRarity = String(item.rarity).padEnd(2, ' ');
        const paddedValue = String(item.technicalName).includes('Forma') ? '  ' : String(item.value).padEnd(2, ' ');
        const colorCode = String(item.technicalName).includes('Forma') ? '' : `{${item.color}}`;
        message += `${paddedRarity} | ${paddedValue} | ${item.name} ${item.part} ${colorCode}\n`;
    });

    return message;
}

function getColorType(count) {
    if (count >= 0 && count <= 7) return 'ED';
    if (count >= 8 && count <= 15) return 'RED';
    if (count >= 16 && count <= 31) return 'ORANGE';
    if (count >= 32 && count <= 64) return 'YELLOW';
    if (count >= 65) return 'GREEN';
    return 'Unknown';
}