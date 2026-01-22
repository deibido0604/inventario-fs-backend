// routes/outboundRoutes.js - CORREGIDO
var express = require('express');
const {
  jwtObject,
  getValidation,
  validate,
  authenticateUser,
} = require('../middleware/middlewareRules');
const outboundController = require('../controllers/outboundController');

const {
  createOutbound,
  listOutbounds,
  receiveOutbound,
  getOutboundDetails,
  checkAvailability,
  getAvailableProducts,
  getOutboundStats,
  checkBranchLimit,
  cancelOutbound,
} = outboundController();

var outboundRouter = express.Router();

// Todas las rutas requieren autenticación
outboundRouter.use(jwtObject, authenticateUser);

// Obtener productos disponibles en una sucursal
outboundRouter.get('/available-products/:branchId', getAvailableProducts);

// También aceptar query param (opcional)
outboundRouter.get('/available-products', getAvailableProducts);

// Listar salidas con filtros
outboundRouter.get('/list', listOutbounds);

// Verificar límite de sucursal
outboundRouter.get('/check-limit/:branchId', checkBranchLimit);

// Obtener estadísticas de salidas
outboundRouter.get('/stats', getOutboundStats);

// ===== RUTAS DINÁMICAS AL FINAL =====

// Ver detalles de una salida (ESTA DEBE IR AL FINAL)
outboundRouter.get('/:id', getOutboundDetails);

// ===== RUTAS POST =====

// Crear salida
outboundRouter.post(
  '/create',
  [
    getValidation('create:outbound'),
    validate,
  ],
  createOutbound,
);

// Recibir salida
outboundRouter.post('/receive/:id', receiveOutbound);

// Cancelar salida
outboundRouter.post('/cancel/:id', cancelOutbound);

// Verificar disponibilidad de producto
outboundRouter.post(
  '/check-availability',
  [
    getValidation('check:availability'),
    validate,
  ],
  checkAvailability,
);

module.exports = outboundRouter;