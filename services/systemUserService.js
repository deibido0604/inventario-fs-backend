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
      // Verificar si el usuario ya existe
      const existingUser = await models.SystemUser.findOne({
        $or: [
          { username: param.username.toLowerCase() },
          { email: param.email.toLowerCase() },
        ],
      });

      if (existingUser) {
        return buildError(400, "El usuario o email ya está registrado!");
      }

      // Hash de la contraseña
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

      // Ocultar password en la respuesta
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

      // Si se actualiza la contraseña
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
        // Eliminar password del log por seguridad
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

      // No permitir eliminar el usuario admin principal
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

  // Login de usuario
  async function loginSystemUser(username, password, req) {
    try {
      // Buscar usuario por username o email
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

      // Verificar si el usuario está activo
      if (!user.active) {
        return buildError(403, "Usuario desactivado!");
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return buildError(401, "Credenciales incorrectas!");
      }

      // Actualizar último login
      user.lastLogin = new Date();
      await user.save();

      // ========== AGREGAR ESTO: GENERAR TOKEN JWT ==========
      const jwt = require("jsonwebtoken");

      // Payload del token
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
      };

      // Extraer permisos del usuario
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

      // Generar token JWT
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || "clave_secreta_para_produccion_2024",
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
      );

      // ========== FIN DE AGREGAR TOKEN ==========

      const userResponse = user.toObject();
      delete userResponse.password;

      // Log de login
      await logsConstructor(
        constants.LOG_TYPE.USER_LOGIN,
        { _id: user._id, username: user.username },
        "Inicio de sesión exitoso",
        user.username,
      );

      // ========== ACTUALIZAR RESPUESTA ==========
      return {
        ...userResponse, // Mantener datos del usuario
        token, // Agregar el token JWT
        expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      };
      // ========== FIN ACTUALIZAR RESPUESTA ==========
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  // Logout de usuario
  async function logoutSystemUser(userId, req) {
    try {
      const user = await models.SystemUser.findById(
        mongoose.Types.ObjectId(userId),
      );

      if (!user) {
        return buildError(404, "Usuario no encontrado!");
      }

      // Log de logout
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
