const { integrations } = require("googleapis/build/src/apis/integrations");
const mongoose = require("mongoose");

const wf_migrationdata = {
    userID: { type: String, required: true, index: true },
    farmer: {type: Number, required: false, index: false},
    runner: {type: Number, required: false, index: false},
    radder: {type: Number, required: false, index: false},
    merchant: {type: Number, required: false, index: false}
};

module.exports = mongoose.model("wf_migrationdata", wf_migrationdata, "wf_migrationdata");