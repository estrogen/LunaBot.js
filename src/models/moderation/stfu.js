const mongoose = require("mongoose");
const userBaseSchema = require("../userBaseSchema.js");

const stfu = mongoose.Schema({
	...userBaseSchema
});

module.exports = mongoose.model("Stfu", stfu)