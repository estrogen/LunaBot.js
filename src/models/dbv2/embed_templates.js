const mongoose = require("mongoose");

const embed_templates = {
    team: String,
    message: String
};

module.exports = mongoose.model("embed_templates", embed_templates);