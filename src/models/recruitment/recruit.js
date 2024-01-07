const mongoose = require("mongoose");
const userBaseSchema = require("../userBaseSchema.js");

const recruitData = mongoose.Schema({
	...userBaseSchema,
	kingdom: String,
	recruiter: String,
	clanJoin: String,
	serverJoin: String
});

module.exports = mongoose.model("RecruitData", recruitData)