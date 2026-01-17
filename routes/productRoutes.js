const express = require("express");
const {
  jwtObject,
  getValidation,
  validate,
  authenticateUser,
} = require("../middleware/middlewareRules");

const productController = require("../controllers/productController");

// Verificar si productController es una función o un objeto
let productControllerFunc;
try {
  productControllerFunc = productController();
} catch (error) {
  // Si productController ya devuelve las funciones directamente
  productControllerFunc = productController;
}

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = productControllerFunc;

const ProductRouter = express.Router();

// Obtener todos los productos
ProductRouter.get("/list", getAllProducts);

// Obtener producto por ID
ProductRouter.get("/:id", getProductById);

// Crear producto
ProductRouter.post(
  "/create",
  [getValidation("create:product"), validate],
  createProduct
);

// Actualizar producto
ProductRouter.put(
  "/update",
  [getValidation("update:product"), validate],
  updateProduct
);

// Eliminar producto
ProductRouter.delete("/delete/:id", deleteProduct);

module.exports = ProductRouter;