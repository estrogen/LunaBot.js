const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, codeBlock, ButtonBuilder, ButtonStyle } = require('discord.js');
const cc = require('../../../config.json');
const relicDataModel = require('../../models/dbv2/wf_relicData');
const wf_runs = require('../../models/dbv2/wf_runs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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
            .addStringOption(option => option.setName('mission').setDescription('Mission Type').setAutocomplete(true))
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
        const [relicType, relicName] = relic.split(' ');
        const mission = i.options.getString('mission');

        await i.deferReply();

        try {
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
                    const relicData = await getRelicBreakdown(bot, relicType, relicName);
                    const lfgButtons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId("lfgJoin").setLabel("✔").setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('lfgCancel').setLabel('❌').setStyle(ButtonStyle.Danger),
                        );

                    const runId = await generateRunId(i.user.id, relic, type);
                    const embed = new EmbedBuilder()
                        .setTitle(`Treasury Run for ${amount}x ${relic}`)
                        .setDescription(`<@${i.member.id}>`)
                        .addFields([
                            { name: "Fissures", value: `${fissures}`, inline: false}, 
                            { name: `${relicData.name || `${relic} Data`}`, value: `${codeBlock('ml', relicData.rewards) || 'Unable to acquire data.' }`, inline: false}
                        ])
                        .setColor("#cfa3ff")
                        .setFooter({ text: `Run ID: ${runId}` });
                    await i.editReply({ embeds: [embed], components: [lfgButtons] });
                    newWfRun = new wf_runs({
                        host: i.user.id,
                        participants: [],
                        runType: type,
                        mission: "",
                        relic: relic,
                        rewards: [],
                        status: "lfg",
                        date: new Date(),
                        runId: runId
                    });
                    await newWfRun.save();
                    break;
                case "farmer":
                    return i.reply("not implemented");
                case "general":
                    return i.reply("not implemented");
                      
            }
        } catch (error) {
            console.log(`Error:`, error);
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
                        let itemName = breakdown[0];
                        let partName = breakdown[1].split(' ')[0];

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

function generateRunId(userId, relic, type) {
    const date = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
    const shortRelic = relic.split(' ')[0];
    const shortType = type.substring(0, 3);
    const uniqueSuffix = uuidv4().split('-')[0];
    return `${userId}-${date}-${shortType}-${shortRelic}-${uniqueSuffix}`;
}
