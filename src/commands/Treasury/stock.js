const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, codeBlock } = require('discord.js');
const { Pagination } = require('pagination.djs');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('Displays stock of all items by color type')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Color type of the items')
                .setRequired(true)
                .addChoices(
                    { name: 'ED', value: 'ED' },
                    { name: 'RED', value: 'RED' },
                    { name: 'ORANGE', value: 'ORANGE' },
                    { name: 'YELLOW', value: 'YELLOW' },
                    { name: 'GREEN', value: 'GREEN' }
                )),
    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id))){
            return i.reply({ content: "You're not a staff!", ephemeral: true});
        }

        const colorType = i.options.getString('type');
        await i.deferReply();

        const parts = await fetchItemDetailsByColor(bot.gsapi, process.env.sheet, colorType);

        if (!parts.length) {
            return i.editReply({ content: `No items found for color type ${colorType}.`, ephemeral: true });
        }

        parts.sort((a, b) => a.count - b.count);

        const itemsPerPage = 15;
        const pages = [];
        for (let i = 0; i < parts.length; i += itemsPerPage) {
            pages.push(parts.slice(i, i + itemsPerPage));
        }

        const embeds = pages.map((page, pageIndex) => {
            const pageDescription = page.map(part => {
                const paddedCount = String(part.count).padStart(2, ' ').padEnd(3, ' ');
                const modifiedItemName = part.itemName.replace(/Neuroptics/g, 'Neuro').replace(/Blueprint/g, 'BP');
                return `${paddedCount} | ${modifiedItemName}`;
            }).join('\n');
        
            return new EmbedBuilder()
                .setTitle(`${colorType} ${pageIndex + 1}/${pages.length}`)
                .setDescription(codeBlock('ml', pageDescription))
                .setColor("#cfa3ff");
        });

        const pagination = new Pagination(i, {
            firstEmoji: '⏮',
            prevEmoji: '◀️',
            nextEmoji: '▶️',
            lastEmoji: '⏭',
            idle: 60000,
            ephemeral: true,
            buttonStyle: ButtonStyle.Secondary,
            loop: true
        });

        pagination.setEmbeds(embeds).render();
    }
}

async function fetchItemDetailsByColor(gsapi, spreadsheetId, targetColorType) {
    const sheets = ['FRAMES', 'PRIMARIES', 'SECONDARIES', 'MELEES', 'OTHERS'];
    const partNames = [
        "Chassis", "Neuroptics", "Stock", "Upper limb", "Lower limb", "Barrel",
        "Receiver", "Grip", "String", "Pouch", "Stars", "Blade", "Ornament", "Disc",
        "Handle", "Head", "Boot", "Gauntlet", "Chain", "Guard", "Hilt", "Carapace",
        "Cerebrum", "Band", "Buckle", "Blueprint", "Harness", "Systems", "Wings"
    ];
    const results = [];

    for (const sheet of sheets) {
        const range = `${sheet}!A:Z`;
        const response = await gsapi.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        
        const formatResponse = await gsapi.spreadsheets.get({
            spreadsheetId,
            ranges: range,
            includeGridData: true,
        });
        const formatRows = formatResponse.data.sheets[0].data[0].rowData;

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
            for (let colIndex = 0; colIndex < (rows[rowIndex] ? rows[rowIndex].length : 0); colIndex++) {
                const cellValue = rows[rowIndex][colIndex];
                const formatCell = formatRows[rowIndex] && formatRows[rowIndex].values[colIndex];
                const bgColor = formatCell && formatCell.effectiveFormat && formatCell.effectiveFormat.backgroundColor;
                const colorType = getColorType(bgColor);

                if (colorType === targetColorType) {
                    const count = parseInt(cellValue, 10);
                    if (!isNaN(count)) {
                        if (colIndex > 0 && partNames.includes(rows[rowIndex][colIndex - 1].replace(' x2', ''))) {
                            let itemRow = rowIndex;
                            while (itemRow >= 0) {
                                const borderRight = formatRows[itemRow].values[colIndex - 1]?.effectiveFormat?.borders?.right;
                                if (!borderRight) {
                                    const itemName = sheet === 'FRAMES' ? rows[itemRow+1][colIndex - 1] : rows[itemRow][colIndex - 1];
                                    const partName = rows[rowIndex][colIndex - 1];

                                    if (itemName) {
                                        results.push({
                                            sheet,
                                            itemName: capitalizeWords(`${itemName} ${partName}`),
                                            count,
                                            colorType
                                        });                            
                                        break;
                                    }
                                }
                                itemRow--;
                            }
                        }
                    }
                }
            }
        }
    }

    return results;
}

function capitalizeWords(str) {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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