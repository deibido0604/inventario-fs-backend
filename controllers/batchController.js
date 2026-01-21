// controllers/batchController.js - Versión SIMPLIFICADA
const { validationResult } = require("express-validator");
const batchService = require("../services/batchService");
const Response = require("../components/response");

function batchController() {
  async function createBatch(req, res) {
    const responseClass = new Response();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array(),
        code: 422,
      });
    }

    const batchData = req.body;

    batchService
      .createBatch(batchData)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Lote creado exitosamente", 200, data),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getStock(req, res) {
    const responseClass = new Response();
    const { productId, branchId } = req.query;

    batchService
      .getStockByProduct({ productId, branchId })
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "Stock obtenido", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  return {
    createBatch,
    getStock
  };
}

module.exports = batchController;