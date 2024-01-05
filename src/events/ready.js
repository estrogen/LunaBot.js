const { REST, ActivityType } = require('discord.js');
const { Routes } = require('discord-api-types/v9');

module.exports = async (bot) => {
    console.log('[Crescent]'.blue, `Username: ${bot.user.tag} (${bot.user.id})`.white);
    bot.user.setPresence({
        activities: [{
            type: ActivityType.Custom,
            name: "custom", // name is exposed through the API but not shown in the client for ActivityType.Custom
            state: "I'm super shy. ><"
        }],
        status: "online"
    })

    const rest = new REST({ version: '9' }).setToken(process.env.token);

    console.log('[Crescent]'.blue,'Started refreshing application (/) commands.');
    await rest.put(
        Routes.applicationGuildCommands(process.env.client, process.env.guild),
        { body: bot.commandArray },
    );
    console.log('[Crescent]'.blue,'Successfully reloaded application (/) commands.');
    
    const guild = bot.guilds.cache.get(process.env.guild);
    await guild.commands.set(bot.commandArray);
};