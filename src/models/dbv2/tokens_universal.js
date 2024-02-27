const mongoose = require("mongoose");
const tokensBaseSchema = require("./tokensBaseSchema.js");

const tokens_treasure = {
    ...tokensBaseSchema,
    transactions: [{date: Date, identifier: String, desc: String, amount: Number}]
};

module.exports = mongoose.model("tokens_universal", tokens_treasure, "tokens_universal");