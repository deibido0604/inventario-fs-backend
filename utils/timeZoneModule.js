"use strict";
const constants = require("../components/constants/index");
const default_timezone = constants.DEFAULT_TIMEZONE;
const moment = require('moment-timezone');
global.moment = moment;

let nowInUnix = function (timezone) {
    if (!timezone) {
        timezone = default_timezone;
    }

    return global.moment().tz(timezone).unix();
};

module.exports.nowInUnix = nowInUnix;