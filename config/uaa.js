//.env config
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    auth_url: process.env.UAA_CHAT_AUTH_URL,
    user_info_url: process.env.UAA_CHAT_AUTH_USERINFO_URL
};