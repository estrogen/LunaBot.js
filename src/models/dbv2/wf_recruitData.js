const mongoose = require("mongoose");

const wf_recruitData = {
    userID: { type: String, required: true, index: true },
    recruiter: { type: String, required: true, index: true},
    joinDate: {type: Date, required: true, index: true},
    clan: { type: String, required: true}

};

module.exports = mongoose.model("WFRecruitData", wf_recruitData);