const mongoose = require("mongoose");
const Product = require("../models/Products.js");
const logsConstructor = require("../utils/logs");
const constants = require("../components/constants/index");
const { buildError } = require("../utils/response");

function productService() {
  async function getAllProducts(skip = 0, limit = 10) {
    try {
      const products = await Product.find()
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 })
        .lean();

      return products.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
        quantity: p.quantity,
        active: p.active,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function getProductById(id) {
    try {
      const product = await Product.findById(id).lean();
      if (!product) return buildError(404, "Producto no encontrado");

      return {
        _id: product._id.toString(),
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function createProduct(param, req) {
    try {
      const product = new Product({
        name: param.name,
        description: param.description,
        price: param.price,
        quantity: param.quantity,
        active: param.active !== undefined ? param.active : true,
      });

      const data = await product.save();

      // Logueo
      await logsConstructor(
        constants.LOG_TYPE.CREATE_PRODUCT,
        data,
        "Producto creado",
        req.headers["console-user"]
      );

      return data;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function updateProduct(param, req) {
    try {
      const update = {
        $set: {
          name: param.name,
          description: param.description,
          price: param.price,
          quantity: param.quantity,
          active: param.active,
        },
      };

      const data = await Product.updateOne(
        { _id: mongoose.Types.ObjectId(param.id) },
        update
      );

      if (data) {
        await logsConstructor(
          constants.LOG_TYPE.UPDATE_PRODUCT,
          param,
          "Producto actualizado",
          req.headers["console-user"]
        );
      }

      return data;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function deleteProduct(id, req) {
    try {
      const product = await Product.findById(id);
      if (!product) return buildError(404, "Producto no encontrado");

      await Product.deleteOne({ _id: id });

      await logsConstructor(
        constants.LOG_TYPE.DELETE_PRODUCT,
        product,
        "Producto eliminado",
        req.headers["console-user"]
      );

      return product;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  return {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}

module.exports = productService();
