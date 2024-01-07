const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cc = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guestban')
        .setDescription('Will allow mods to ban guests')
		.addUserOption(option => option.setName('guest').setDescription('Guest to ban').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for banning').setRequired(true))
		.setDefaultPermission(false),
   
	async execute(i, bot) {
		if(!i.member.roles.cache.some(r => cc.Roles.Mods.includes(r.id)))
			return i.reply({ content: "You're not a moderator!", ephemeral: true});

		const user = i.options.getUser('guest');
		const reason = i.options.getString('reason');
		try {
			const target = await i.guild.members.fetch(user.id)
			if (!target)
				return i.reply({ content: "Guest doesn't exist", ephemeral: true});

			if (target.roles.cache.some(r => (cc.Roles.Guestban).concat(cc.Roles.Kingdoms, cc.Roles.Admin).includes(r.id)))
				return i.reply({ content: "You're unable to ban this user!", ephemeral: true});
		
			const logs = await i.guild.channels.cache.get('535613990546702341');
			const bEmbed = new EmbedBuilder()
				.setColor('#FF6961')
				.setThumbnail(i.user.avatarURL({ dynamic: false, format: "png", size: 4096 }))
				.setTimestamp()
				.addFields([
					{ name: 'Banned', value: `${user.username} (${user.id})`, inline: true },
					{ name: 'Moderator', value: `${i.user.username} (${i.user.id})`, inline: true },
					{ name: 'Reason', value: `${reason}`, inline: true },
				]);
			await i.reply({ embeds: [bEmbed], ephemeral: true});
			await logs.send({ embeds: [bEmbed] });
			await target.ban({ days: 7, reason: reason});
		} catch (err) {
			console.error(err)
			i.reply({ content: "An error has unfortunately occured", ephemeral: true});
		}
	},

};