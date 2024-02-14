const mongoose = require("mongoose");
const tokensBaseSchema = require("./tokensBaseSchema.js");

const tokens_design = {
    ...tokensBaseSchema
};

module.exports = mongoose.model("tokens_design", tokens_design, "tokens_design");