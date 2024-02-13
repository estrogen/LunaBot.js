const mongoose = require("mongoose");
const tokensBaseSchema = require("./tokensBaseSchema.js");

const tokens_treasure = {
    ...tokensBaseSchema
};

module.exports = mongoose.model("tokensTreasure", tokens_treasure);