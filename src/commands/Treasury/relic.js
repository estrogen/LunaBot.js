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
        
        const relic = i.options.getString('relic');
        await i.deferReply();
        const relicData = await getRelicBreakdown(bot, relic);

        if (!relicData) {
            return i.editReply({ content: "Failed to fetch data for the specified relic." });
        }

        const embed = new EmbedBuilder()
            .setTitle(`${relicData.name || 'Unknown'}`)
            .setDescription(codeBlock('ml', relicData.rewards))
            .setColor("#cfa3ff")

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

async function getRelicBreakdown(bot, selectedRelic) {
    const relics = await relicDataModel.find({}).lean();
    const relicValues = await fetchRelicValues(bot.gsapi, process.env.treasury, relics);
    let details = {
        name: '',
        rewards: ''
    }

    const rarityAbbreviation = {
        'Common': 'C',
        'Uncommon': 'UC',
        'Rare': 'RA'
    };

    const data = [];

    for (const relic of relics) {
        if (selectedRelic.includes(relic.type)) {
            for (const r of relic.relics) {
                if (selectedRelic.includes(r.name)) {
                    for (const reward of r.rewards) {
                        const rarityAbbr = rarityAbbreviation[reward.rarity] || reward.rarity;
                        const relicValue = relicValues[`${relic.type} ${r.name}`] || 'N/A';
                        details.name = `${relic.type} ${r.name} {${relicValue}}`;
                        if (!reward.part.includes('Forma')) {
                            const breakdown = reward.part.split(' Prime ');
                            const part = breakdown[1].split(' ')[0];
                            data.push({
                                technicalName: reward.part,
                                name: breakdown[0],
                                part: part,
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
                    }
                }
            }
        }
    }    
    details.rewards = await fetchItemPartCount(bot.gsapi, process.env.sheet, data);
    return details;
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
    const sheets = ['FRAMES', 'PRIMARIES', 'SECONDARIES', 'MELEES', 'OTHERS'];
    let results = [];

    for (const sheet of sheets) {
        const countResponse = await gsapi.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheet}!A:Z`,
        });
        const countRows = countResponse.data.values;

        const formatResponse = await gsapi.spreadsheets.get({
            spreadsheetId,
            ranges: `${sheet}!A:Z`,
            includeGridData: true,
        });
        const formatRows = formatResponse.data.sheets[0].data[0].rowData;

        for (const item of data) {
            let itemFound = false;
            let itemColumnIndex = -1;

            for (let rowIndex = 0; rowIndex < countRows.length; rowIndex++) {
                const countRow = countRows[rowIndex];

                if (!itemFound) {
                    itemColumnIndex = countRow.findIndex(cell => cell && cell.toString().toLowerCase() === item.name.toLowerCase());
                    if (itemColumnIndex !== -1) {
                        itemFound = true;
                    }
                }

                if (itemFound) {
                    const partCell = countRow[itemColumnIndex] ? countRow[itemColumnIndex].toString().toLowerCase() : '';
                    const countCell = countRow[itemColumnIndex + 1] ? countRow[itemColumnIndex + 1] : '';

                    const formatCell = formatRows[rowIndex] && formatRows[rowIndex].values[itemColumnIndex + 1];
                    const bgColor = formatCell && formatCell.effectiveFormat && formatCell.effectiveFormat.backgroundColor;
                    const colorType = bgColor ? getColorType(bgColor) : 'Unknown';

                    if (!partCell || (rowIndex > 0 && !countRows[rowIndex - 1][itemColumnIndex])) {
                        continue;
                    }

                    if (partCell.includes(item.part.toLowerCase())) {
                        item.value = countCell;
                        item.color = colorType;

                        const existingItemIndex = results.findIndex(res => res.name === item.name && res.part === item.part);
                        if (existingItemIndex !== -1) {
                            results[existingItemIndex] = item;
                        } else {
                            results.push(item);
                        }
                    }
                }
            }
        }
    }

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
        const paddedRarity = item.rarity.padEnd(2, ' ');
        const paddedValue = item.technicalName.includes('Forma') ? '  ' : item.value.padEnd(2, ' ');
        const colorCode = item.technicalName.includes('Forma') ? '' : `{${item.color}}`;
        message += `${paddedRarity} | ${paddedValue} | ${item.name} ${item.part} ${colorCode}\n`;
    });

    console.log("Final message:", message);

    return message;

}

function getColorType(bgColor) {
    const types = {
        'ED': "#20124D",
        'RED': "#990000",
        'ORANGE': "#B45F06",
        'YELLOW': "#BF9000",
        'GREEN': "#38761D",
    };

    const hexColor = rgbToHex(bgColor.red || 0, bgColor.green || 0, bgColor.blue || 0).toUpperCase();
    const colorType = Object.keys(types).find(key => types[key] === hexColor) || 'Unknown';
    return colorType;
}

function rgbToHex(r, g, b) {
    function componentToHex(c) {
        const hex = Math.round((c || 0) * 255).toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}