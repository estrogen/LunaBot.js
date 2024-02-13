const mongoose = require("mongoose");

const roleblock = mongoose.Schema({
	guildID: String,
    role: String,
	blocked: []
});

module.exports = mongoose.model("RoleBlock", roleblock);