const mongoose = require("mongoose");
const userBaseSchema = require("../userBaseSchema.js");

const hackban = mongoose.Schema({
	...userBaseSchema
});

module.exports = mongoose.model("Hackban", hackban)