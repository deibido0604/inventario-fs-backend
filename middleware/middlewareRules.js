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
  // Modificado: Ahora siempre pasa sin validar el token
  const jwtObject = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers["inventario-auth"];
    
    if (authHeader) {
      // Si hay token, intentamos decodificarlo pero no fallamos si es inválido
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;
      
      try {
        const decoded = jwt.decode(token); // Usamos decode en lugar de verify
        if (decoded) {
          req.user = decoded;
          req.headers["console-user"] = decoded.email || decoded.username;
        }
      } catch (error) {
        // No hacemos nada si falla el decode
        console.log("Token no válido, pero continuamos sin autenticación");
      }
    }
    
    // Si no hay token o es inválido, asignamos un usuario por defecto para desarrollo
    if (!req.user) {
      req.user = {
        id: "dev-user-001",
        username: "developer",
        email: "dev@inventario.com",
        role: "admin",
        permissions: ["all"]
      };
      req.headers["console-user"] = "developer";
    }
    
    console.log("Usuario actual (simulado):", req.user.username);
    next();
  };

  const authenticateUser = (req, res, next) => {
    // Simplemente continuamos sin verificar
    if (req.headers["inventario-auth"]) {
      try {
        const decoded = jwt.decode(req.headers["inventario-auth"]);
        if (decoded) {
          req.headers["console-user"] = decoded.email || decoded.username;
        }
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