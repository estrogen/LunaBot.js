const mongoose = require("mongoose");

const usersSchema = {
    userID: { type: String, required: true, index: true },
    serverJoinDate: { type: Date, required: true, index: true },
    wfIGN: { type: String, required:false },
    wfPastIGN: { type: [String], required:false },
    otherIGN: { type: [String], required:false }
};

module.exports = mongoose.model("users", usersSchema);
