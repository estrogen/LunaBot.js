const { SlashCommandBuilder, EmbedBuilder, codeBlock } = require('discord.js');
const relicDataModel = require('../../models/dbv2/wf_relicData');
const cc = require('../../../config.json');
const permission = require('../../functions/funcPermissions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('part')
        .setDescription('lets you see how many units we own for that part.')
        .addStringOption(option => option.setName('name').setDescription('Item Name').setRequired(true))
        .addStringOption(option => option.setName('part').setDescription('Part Name'))
        .setDefaultPermission(false),

    async execute(i, bot) {
        if(!permission(i.member, "Staff")){
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
                .setColor("#cfa3ff")
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
                .setColor("#cfa3ff")
                .setTimestamp();
            i.editReply({ embeds: [embed], ephemeral: true });
        }
        else {
            i.editReply({ content: 'Part not found or no count available.', ephemeral: true });
        }
    }
}

async function fetchItemPartCount(gsapi, spreadsheetId, itemName, partName) {
    const range = 'MANAGERS!Q:S';
    let details = partName.toLowerCase() === 'set' ? [] : null;

    try {
        const response = await gsapi.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        const rows = response.data.values;

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

        rows.forEach(row => {
            const [fetchedItemName, fetchedPartName, countStr] = row;

            const normalizedFetchedItemName = fetchedItemName ? fetchedItemName.toLowerCase() : '';
            const normalizedFetchedPartName = fetchedPartName ? fetchedPartName.toLowerCase() : '';

            if (normalizedFetchedItemName.includes(itemName.toLowerCase()) && 
                (partName.toLowerCase() === 'set' || normalizedFetchedPartName.includes(partName.toLowerCase()))) {

                const count = parseInt(countStr, 10);
                const isValidCount = !isNaN(count);
                const adjustedCount = partsRequiringHalfCount.includes(normalizedFetchedPartName) ? Math.ceil(count / 2) : count;
                const colorType = isValidCount ? getColorType(adjustedCount) : 'Unknown';

                const detail = {
                    part: fetchedPartName,
                    count: isValidCount ? count : 'N/A',
                    color: colorType,
                };

                if (partName.toLowerCase() === 'set') {
                    details.push(detail);
                } else {
                    details = detail;
                }
            }
        });

        return details;
    } catch (error) {
        console.error('Error fetching item part count:', error);
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

function getColorType(count) {
    if (count >= 0 && count <= 7) return 'ED';
    if (count >= 8 && count <= 15) return 'RED';
    if (count >= 16 && count <= 31) return 'ORANGE';
    if (count >= 32 && count <= 64) return 'YELLOW';
    if (count >= 65) return 'GREEN';
    return 'Unknown';
}