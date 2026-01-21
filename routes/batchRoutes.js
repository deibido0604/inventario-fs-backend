// routes/batchRoutes.js
var express = require('express');
const {
  jwtObject,
  getValidation,
  validate,
  authenticateUser,
} = require('../middleware/middlewareRules');
const batchController = require('../controllers/batchController');

const {
  createBatch,
  getStock,
} = batchController();

var batchRouter = express.Router();

// Crear lote (solo para cargar stock inicial)
batchRouter.post(
  '/create',
  [
    getValidation('create:batch'),
    validate,
  ],
  createBatch,
);

// Verificar stock
batchRouter.get('/stock', getStock);

module.exports = batchRouter;