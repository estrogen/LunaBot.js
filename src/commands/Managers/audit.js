const { SlashCommandBuilder } = require('discord.js');
const cc = require('../../../config.json');
const recruitDb = require('../../models/dbv2/wf_recruitData');
const wallets = {
    'r': require('../../models/dbv2/tokens_recruit'),
    't': require('../../models/dbv2/tokens_treasure'),
    'd': require('../../models/dbv2/tokens_design'),
    'c': require('../../models/dbv2/tokens_deco'),
};

const departmentManagers = {
    't': "890240560496017476", //Treasury manager
    'd': "890240560496017477", //Desigenr Manager
    'r': "890240560542134274", //Recruiter Manager
    'c': "890240560542134272", //Decorator Manager
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('audit')
        .setDescription('For making changes to staff members wallets')
        .addStringOption(option => 
            option.setName('department')
            .setDescription('Which department you want to audit')
            .setRequired(true)
            .addChoices(
                {name: 'Recruiter', value: 'r'},
                {name: 'Treasury', value: 't'},
                {name: 'Designer', value: 'd'},
                {name: 'Events', value: 'e'},
                {name: 'Decorator', value: 'c'}
            ))
        .addStringOption(option => 
            option.setName('mode')
            .setDescription('Which audit mode you want to be in')
            .setRequired(true)
            .addChoices(
                {name: 'Add', value: 'add'},
                {name: 'Remove', value: 'remove'},
                {name: 'Recruit Remove', value: 'log'}
            ))
        .addStringOption(option => option.setName('user').setDescription('User id of person').setRequired(true))
        .addStringOption(option => option.setName('amount').setDescription('Amount you want to audit (Doesnt apply to Recruit Remove)').setRequired(false))
        .setDefaultPermission(false),

    async execute(i, bot) {
        const department = i.options.getString('department');
        const mode = i.options.getString('mode');
        const userId = i.options.getString('user');
        let amount = mode !== 'log' ? i.options.getString('amount') : null;
        amount = amount ? parseFloat(amount) : null;

        if (!i.member.roles.cache.has(departmentManagers[department])) {
            return i.reply({ content: "Not a manager of that department.", ephemeral: true });
        }
        try {
            switch (mode) {
                case 'add':
                case 'remove':
                    await auditWallet(department, userId, amount, mode, i);
                    break;
                case 'log':
                    await removeRecruitLog(userId, i);
                    break;
                default:
                    i.reply({ content: "Invalid mode selected.", ephemeral: true });
                    break;
            }
        } catch (error) {
            console.error(error);
            i.reply({ content: "An error occurred while processing your request.", ephemeral: true });
        }
    },

};

async function auditWallet(department, userId, amount, mode, interaction) {
    if (!amount) {
        return interaction.reply({ content: "No amount provided for this action.", ephemeral: true });
    }

    const walletModel = wallets[department];
    const walletDoc = await walletModel.findOne({ userID: userId });

    if (!walletDoc) {
        return interaction.reply({ content: "No wallet found for the user.", ephemeral: true });
    }

    if (mode === 'add') {
        walletDoc.tokens += amount;
    } else {
        walletDoc.tokens -= amount;
    }

    await walletDoc.save();
    interaction.reply({
        content: `${mode === 'add' ? 'Added' : 'Removed'} ${amount} to the user's balance!`,
        ephemeral: true
    });
}

async function removeRecruitLog(userId, interaction) {
    const recruitEntry = await recruitDb.findOne({ userID: userId });
    if (!recruitEntry) {
        return interaction.reply({ content: "No recruit entry found for this user.", ephemeral: true });
    }

    await recruitEntry.deleteOne();
    interaction.reply({ content: "Recruit log entry removed!", ephemeral: true });
}
