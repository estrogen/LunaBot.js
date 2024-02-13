const mongoose = require("mongoose");
const tokensBaseSchema = require("./tokensBaseSchema.js");

const tokens_deco = {
    ...tokensBaseSchema
};

module.exports = mongoose.model("tokens_deco", tokens_deco);