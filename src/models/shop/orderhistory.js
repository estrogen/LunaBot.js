const mongoose = require("mongoose");
const userBaseSchema = require("../userBaseSchema.js");

const orderHistory = mongoose.Schema({
	...userBaseSchema,
	history: [
        {
            itemName: String,
            orderDate: String
        }
    ]
});

module.exports = mongoose.model("OrderHistory", orderHistory)