const mongoose = require("mongoose");
const userBaseSchema = require("../userBaseSchema.js");

const pendingOrders = mongoose.Schema({
	...userBaseSchema,
	pending: [
        {
            itemName: String,
            orderDate: String
        }
    ]
});

module.exports = mongoose.model("pendingOrders", pendingOrders)