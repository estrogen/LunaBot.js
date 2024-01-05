const mongoose = require("mongoose");

const designerProfile = mongoose.Schema({
	userID: String,
	guildID: String,
	tokens: {
		type: Number,
		default: 0
	},
	sheet: String,
	support: String
});

module.exports = mongoose.model("DesignerProfile", designerProfile)