const mongoose = require("mongoose");
const tokensBaseSchema = require("./tokensBaseSchema.js");

const tokensDesign = {
    ...tokensBaseSchema
};

module.exports = mongoose.model("tokensDesign", tokens_design);