const mongoose = require("mongoose");

const shopSchema = mongoose.Schema({
	team: String,
	items: [{name: String, price: Number}]
});

module.exports = mongoose.model("Shop", shopSchema)