const mongoose = require('mongoose');
const logsConstructor = require('../utils/logs');
const constants = require('../components/constants/index');
const { buildError } = require('../utils/response');
const models = require('../models');

function rolesService() {
  async function getAllRoles(skip = 0, limit = 10, type) {
    try {
      let match = {};

      if (type.length > 0) {
        match = { type: { $in: type } };
      }
      
      const roles = await models.Roles.aggregate([
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            name: 1,
            type: 1,
            description: 1,
            permissions: 1,
            nature: 1,
          },
        },
        { $skip: skip },
        { $limit: limit },
        { $sort: { name: 1 } },
      ]);

      const data = [];

      roles.forEach((roles) => {
        roles._id.toString();
        data.push(roles);
      });

      return data;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function getRolesById(id) {
    try {
      const query = await models.Roles.find(
        {
          _id: mongoose.Types.ObjectId(id),
        },
        {
          _id: 1,
          name: 1,
          type: 1,
          description: 1,
          permissions: 1,
          nature: 1,
        },
      );

      const roles = query[0];

      const data = {
        _id: roles._id.toString(),
        name: roles.name || '',
        type: roles.type || '',
        description: roles.description || '',
        permissions: roles.permissions || [],
      };

      return data;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function createRoles(param, req) {
    try {
      let roles = new models.Roles({
        name: param.name,
        type: param.type,
        description: param.description,
        permissions: param.permissions,
      });
      const data = await roles.save();

      if (data) {
        const extractedData = {
          name: data.name,
          type: data.type,
          description: data.description,
          permissions: data.permissions,
        };
        await logsConstructor(
          constants.LOG_TYPE.CREATE_ROLS,
          extractedData,
          'Rol nuevo',
          req.headers['console-user'],
        );
      }

      return data;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function updateRoles(param, req) {
    try {
      const update = {
        $set: {
          name: param.name,
          type: param.type,
          description: param.description,
          permissions: param.permissions,
        },
      };
      const data = await models.Roles.updateOne(
        { _id: mongoose.Types.ObjectId(param.id) },
        update,
      );
      if (data) {
        const extractedData = {
          _id: param.id,
          name: param.name,
          type: param.type,
          description: param.description,
          permissions: param.permissions,
        };
        await logsConstructor(
          constants.LOG_TYPE.UPDATE_ROLS,
          extractedData,
          'Rol actualizado',
          req.headers['console-user'],
        );
      }
      return data;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  async function deleteRoles(id, req) {
    try {
      const roles = await models.Roles.findOne({
        _id: mongoose.Types.ObjectId(id),
      });

      if (!roles) {
        return buildError(500, 'Rol no encontrado!');
      }

      const rolesUser = await models.SystemUser.findOne({
        roles: mongoose.Types.ObjectId(id),
      });

      if (rolesUser) {
        return buildError(500, 'Rol asignado a un Usuario!');
      }

      const deletionResult = await models.Roles.deleteOne({
        _id: mongoose.Types.ObjectId(id),
      });

      if (deletionResult) {
        const extractedData = {
          _id: roles._id,
          name: roles.name,
          type: roles.type,
          description: roles.description,
          permissions: roles.permissions,
        };
        await logsConstructor(
          constants.LOG_TYPE.DELETE_ROLS,
          extractedData,
          'Rol eliminado',
          req.headers['console-user'],
        );
      }
      return deletionResult;
    } catch (e) {
      return buildError(500, e.message);
    }
  }

  return {
    getAllRoles,
    getRolesById,
    createRoles,
    updateRoles,
    deleteRoles,
  };
}

module.exports = rolesService();
