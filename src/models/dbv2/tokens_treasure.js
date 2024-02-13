const mongoose = require("mongoose");
const tokensBaseSchema = require("./tokensBaseSchema.js");

const tokensTreasure = {
    ...tokensBaseSchema
};

module.exports = mongoose.model("tokensTreasure", toekns_treasure);