const { check, validationResult } = require('express-validator')
const getGalleryImagesRules = () => {
  return [
    check('senderId', 'senderId is require').not().isEmpty(),
    check('receiverId', 'receiverId is require').not().isEmpty()
  ]
}

const validate = (req, res, next) => {

  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = []
  errors.array().map(err => extractedErrors.push(err.msg))

  return res.status(400).json({
    "result" : null,
    "statusCode" : 400,
    "message" : extractedErrors[0]
  });
}

module.exports = {
  getGalleryImagesRules,
  validate,
}