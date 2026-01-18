const { check } = require('express-validator');

const systemUserValidation = {
  'create:user': [
    check('username', 'username does not exist.').not().isEmpty(),
    check('email', 'email does not exist.').not().isEmpty().isEmail(),
    check('password', 'password does not exist.').not().isEmpty().isLength({ min: 6 }),
    check('name', 'name does not exist.').not().isEmpty(),
    check('lastName', 'lastName does not exist.').not().isEmpty(),
    check('department', 'department does not exist.').not().isEmpty(),
    check('phone', 'phone does not exist.').optional(),
    check('avatar', 'avatar does not exist.').optional(),
    check('roles', 'roles must be an array.').optional().isArray(),
    check('active', 'active does not exist.').optional().isBoolean()
  ],
  
  'update:user': [
    check('id', 'id does not exist.').not().isEmpty(),
    check('username', 'username does not exist.').optional(),
    check('email', 'email does not exist.').optional().isEmail(),
    check('password', 'password does not exist.').optional().isLength({ min: 6 }),
    check('name', 'name does not exist.').optional(),
    check('lastName', 'lastName does not exist.').optional(),
    check('department', 'department does not exist.').optional(),
    check('phone', 'phone does not exist.').optional(),
    check('avatar', 'avatar does not exist.').optional(),
    check('roles', 'roles must be an array.').optional().isArray(),
    check('active', 'active does not exist.').optional().isBoolean()
  ],
  
  'login:user': [
    check('username', 'username does not exist.').not().isEmpty(),
    check('password', 'password does not exist.').not().isEmpty()
  ]
};

module.exports = { systemUserValidation };