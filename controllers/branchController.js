const { validationResult } = require("express-validator");
const branchService = require("../services/branchService");
const Response = require("../components/response");

function branchController() {
  async function getAllBranches(req, res) {
    const responseClass = new Response();
    const { active, city, search } = req.query;

    const filters = {};
    if (active !== undefined) filters.active = active;
    if (city) filters.city = city;
    if (search) filters.search = search;

    branchService
      .getAllBranches(filters)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "success", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getBranchById(req, res) {
    const responseClass = new Response();
    const { id } = req.params;

    branchService
      .getBranchById(id)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "success", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function createBranch(req, res) {
    const responseClass = new Response();
    const branch = req.body;

    branchService
      .createBranch(branch, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Sucursal creada!", 200, data),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function updateBranch(req, res) {
    const responseClass = new Response();
    const branch = req.body;

    branchService
      .updateBranch(branch, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(
              true,
              "Sucursal actualizada!",
              200,
              data,
            ),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function deleteBranch(req, res) {
    const responseClass = new Response();
    const { id } = req.params;

    branchService
      .deleteBranch(id, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Sucursal eliminada!", 200, data),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getBranchStats(req, res) {
    const responseClass = new Response();

    branchService
      .getBranchStats()
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(
              true,
              "Estadísticas obtenidas",
              200,
              data,
            ),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getActiveBranches(req, res) {
    const responseClass = new Response();

    branchService
      .getActiveBranches()
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Sucursales activas", 200, data),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getDestinationBranchesForUser(req, res) {
    const responseClass = new Response();

    const { userId } = req.query;

    if (!userId) {
      return res
        .status(400)
        .send(
          responseClass.buildResponse(false, "ID de usuario requerido", 400),
        );
    }

    branchService
      .getDestinationBranchesForUser(userId)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(
              true,
              "Sucursales destino obtenidas",
              200,
              data,
            ),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  return {
    getAllBranches,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranchStats,
    getActiveBranches,
    getDestinationBranchesForUser,
  };
}

module.exports = branchController;