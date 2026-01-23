"use strict";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = {
  outbound_number: {
    type: String,
    unique: true
  },
  source_branch: {
    type: Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },
  destination_branch: {
    type: Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "SystemUser",
    required: true
  },
  status: {
    type: String,
    enum: ["Pendiente", "Enviada a sucursal", "Recibido en sucursal", "Cancelada"],
    default: "Pendiente"
  },
  total_units: {
    type: Number,
    required: true,
    default: 0
  },
  total_cost: {
    type: Number,
    required: true,
    default: 0
  },
  request_date: {
    type: Date,
    default: Date.now
  },
  sent_date: {
    type: Date
  },
  received_date: {
    type: Date
  },
  received_by: {
    type: Schema.Types.ObjectId,
    ref: "SystemUser"
  },
  notes: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true
  }
};

const options = {
  collection: "Outbounds",
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
};

const OutboundSchema = new Schema(schema, options);

OutboundSchema.pre('save', async function(next) {
  if (!this.outbound_number) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      request_date: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year+1}-01-01`)
      }
    });
    this.outbound_number = `SAL-${year}-${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

OutboundSchema.index({ outbound_number: 1 }, { unique: true });
OutboundSchema.index({ destination_branch: 1, status: 1 });
OutboundSchema.index({ user: 1, request_date: -1 });
OutboundSchema.index({ request_date: -1 });

module.exports = mongoose.model("Outbound", OutboundSchema);