const mongoose = require("mongoose");
const tokensBaseSchema = require("./tokensBaseSchema.js");

const tokensRecruit = {
    ...tokensBaseSchema
};

module.exports = mongoose.model("tokensRecruit", tokens_recruit);