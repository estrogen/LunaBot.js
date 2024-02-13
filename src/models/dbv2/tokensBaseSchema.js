const mongoose = require("mongoose");

const tokensBaseSchema = {
    userID: { type: String, required: true, index: true },
    tokens: { type: Number, default: 0 },
};

module.exports = tokensBaseSchema;