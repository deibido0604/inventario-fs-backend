"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = {
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  avatar: {
    type: String,
  },
  department: {
    type: String,
    required: true,
  },
  roles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roles",
    },
  ],
  active: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
};

const options = {
  collection: "SystemUsers",
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
};

const SystemUserSchema = new Schema(schema, options);

SystemUserSchema.index({ username: 1 }, { unique: true });
SystemUserSchema.index({ email: 1 }, { unique: true });
SystemUserSchema.index({ active: 1 });
SystemUserSchema.index({ department: 1 });

module.exports = mongoose.model("SystemUser", SystemUserSchema);
