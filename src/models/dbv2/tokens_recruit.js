const mongoose = require("mongoose");
const tokensBaseSchema = require("./tokensBaseSchema.js");

const tokens_recruit = {
    ...tokensBaseSchema
};

module.exports = mongoose.model("tokens_recruit", tokens_recruit, "tokens_recruit");