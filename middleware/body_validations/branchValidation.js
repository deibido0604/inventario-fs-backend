const { check } = require('express-validator');

const branchValidation = {
    'create:branch': [
        check('code', 'El código es requerido').not().isEmpty(),
        check('name', 'El nombre es requerido').not().isEmpty(),
        check('address', 'La dirección es requerida').not().isEmpty(),
        check('city', 'La ciudad es requerida').not().isEmpty(),
        check('max_outstanding_amount', 'El monto máximo debe ser un número')
            .optional()
            .isNumeric()
            .custom(value => value > 0),
        check('phone', 'El teléfono debe ser válido').optional().isString(),
        check('email', 'El email debe ser válido').optional().isEmail(),
        check('manager', 'El manager debe ser un ObjectId válido')
            .optional()
            .isMongoId(),
        check('active', 'Activo debe ser booleano').optional().isBoolean()
    ],
    'update:branch': [
        check('id', 'El ID de la sucursal es requerido').not().isEmpty(),
        check('code', 'El código debe ser texto').optional().isString(),
        check('name', 'El nombre debe ser texto').optional().isString(),
        check('address', 'La dirección debe ser texto').optional().isString(),
        check('city', 'La ciudad debe ser texto').optional().isString(),
        check('max_outstanding_amount', 'El monto máximo debe ser un número')
            .optional()
            .isNumeric(),
        check('phone', 'El teléfono debe ser válido').optional().isString(),
        check('email', 'El email debe ser válido').optional().isEmail(),
        check('manager', 'El manager debe ser un ObjectId válido')
            .optional()
            .isMongoId(),
        check('active', 'Activo debe ser booleano').optional().isBoolean()
    ]
};

module.exports = {
    branchValidation
};