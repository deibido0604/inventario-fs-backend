"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = {
  outbound: {
    type: Schema.Types.ObjectId,
    ref: "Outbound",
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
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_cost: {
    type: Number,
    required: true
  },
  total_cost: {
    type: Number,
    required: true
  },
  expiration_date: {
    type: Date,
    required: true
  },
  batch_number: {
    type: String,
    required: true
  }
};

const options = {
  collection: "OutboundDetails",
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};

const OutboundDetailSchema = new Schema(schema, options);

OutboundDetailSchema.index({ outbound: 1 });
OutboundDetailSchema.index({ batch: 1 });
OutboundDetailSchema.index({ product: 1 });

module.exports = mongoose.model("OutboundDetail", OutboundDetailSchema);