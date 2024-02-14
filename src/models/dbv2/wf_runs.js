const mongoose = require("mongoose");

const wf_runs = {
    host: { type: String, required: true, index: true },
    partcipant: { type: [String], required: true, index: true },
    runType: { type: String, required: true },
    mission: { type: String, required: false },
    rewards: { type: [String], required: false },
    date: { type: Date, required: true, index: true },
    screenshot: { type: String, required: false }
};

module.exports = mongoose.model("WF_Runs", wf_runs);