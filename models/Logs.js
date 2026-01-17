"use strict";
let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const schema = {
    username: {
        type: String
    },
    type: {
        type: String
    },
    data: {
        type: [Object]
    },
    motive: {
        type: String
    },
    source: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    territory: {
        type: Schema.Types.ObjectId,
    },
    unix_date: {
        type: Number
    },
};

const options = {
    collection: "Logs"
};

let LogSchema = new Schema(schema, options);

module.exports = mongoose.model("Logs", LogSchema);
