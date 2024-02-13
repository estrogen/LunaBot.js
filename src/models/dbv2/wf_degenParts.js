const mongoose = require("mongoose");

const wf_degenParts = {
    part: {type: String, required: true, index: true},
    amount: {type: Int32Array, required: true}

};

module.exports = mongoose.model("WFDegenParts", wf_degenParts);