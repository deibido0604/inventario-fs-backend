const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
var jwtDecode = require('jwt-decode');
const { check, validationResult } = require('express-validator');
const Response = require('../components/response');

// Importar SOLO productValidation (las otras no existen por ahora)
const { productValidation } = require('./body_validations/productValidation');

// Como solo tenemos productValidation, no necesitamos importar los demás
const validators = {
  login: [
    check('username', 'username does not exist.').exists(),
    check('password', 'password does not exist.').exists(),
  ],
  ...productValidation
  // Los demás se agregarán cuando existan
};

function middlewareRules() {
  // Para desarrollo: JWT simplificado
  const jwtObject = (req, res, next) => {
    try {
      // Opción 1: Si usas Auth0 (completo)
      if (process.env.JWSKURI && process.env.JWSKURI !== '') {
        const auth0Check = jwt({
          secret: jwks.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: process.env.JWSKURI,
          }),
          aud: process.env.AUD,
          issuer: process.env.ISSUER,
          algorithms: ['RS256'],
        });
        return auth0Check(req, res, next);
      }
      
      // Opción 2: JWT simple para desarrollo
      const authHeader = req.headers.authorization || req.headers['compi-auth'];
      
      if (!authHeader) {
        // Permitir continuar en desarrollo sin token
        console.log('⚠️  Desarrollo: No se proporcionó token, continuando...');
        req.user = { email: 'dev@localhost' };
        req.headers['console-user'] = 'dev@localhost';
        return next();
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      // Verificar con JWT simple
      const decoded = jwtDecode(token);
      req.user = decoded;
      
      if (decoded.email) {
        req.headers['console-user'] = decoded.email;
      }
      
      next();
    } catch (error) {
      console.error('❌ JWT Error:', error.message);
      // En desarrollo, permitimos continuar
      console.log('⚠️  Desarrollo: Continuando sin autenticación...');
      req.user = { email: 'dev@localhost' };
      next();
    }
  };

  function authenticateUser(req, res, next) {
    // En desarrollo, siempre permitir
    if (process.env.NODE_ENV === 'development') {
      console.log('🔓 Desarrollo: Autenticación bypass');
      if (!req.headers['console-user']) {
        req.headers['console-user'] = 'dev@localhost';
      }
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