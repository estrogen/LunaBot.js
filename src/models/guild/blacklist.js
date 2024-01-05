const mongoose = require("mongoose");

const listSchema = mongoose.Schema({
	guildID: String,
	name: String,
	words: []
});

module.exports = mongoose.model("Blacklist", listSchema)