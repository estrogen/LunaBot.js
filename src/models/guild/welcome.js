const mongoose = require("mongoose");

const welcomeSchema = mongoose.Schema({
	team: String,
	message: String
});

module.exports = mongoose.model("Welcome", welcomeSchema)