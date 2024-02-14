const mongoose = require("mongoose");

const tokens_shop = mongoose.Schema({
	team: String,
	items: [{name: String, price: Number}]
});

module.exports = mongoose.model("tokens_shop", tokens_shop, "tokens_shop")