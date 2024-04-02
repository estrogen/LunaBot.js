const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Bot uptime')
		.setDefaultPermission(true),
		
    async execute(i, bot) {
		let total = (bot.uptime / 1000);
		let days = Math.floor(total / 86400);
		total %= 86400;
		let hours = Math.floor(total / 3600);
		total %= 3600;
		let minutes = Math.floor(total / 60);
		let seconds = Math.floor(total % 60);
		const timeEmbed = new EmbedBuilder()
			.setColor('#7289DA')
			.addFields([{ name: "Bot Uptime", value: `${days} Day, ${hours} Hrs, ${minutes} Min, ${seconds} Sec`}])
        await i.reply({embeds: [timeEmbed], ephemeral: true});
    },
};