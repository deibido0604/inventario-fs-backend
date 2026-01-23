const mongoose = require("mongoose");
const Product = require("../models/Products.js");
const logsConstructor = require("../utils/logs");
const constants = require("../components/constants/index");
const { buildError } = require("../utils/response");

function productService() {
  async function getAllProducts() {
    try {
      const query = {};

      const products = await Product.find(query).sort({ name: 1 }).lean();

      return products.map((p) => ({
        _id: p._id.toString(),
        code: p.code,
        name: p.name,
        description: p.description,
        unit_cost: p.unit_cost,
        unit_price: p.unit_price,
        category: p.category,
        subcategory: p.subcategory,
        brand: p.brand,
        min_stock: p.min_stock,
        max_stock: p.max_stock,
        unit_of_measure: p.unit_of_measure,
        barcode: p.barcode,
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw buildError(400, "ID de producto inválido");
      }

      const product = await Product.findById(id).lean();
      if (!product) {
        throw buildError(404, "Producto no encontrado");
      }

      return {
        _id: product._id.toString(),
        code: product.code,
        name: product.name,
        description: product.description,
        unit_cost: product.unit_cost,
        unit_price: product.unit_price,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        min_stock: product.min_stock,
        max_stock: product.max_stock,
        unit_of_measure: product.unit_of_measure,
        barcode: product.barcode,
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
      const existingProduct = await Product.findOne({ code: param.code });
      if (existingProduct) {
        throw buildError(400, "Ya existe un producto con este código");
      }

      const productData = {
        code: param.code,
        name: param.name,
        description: param.description || "",
        unit_cost: param.unit_cost || 0,
        unit_price: param.unit_price || 0,
        category: param.category,
        subcategory: param.subcategory || "",
        brand: param.brand || "",
        min_stock: param.min_stock || 0,
        max_stock: param.max_stock || 0,
        unit_of_measure: param.unit_of_measure || "unidad",
        barcode: param.barcode || "",
        active: param.active !== undefined ? param.active : true,
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.CREATE_PRODUCT || "CREATE_PRODUCT",
          savedProduct,
          "Producto creado",
          req.headers["console-user"] || "system",
        );
      }

      return {
        _id: savedProduct._id.toString(),
        code: savedProduct.code,
        name: savedProduct.name,
        message: "Producto creado exitosamente",
      };
    } catch (e) {
      if (e.code === 11000) {
        throw buildError(400, "El código del producto ya existe");
      }
      return buildError(500, e.message);
    }
  }

  async function updateProduct(param, req) {
    try {
      if (!param.id) {
        throw buildError(400, "ID de producto requerido");
      }

      const existingProduct = await Product.findById(param.id);
      if (!existingProduct) {
        throw buildError(404, "Producto no encontrado");
      }

      if (param.code && param.code !== existingProduct.code) {
        const codeExists = await Product.findOne({
          code: param.code,
          _id: { $ne: param.id },
        });
        if (codeExists) {
          throw buildError(400, "Ya existe otro producto con este código");
        }
      }

      const updateData = {
        code: param.code || existingProduct.code,
        name: param.name || existingProduct.name,
        description: param.description || existingProduct.description,
        unit_cost:
          param.unit_cost !== undefined
            ? param.unit_cost
            : existingProduct.unit_cost,
        unit_price:
          param.unit_price !== undefined
            ? param.unit_price
            : existingProduct.unit_price,
        category: param.category || existingProduct.category,
        subcategory: param.subcategory || existingProduct.subcategory,
        brand: param.brand || existingProduct.brand,
        min_stock:
          param.min_stock !== undefined
            ? param.min_stock
            : existingProduct.min_stock,
        max_stock:
          param.max_stock !== undefined
            ? param.max_stock
            : existingProduct.max_stock,
        unit_of_measure:
          param.unit_of_measure || existingProduct.unit_of_measure,
        barcode: param.barcode || existingProduct.barcode,
        active:
          param.active !== undefined ? param.active : existingProduct.active,
      };

      const updatedProduct = await Product.findByIdAndUpdate(
        param.id,
        updateData,
        { new: true, runValidators: true },
      );

      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.UPDATE_PRODUCT || "UPDATE_PRODUCT",
          updatedProduct,
          "Producto actualizado",
          req.headers["console-user"] || "system",
        );
      }

      return {
        _id: updatedProduct._id.toString(),
        code: updatedProduct.code,
        name: updatedProduct.name,
        message: "Producto actualizado exitosamente",
      };
    } catch (e) {
      if (e.code === 11000) {
        throw buildError(400, "El código del producto ya existe");
      }
      return buildError(500, e.message);
    }
  }

  async function deleteProduct(id, req) {
    try {
      const deletedProduct = await Product.findByIdAndDelete(id);

      if (!deletedProduct) {
        throw buildError(404, "Producto no encontrado");
      }

      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.DELETE_PRODUCT,
          deletedProduct,
          "Producto eliminado",
          req.headers["console-user"] || "system",
        );
      }

      return {
        _id: deletedProduct._id.toString(),
        code: deletedProduct.code,
        name: deletedProduct.name,
        message: "Producto eliminado permanentemente",
      };
    } catch (e) {
      return buildError(e.code || 500, e.message);
    }
  }

  async function getProductByCode(code) {
    try {
      const product = await Product.findOne({ code }).lean();
      if (!product) {
        throw buildError(404, "Producto no encontrado");
      }

      return {
        _id: product._id.toString(),
        code: product.code,
        name: product.name,
        description: product.description,
        unit_cost: product.unit_cost,
        unit_price: product.unit_price,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        min_stock: product.min_stock,
        max_stock: product.max_stock,
        unit_of_measure: product.unit_of_measure,
        barcode: product.barcode,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    } catch (e) {
      throw buildError(500, e.message);
    }
  }

  async function getProductStats() {
    try {
      const [total, active, categories] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ active: true }),
        Product.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

      return {
        totalProducts: total,
        activeProducts: active,
        inactiveProducts: total - active,
        categories: categories,
        timestamp: new Date(),
      };
    } catch (e) {
      return buildError(500, e.message);
    }
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

module.exports = productService();
