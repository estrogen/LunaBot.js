const mongoose = require("mongoose");

const userBaseSchema = {
    guildID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
};

module.exports = userBaseSchema;
