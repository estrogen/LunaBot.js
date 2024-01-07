const Discord = require("discord.js");
const cc = require("../../config.json");

const management = {
	"890240560458244182" : "893094588460441610",//moderator          : moderation manager
	"890240560319856720" : "890240560542134274",//recruiter team     : recruiter manager
	"594971851957076038" : "1193134929274478683",//resource farmerAE  : resource Farmer manager
	"613717287870005260" : "890240560542134272",//decorator          : decorator manager
	"890240560294682627" : "890240560496017477",//designer           : designer manager
	"890240560319856711" : "890240560496017476",//tresury team       : tresury manager
};

module.exports = async (bot, member) => {
	const kingdom = member.roles.cache.find(r => cc.Roles.Kingdoms.includes(r.id));

	if (!member.roles.cache.has("595045402143752212")) { //NO IDEA
		if (member.roles.cache.some(r=>cc.Roles.Kingdoms.includes(r.id))) {
			const log = await bot.channels.cache.get("728725582602436649");
			const leaveEmbed = new Discord.EmbedBuilder()
				.setAuthor({ name: `${member.user.username}#${member.user.discriminator} | ${kingdom.name}`, iconURL: member.user.displayAvatarURL() })
				.setColor(kingdom.color)
				.setDescription(`${member.nickname} has left the server.`)
				.setFooter({ text: `ID: ${member.id} • ${new Date().toLocaleString()}` })
			await log.send({ embeds: [leaveEmbed]});
		}
	}
	
	if(member.roles.cache.some(r=>cc.Roles.Staff.includes(r.id))){
		const parse = member.roles.cache.filter(r => cc.Roles.Staff.includes(r.id));
		const teams = parse.map(r => `${r.name}`).join(", ").replace(/[^,\sa-z]/gi, '');
		const managers = parse.map(r => `<@&${management[r.id]}>`).join(" ");
		const staffLeaveLog = await bot.channels.cache.get("1193541654058106920");
		const msg = await staffLeaveLog.send({ content: `${managers}` });
		const notify = new Discord.EmbedBuilder()
			.setAuthor({ name: `${member.user.username}#${member.user.discriminator} | ${kingdom.name}`, iconURL: member.user.displayAvatarURL() })
			.setColor("#e67e22")
			.setDescription(`${member.nickname} has parted ways.\n\n**Staff Member's Roles:** ${teams}`)
			.setFooter({ text: `ID: ${member.id} • ${new Date().toLocaleString()}` })
		await msg.edit({ content: `\u200B`, embeds: [notify] });
	}
};