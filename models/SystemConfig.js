"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = {
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ["general", "inventory", "security", "branches", "notifications"]
  },
  data_type: {
    type: String,
    enum: ["string", "number", "boolean", "array", "object"]
  },
  is_editable: {
    type: Boolean,
    default: true
  }
};

const options = {
  collection: "SystemConfigs",
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};

const SystemConfigSchema = new Schema(schema, options);

// Índices
SystemConfigSchema.index({ key: 1 }, { unique: true });
SystemConfigSchema.index({ category: 1 });

module.exports = mongoose.model("SystemConfig", SystemConfigSchema);