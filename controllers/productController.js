const { validationResult } = require("express-validator");
const productService = require("../services/productService");
const Response = require("../components/response");

function productController() {
  async function getAllProducts(req, res) {
    const responseClass = new Response();
    try {
      const { skip = 0, limit = 10, active, category, search } = req.query;

      const filters = {};
      if (active !== undefined) filters.active = active;
      if (category) filters.category = category;
      if (search) filters.search = search;

      productService
        .getAllProducts(parseInt(skip), parseInt(limit), filters)
        .then((data) => {
          return res
            .status(200)
            .send(responseClass.buildResponse(true, "success", 200, data));
        })
        .catch((error) => {
          return res.status(error.code || 500).send(error);
        });
    } catch (error) {
      return res
        .status(500)
        .send(responseClass.buildResponse(false, error.message, 500));
    }
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

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array(),
        code: 422,
      });
    }

    const product = req.body;

    productService
      .createProduct(product, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(true, "Producto creado!", 200, data),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function updateProduct(req, res) {
    const responseClass = new Response();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        errors: errors.array(),
        code: 422,
      });
    }

    const product = req.body;

    productService
      .updateProduct(product, req)
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(
              true,
              "Producto actualizado!",
              200,
              data,
            ),
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
            responseClass.buildResponse(true, "Producto eliminado!", 200, data),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getProductByCode(req, res) {
    const responseClass = new Response();
    const { code } = req.params;

    productService
      .getProductByCode(code)
      .then((data) => {
        return res
          .status(200)
          .send(responseClass.buildResponse(true, "success", 200, data));
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  async function getProductStats(req, res) {
    const responseClass = new Response();

    productService
      .getProductStats()
      .then((data) => {
        return res
          .status(200)
          .send(
            responseClass.buildResponse(
              true,
              "Estadísticas obtenidas",
              200,
              data,
            ),
          );
      })
      .catch((error) => {
        return res.status(error.code || 500).send(error);
      });
  }

  return {
    getAllProducts,
    getProductById,
    getProductByCode,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductStats,
  };
}

module.exports = productController;
