const off = require("../models/moderation/stfu");

module.exports = async (bot, oldS, newS) => {
	if (newS.channel === null && oldS.channel === undefined) {
		const stfu = await off.findOne({ userID: newS.member.id });
		if(stfu) return newS.setChannel(null, "User is off'd");
	}
};