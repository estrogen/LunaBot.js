const wf_runs = require('../../models/dbv2/wf_runs');
const users = require('../../models/dbv2/usersSchema');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: {
        name: 'lfgExport'
    },
    async execute(i, bot) {
        const runId = i.message.embeds[0].footer.text.replace('Run ID: ', '');
        const run = await wf_runs.findOne({ runId: runId });
        const interactingUserId = i.user.id;

        if (run && run.host === interactingUserId) {
            const title = i.message.embeds[0].title;
            const relicCountMatch = title.match(/(\d+)x/);
            const relicCount = relicCountMatch ? parseInt(relicCountMatch[1]) : 0;

            const igns = await Promise.all(run.participants.map(async userId => {
                const user = await users.findOne({ userID: userId });
                return user ? user.wfIGN : 'Unknown';
            }));

            const data = prepareDataArray(run, igns, relicCount);
            const excelString = convertToExcelString(data);
            const filePath = path.join(__dirname, 'export.txt');

            fs.writeFileSync(filePath, excelString);
            const file = new AttachmentBuilder(filePath, { name: 'export.txt' });

            await i.reply({ files: [file] });
            fs.unlinkSync(filePath);
        } else {
            await i.reply({ content: "You are not the host of this run or the run was not found.", ephemeral: true });
        }
    },
}

function prepareDataArray(run, igns, totalCount) {
    const result = [];
    const relicName = run.relic;
    const date = new Date(run.date).toLocaleDateString('en-US');
    let remainingParts = run.rewards.length;
    let partsAdded = 0;

    const rowsNeeded = Math.ceil(totalCount / 6);

    for (let i = 0; i < rowsNeeded; i++) {
        const relicsInRow = Math.min(6, totalCount - i * 6);
        const row = [relicName, relicsInRow.toString(), ' ']; 

        igns.forEach(ign => row.push(ign));

        for (let j = 0; j < relicsInRow && partsAdded < remainingParts; j++) {
            let part = run.rewards[partsAdded++];
            part = part.replace("Blueprint", "BP").replace("Neuroptics", "Neuro");
            row.push(part);
        }

        while (row.length < 12) {
            row.push('\u00A0');
        }

        row.push(date);
        result.push(row);
    }

    return result;
}

function convertToExcelString(arr) {
    return arr.map(row => {
        const filteredRow = row.filter(item => item !== '');
        return filteredRow.join('\t');
    }).join('\n');
}