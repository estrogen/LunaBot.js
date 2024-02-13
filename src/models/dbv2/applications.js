const mongoose = require("mongoose");

const applicationSchemaDefinition = {
    name: { type: String, required: true },
    description: { type: String, required: true },
    questions: { type: [String], required: true },
    output: { type: String, required: true },
};

const applicationSchema = mongoose.Schema(applicationSchemaDefinition);

module.exports = mongoose.model("Applications", applicationSchema);