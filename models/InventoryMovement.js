"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = {
  movement_type: {
    type: String,
    enum: ["entrada", "salida", "ajuste"],
    required: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  batch: {
    type: Schema.Types.ObjectId,
    ref: "Batch",
    required: true
  },
  branch: {
    type: Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previous_stock: {
    type: Number,
    required: true
  },
  new_stock: {
    type: Number,
    required: true
  },
  unit_cost: {
    type: Number,
    required: true
  },
  total_cost: {
    type: Number,
    required: true
  },
  reference_document: {
    type: String
  },
  reference_id: {
    type: Schema.Types.ObjectId
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "SystemUser",
    required: true
  },
  notes: {
    type: String
  }
};

const options = {
  collection: "InventoryMovements",
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};

const InventoryMovementSchema = new Schema(schema, options);

InventoryMovementSchema.index({ movement_type: 1, createdAt: -1 });
InventoryMovementSchema.index({ product: 1, branch: 1 });
InventoryMovementSchema.index({ batch: 1, createdAt: -1 });
InventoryMovementSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("InventoryMovement", InventoryMovementSchema);