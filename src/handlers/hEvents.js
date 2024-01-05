const { readdirSync, read } = require("fs")
console.log(`[EVENT HANDLER]`.green, `Loading Events`.white)
let eventCount = 0;

module.exports = (bot) => {
    bot.hEvents = async (events, path) => {
        readdirSync(`${process.cwd()}/src/events/`).forEach(async file => {
            let fileName = file.replace(".js", "")
            bot.on(fileName, require(`../events/${file}`).bind(null, bot));
            eventCount = eventCount + 1
        })
    };
}