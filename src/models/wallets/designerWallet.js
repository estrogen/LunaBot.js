const mongoose = require("mongoose");
const userBaseSchema = require("../userBaseSchema.js");

const designerProfile = mongoose.Schema({
	...userBaseSchema,
	tokens: {
		type: Number,
		default: 0
	},
	sheet: String,
	support: String
});

module.exports = mongoose.model("DesignerProfile", designerProfile)