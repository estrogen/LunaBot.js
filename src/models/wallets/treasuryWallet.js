const mongoose = require("mongoose");

const walletSchema = mongoose.Schema({
	userID: String,
	guildID: String,
	lifetime: {
		type: Number,
		default: 0
	},
	treasuryCoins: {
		type: Number, 
		default: 0
	},
	tokens: {
		type: Number,
		default: 0
	}
});

module.exports = mongoose.model("Balance", walletSchema)