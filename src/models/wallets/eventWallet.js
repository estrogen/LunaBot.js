const mongoose = require("mongoose");

const eventWallet = mongoose.Schema({
	userID: String,
	guildID: String,
	tokens: {
		type: Number,
		default: 0
	},
});

module.exports = mongoose.model("EventWallet", eventWallet)