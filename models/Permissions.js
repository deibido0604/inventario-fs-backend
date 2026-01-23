"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
    action: { type: String },
    subject: { type: String },
    type: { type: String },
});

const options = {
    collection: "Permissions",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};


let permissionsSchema = new Schema(schema, options);

module.exports = mongoose.model("Permissions", permissionsSchema);
