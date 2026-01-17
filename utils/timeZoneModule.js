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

let nowMoment = function (timezone) {
	if (!timezone) {
		timezone = default_timezone;
	}

	return moment().tz(timezone);
};

function formatUnixDate(unixTime, timezone) {
	let date = moment.unix(unixTime).tz(timezone);
	let formattedTime = date.format("hh:mm A");
	let formattedDate = date.format("MM/DD/YYYY");

	return {
		Hour: formattedTime,
		Date: formattedDate
	};
}

const parseISODate = (isoDate) => {

    const [date, time] = isoDate.split(' ');
    if (!time) {
        return new Date(isoDate);
    }

    return new Date(`${date}+${time}`);
};

const formatISODateToTimezone = (isoDate, Timezone) => {
    return moment(isoDate).tz(Timezone);
};

let startOfDayInMoment = function (timezone) {
	if (!timezone) {
		timezone = default_timezone;
	}

	return moment().tz(timezone).startOf("day");
};

let endOfDayInMoment = function (timezone) {
	if (!timezone) {
		timezone = default_timezone;
	}

	return moment().tz(timezone).endOf("day");
};
/**
 * Convierte un tiempo Unix a una fecha 
 * @param {number} unixTime - El tiempo en formato Unix
 * @param {string} timezone - La zona horaria para formatear la fecha
 */

let unixToFormattedDate = (unixTime, timezone) => {
    if (!timezone) {
        timezone = default_timezone;
    }
    
    return moment.unix(unixTime).tz(timezone).format("YYYY-MM-DD HH:mm:ss");
};

let unixToFormattedDates = (unixTime, timezone) => {
    if (!timezone) {
        timezone = default_timezone;
    }

    return moment.unix(unixTime).tz(timezone).format("hh:mm A");
};

let unixFormattedDate = (unixTime, timezone) => {
    if (!timezone) {
        timezone = default_timezone;
    }
    
    return moment.unix(unixTime).tz(timezone).format('h:mm A');
};

/**
 * @param time
 * @param timezone
 * @param format
 * @return string
 * **/
let formatDate = function (time, timezone, format) {
	if (!timezone) {
		timezone = default_timezone;
	}

	if (!format) {
		return moment.unix(time).tz(timezone).format();
	}

	return moment.unix(time).tz(timezone).format(format);
};

/**
 * @param time
 * @param timezone
 * @return string
 * **/
let formatIsoDate = function (time, timezone, ) {
	if (!timezone) {
		timezone = default_timezone;
	}

	return moment.unix(time).tz(timezone).toISOString();
};

/**
 * @param timezone
 * @returns {number}
 */
let startOfDayInUnix = function (timezone) {
	if (!timezone) {
		timezone = default_timezone;
	}

	return moment().tz(timezone).startOf("day").unix();
};

/**
 * @param timezone
 * @returns {number}
 */
let endOfDayInUnix = function (timezone) {
	if (!timezone) {
		timezone = default_timezone;
	}

	return moment().tz(timezone).endOf("day").unix();
};

const convertToISODate = (date, timezone) => {
  if (!timezone) {
    timezone = default_timezone;
  }
  const formattedDate = moment.tz(date, 'DD/MM/YYYY', timezone);

  return formattedDate.toISOString();
};

const parseDDMMYYYYToISODate = (dateString, timezone) => {
  const [day, month, year] = dateString.split('/');
  if (!timezone) {
    timezone = default_timezone;
  }

  const isoDate = moment
    .tz(`${year}-${month}-${day}T00:00:00`, timezone)
    .toDate();
  return isoDate;
};

let startOfMonthInUnix = function (timezone) {
    if (!timezone) {
        timezone = default_timezone;
    }
    return moment().tz(timezone).startOf("month").unix();
};

let endOfMonthInUnix = function (timezone) {
    if (!timezone) {
        timezone = default_timezone;
    }
    return moment().tz(timezone).endOf("month").unix();
};

function convertIsoToUnix(isoDate, timezone) {
    if (!timezone) {
        timezone = default_timezone;
    }
    return moment.tz(isoDate, timezone).unix();
}

function convertIsoToUnixEndOfDay(isoDate, timezone) {
	if (!timezone) {
        timezone = 'UTC'; 
    }
    return moment.tz(isoDate, timezone).endOf('day').unix();
}

function getTodayStartUnix(timezone) {
    if (!timezone) {
        timezone = default_timezone;
    }
    return moment.tz(timezone).startOf('day').unix();
}

function getTodayEndUnix(timezone) {
    if (!timezone) {
        timezone = default_timezone;
    }
    return moment.tz(timezone).endOf('day').unix();
}

/**
 * @param {string} timezone
 * @param {string|number|Date|import('moment').Moment} [date]
 * @returns {number}
 */
function getDayEndUnix(timezone, date) {
    const tz = timezone || default_timezone;
    const base = date ? moment.tz(date, tz) : moment.tz(tz);
    return base.endOf('day').unix();
}

const getUnixDayOffset = function (date, timezone) {
	if (!timezone) {
		timezone = default_timezone;
	}

	const now = moment.unix(date).tz(timezone);
	const startOfDay = now.clone().startOf('day');
    const unixStartOfDay = startOfDay.unix();

	let hour = date - unixStartOfDay;
	const dayName = now.format('dddd');

	let utcOffsetMinutes = now.utcOffset();
	utcOffsetMinutes = utcOffsetMinutes * 60 * -1;
	const adjustedHour = hour + utcOffsetMinutes; // Convertir a segundos
	
	hour = adjustedHour;
	
	return { hour, dayName };
};

module.exports.nowInUnix = nowInUnix;
module.exports.formatUnixDate = formatUnixDate;
module.exports.parseISODate = parseISODate;
module.exports.formatISODateToTimezone = formatISODateToTimezone;
module.exports.startOfDayInMoment = startOfDayInMoment;
module.exports.endOfDayInMoment = endOfDayInMoment;
module.exports.nowMoment = nowMoment;
module.exports.unixToFormattedDate = unixToFormattedDate;
module.exports.unixFormattedDate = unixFormattedDate;
module.exports.formatDate = formatDate;
module.exports.formatIsoDate = formatIsoDate;
module.exports.startOfDayInUnix = startOfDayInUnix;
module.exports.endOfDayInUnix = endOfDayInUnix;
module.exports.convertToISODate = convertToISODate;
module.exports.parseDDMMYYYYToISODate = parseDDMMYYYYToISODate;
module.exports.startOfMonthInUnix = startOfMonthInUnix;
module.exports.endOfMonthInUnix = endOfMonthInUnix;
module.exports.unixToFormattedDates = unixToFormattedDates;
module.exports.convertIsoToUnix = convertIsoToUnix;
module.exports.convertIsoToUnixEndOfDay = convertIsoToUnixEndOfDay;
module.exports.getTodayStartUnix = getTodayStartUnix;
module.exports.getTodayEndUnix = getTodayEndUnix;
module.exports.getDayEndUnix = getDayEndUnix;
module.exports.getUnixDayOffset = getUnixDayOffset;