const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
var jwtDecode = require('jwt-decode');
const { check, validationResult } = require('express-validator');
const Response = require('../components/response');

const {
  productValidation
} = require('./body_validations/productValidation');

// Como solo tenemos productValidation, no necesitamos importar los demás
const validators = {
  login: [
    check('username', 'username does not exist.').exists(),
    check('password', 'password does not exist.').exists(),
  ],
  ...productValidation
};

function middlewareRules() {
  // Si estamos en desarrollo o no hay JWSKURI configurado, usar JWT simple
  const jwtObject = (req, res, next) => {
    // Si es desarrollo o no hay JWSKURI, usar JWT simple
    if (process.env.NODE_ENV === 'development' || !process.env.JWSKURI) {
      const authHeader = req.headers.authorization || req.headers['compi-auth'];
      
      if (!authHeader) {
        // En desarrollo, crear un usuario dummy
        req.user = { email: 'dev@localhost', username: 'dev_user' };
        req.headers['console-user'] = 'dev@localhost';
        return next();
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      try {
        // Decodificar sin verificar (para desarrollo)
        const decoded = jwtDecode(token);
        req.user = decoded;
        req.headers['console-user'] = decoded.email || decoded.username || 'dev_user';
      } catch (error) {
        console.error('JWT decode error:', error.message);
        // En desarrollo, continuar con usuario dummy
        req.user = { email: 'dev@localhost', username: 'dev_user' };
        req.headers['console-user'] = 'dev@localhost';
      }
      return next();
    }
    
    // En producción con Auth0
    return jwt({
      secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: process.env.JWSKURI,
      }),
      aud: process.env.AUD,
      issuer: process.env.ISSUER,
      algorithms: ['RS256'],
    })(req, res, next);
  };

  function authenticateUser(req, res, next) {
    // Si es desarrollo, no verificar
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // En producción, verificar
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        msg: "Usuario no autenticado"
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
        .json(
          responseClass.buildResponse(
            false,
            errors.mapped(),
            1002,
            {},
          ),
        );
    }
    next();
  }

  return { jwtObject, authenticateUser, getValidation, validate };
}

module.exports = middlewareRules();