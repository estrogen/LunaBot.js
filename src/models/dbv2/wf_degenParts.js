const mongoose = require("mongoose");

const wf_degenParts = {
    part: { type: String, required: true, index: true },
    amount: { type: Number, required: true }

};

module.exports = mongoose.model("wf_degenParts", wf_degenParts);