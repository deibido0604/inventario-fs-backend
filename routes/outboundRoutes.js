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

outboundRouter.use(jwtObject, authenticateUser);

outboundRouter.get('/available-products/:branchId', getAvailableProducts);

outboundRouter.get('/available-products', getAvailableProducts);

outboundRouter.get('/list', listOutbounds);

outboundRouter.get('/check-limit', checkBranchLimit);

outboundRouter.get('/stats', getOutboundStats);

outboundRouter.get('/:id', getOutboundDetails);

outboundRouter.post(
  '/create',
  [
    getValidation('create:outbound'),
    validate,
  ],
  createOutbound,
);

outboundRouter.post('/receive/:id', receiveOutbound);

outboundRouter.post('/cancel/:id', cancelOutbound);

outboundRouter.post(
  '/check-availability',
  [
    getValidation('check:availability'),
    validate,
  ],
  checkAvailability,
);

module.exports = outboundRouter;