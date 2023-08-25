let oss = require('ali-oss');
let fs = require('fs');
const mediaHelper = require('../helpers/mediaHelper');

let client = new oss({
  accessKeyId: process.env.ALIBABA_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIBABA_OSS_SECRET_ACCESS_KEY,
  region: process.env.ALIBABA_OSS_REGION,
  bucket: process.env.ALIBABA_OSS_BUCKET
});

const uploadFile = async (fileName, filePath) => {
  try {
    let result = await client.put(fileName, filePath);
  } catch (e) {
    console.log (e);
  }
}

const uploadFileStream = async (fileName, filePath) => {
  try {
    let stream = fs.createReadStream(filePath);
    let result = await client.putStream(fileName, stream);
    if(result.res.statusCode == 200) {
      mediaHelper.deleteFileFromAkoneyaMedia(filePath);
    }
  } catch (e) {
      console.log(e);
  }
}

const deleteFile = async (fileName) => {
  try {
    let result = await client.delete(fileName);
  } catch (err) {
    console.log (err);
  }
}


module.exports = {
  uploadFile: uploadFile,
  uploadFileStream: uploadFileStream,
  deleteFile: deleteFile
}