const mongoose = require("mongoose");
const models = require("../models");
const logsConstructor = require("../utils/logs");
const constants = require("../components/constants/index");
const { buildError } = require("../utils/response");
const bcrypt = require("bcryptjs");

function systemUserService() {
  async function getAllSystemUsers(skip = 0, limit = 10, type = [], active) {
    try {
      let match = {};

      if (type.length > 0) {
        match.department = { $in: type };
      }

      if (active !== undefined) {
        match.active = active === "true";
      }

      const users = await models.SystemUser.aggregate([
        {
          $match: match,
        },
        {
          $lookup: {
            from: "Roles",
            localField: "roles",
            foreignField: "_id",
            as: "rolesInfo",
          },
        },
        {
          $project: {
            _id: 1,
            username: 1,
            email: 1,
            name: 1,
            lastName: 1,
            phone: 1,
            avatar: 1,
            department: 1,
            active: 1,
            lastLogin: 1,
            createdAt: 1,
            updatedAt: 1,
            roles: "$rolesInfo",
          },
        },
        { $skip: parseInt(skip) },
        { $limit: parseInt(limit) },
      ]);

      const data = [];
      users.forEach((user) => {
        user._id = user._id.toString();
        data.push(user);
      });
      return data;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function getSystemUserById(id) {
    try {
      const user = await models.SystemUser.findById(
        mongoose.Types.ObjectId(id),
      ).populate("roles", "name type description");

      if (!user) {
        return buildError(404, "Usuario no encontrado!");
      }

      const data = {
        _id: user._id.toString(),
        username: user.username || "",
        email: user.email || "",
        name: user.name || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
        department: user.department || "",
        active: user.active || false,
        roles: user.roles,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return data;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function createSystemUser(param, req) {
    try {
      const existingUser = await models.SystemUser.findOne({
        $or: [
          { username: param.username.toLowerCase() },
          { email: param.email.toLowerCase() },
        ],
      });

      if (existingUser) {
        return buildError(400, "El usuario o email ya está registrado!");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(param.password, salt);

      let user = new models.SystemUser({
        username: param.username.toLowerCase(),
        email: param.email.toLowerCase(),
        password: hashedPassword,
        name: param.name,
        lastName: param.lastName,
        phone: param.phone,
        avatar: param.avatar,
        department: param.department,
        roles: param.roles || [],
        active: param.active !== undefined ? param.active : true,
      });

      const data = await user.save();

      if (data) {
        const extractedData = {
          _id: data._id,
          username: data.username,
          email: data.email,
          name: data.name,
          lastName: data.lastName,
        };
        await logsConstructor(
          constants.LOG_TYPE.CREATE_USER,
          extractedData,
          "Usuario creado",
          req.headers["console-user"],
        );
      }

      const userResponse = data.toObject();
      delete userResponse.password;

      return userResponse;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function updateSystemUser(param, req) {
    try {
      const updateData = {};

      if (param.username) updateData.username = param.username.toLowerCase();
      if (param.email) updateData.email = param.email.toLowerCase();
      if (param.name) updateData.name = param.name;
      if (param.lastName) updateData.lastName = param.lastName;
      if (param.phone !== undefined) updateData.phone = param.phone;
      if (param.avatar !== undefined) updateData.avatar = param.avatar;
      if (param.department) updateData.department = param.department;
      if (param.roles) updateData.roles = param.roles;
      if (param.active !== undefined) updateData.active = param.active;

      if (param.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(param.password, salt);
      }

      const data = await models.SystemUser.updateOne(
        { _id: mongoose.Types.ObjectId(param.id) },
        { $set: updateData },
      );

      if (data) {
        const extractedData = {
          _id: param.id,
          ...updateData,
        };
        if (extractedData.password) delete extractedData.password;

        await logsConstructor(
          constants.LOG_TYPE.UPDATE_USER,
          extractedData,
          "Usuario actualizado",
          req.headers["console-user"],
        );
      }

      return data;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function deleteSystemUser(id, req) {
    try {
      const user = await models.SystemUser.findById(
        mongoose.Types.ObjectId(id),
      );

      if (!user) {
        return buildError(404, "Usuario no encontrado!");
      }

      if (user.username === "admin") {
        return buildError(
          400,
          "No se puede eliminar el usuario administrador principal!",
        );
      }

      const deletionResult = await models.SystemUser.deleteOne({
        _id: mongoose.Types.ObjectId(id),
      });

      if (deletionResult) {
        const extractedData = {
          _id: user._id,
          username: user.username,
          email: user.email,
        };
        await logsConstructor(
          constants.LOG_TYPE.DELETE_USER,
          extractedData,
          "Usuario eliminado",
          req.headers["console-user"],
        );
      }

      return deletionResult;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function loginSystemUser(username, password, req) {
    try {
      const user = await models.SystemUser.findOne({
        $or: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() },
        ],
      }).populate({
        path: "roles",
        populate: {
          path: "permissions",
        },
      });

      if (!user) {
        return buildError(401, "Credenciales incorrectas!");
      }

      if (!user.active) {
        return buildError(403, "Usuario desactivado!");
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return buildError(401, "Credenciales incorrectas!");
      }

      const branch = await models.Branch.findOne({
        manager: user._id,
        active: true,
      })
        .select("code name _id address city phone email max_outstanding_amount")
        .lean();

      user.lastLogin = new Date();
      await user.save();

      const jwt = require("jsonwebtoken");

      const tokenPayload = {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        roles: user.roles.map((role) => ({
          id: role._id,
          name: role.name,
          type: role.type,
        })),
        permissions: [],
        // Incluir información de la sucursal si existe
        ...(branch && {
          branch: {
            id: branch._id.toString(),
            code: branch.code,
            name: branch.name,
            city: branch.city,
            max_outstanding_amount: branch.max_outstanding_amount || 5000,
          },
        }),
      };

      user.roles.forEach((role) => {
        if (role.permissions) {
          role.permissions.forEach((perm) => {
            tokenPayload.permissions.push({
              action: perm.action,
              subject: perm.subject,
              type: perm.type,
            });
          });
        }
      });

      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || "clave_secreta_para_produccion_2024",
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
      );

      const userResponse = user.toObject();
      delete userResponse.password;

      // Agregar sucursal a la respuesta del login
      if (branch) {
        userResponse.branch = branch;
      }

      await logsConstructor(
        constants.LOG_TYPE.USER_LOGIN,
        { _id: user._id, username: user.username },
        "Inicio de sesión exitoso",
        user.username,
      );

      return {
        ...userResponse,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      };
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function logoutSystemUser(userId, req) {
    try {
      const user = await models.SystemUser.findById(
        mongoose.Types.ObjectId(userId),
      );

      if (!user) {
        return buildError(404, "Usuario no encontrado!");
      }

      await logsConstructor(
        constants.LOG_TYPE.USER_LOGOUT,
        { _id: user._id, username: user.username },
        "Cierre de sesión exitoso",
        user.username,
      );

      return { success: true, message: "Logout exitoso" };
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  return {
    getAllSystemUsers,
    getSystemUserById,
    createSystemUser,
    updateSystemUser,
    deleteSystemUser,
    loginSystemUser,
    logoutSystemUser,
  };
}

module.exports = systemUserService();
