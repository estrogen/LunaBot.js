const mongoose = require("mongoose");

const listSchema = mongoose.Schema({
	guildID: String,
    role: String,
	blocked: []
});

module.exports = mongoose.model("RoleBlock", listSchema);