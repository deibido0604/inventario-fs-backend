// routes/outboundRoutes.js
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

// Crear salida
outboundRouter.post(
  '/create',
  [
    getValidation('create:outbound'),
    validate,
  ],
  createOutbound,
);

// Listar salidas con filtros
outboundRouter.get('/list', listOutbounds);

// Recibir salida
outboundRouter.post('/receive/:id', receiveOutbound);

// Cancelar salida
outboundRouter.post('/cancel/:id', cancelOutbound);

// Ver detalles de una salida
outboundRouter.get('/:id', getOutboundDetails);

// Verificar disponibilidad de producto
outboundRouter.post(
  '/check-availability',
  [
    getValidation('check:availability'),
    validate,
  ],
  checkAvailability,
);

// Obtener productos disponibles en una sucursal
outboundRouter.get('/available-products/:branchId', getAvailableProducts);

// Obtener estadísticas de salidas
outboundRouter.get('/stats', getOutboundStats);

// Verificar límite de sucursal
outboundRouter.get('/check-limit/:branchId', checkBranchLimit);

module.exports = outboundRouter;