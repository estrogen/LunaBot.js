const mongoose = require("mongoose");

const stored_Data = mongoose.Schema({
	team: String,
	items: [{name: String, price: Number}]
});

module.exports = mongoose.model("stored_Data", stored_Data, "stored_Data")