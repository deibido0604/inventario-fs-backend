"use strict";

const models = require('../models');
const { nowInUnix } = require('./timeZoneModule');
const constants = require('../components/constants/index');

const logsConstructor = async (type, data, motive, username, source = 'InventarioFS') => {
  try {
    
    let log = new models.Logs({
      username: username || 'InventarioFS',
      type: type,
      data: data,
      motive: motive,
      source: source,
      unix_date: nowInUnix(constants.DEFAULT_TIMEZONE),
    });

    const data_log = await log.save();

    return data_log; 
  } catch (error) {
    throw error; 
  }
  
};

const SupportLogsConstructor = async (data) => {
  try {
    let log = new models.SupportLogs(data);
    const data_log = await log.save();
    return data_log;
  } catch (error) {
    throw error;
  }
};

module.exports = logsConstructor;
module.exports.SupportLogsConstructor = SupportLogsConstructor;
