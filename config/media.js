const dotenv = require('dotenv');
dotenv.config();

const url = process.env.FILESYSTEM_CLOUD_ENABLED == 'true' ? process.env.ALIBABA_OSS_URL : process.env.AKONEYA_MEDIA_URL;

module.exports = {
	imageSizeLimit: process.env.IMAGE_SIZE_LIMIT_IN_KB,
	url: url,
	path: process.env.LOCAL_MEDIA_PATH,
	cloud_upload_enabled: process.env.FILESYSTEM_CLOUD_ENABLED
};