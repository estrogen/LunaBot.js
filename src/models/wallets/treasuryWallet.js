const mongoose = require("mongoose");
const userBaseSchema = require("../userBaseSchema.js");

const walletSchema = mongoose.Schema({
	...userBaseSchema,
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