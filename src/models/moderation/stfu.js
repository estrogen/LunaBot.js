const mongoose = require("mongoose");

const stfu = mongoose.Schema({
	userID: String,
	guildID: String
});

module.exports = mongoose.model("Stfu", stfu)