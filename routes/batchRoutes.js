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

batchRouter.post(
  '/create',
  [
    getValidation('create:batch'),
    validate,
  ],
  createBatch,
);

batchRouter.get('/stock', getStock);

module.exports = batchRouter;