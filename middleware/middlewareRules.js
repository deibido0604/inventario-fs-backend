const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const Response = require("../components/response");
const { branchValidation } = require("./body_validations/branchValidation");

const validators = {
  login: [
    check("username", "username does not exist.").exists(),
    check("password", "password does not exist.").exists(),
  ],
  "create:user": [],
  "update:user": [],

  'create:branch': branchValidation['create:branch'],
  'update:branch': branchValidation['update:branch'],
};

function middlewareRules() {
  const jwtObject = (req, res, next) => {
    next();
  };

  const authenticateUser = (req, res, next) => {
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