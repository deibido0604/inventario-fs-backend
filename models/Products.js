"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = {
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
};

const options = {
    collection: "Products",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};

const ProductSchema = new Schema(schema, options);

module.exports = mongoose.model("Product", ProductSchema);
