const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, codeBlock } = require('discord.js');
const { Pagination } = require('pagination.djs');
const cc = require('../../../config.json');
const permission = require('../../functions/funcPermissions.js');

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
        if(!permission(i.member, "Staff")){
            return i.reply({ content: "You're not a staff!", ephemeral: true});
        }

        const colorType = i.options.getString('type');
        await i.deferReply();

        const parts = await fetchItemDetails(bot.gsapi, process.env.sheet, colorType);

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
                const modifiedItemName = (part.itemName + ' ' + part.partName)
                    .replace(/Neuroptics/g, 'Neuro')
                    .replace(/Blueprint/g, 'BP')
                    .trim();
        
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

async function fetchItemDetails(gsapi, spreadsheetId, targetType) {
    const range = 'MANAGERS!Q:S';
    const response = await gsapi.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    const results = [];

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

    for (const row of rows) {
        let [itemName, partName, countStr] = row;

        itemName = itemName.replace(' Prime', '');

        let count = parseInt(countStr, 10);
        if (isNaN(count)) continue;

        const fullPartName = `${itemName} ${partName}`;
        if (partsRequiringHalfCount.includes(fullPartName)) {
            count = Math.ceil(count / 2);
        }

        const colorType = getColorType(count);
        if (colorType === targetType) {
            results.push({
                itemName: capitalizeWords(itemName),
                partName: capitalizeWords(partName),
                count,
                colorType
            });
        }
    }

    return results;
}

function capitalizeWords(str) {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getColorType(count) {
    if (count >= 0 && count <= 7) return 'ED';
    if (count >= 8 && count <= 15) return 'RED';
    if (count >= 16 && count <= 31) return 'ORANGE';
    if (count >= 32 && count <= 64) return 'YELLOW';
    if (count >= 65) return 'GREEN';
    return 'Unknown';
}