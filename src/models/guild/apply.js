const mongoose = require("mongoose");
const userBaseSchema = require("../userBaseSchema.js");

const applySchemaDefinition = {
    ...userBaseSchema,
};

const applySchema = mongoose.Schema(applySchemaDefinition);

module.exports = mongoose.model("Apply", applySchema);