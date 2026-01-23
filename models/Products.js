"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = {
  code: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  unit_cost: {
    type: Number,
    required: true,
    default: 0,
  },
  unit_price: {
    type: Number,
    required: true,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  subcategory: {
    type: String,
  },
  brand: {
    type: String,
  },
  min_stock: {
    type: Number,
    default: 0,
  },
  max_stock: {
    type: Number,
    default: 0,
  },
  unit_of_measure: {
    type: String,
    required: true,
    default: "unidad",
  },
  barcode: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,
  },
};

const options = {
  collection: "Products",
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
};

const ProductSchema = new Schema(schema, options);

ProductSchema.index({ code: 1 }, { unique: true });
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ active: 1 });

module.exports = mongoose.model("Product", ProductSchema);
