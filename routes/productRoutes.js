const express = require("express");
const {
  jwtObject,
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
  createProduct,
  updateProduct,
  deleteProduct,
} = productControllerFunc;

const ProductRouter = express.Router();

ProductRouter.get("/list", getAllProducts);

ProductRouter.get("/:id", getProductById);

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