const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const Response = require("../components/response");

const validators = {
  login: [
    check("username", "username does not exist.").exists(),
    check("password", "password does not exist.").exists(),
  ],
};

function middlewareRules() {
  const jwtObject = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers["inventario-auth"];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Token requerido",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "inventario-fs");
      req.user = decoded;
      req.headers["console-user"] = decoded.email || decoded.username;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: "Token inválido",
      });
    }
  };

  const authenticateUser = (req, res, next) => {
    if (req.headers["inventario-auth"]) {
      try {
        const decoded = jwt.decode(req.headers["inventario-auth"]);
        req.headers["console-user"] = decoded.email || decoded.username;
      } catch (err) {
        console.log("Error decodificando inventario-auth:", err.message);
      }
    }
    next();
  };

  const getValidation = (scope) => validators[scope] || [];

  const validate = (req, res = response, next) => {
    const responseClass = new Response();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json(responseClass.buildResponse(false, errors.mapped(), 1002, {}));
    }
    next();
  };

  return { jwtObject, authenticateUser, getValidation, validate };
}

module.exports = middlewareRules();
