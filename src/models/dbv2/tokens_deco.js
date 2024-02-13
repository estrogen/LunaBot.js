const mongoose = require("mongoose");
const tokensBaseSchema = require("./tokensBaseSchema.js");

const tokensDeco = {
    ...tokensBaseSchema
};

module.exports = mongoose.model("tokensDeco", tokens_deco);