const mongoose = require("mongoose");

const recruitData = mongoose.Schema({
	userID: String,
	guildID: String,
	kingdom: String,
	recruiter: String,
	clanJoin: String,
	serverJoin: String
});

module.exports = mongoose.model("RecruitData", recruitData)