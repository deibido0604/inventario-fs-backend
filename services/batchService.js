// services/batchService.js - Versión SIMPLIFICADA
"use strict";
const mongoose = require("mongoose");
const Batch = require("../models/Batch");
const Product = require("../models/Products");
const Branch = require("../models/Branch");
const { buildError } = require("../utils/response");

function batchService() {
  // Crear lote inicial
  async function createBatch(params) {
    try {
      const {
        batch_number,
        product,
        branch,
        quantity,
        current_stock,
        expiration_date,
        unit_cost,
        supplier,
        user
      } = params;

      // Validar producto
      const productExists = await Product.findById(product);
      if (!productExists) {
        throw buildError(404, "Producto no encontrado");
      }

      // Validar sucursal
      const branchExists = await Branch.findById(branch);
      if (!branchExists) {
        throw buildError(404, "Sucursal no encontrada");
      }

      // Verificar si ya existe el número de lote
      const existingBatch = await Batch.findOne({ batch_number });
      if (existingBatch) {
        throw buildError(400, "Ya existe un lote con este número");
      }

      // Crear lote
      const batch = new Batch({
        batch_number,
        product,
        branch,
        quantity,
        current_stock: current_stock || quantity,
        expiration_date,
        unit_cost,
        supplier,
        entry_date: new Date(),
        active: true
      });

      await batch.save();

      return {
        _id: batch._id.toString(),
        batch_number: batch.batch_number,
        productName: productExists.name,
        branchName: branchExists.name,
        quantity: batch.quantity,
        current_stock: batch.current_stock,
        unit_cost: batch.unit_cost,
        message: "Lote creado exitosamente"
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener stock por producto y sucursal (para verificación)
  async function getStockByProduct(params) {
    try {
      const { productId, branchId } = params;
      
      const batches = await Batch.find({
        product: productId,
        branch: branchId,
        current_stock: { $gt: 0 }
      }).sort({ expiration_date: 1 });

      const totalStock = batches.reduce((sum, batch) => sum + batch.current_stock, 0);

      return {
        productId,
        totalStock,
        batches: batches.map(batch => ({
          batchId: batch._id,
          batch_number: batch.batch_number,
          current_stock: batch.current_stock,
          expiration_date: batch.expiration_date,
          unit_cost: batch.unit_cost,
          daysToExpire: Math.ceil((batch.expiration_date - new Date()) / (1000 * 60 * 60 * 24))
        }))
      };

    } catch (error) {
      throw error;
    }
  }

  return {
    createBatch,
    getStockByProduct
  };
}

module.exports = batchService();