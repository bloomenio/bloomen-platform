require("dotenv").config();

const AWS = require("aws-sdk");
const hash = require("../helpers/hash");
const bucket = "bloomen";
const s3 = new AWS.S3();

let bloomenFileUrl = function(hash) {
  const baseUrl = process.env.BLOOMEN_URL;
  return baseUrl + "assets/host/" + hash;
};

let getFile = function(key) {
  const getParams = {
    Bucket: bucket, // your bucket name,
    Key: key // path to the object you're looking for
  };

  return new Promise((resolve, reject) => {
    s3.getObject(getParams, function(err, data) {
      /* istanbul ignore if */
      if (err) {
        reject(err);
      }

      resolve(data);
    });
  });
};

let getFileUrl = function(key) {
  const baseUrl = process.env.AWS_URL;

  return new Promise((resolve, reject) => {
    resolve(baseUrl + key);
  });
};

let listFileUrls = function(amount, fromKey) {
  let params = {
    Bucket: bucket,
    MaxKeys: amount
  };

  // If user provides previous filename, continue fetching results from there.
  // For pagination.
  fromKey ? (params.StartAfter = fromKey) : null;

  return new Promise((resolve, reject) => {
    s3.listObjectsV2(params, function(err, data) {
      /* istanbul ignore if */
      if (err) {
        reject(err);
        return;
      }

      // create url array
      let keys = data.Contents.map(file => {
        return bloomenFileUrl(file.Key);
      });

      resolve(keys);
    });
  });
};

let uploadBase64 = function(base64) {
  const type = base64.split(";")[0].split("/")[1];
  const contentType = "image/" + type;
  const encoding = "base64";

  // TODO: check content type, only allow images

  const base64Data = new Buffer(
    base64.replace(/^data:image\/\w+;base64,/, ""),
    encoding
  );

  // TODO: save image hash to blockchain
  const key = hash(base64);

  const params = {
    Bucket: bucket,
    Key: key,
    Body: base64Data,
    ACL: "public-read",
    ContentEncoding: encoding,
    ContentType: contentType
  };

  return new Promise((resolve, reject) => {
    // if (base64.split(";")[0].split("/")[0] !== "image") {
    //   reject({ status: 400, error: "Only image uploads are allowed." });
    //   return;
    // }

    s3.upload(params, (err, data) => {
      /* istanbul ignore if */
      if (err) {
        reject(err);
        return console.log(err);
      }

      resolve(data);
    });
  });
};

module.exports = {
  getFile: getFile,
  getFileUrl: getFileUrl,
  listFileUrls: listFileUrls,
  uploadBase64: uploadBase64,
  bloomenFileUrl: bloomenFileUrl
};
