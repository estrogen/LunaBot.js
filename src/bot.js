const { Collection, Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const colors = require("colors")

require('dotenv').config();
const bot = new Client({
	shards: 'auto',
	intents: [
        GatewayIntentBits.Guilds,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
		Partials.User,
		Partials.GuildMembers,
        Partials.Message, 
        Partials.Channel, 
        Partials.Reaction,
    ]
});

bot.commands = new Collection();
bot.buttons = new Collection();

const handlers = fs.readdirSync("./src/handlers").filter(file => file.endsWith(".js"));
const events = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commands = fs.readdirSync("./src/commands");

(async () => {
	for (file of handlers) {
		require(`./handlers/${file}`)(bot);
	}

	bot.hEvents(events, "./src/events");
	bot.hCommands(commands, "./src/commands");
	bot.hButtons();
    bot.login(process.env.token).catch(e => {
		console.log(`[Error]`.red, "Invalid or No Bot Token Provided.".green)});
	bot.hDatabase(); 
})();