const mongoose = require("mongoose");

const tokens_shop = mongoose.Schema({
	name: String,
    price: Number,
    restriction: String,
    modifier: [String] 
});

module.exports = mongoose.model("tokens_ushop", tokens_shop, "tokens_ushop")