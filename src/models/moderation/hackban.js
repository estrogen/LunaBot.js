const mongoose = require("mongoose");

const hackban = mongoose.Schema({
	userID: String,
	guildID: String
});

module.exports = mongoose.model("Hackban", hackban)