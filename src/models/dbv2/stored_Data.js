const mongoose = require("mongoose");

const stored_Data = mongoose.Schema({
	team: String,
	items: [{name: String, amount: Number}]
});

module.exports = mongoose.model("stored_Data", stored_Data, "stored_Data")