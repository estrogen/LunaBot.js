const fs = require('fs');

module.exports = (bot) => {
    bot.hButtons = async () => {
        const buttons = fs.readdirSync('./src/buttons');
        for (const folder of buttons) {
            const files = fs.readdirSync(`./src/buttons/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of files) {
                const button = require(`../buttons/${folder}/${file}`);
                bot.buttons.set(button.data.name, button);
            }
        }
    }
}