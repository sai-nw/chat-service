var uuid = require("uuid");

/**
 * Return a uuid string
 */
function generate_uuid() {  
	return uuid.v4();
}

/**
 * Return image name
 */
function generate_image_name(fileExtension) {  
	return generate_uuid() + fileExtension;
}

module.exports = {
    generate_uuid: generate_uuid,
    generate_image_name: generate_image_name
};