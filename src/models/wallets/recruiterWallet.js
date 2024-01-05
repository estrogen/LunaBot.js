const mongoose = require("mongoose");

const recruitWallet = mongoose.Schema({
	userID: String,
	guildID: String,
	tokens: {
		type: Number,
		default: 0
	},
});

module.exports = mongoose.model("RecruitWallet", recruitWallet)