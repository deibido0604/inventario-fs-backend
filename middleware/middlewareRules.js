const jwt = require("express-jwt");
const jwks = require("jwks-rsa");
var jwtDecode = require("jwt-decode");
const { check, validationResult } = require("express-validator");
const Response = require("../components/response");

const { productValidation } = require("./body_validations/productValidation");
const {
  systemUserValidation,
} = require("./body_validations/systemUserValidation");

const validators = {
  login: [
    check("username", "username does not exist.").exists(),
    check("password", "password does not exist.").exists(),
  ],
  ...productValidation,
  ...systemUserValidation,
};

function middlewareRules() {
  const jwtObject = (req, res, next) => {
    if (!process.env.JWSKURI || process.env.JWSKURI === "") {
      const authHeader = req.headers.authorization || req.headers["inventario-fs"];

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
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "inventario-fs",
        );
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
    } else {
      return jwt({
        secret: jwks.expressJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: process.env.JWSKURI,
        }),
        aud: process.env.AUD,
        issuer: process.env.ISSUER,
        algorithms: ["RS256"],
      })(req, res, next);
    }
  };

  function authenticateUser(req, res, next) {
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    // En producción, verificar
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        msg: "Usuario no autenticado",
      });
    }

    next();
  }

  function getValidation(scope) {
    var validator = validators[scope];

    if (!validator) {
      return [];
    }

    return validator;
  }

  function validate(req, res = response, next) {
    const responseClass = new Response();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json(responseClass.buildResponse(false, errors.mapped(), 1002, {}));
    }
    next();
  }

  return { jwtObject, authenticateUser, getValidation, validate };
}

module.exports = middlewareRules();
