const express = require("express");
const {
  getValidation,
  validate,
  authenticateUser,
} = require("../middleware/middlewareRules");

const productController = require("../controllers/productController");

let productControllerFunc;
try {
  productControllerFunc = productController();
} catch (error) {
  productControllerFunc = productController;
}

const {
  getAllProducts,
  getProductById,
  getProductByCode,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = productControllerFunc;

const ProductRouter = express.Router();

ProductRouter.get("/list", getAllProducts);
ProductRouter.get("/stats", getProductStats);
ProductRouter.get("/:id", getProductById);
ProductRouter.get("/code/:code", getProductByCode);

ProductRouter.post(
  "/create",
  [getValidation("create:product"), validate],
  createProduct
);

ProductRouter.put(
  "/update",
  [getValidation("update:product"), validate],
  updateProduct
);

ProductRouter.delete("/delete/:id", deleteProduct);

module.exports = ProductRouter;