const mongoose = require("mongoose");

const baseSchema = {
    guildID: { type: String, required: true, index: true },
};

module.exports = baseSchema;
