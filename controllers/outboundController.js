// controllers/outboundController.js
const { validationResult } = require("express-validator");
const outboundService = require("../services/outboundService");
const Response = require("../components/response");

function outboundController() {
  async function createOutbound(req, res) {
    const responseClass = new Response();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array(),
        code: 422,
      });
    }

    const outboundData = req.body;

    outboundService
      .createOutbound(outboundData, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Salida creada exitosamente", 200, data),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function listOutbounds(req, res) {
    const responseClass = new Response();
    try {
      const filters = req.query;

      outboundService
        .listOutbounds(filters, req)
        .then((data) => {
          return res
            .status(200)
            .send(responseClass.buildResponse(true, "success", 200, data));
        })
        .catch((error) => {
          return res.status(error.code || 500).send(error);
        });
    } catch (error) {
      return res
        .status(500)
        .send(responseClass.buildResponse(false, error.message, 500));
    }
  }

  async function receiveOutbound(req, res) {
    const responseClass = new Response();
    const { id } = req.params;

    outboundService
      .receiveOutbound(id, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Salida recibida exitosamente", 200, data),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getOutboundDetails(req, res) {
    const responseClass = new Response();
    const { id } = req.params;

    outboundService
      .getOutboundDetails(id, req)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "success", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function checkAvailability(req, res) {
    const responseClass = new Response();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array(),
        code: 422,
      });
    }

    const params = req.body;

    outboundService
      .checkProductAvailability(params, req)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "Disponibilidad verificada", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getAvailableProducts(req, res) {
    const responseClass = new Response();
    const { branchId } = req.params;

    outboundService
      .getAvailableProducts(branchId, req)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "Productos obtenidos", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getOutboundStats(req, res) {
    const responseClass = new Response();
    const filters = req.query;

    outboundService
      .getOutboundStats(filters, req)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "Estadísticas obtenidas", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function checkBranchLimit(req, res) {
    const responseClass = new Response();
    const { branchId } = req.params;

    outboundService
      .checkDestinationBranchLimit(branchId)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "Límite verificado", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function cancelOutbound(req, res) {
    const responseClass = new Response();
    const { id } = req.params;

    outboundService
      .cancelOutbound(id, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Salida cancelada exitosamente", 200, data),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  return {
    createOutbound,
    listOutbounds,
    receiveOutbound,
    getOutboundDetails,
    checkAvailability,
    getAvailableProducts,
    getOutboundStats,
    checkBranchLimit,
    cancelOutbound,
  };
}

module.exports = outboundController;