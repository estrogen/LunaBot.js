const Discord = require("discord.js");
const cc = require("../../config.json");

const management = {
	"691679183713075230" : "893094588460441610",//moderator          : moderation manager
	"585792324106452992" : "881053311304876053",//senpai             : academy manager
	"549230892309020685" : "594982795194138626",//recruiter team     : recruiter manager
	"594971851957076038" : "594982826839900204",//resource farmerAE  : resource Farmer manager
	"897689079343378462" : "594982826839900204",//resource farmerAES : resource Farmer manager
	"741517810563285112" : "594982826839900204",//rookie farmer      : resource Farmer manager
	"613717287870005260" : "613717285718327306",//decorator          : decorator manager
	"577367730693472286" : "594982828866011186",//designer           : designer manager
	"674505282168160276" : "674509654801252402",//tresury team       : tresury manager
};

module.exports = async (bot, member) => {
	const kingdom = member.roles.cache.find(r => cc.Roles.Kingdoms.includes(r.id));

	if (!member.roles.cache.has("595045402143752212")) {
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
		const staffLeaveLog = await bot.channels.cache.get("1026707735531765830");
		const msg = await staffLeaveLog.send({ content: `${managers}` });
		const notify = new Discord.EmbedBuilder()
			.setAuthor({ name: `${member.user.username}#${member.user.discriminator} | ${kingdom.name}`, iconURL: member.user.displayAvatarURL() })
			.setColor("#e67e22")
			.setDescription(`${member.nickname} has parted ways.\n\n**Staff Member's Roles:** ${teams}`)
			.setFooter({ text: `ID: ${member.id} • ${new Date().toLocaleString()}` })
		await msg.edit({ content: `\u200B`, embeds: [notify] });
	}
};