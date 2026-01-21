const { check } = require("express-validator");

const productValidation = {
  "create:product": [
    check("code", "El código es requerido").not().isEmpty(),
    check("name", "El nombre es requerido").not().isEmpty(),
    check("category", "La categoría es requerida").not().isEmpty(),
    check("unit_price", "El precio unitario es requerido").not().isEmpty(),
    check("unit_price", "El precio unitario debe ser un número").isNumeric(),
    check("unit_cost", "El costo unitario debe ser un número")
      .optional()
      .isNumeric(),
    check("unit_of_measure", "La unidad de medida es requerida")
      .not()
      .isEmpty(),
    check("description", "La descripción debe ser texto").optional().isString(),
    check("subcategory", "La subcategoría debe ser texto")
      .optional()
      .isString(),
    check("brand", "La marca debe ser texto").optional().isString(),
    check("min_stock", "El stock mínimo debe ser un número")
      .optional()
      .isInt({ min: 0 }),
    check("max_stock", "El stock máximo debe ser un número")
      .optional()
      .isInt({ min: 0 }),
    check("barcode", "El código de barras debe ser texto")
      .optional()
      .isString(),
    check("active", "Activo debe ser booleano").optional().isBoolean(),
  ],
  "update:product": [
    check("id", "El ID del producto es requerido").not().isEmpty(),
    check("code", "El código debe ser texto").optional().isString(),
    check("name", "El nombre debe ser texto").optional().isString(),
    check("category", "La categoría debe ser texto").optional().isString(),
    check("unit_price", "El precio unitario debe ser un número")
      .optional()
      .isNumeric(),
    check("unit_cost", "El costo unitario debe ser un número")
      .optional()
      .isNumeric(),
    check("unit_of_measure", "La unidad de medida debe ser texto")
      .optional()
      .isString(),
    check("description", "La descripción debe ser texto").optional().isString(),
    check("subcategory", "La subcategoría debe ser texto")
      .optional()
      .isString(),
    check("brand", "La marca debe ser texto").optional().isString(),
    check("min_stock", "El stock mínimo debe ser un número")
      .optional()
      .isInt({ min: 0 }),
    check("max_stock", "El stock máximo debe ser un número")
      .optional()
      .isInt({ min: 0 }),
    check("barcode", "El código de barras debe ser texto")
      .optional()
      .isString(),
    check("active", "Activo debe ser booleano").optional().isBoolean(),
  ],
};

module.exports = {
  productValidation,
};
