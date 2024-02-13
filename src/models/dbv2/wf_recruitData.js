const mongoose = require("mongoose");

const wf_recruitData = {
    userID: { type: String, required: true, index: true },
    recruiter: { type: String, required: true, index: true },
    joinDate: { type: Date, required: true, index: true },
    kingdom: { type: String, required: true }
};

module.exports = mongoose.model("wf_recruitData", wf_recruitData);