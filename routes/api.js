// Initialize express router
var express = require('express');
let router = express.Router();

// Set default API response
router.get('/v1.0/checkServiceStatus', function (req, res) {
    res.json({
    	result: {
    		data : "API Its Working"
    	},
        statusCode: 200,
        message: 'Success'
    });
});

const rateLimitMiddleware = require("../middleware/rateLimitMiddleware");
const uaaAuthMiddleware = require("../middleware/uaaAuthMiddleware.js");
const conversationController = require('../controllers/conversationController');
const galleryController = require("../controllers/galleryController");
const { getGalleryImagesRules, validate } = require('../validations/getGalleryImagesValidator.js');
const messageController = require("../controllers/messageController");

const requiredMiddlewares = [
	rateLimitMiddleware.rateLimit,
	uaaAuthMiddleware.checkTokenWithUaa
];

router.route('/v1.0/conversations').get(requiredMiddlewares,conversationController.index);
router.route('/v1.0/conversations/users').get(requiredMiddlewares,conversationController.users);
router.route('/v1.0/gallery/images').post(requiredMiddlewares, getGalleryImagesRules(), validate ,galleryController.getImages);
router.route('/v1.0/remove/messages').post(requiredMiddlewares,messageController.remove);
// Export API routes
module.exports = router;