const mongoose = require("mongoose");

const tokensSplitSchema = {
    userID: { type: String, required: true, index: true },
};

module.exports = mongoose.model("TokensSchemaSplit", tokensSplitSchema);
