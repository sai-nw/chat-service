let express = require('express');
let path = require('path');
let app = express();
let http = require('http');
let server = http.Server(app);

let sockets = require('./sockets.js');

const appConfig = require('./config/app.js');
const dbConnect = require("./config/db_connect");
const bodyParser = require("body-parser");

let apiRoutes = require("./routes/api");

// Configure bodyparser to handle post requests
app.use(bodyParser.urlencoded({ extended: true }));
//allow json body request
app.use(bodyParser.json());

var port = appConfig.port;

server.listen(port, function () {
  console.log("Listening on port " + port);
});

dbConnect.then(db => {
  console.log("Database connected successfully");
});

sockets.init(server);

app.use(express.static(path.join(__dirname, "public")));

// Use Api routes in the App
app.use('/api', apiRoutes);

app.use(function(req,res){
	res.statusCode = 404;
  	res.json({
	    "result": null,
	    "statusCode": 404,
	    "message": "Not Found"
	});
});