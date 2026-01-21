"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = {
  code: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: "SystemUser"
  },
  max_outstanding_amount: {
    type: Number,
    default: 5000,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
};

const options = {
  collection: "Branches",
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};

const BranchSchema = new Schema(schema, options);

BranchSchema.index({ code: 1 }, { unique: true });
BranchSchema.index({ name: 1 });
BranchSchema.index({ city: 1 });
BranchSchema.index({ active: 1 });

module.exports = mongoose.model("Branch", BranchSchema);