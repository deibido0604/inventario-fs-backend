"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = {
  batch_number: {
    type: String,
    required: true,
    unique: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  current_stock: {
    type: Number,
    required: true,
    default: 0
  },
  expiration_date: {
    type: Date,
    required: true
  },
  manufacturing_date: {
    type: Date
  },
  entry_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  unit_cost: {
    type: Number,
    required: true
  },
  supplier: {
    type: String
  },
  invoice_number: {
    type: String
  },
  notes: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
};

const options = {
  collection: "Batches",
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};

const BatchSchema = new Schema(schema, options);

BatchSchema.index({ product: 1, expiration_date: 1 });
BatchSchema.index({ branch: 1, product: 1 });
BatchSchema.index({ batch_number: 1 }, { unique: true });
BatchSchema.index({ expiration_date: 1 });

module.exports = mongoose.model("Batch", BatchSchema);