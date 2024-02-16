const { SlashCommandBuilder, EmbedBuilder, codeBlock } = require('discord.js');
const relicDataModel = require('../../models/dbv2/wf_relicData');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('part')
        .setDescription('lets you see how many units we own for that part.')
        .addStringOption(option => option.setName('name').setDescription('Item Name').setRequired(true))
        .addStringOption(option => option.setName('part').setDescription('Part Name'))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id))){
            return i.reply({ content: "You're not a staff!", ephemeral: true});
        }

        const itemName = i.options.getString('name');
        let partName = i.options.getString('part');
        partName = partName || 'Set';
        const fullPartName = itemName.includes('Prime') ? `${itemName} ${partName}` : `${itemName} Prime ${partName}`;
        const result = await fetchItemPartCount(bot.gsapi, process.env.sheet, itemName, partName);

        await i.deferReply();
        if (Array.isArray(result) && result.length > 0) {
            let message = '';
            result.forEach(detail => {
                const paddedCount = detail.count.toString().padEnd(2, ' ');
                message += `${paddedCount} | ${detail.part} {${detail.color}}\n`;
            });
            const embed = new EmbedBuilder()
                .setTitle(`${itemName} Prime Set`)
                .setDescription(`${codeBlock('ml', message)}`)
                .setColor("#ffb347")
                .setTimestamp();
            i.editReply({ embeds: [embed]});
        } else if (result) {
            const relics = await relicDataModel.find({ "relics.rewards.part": fullPartName }).lean();
            const relicValues = await fetchRelicValues(bot.gsapi, process.env.treasury, relics);

            let message = '';

            const rarityAbbreviation = {
                'Common': 'C',
                'Uncommon': 'UC',
                'Rare': 'RA'
            };

            relics.forEach(relic => {
                relic.relics.forEach(r => {
                    r.rewards.forEach(reward => {
                        if (reward.part === fullPartName) {
                            const rarityAbbr = rarityAbbreviation[reward.rarity] || reward.rarity;
                            const vaulted = r.vaulted ? '{V}' : '';
                            const relicValue = relicValues[`${relic.type} ${r.name}`] || 'N/A';
                            const paddedRarity = rarityAbbr.padEnd(2, ' ');
                            const paddedValue = relicValue.padEnd(2, ' ');

                            message += `${paddedRarity} | ${paddedValue} | ${relic.type} ${r.name} ${vaulted}\n`;
                        }
                    });
                });
            });

            const embed = new EmbedBuilder()
                .setTitle(`${fullPartName} {${result.count}}`)
                .setDescription(`${codeBlock('ml', message)}`)
                .setColor("#ffb347")
                .setTimestamp();
            i.editReply({ embeds: [embed], ephemeral: true });
        }
        else {
            i.editReply({ content: 'Part not found or no count available.', ephemeral: true });
        }
    }
}

async function fetchItemPartCount(gsapi, spreadsheetId, itemName, partName) {
    const sheets = ['FRAMES', 'PRIMARIES', 'SECONDARIES', 'MELEES', 'OTHERS'];
    let details = partName.toLowerCase() === 'set' ? [] : null;

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

        let itemFound = false;
        let itemColumnIndex = -1;

        for (let rowIndex = 0; rowIndex < countRows.length; rowIndex++) {
            const countRow = countRows[rowIndex];

            if (!itemFound) {
                itemColumnIndex = countRow.findIndex(cell => cell && cell.toString().toLowerCase() === itemName.toLowerCase());
                if (itemColumnIndex !== -1) {
                    itemFound = true;
                    continue;
                }
            } else {
                const partCell = countRow[itemColumnIndex] ? countRow[itemColumnIndex].toString().toLowerCase() : '';
                const countCell = countRow[itemColumnIndex + 1] ? countRow[itemColumnIndex + 1] : 'N/A';

                const formatCell = formatRows[rowIndex] && formatRows[rowIndex].values[itemColumnIndex + 1];
                const bgColor = formatCell && formatCell.effectiveFormat && formatCell.effectiveFormat.backgroundColor;
                const colorType = bgColor ? getColorType(bgColor) : 'Unknown';

                if (!partCell || (rowIndex > 0 && !countRows[rowIndex - 1][itemColumnIndex])) {
                    break;
                }

                if (partName.toLowerCase() === 'set') {
                    details.push({ part: countRow[itemColumnIndex], count: countCell, color: colorType });
                } else if (partCell.includes(partName.toLowerCase())) {
                    details = { part: countRow[itemColumnIndex], count: countCell, color: colorType };
                    break;
                }
            }
        }

        if (details && (Array.isArray(details) && details.length > 0 || !Array.isArray(details))) break;
        itemFound = false;
    }

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