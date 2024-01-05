const mongoose = require('mongoose');
const fs = require('fs');
const mFiles = fs.readdirSync("./src/mEvents").filter(file => file.endsWith(".js"));

module.exports = (bot) => {
    bot.hDatabase = async () => {
        for (file of mFiles) {
            const event = require(`../mEvents/${file}`);
            mongoose.connection.on(event.name, (...args) => event.execute(...args));
        }
        mongoose.Promise = global.Promise;
        await mongoose.connect(process.env.mongo, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
    };
};