// services/outboundService.js
"use strict";
const mongoose = require("mongoose");
const Outbound = require("../models/Outbound");
const OutboundDetail = require("../models/OutboundDetail");
const Batch = require("../models/Batch");
const InventoryMovement = require("../models/InventoryMovement");
const Branch = require("../models/Branch");
const Product = require("../models/Products");
const User = require("../models/SystemUser"); // Añadir modelo User
const { buildError } = require("../utils/response");
const logsConstructor = require("../utils/logs");
const constants = require("../components/constants/index");

function outboundService() {
  // Obtener la sucursal donde el usuario es manager
  async function getUserBranch(userId) {
    try {
      // Buscar la sucursal donde este usuario es manager
      const branch = await Branch.findOne({
        manager: userId,
        active: true
      }).lean();
      
      return branch;
    } catch (error) {
      console.error("Error obteniendo sucursal del usuario:", error);
      return null;
    }
  }

  // Obtener información del usuario por ID
  async function getUserById(userId) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        throw buildError(404, "Usuario no encontrado");
      }
      return user;
    } catch (error) {
      throw buildError(404, "Error obteniendo información del usuario");
    }
  }

  // Verificar límite de L 5000 para sucursal destino
  async function checkDestinationBranchLimit(destinationBranchId) {
    try {
      const pendingOutbounds = await Outbound.find({
        destination_branch: destinationBranchId,
        status: "Enviada a sucursal"
      });

      const totalPendingCost = pendingOutbounds.reduce((sum, outbound) => 
        sum + (outbound.total_cost || 0), 0
      );

      const withinLimit = totalPendingCost < 5000;
      
      return {
        success: withinLimit,
        withinLimit,
        currentTotal: totalPendingCost,
        remaining: 5000 - totalPendingCost,
        message: withinLimit 
          ? `Límite disponible: L ${(5000 - totalPendingCost).toFixed(2)}`
          : `La sucursal excede el límite de L 5000. Total actual: L ${totalPendingCost.toFixed(2)}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error verificando límite: ${error.message}`
      };
    }
  }

  // Validar disponibilidad de producto en una sucursal
  async function validateProductStock(productId, quantity, branchId) {
    try {
      const batches = await Batch.find({
        product: productId,
        branch: branchId,
        current_stock: { $gt: 0 }
      }).sort({ expiration_date: 1 });

      let totalAvailable = 0;
      const batchDetails = [];

      for (const batch of batches) {
        totalAvailable += batch.current_stock;
        batchDetails.push({
          batchId: batch._id,
          batchNumber: batch.batch_number,
          available: batch.current_stock,
          expirationDate: batch.expiration_date,
          unitCost: batch.unit_cost
        });
      }

      const isAvailable = totalAvailable >= quantity;
      
      return {
        success: true,
        isAvailable,
        totalAvailable,
        required: quantity,
        batches: batchDetails,
        message: isAvailable 
          ? "Stock disponible" 
          : `Stock insuficiente. Disponible: ${totalAvailable}, Requerido: ${quantity}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error validando stock: ${error.message}`
      };
    }
  }

  // Seleccionar lotes automáticamente (FIFO)
  async function selectBatchesForProduct(productId, quantity, branchId, session = null) {
    try {
      const query = {
        product: productId,
        branch: branchId,
        current_stock: { $gt: 0 }
      };

      const availableBatches = session 
        ? await Batch.find(query).sort({ expiration_date: 1 }).session(session)
        : await Batch.find(query).sort({ expiration_date: 1 });

      let remainingQuantity = quantity;
      const selectedBatches = [];

      for (const batch of availableBatches) {
        if (remainingQuantity <= 0) break;

        const takeQuantity = Math.min(batch.current_stock, remainingQuantity);
        
        selectedBatches.push({
          batchId: batch._id,
          batchNumber: batch.batch_number,
          quantity: takeQuantity,
          unitCost: batch.unit_cost,
          totalCost: takeQuantity * batch.unit_cost,
          expirationDate: batch.expiration_date,
          currentStock: batch.current_stock,
          newStock: batch.current_stock - takeQuantity
        });

        remainingQuantity -= takeQuantity;
      }

      if (remainingQuantity > 0) {
        return {
          success: false,
          message: `No hay suficiente inventario. Faltan ${remainingQuantity} unidades`
        };
      }

      return {
        success: true,
        batches: selectedBatches,
        totalQuantity: quantity,
        totalCost: selectedBatches.reduce((sum, b) => sum + b.totalCost, 0)
      };
    } catch (error) {
      return {
        success: false,
        message: `Error seleccionando lotes: ${error.message}`
      };
    }
  }

  // Crear salida de inventario
  async function createOutbound(params, req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { destination_branch, notes, items, user } = params; // user es solo el ID
      
      // Validar que venga el usuario en el body
      if (!user) {
        throw buildError(400, "ID de usuario no proporcionado en el cuerpo de la solicitud");
      }

      // Obtener información del usuario
      const userInfo = await getUserById(user);

      // 1. Obtener sucursal del usuario (donde es manager)
      const sourceBranch = await getUserBranch(user);
      if (!sourceBranch) {
        throw buildError(400, "El usuario no es manager de ninguna sucursal activa");
      }

      // 2. Validar sucursal destino
      const destinationBranch = await Branch.findById(destination_branch).session(session);
      if (!destinationBranch || !destinationBranch.active) {
        throw buildError(404, "Sucursal destino no encontrada o inactiva");
      }

      // 3. Verificar que no se envíe a la misma sucursal
      if (sourceBranch._id.toString() === destinationBranch._id.toString()) {
        throw buildError(400, "No puede enviar productos a la misma sucursal de origen");
      }

      // 4. Verificar límite de L 5000
      const limitCheck = await checkDestinationBranchLimit(destination_branch);
      if (!limitCheck.withinLimit) {
        throw buildError(400, limitCheck.message);
      }

      // 5. Procesar cada item
      let totalUnits = 0;
      let totalCost = 0;
      const processedItems = [];
      const batchUpdates = [];
      const inventoryMovements = [];

      for (const item of items) {
        const { productId, quantity } = item;

        // Validar producto
        const product = await Product.findById(productId).session(session);
        if (!product || !product.active) {
          throw buildError(404, `Producto no encontrado o inactivo`);
        }

        // Validar cantidad mínima
        if (quantity <= 0) {
          throw buildError(400, `Cantidad inválida para producto ${product.code}`);
        }

        // Seleccionar lotes (FIFO)
        const batchSelection = await selectBatchesForProduct(
          productId, 
          quantity, 
          sourceBranch._id, 
          session
        );

        if (!batchSelection.success) {
          throw buildError(400, `Producto ${product.code}: ${batchSelection.message}`);
        }

        // Procesar cada lote seleccionado
        for (const batch of batchSelection.batches) {
          // Actualizar stock del lote
          batchUpdates.push({
            batchId: batch.batchId,
            newStock: batch.newStock
          });

          // Registrar movimiento de inventario
          const movement = new InventoryMovement({
            movement_type: "salida",
            product: productId,
            batch: batch.batchId,
            branch: sourceBranch._id,
            quantity: batch.quantity,
            previous_stock: batch.currentStock,
            new_stock: batch.newStock,
            unit_cost: batch.unitCost,
            total_cost: batch.totalCost,
            reference_document: "OUTBOUND",
            user: user,
            notes: `Salida a sucursal ${destinationBranch.name} (${destinationBranch.code})`
          });

          inventoryMovements.push(movement);

          // Agregar a items procesados
          processedItems.push({
            product: productId,
            productName: product.name,
            productCode: product.code,
            batch: batch.batchId,
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            unitCost: batch.unitCost,
            totalCost: batch.totalCost,
            expirationDate: batch.expirationDate
          });
        }

        totalUnits += quantity;
        totalCost += batchSelection.totalCost;
      }

      // 6. Crear encabezado de salida
      const outbound = new Outbound({
        source_branch: sourceBranch._id,
        destination_branch,
        user: user,
        status: "Enviada a sucursal",
        total_units: totalUnits,
        total_cost: totalCost,
        sent_date: new Date(),
        notes
      });

      await outbound.save({ session });

      // 7. Actualizar stocks de lotes
      for (const update of batchUpdates) {
        await Batch.findByIdAndUpdate(
          update.batchId,
          { current_stock: update.newStock },
          { session }
        );
      }

      // 8. Guardar movimientos de inventario con referencia a la salida
      for (const movement of inventoryMovements) {
        movement.reference_id = outbound._id;
        await movement.save({ session });
      }

      // 9. Crear detalles de la salida
      for (const item of processedItems) {
        const detail = new OutboundDetail({
          outbound: outbound._id,
          product: item.product,
          batch: item.batch,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total_cost: item.totalCost,
          expiration_date: item.expirationDate,
          batch_number: item.batchNumber
        });

        await detail.save({ session });
      }

      await session.commitTransaction();

      // 10. Registrar log
      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.CREATE_OUTBOUND || "CREATE_OUTBOUND",
          outbound,
          "Salida de inventario creada",
          req.headers["console-user"] || userInfo.username || "system"
        );
      }

      return {
        _id: outbound._id.toString(),
        outbound_number: outbound.outbound_number,
        sourceBranch: sourceBranch.name,
        destinationBranch: destinationBranch.name,
        totalUnits,
        totalCost,
        itemsCount: processedItems.length,
        message: "Salida registrada exitosamente"
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Listar salidas con filtros
  async function listOutbounds(filters, req) {
    try {
      const { startDate, endDate, destination_branch, status, search, user } = filters; // user es solo el ID
      
      // Validar que venga el usuario en el body
      if (!user) {
        throw buildError(400, "ID de usuario no proporcionado en el cuerpo de la solicitud");
      }

      // Obtener información del usuario
      const userInfo = await getUserById(user);

      const query = {};

      // Filtrar por fecha
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(`${endDate}T23:59:59.999Z`)
        };
      }

      // Filtrar por sucursal destino
      if (destination_branch) {
        query.destination_branch = destination_branch;
      }

      // Filtrar por estado
      if (status) {
        query.status = status;
      }

      // Búsqueda por número
      if (search) {
        query.outbound_number = { $regex: search, $options: "i" };
      }

      // Obtener sucursal del usuario
      const userBranch = await getUserBranch(user);
      
      // Si el usuario no es admin y tiene sucursal, filtrar por su sucursal
      if (!userInfo.isAdmin && userBranch) {
        // El usuario puede ver:
        // 1. Salidas que salieron de su sucursal
        // 2. Salidas que llegaron a su sucursal
        query.$or = [
          { source_branch: userBranch._id },
          { destination_branch: userBranch._id }
        ];
      }

      // Obtener salidas
      const outbounds = await Outbound.find(query)
        .populate("source_branch", "name code")
        .populate("destination_branch", "name code")
        .populate("user", "name username")
        .populate("received_by", "name username")
        .sort({ createdAt: -1 })
        .lean();

      // Obtener detalles para calcular unidades
      const outboundsWithDetails = await Promise.all(
        outbounds.map(async (outbound) => {
          const details = await OutboundDetail.find({ outbound: outbound._id });
          const units = details.reduce((sum, detail) => sum + detail.quantity, 0);

          // Verificar si el usuario puede recibir esta salida
          // Solo si es manager de la sucursal destino
          const canReceive = outbound.status === "Enviada a sucursal" && 
                           userBranch && 
                           userBranch._id.toString() === outbound.destination_branch._id.toString();

          return {
            ...outbound,
            total_units: units,
            canReceive
          };
        })
      );

      return outboundsWithDetails;

    } catch (error) {
      throw error;
    }
  }

  // Recibir salida en sucursal destino
  async function receiveOutbound(params, req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id, user } = params; // id y user (ID) vienen en el body
      
      // Validar que venga el usuario en el body
      if (!user) {
        throw buildError(400, "ID de usuario no proporcionado en el cuerpo de la solicitud");
      }

      // Obtener información del usuario
      const userInfo = await getUserById(user);

      // 1. Obtener salida
      const outbound = await Outbound.findById(id).session(session);
      if (!outbound) {
        throw buildError(404, "Salida no encontrada");
      }

      // 2. Validar estado
      if (outbound.status !== "Enviada a sucursal") {
        throw buildError(400, "La salida no está en estado 'Enviada a sucursal'");
      }

      // 3. Verificar que el usuario es manager de la sucursal destino
      const userBranch = await getUserBranch(user);
      if (!userBranch || userBranch._id.toString() !== outbound.destination_branch.toString()) {
        throw buildError(403, "Solo el manager de la sucursal destino puede recibir esta salida");
      }

      // 4. Obtener detalles de la salida
      const details = await OutboundDetail.find({ outbound: id })
        .populate("product")
        .session(session);

      // 5. Procesar recepción de cada producto
      for (const detail of details) {
        // Buscar lote en sucursal destino
        let batch = await Batch.findOne({
          batch_number: detail.batch_number,
          product: detail.product._id,
          branch: outbound.destination_branch
        }).session(session);

        if (batch) {
          // Actualizar lote existente
          const previousStock = batch.current_stock;
          batch.current_stock += detail.quantity;
          await batch.save({ session });

          // Registrar movimiento
          const movement = new InventoryMovement({
            movement_type: "entrada",
            product: detail.product._id,
            batch: batch._id,
            branch: outbound.destination_branch,
            quantity: detail.quantity,
            previous_stock: previousStock,
            new_stock: batch.current_stock,
            unit_cost: detail.unit_cost,
            total_cost: detail.total_cost,
            reference_document: "RECEPCION",
            reference_id: outbound._id,
            user: user,
            notes: `Recepción de salida ${outbound.outbound_number}`
          });

          await movement.save({ session });
        } else {
          // Crear nuevo lote en destino
          const sourceBatch = await Batch.findById(detail.batch).session(session);
          
          batch = new Batch({
            batch_number: detail.batch_number,
            product: detail.product._id,
            branch: outbound.destination_branch,
            quantity: detail.quantity,
            current_stock: detail.quantity,
            expiration_date: detail.expiration_date,
            unit_cost: detail.unit_cost,
            entry_date: new Date(),
            manufacturing_date: sourceBatch?.manufacturing_date,
            supplier: sourceBatch?.supplier,
            invoice_number: sourceBatch?.invoice_number
          });

          await batch.save({ session });

          // Registrar movimiento
          const movement = new InventoryMovement({
            movement_type: "entrada",
            product: detail.product._id,
            batch: batch._id,
            branch: outbound.destination_branch,
            quantity: detail.quantity,
            previous_stock: 0,
            new_stock: detail.quantity,
            unit_cost: detail.unit_cost,
            total_cost: detail.total_cost,
            reference_document: "RECEPCION",
            reference_id: outbound._id,
            user: user,
            notes: `Recepción de salida ${outbound.outbound_number} - Nuevo lote`
          });

          await movement.save({ session });
        }
      }

      // 6. Actualizar salida
      outbound.status = "Recibido en sucursal";
      outbound.received_date = new Date();
      outbound.received_by = user;
      await outbound.save({ session });

      await session.commitTransaction();

      // 7. Registrar log
      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.RECEIVE_OUTBOUND || "RECEIVE_OUTBOUND",
          outbound,
          "Salida recibida en sucursal",
          req.headers["console-user"] || userInfo.username || "system"
        );
      }

      return {
        _id: outbound._id.toString(),
        outbound_number: outbound.outbound_number,
        message: "Salida recibida exitosamente"
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Verificar disponibilidad de producto
  async function checkProductAvailability(params, req) {
    try {
      const { productId, quantity, user } = params; // user es solo el ID
      
      // Validar que venga el usuario en el body
      if (!user) {
        throw buildError(400, "ID de usuario no proporcionado en el cuerpo de la solicitud");
      }

      // Obtener información del usuario
      const userInfo = await getUserById(user);

      // Obtener sucursal del usuario
      const userBranch = await getUserBranch(user);
      if (!userBranch) {
        return buildError(400, "El usuario no es manager de ninguna sucursal");
      }

      const stockCheck = await validateProductStock(
        productId, 
        quantity, 
        userBranch._id
      );
      
      if (!stockCheck.success) {
        return stockCheck;
      }

      // Si hay stock, obtener detalles de lotes
      if (stockCheck.isAvailable) {
        const batchSelection = await selectBatchesForProduct(
          productId, 
          quantity, 
          userBranch._id
        );
        
        if (batchSelection.success) {
          return {
            success: true,
            isAvailable: true,
            totalAvailable: stockCheck.totalAvailable,
            required: quantity,
            batches: batchSelection.batches,
            totalCost: batchSelection.totalCost,
            message: "Producto disponible"
          };
        }
      }

      return stockCheck;

    } catch (error) {
      throw error;
    }
  }

  // Obtener detalles de una salida
  async function getOutboundDetails(params, req) {
    try {
      const { id, user } = params; // id y user (ID) vienen en el body
      
      // Validar que venga el usuario en el body
      if (!user) {
        throw buildError(400, "ID de usuario no proporcionado en el cuerpo de la solicitud");
      }

      // Obtener información del usuario
      const userInfo = await getUserById(user);

      const outbound = await Outbound.findById(id)
        .populate("source_branch", "name code address city phone email")
        .populate("destination_branch", "name code address city phone email")
        .populate("user", "name username email")
        .populate("received_by", "name username email");

      if (!outbound) {
        throw buildError(404, "Salida no encontrada");
      }

      // Verificar permisos
      const userBranch = await getUserBranch(user);
      const canView = userInfo.isAdmin || 
                     (userBranch && (
                       outbound.source_branch._id.toString() === userBranch._id.toString() ||
                       outbound.destination_branch._id.toString() === userBranch._id.toString()
                     ));
      
      if (!canView) {
        throw buildError(403, "No tiene permisos para ver esta salida");
      }

      const details = await OutboundDetail.find({ outbound: id })
        .populate("product", "name code unit_of_measure category")
        .populate("batch", "batch_number")
        .lean();

      return {
        outbound,
        details
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener productos disponibles en la sucursal del usuario
  async function getAvailableProducts(params, req) {
    try {
      const { branchId, user } = params; // user es solo el ID
      
      // Validar que venga el usuario en el body
      if (!user) {
        throw buildError(400, "ID de usuario no proporcionado en el cuerpo de la solicitud");
      }

      // Obtener información del usuario
      const userInfo = await getUserById(user);

      let targetBranchId = branchId;

      // Si no se especifica branchId, usar la sucursal del usuario
      if (!targetBranchId) {
        const userBranch = await getUserBranch(user);
        if (!userBranch) {
          throw buildError(400, "El usuario no es manager de ninguna sucursal");
        }
        targetBranchId = userBranch._id;
      }

      // Buscar lotes con stock en la sucursal
      const batches = await Batch.find({
        branch: targetBranchId,
        current_stock: { $gt: 0 }
      })
        .populate("product")
        .sort({ "product.name": 1, expiration_date: 1 });

      // Agrupar por producto
      const productMap = new Map();

      for (const batch of batches) {
        if (batch.product && batch.product.active) {
          const productId = batch.product._id.toString();
          
          if (!productMap.has(productId)) {
            productMap.set(productId, {
              productId: batch.product._id,
              code: batch.product.code,
              name: batch.product.name,
              description: batch.product.description,
              unit_of_measure: batch.product.unit_of_measure,
              unit_cost: batch.product.unit_cost,
              category: batch.product.category,
              totalStock: 0,
              batches: [],
              available: true
            });
          }

          const product = productMap.get(productId);
          product.totalStock += batch.current_stock;
          product.batches.push({
            batchId: batch._id,
            batchNumber: batch.batch_number,
            stock: batch.current_stock,
            expirationDate: batch.expiration_date,
            unitCost: batch.unit_cost,
            totalCost: batch.current_stock * batch.unit_cost
          });
        }
      }

      const products = Array.from(productMap.values());

      return products;

    } catch (error) {
      throw error;
    }
  }

  // Obtener estadísticas
  async function getOutboundStats(params, req) {
    try {
      const { startDate, endDate, branchId, user } = params; // user es solo el ID
      
      // Validar que venga el usuario en el body
      if (!user) {
        throw buildError(400, "ID de usuario no proporcionado en el cuerpo de la solicitud");
      }

      // Obtener información del usuario
      const userInfo = await getUserById(user);

      const match = {};
      
      if (startDate && endDate) {
        match.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      // Si el usuario no es admin, filtrar por su sucursal
      if (!userInfo.isAdmin) {
        const userBranch = await getUserBranch(user);
        if (userBranch) {
          match.$or = [
            { source_branch: userBranch._id },
            { destination_branch: userBranch._id }
          ];
        }
      } else if (branchId) {
        // Filtrar por sucursal específica si es admin
        match.$or = [
          { source_branch: branchId },
          { destination_branch: branchId }
        ];
      }

      const stats = await Outbound.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalUnits: { $sum: "$total_units" },
            totalCost: { $sum: "$total_cost" },
            avgCost: { $avg: "$total_cost" }
          }
        }
      ]);

      const totals = await Outbound.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalUnits: { $sum: "$total_units" },
            totalCost: { $sum: "$total_cost" }
          }
        }
      ]);

      return {
        byStatus: stats,
        totals: totals[0] || { total: 0, totalUnits: 0, totalCost: 0 }
      };

    } catch (error) {
      throw error;
    }
  }

  // Cancelar salida
  async function cancelOutbound(params, req) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id, user } = params; // id y user (ID) vienen en el body
      
      // Validar que venga el usuario en el body
      if (!user) {
        throw buildError(400, "ID de usuario no proporcionado en el cuerpo de la solicitud");
      }

      // Obtener información del usuario
      const userInfo = await getUserById(user);

      // 1. Obtener salida
      const outbound = await Outbound.findById(id).session(session);
      if (!outbound) {
        throw buildError(404, "Salida no encontrada");
      }

      if (outbound.status === "Recibido en sucursal") {
        throw buildError(400, "No se puede cancelar una salida ya recibida");
      }

      if (outbound.status === "Cancelada") {
        throw buildError(400, "La salida ya está cancelada");
      }

      // 2. Verificar que el usuario es manager de la sucursal de origen
      const userBranch = await getUserBranch(user);
      if (!userBranch || userBranch._id.toString() !== outbound.source_branch.toString()) {
        throw buildError(403, "Solo el manager de la sucursal de origen puede cancelar esta salida");
      }

      // 3. Obtener detalles
      const details = await OutboundDetail.find({ outbound: id }).session(session);

      // 4. Revertir stock en lotes originales
      for (const detail of details) {
        const batch = await Batch.findById(detail.batch).session(session);
        if (batch) {
          batch.current_stock += detail.quantity;
          await batch.save({ session });

          // Registrar movimiento de reversión
          const movement = new InventoryMovement({
            movement_type: "ajuste",
            product: detail.product,
            batch: detail.batch,
            branch: outbound.source_branch,
            quantity: detail.quantity,
            previous_stock: batch.current_stock - detail.quantity,
            new_stock: batch.current_stock,
            unit_cost: detail.unit_cost,
            total_cost: detail.total_cost,
            reference_document: "CANCELACION",
            reference_id: outbound._id,
            user: user,
            notes: `Cancelación de salida ${outbound.outbound_number}`
          });

          await movement.save({ session });
        }
      }

      // 5. Actualizar estado
      outbound.status = "Cancelada";
      await outbound.save({ session });

      await session.commitTransaction();

      // 6. Registrar log
      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.CANCEL_OUTBOUND || "CANCEL_OUTBOUND",
          outbound,
          "Salida cancelada",
          req.headers["console-user"] || userInfo.username || "system"
        );
      }

      return {
        _id: outbound._id.toString(),
        outbound_number: outbound.outbound_number,
        message: "Salida cancelada exitosamente"
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  return {
    createOutbound,
    listOutbounds,
    receiveOutbound,
    checkProductAvailability,
    getOutboundDetails,
    getOutboundStats,
    cancelOutbound,
    checkDestinationBranchLimit,
    getAvailableProducts
  };
}

module.exports = outboundService();