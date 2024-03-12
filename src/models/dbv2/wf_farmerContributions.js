const mongoose = require("mongoose");

const wf_farmerContributions = {
    userID: { type: String, required: true, index: true },
    clan: { type: String, required: true, index: true },
    contribution: [{date: Date, resource: String, amount: Number, inputUser: String}]
};

module.exports = mongoose.model("wf_farmerContributions", wf_farmerContributions, "wf_farmerContributions");