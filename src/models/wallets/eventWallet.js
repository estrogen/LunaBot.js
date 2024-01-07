const mongoose = require("mongoose");
const userBaseSchema = require("../userBaseSchema.js");

const eventWallet = mongoose.Schema({
	...userBaseSchema,
	tokens: {
		type: Number,
		default: 0
	},
});

module.exports = mongoose.model("EventWallet", eventWallet)