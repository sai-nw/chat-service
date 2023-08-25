const moment = require('moment-timezone');

const getStandardFormat = (date) => {
	return date ? moment(date).tz("Asia/Yangon").format('YYYY-MM-DD HH:mm:ss') : null;
}

exports.getStandardFormat = getStandardFormat;