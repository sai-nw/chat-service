const mongoose = require("mongoose");

mongoose.Promise = require("bluebird");

//.env config
const dotenv = require('dotenv');
dotenv.config();

var dbConnection = process.env.DB_CONNECTION;
var dbHost = process.env.DB_HOST;
var dbPort = process.env.DB_PORT;
var dbName = process.env.DB_DATABASE;
var dbConnection = process.env.DB_CONNECTION;
var dbUserName = encodeURIComponent(process.env.DB_USERNAME);
var dbPwd = encodeURIComponent(process.env.DB_PASSWORD);

const url = `${dbConnection}://${dbUserName}:${dbPwd}@${dbHost}:${dbPort}/${dbName}?authSource=admin`
//"mongodb://root:root@127.0.0.1:37017/chat_research?authSource=admin";

const dbConnect = mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = dbConnect;