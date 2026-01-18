const { validationResult } = require("express-validator");
const systemUserService = require("../services/systemUserService");
const Response = require("../components/response");

function systemUserController() {
  async function getAllSystemUsers(req, res) {
    const responseClass = new Response();
    const { skip, limit, type, active } = req.query;

    systemUserService
      .getAllSystemUsers(parseInt(skip), parseInt(limit), type || [], active)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "success", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getSystemUserById(req, res) {
    const responseClass = new Response();
    const { id } = req.params;

    systemUserService
      .getSystemUserById(id)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "success", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function createSystemUser(req, res) {
    const responseClass = new Response();
    const user = req.body;

    systemUserService
      .createSystemUser(user, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Usuario creado!", 200, data)
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function updateSystemUser(req, res) {
    const responseClass = new Response();
    const user = req.body;

    systemUserService
      .updateSystemUser(user, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Usuario actualizado!", 200, data)
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function deleteSystemUser(req, res) {
    const responseClass = new Response();
    const { id } = req.params;

    systemUserService
      .deleteSystemUser(id, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Usuario eliminado!", 200, data)
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function loginSystemUser(req, res) {
    const responseClass = new Response();
    const { username, password } = req.body;

    systemUserService
      .loginSystemUser(username, password, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Login exitoso!", 200, data)
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function logoutSystemUser(req, res) {
    const responseClass = new Response();
    const userId = req.user ? req.user.userId : null;

    if (!userId) {
      return res
        .status(401)
        .send(responseClass.buildResponse(false, "Usuario no autenticado", 401, {}));
    }

    systemUserService
      .logoutSystemUser(userId, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Logout exitoso!", 200, data)
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  return {
    getAllSystemUsers,
    getSystemUserById,
    createSystemUser,
    updateSystemUser,
    deleteSystemUser,
    loginSystemUser,
    logoutSystemUser
  };
}

module.exports = systemUserController;