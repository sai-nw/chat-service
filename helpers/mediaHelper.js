const fs = require('fs');

const deleteFileFromAkoneyaMedia = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

exports.deleteFileFromAkoneyaMedia = deleteFileFromAkoneyaMedia;