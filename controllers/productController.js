const { validationResult } = require("express-validator");
const productService = require("../services/productService");
const Response = require("../components/response");

function productController() {
  async function getAllProducts(req, res) {
    const responseClass = new Response();
    const { skip, limit } = req.query;

    productService
      .getAllProducts(parseInt(skip), parseInt(limit))
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "success", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getProductById(req, res) {
    const responseClass = new Response();
    const { id } = req.params;

    productService
      .getProductById(id)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "success", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function createProduct(req, res) {
    const responseClass = new Response();
    const product = req.body;

    productService
      .createProduct(product, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Producto creado!", 200, data)
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function updateProduct(req, res) {
    const responseClass = new Response();
    const product = req.body;

    productService
      .updateProduct(product, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Producto actualizado!", 200, data)
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function deleteProduct(req, res) {
    const responseClass = new Response();
    const { id } = req.params;

    productService
      .deleteProduct(id, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Producto eliminado!", 200, data)
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  return {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

module.exports = productController;
