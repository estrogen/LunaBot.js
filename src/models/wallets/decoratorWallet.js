const mongoose = require("mongoose");

const decoWallet = mongoose.Schema({
	userID: String,
	guildID: String,
	tokens: {
		type: Number,
		default: 0
	},
});

module.exports = mongoose.model("DecoratorWallet", decoWallet)