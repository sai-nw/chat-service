var request = require('request');
var config = require('../config/uaa.js');
var url = config.auth_url;

var checkTokenWithUaa = (req, res, next) => {

      request.get( {
        url : url,
        headers : {
            "Authorization" : req.headers['authorization'],
            "Accept" : 'application/json'
        }
      },function(error, response, body) {

          if(error == null) {
            if(response.statusCode == 200) {
              var responseJson = JSON.parse(response.body);
              console.log("Authorized");
              req.body.clientUserId = responseJson.result.user.id;
              next();
            } 
            else{
              console.log('Unauthorized');
              var responseJson = JSON.parse(response.body);
              res.send(responseJson);
            }
          }
          else{
            console.log('Failed to connect with UAA Service!');
            res.end();
          }
      });
};

module.exports = {
  checkTokenWithUaa: checkTokenWithUaa
};
