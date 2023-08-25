var rateLimiter =  require('express-rate-limit');

const rateLimit = rateLimiter({
  	windowMs: 60000,//milliseconds is equal 1 minute 
  	max: 60,//MAX_WINDOW_REQUEST_COUNT
  	message: {
        "result": null,
        "statusCode": 429,
        "message": "Too many requests"
    },
    header: true
});

module.exports = {
	rateLimit : rateLimit
}