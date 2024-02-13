const mongoose = require("mongoose");

const wf_farmerContributions = {
    userID: { type: String, required: true, index: true },
    clan: {type: String, required: true},
    resource: {type: [String], required: true},
    screenshot: {type: String, required: false}


};

module.exports = mongoose.model("WFFarmerContributions", wf_farmerContributions);