const mongoose = require("mongoose");

const hackban = mongoose.Schema({
	userID: { type: String, required: true, index: true }
});

module.exports = mongoose.model("Hackban", hackban)