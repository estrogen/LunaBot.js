const mongoose = require("mongoose");

const wf_degenOrders = {
    userID: { type: String, required: true, index: true },
    part: { type: String, required: true },
    fulfilled: { type: Boolean, required: true },
    date: { type: Date, required: true }
};

module.exports = mongoose.model("wf_degenOrders", wf_degenOrders, "wf_degenOrders");