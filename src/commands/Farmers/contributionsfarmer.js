const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const moment = require('moment');
const farmerCont = require('../../models/dbv2/wf_farmerContributions');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('contributionsfarmer')
        .setDescription('Null')
        .addUserOption(option => option.setName('user').setDescription('User Donating').setRequired(false))
        .addStringOption(option => option.setName('clan')
            .setDescription('Clan')
            .setRequired(false)
            .addChoices(
                {name: 'Andromeda Kingdom', value: 'Andromeda'},
                {name: 'Imouto Kingdom', value: 'Imouto'},
                {name: 'Heavens Kingdom', value: 'Heavens'},
                {name: 'Tsuki Kingdom', value: 'Tsuki'},
                {name: 'Waifu Kingdom', value: 'Waifu'},
                {name: 'Yuri Kingdom', value: 'Yuri'},
                {name: 'Cowaii Kingdom', value: 'Cowaii'},
                {name: 'Manga Kingdom', value: 'Manga'}
            ))
        .addNumberOption(option => option.setName('timeframe').setDescription('How many days to look back').setRequired(false))
        .addBooleanOption(option => option.setName('csv').setDescription('Get Output as a CSV').setRequired(false))
        .setDefaultPermission(false),
    async execute(i, bot) {
        
        const color = '#cfa3ff';

        
        const filterUser = i.options.getUser('user');
        const filterClan = i.options.getString('clan');
        const timeframe = i.options.getNumber('timeframe');
        const startDate = new Date(Date.now() - timeframe * 86400 * 1000);

        const allContributions = await farmerCont.find({}).exec();
        var output = "";
        allContributions.forEach(contribution => {
            const { userID, clan, contributions } = contribution;
            contributions.forEach(transaction => {
            
                if ((!filterUser || transaction.inputUser === filterUser) &&
                    (!filterClan || allContributions.clan === filterClan) &&
                    (!timeframe || startDate < new Date(t.date))) {
                        const outUser = userID;
                        const outClan = clan;
                        const formattedDate = transaction.date.toISOString().slice(0, 10);
                        output += `${outUser} | ${outClan} | ${formattedDate} | ${transaction.resource} | ${transaction.amount}\n`;
                }
            });
        });

    if(i.options.getBoolean('csv')){
            output = `userID | clan | date | resource | amount \n` + output;
            const attachment = new AttachmentBuilder(Buffer.from(output, 'utf-8'), { name: 'ContributionData.csv' });
            await i.reply({ files: [attachment]});
        }
        else{

            const embed = new EmbedBuilder()
            .setTitle(`Contribution Logs`)
            .setColor(color)
            .addFields(
                { name: 'Clan', value: `${filterClan}`, inline: true },
                { name: 'User', value: `${filterUser}`, inline: true },
                { name: 'Start Date', value: `${startDate.toISOString().slice(0, 10)}`, inline: true })
            if(output.length <= 1024){
                embed.addFields({ name: 'Contributions', value: `\`\`\`haskell\n${output}\`\`\``, inline: false},);
            }
            else{
                embed.addFields({ name: 'Error', value: "Too many contributions to show. Try using CSV format", inline: false });
            }
                
            
            await i.reply({ embeds: [embed] });
        }

    }
}
        