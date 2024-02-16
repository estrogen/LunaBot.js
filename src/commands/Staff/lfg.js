const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, codeBlock, ButtonBuilder, ButtonStyle } = require('discord.js');
const cc = require('../../../config.json');
const relicDataModel = require('../../models/dbv2/wf_relicData');
const wfRuns = require('../../models/dbv2/wf_runs');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lfg')
        .setDescription('sets up a looking for group embed')
        .addStringOption(option => 
            option.setName('type')
            .setDescription('Which type of run this will be')
            .setRequired(true)
            .addChoices(
                {name: 'Treasury', value: 'treasury'},
                {name: 'Farmer', value: 'farmer'},
                {name: 'Rad Share', value: 'radShare'},
                {name: 'General', value: 'general'}
            ))
            .addStringOption(option => option.setName('relic').setDescription('Relic').setAutocomplete(true))
            .addStringOption(option => option.setName('amount').setDescription('Amount of relics').setAutocomplete(true))
            .addStringOption(option => option.setName('misson').setDescription('Mission Type').setAutocomplete(true))
        .setDefaultPermission(false),
    async autocomplete(i, bot) {
        const focusedOption = i.options.getFocused(true);

        if (focusedOption.name === 'relic') {
            const focusedValue = focusedOption.value.toLowerCase();
            let relics = [];

            try {
                const allRelics = await getAllRelics();

                relics = allRelics
                    .filter(relic => `${relic.type} ${relic.name}`.toLowerCase().includes(focusedValue)) // Filter relics based on what's being typed
                    .slice(0, 25)
                    .map(relic => ({ name: `${relic.type} ${relic.name}`, value: `${relic.type} ${relic.name}` })); // Format for autocomplete
            } catch (error) {
                console.error('Error fetching relics:', error);
            }

            await i.respond(relics);
        } else if (focusedOption.name === 'misson') {
            const missionTypes = [
                { name: 'Assassination', value: 'assassination' },
                { name: 'Assault', value: 'assault' },
                { name: 'Capture', value: 'capture' },
                { name: 'Defense', value: 'defense' },
                { name: 'Disruption', value: 'disruption' },
                { name: 'Excavation', value: 'excavation' },
                { name: 'Exterminate', value: 'exterminate' },
                { name: 'Interception', value: 'interception' },
                { name: 'MobileDefense', value: 'mobiledefense' },
                { name: 'Rescue', value: 'rescue' },
                { name: 'Sabotage', value: 'sabotage' },
                { name: 'Spy', value: 'spy' },
                { name: 'Survival', value: 'survival' },
                { name: 'Any', value: 'any' }
            ];
        
            await i.respond(missionTypes);
        } else if (focusedOption.name === 'amount') {
            const relicAmount = [
                { name: '6', value: '6' },
                { name: '9', value: '9' },
                { name: '12', value: '12' },
                { name: '15', value: '15' },
                { name: '18', value: '18' },
                { name: '21', value: '21' },
                { name: '24', value: '24' }
            ];
        
            await i.respond(relicAmount);
        }
    },
    async execute(i, bot) {
        if(!i.member.roles.cache.some(r => cc.Roles.Staff.includes(r.id))){
            return i.reply({ content: "You're not a staff!", ephemeral: true});
        }
        const type = i.options.getString('type');
        const amount = i.options.getString('amount');
        const relic = i.options.getString('relic');
        const mission = i.options.getString('mission');

        await i.deferReply();

        switch (type) {
            case "treasury":
                if (!amount || !relic) {
                    i.editReply({ content: "Missing Relic Name or Amount." });
                    break;
                } else {
                    if (amount < 6) {
                        i.editReply({ content: "Treasury runs require a minimum of 6 relics." });
                        break;
                    } else {
                        if (amount % 3 != 0) {
                            i.editReply({ content: "Relic amount must be a multiple of 3." });
                            break;
                        }
                    }
                }

                const fissures = await getFissuresForRelic(relic) || 'No Ideal Fissures';
                const relicData = await getRelicBreakdown(bot, relic);
                const lfgButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setCustomId("lfgJoin").setLabel("✔").setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('lfgCancel').setLabel('❌').setStyle(ButtonStyle.Danger),
                    );

                const embed = new EmbedBuilder()
                    .setTitle(`Treasury Run for ${amount}x ${relic}`)
                    .setDescription(`<@${i.member.id}>`)
                    .addFields([
                        { name: "Fissures", value: `${fissures}`, inline: false}, 
                        { name: `${relicData.name || `${relic} Data`}`, value: `${codeBlock('ml', relicData.rewards) || 'Unable to acquire data.' }`, inline: false}
                    ])
                    .setColor("#ffb347")
                    .setTimestamp();
                await i.editReply({ embeds: [embed], components: [lfgButtons] });
                newWfRun = new wfRuns({
                    host: i.user.id,
                    participants: [],
                    runType: type,
                    mission: "",
                    relic: relic,
                    rewards: [],
                    active: true,
                    date: new Date(),
                    screenshot: ""
                });
                await newWfRun.save();
                break;
            case "farmer":
                break;
            case "general":
                break;  
        }
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

async function getFissuresForRelic(relic) {
    const relicType = relic.split(' ')[0];
    const allowedMissionTypes = ['Extermination', 'Capture', 'Sabotage', 'Rescue'];
    const url = 'https://api.warframestat.us/pc/fissures/';
  
    try {
        const response = await axios.get(url);
        const fissures = response.data;
    
        let fissureString = '';

        fissures.forEach(fissure => {
        if (fissure.active && !fissure.isStorm && fissure.tier.toLowerCase() === relicType.toLowerCase() && allowedMissionTypes.includes(fissure.missionType)) {
            const spPrefix = fissure.isHard ? 'SP ' : '';
            const expiryUnix = Math.floor(new Date(fissure.expiry).getTime() / 1000);
            fissureString += `${spPrefix}${fissure.missionType} - ${fissure.node} - <t:${expiryUnix}:R>\n`;
        }
        });

        fissureString = fissureString.trim();

        return fissureString;
    } catch (error) {
      console.error('Error fetching fissures:', error);
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