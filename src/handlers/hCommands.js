const { readdirSync } = require("fs")
console.log(`[Luna]`.green, `Command Handler Was Successfully Enabled.`.white)

module.exports = (bot) => {
    bot.hCommands = async (commands, path) => {
        bot.commandArray = [];
        for (folder of commands) {
            const fCommands = readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));

            for (const file of fCommands) {
                const command = require(`../commands/${folder}/${file}`);
                bot.commands.set(command.data.name, command);
                bot.commandArray.push(command.data.toJSON());
            }
        }
    };
};