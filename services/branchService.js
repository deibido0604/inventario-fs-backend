const mongoose = require("mongoose");
const Branch = require("../models/Branch.js");
const logsConstructor = require("../utils/logs");
const constants = require("../components/constants/index");
const { buildError } = require("../utils/response");

function branchService() {
  async function getAllBranches() {
    try {
      const branches = await Branch.find()
        .sort({ name: 1 })
        .populate("manager", "name email username")
        .lean();

      return branches.map((branch) => ({
        _id: branch._id.toString(),
        code: branch.code,
        name: branch.name,
        address: branch.address,
        city: branch.city,
        phone: branch.phone || "",
        email: branch.email || "",
        manager: branch.manager
          ? {
              _id: branch.manager._id.toString(),
              name: branch.manager.name || branch.manager.username,
              email: branch.manager.email,
              username: branch.manager.username,
            }
          : null,
        max_outstanding_amount: branch.max_outstanding_amount,
        active: branch.active,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      }));
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function getBranchById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw buildError(400, "ID de sucursal inválido");
      }

      const branch = await Branch.findById(id)
        .populate("manager", "name email username")
        .lean();

      if (!branch) {
        throw buildError(404, "Sucursal no encontrada");
      }

      return {
        _id: branch._id.toString(),
        code: branch.code,
        name: branch.name,
        address: branch.address,
        city: branch.city,
        phone: branch.phone || "",
        email: branch.email || "",
        manager: branch.manager
          ? {
              _id: branch.manager._id.toString(),
              name: branch.manager.name || branch.manager.username,
              email: branch.manager.email,
              username: branch.manager.username,
            }
          : null,
        max_outstanding_amount: branch.max_outstanding_amount,
        active: branch.active,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      };
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function createBranch(param, req) {
    try {
      const existingBranch = await Branch.findOne({ code: param.code });
      if (existingBranch) {
        throw buildError(400, "Ya existe una sucursal con este código");
      }

      const branchData = {
        code: param.code,
        name: param.name,
        address: param.address,
        city: param.city,
        phone: param.phone || "",
        email: param.email || "",
        manager: param.manager || null,
        max_outstanding_amount: param.max_outstanding_amount || 5000,
        active: param.active !== undefined ? param.active : true,
      };

      const branch = new Branch(branchData);
      const savedBranch = await branch.save();

      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.CREATE_BRANCH || "CREATE_BRANCH",
          savedBranch,
          "Sucursal creada",
          req.headers["console-user"] || "system"
        );
      }

      return {
        _id: savedBranch._id.toString(),
        code: savedBranch.code,
        name: savedBranch.name,
        message: "Sucursal creada exitosamente",
      };
    } catch (e) {
      if (e.code === 11000) {
        throw buildError(400, "El código de la sucursal ya existe");
      }
      return buildError(500, e.message);
    }
  }

  async function updateBranch(param, req) {
    try {
      if (!param.id) {
        throw buildError(400, "ID de sucursal requerido");
      }

      const existingBranch = await Branch.findById(param.id);
      if (!existingBranch) {
        throw buildError(404, "Sucursal no encontrada");
      }

      if (param.code && param.code !== existingBranch.code) {
        const codeExists = await Branch.findOne({
          code: param.code,
          _id: { $ne: param.id },
        });
        if (codeExists) {
          throw buildError(400, "Ya existe otra sucursal con este código");
        }
      }

      const updateData = {
        code: param.code || existingBranch.code,
        name: param.name || existingBranch.name,
        address: param.address || existingBranch.address,
        city: param.city || existingBranch.city,
        phone: param.phone !== undefined ? param.phone : existingBranch.phone,
        email: param.email !== undefined ? param.email : existingBranch.email,
        manager: param.manager !== undefined ? param.manager : existingBranch.manager,
        max_outstanding_amount:
          param.max_outstanding_amount !== undefined
            ? param.max_outstanding_amount
            : existingBranch.max_outstanding_amount,
        active:
          param.active !== undefined ? param.active : existingBranch.active,
      };

      const updatedBranch = await Branch.findByIdAndUpdate(
        param.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.UPDATE_BRANCH || "UPDATE_BRANCH",
          updatedBranch,
          "Sucursal actualizada",
          req.headers["console-user"] || "system"
        );
      }

      return {
        _id: updatedBranch._id.toString(),
        code: updatedBranch.code,
        name: updatedBranch.name,
        message: "Sucursal actualizada exitosamente",
      };
    } catch (e) {
      if (e.code === 11000) {
        throw buildError(400, "El código de la sucursal ya existe");
      }
      return buildError(500, e.message);
    }
  }

  async function deleteBranch(id, req) {
    try {
      const deletedBranch = await Branch.findByIdAndDelete(id);

      if (!deletedBranch) {
        throw buildError(404, "Sucursal no encontrada");
      }

      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.DELETE_BRANCH || "DELETE_BRANCH",
          deletedBranch,
          "Sucursal eliminada",
          req.headers["console-user"] || "system"
        );
      }

      return {
        _id: deletedBranch._id.toString(),
        code: deletedBranch.code,
        name: deletedBranch.name,
        message: "Sucursal eliminada permanentemente",
      };
    } catch (e) {
      return buildError(e.code || 500, e.message);
    }
  }

  async function deactivateBranch(id, req) {
    try {
      const branch = await Branch.findById(id);
      if (!branch) {
        throw buildError(404, "Sucursal no encontrada");
      }

      branch.active = false;
      await branch.save();

      if (req && req.headers) {
        await logsConstructor(
          constants.LOG_TYPE.DEACTIVATE_BRANCH || "DEACTIVATE_BRANCH",
          branch,
          "Sucursal desactivada",
          req.headers["console-user"] || "system"
        );
      }

      return {
        _id: branch._id.toString(),
        code: branch.code,
        name: branch.name,
        message: "Sucursal desactivada exitosamente",
      };
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function getBranchByCode(code) {
    try {
      const branch = await Branch.findOne({ code })
        .populate("manager", "name email username")
        .lean();

      if (!branch) {
        throw buildError(404, "Sucursal no encontrada");
      }

      return {
        _id: branch._id.toString(),
        code: branch.code,
        name: branch.name,
        address: branch.address,
        city: branch.city,
        phone: branch.phone || "",
        email: branch.email || "",
        manager: branch.manager
          ? {
              _id: branch.manager._id.toString(),
              name: branch.manager.name || branch.manager.username,
              email: branch.manager.email,
              username: branch.manager.username,
            }
          : null,
        max_outstanding_amount: branch.max_outstanding_amount,
        active: branch.active,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt,
      };
    } catch (e) {
      throw buildError(500, e.message);
    }
  }

  async function getBranchStats() {
    try {
      const [total, active, cities] = await Promise.all([
        Branch.countDocuments(),
        Branch.countDocuments({ active: true }),
        Branch.aggregate([
          { $group: { _id: "$city", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

      return {
        totalBranches: total,
        activeBranches: active,
        inactiveBranches: total - active,
        cities: cities,
        timestamp: new Date(),
      };
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function getActiveBranches() {
    try {
      const branches = await Branch.find({ active: true })
        .select("code name city")
        .sort({ name: 1 })
        .lean();

      return branches.map((branch) => ({
        _id: branch._id.toString(),
        code: branch.code,
        name: branch.name,
        city: branch.city,
        label: `${branch.code} - ${branch.name} (${branch.city})`,
        value: branch._id.toString(),
      }));
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  return {
    getAllBranches,
    getBranchById,
    getBranchByCode,
    createBranch,
    updateBranch,
    deleteBranch,
    deactivateBranch,
    getBranchStats,
    getActiveBranches,
  };
}

module.exports = branchService();