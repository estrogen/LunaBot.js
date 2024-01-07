const hb = require("../models/moderation/hackban")

module.exports = async (bot, member) => {
	const data = await hb.findOne({ userID: member.id });
	if(data) {
		await bot.guilds.cache.get("521850636321423371").members.cache.get(member.id).ban({days: 7, reason: "Hackbanned user!"});
		data.deleteOne();
	}
};