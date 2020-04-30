require("dotenv").config();
const request = require("request");

const AWS = require("aws-sdk");
const hash = require("./hash");
const bucket = "bloomen";
const s3 = new AWS.S3();

const bloomenFileUrl = function(hash) {
  const baseUrl = process.env.BLOOMEN_URL;
  return baseUrl + "assets/host/" + hash;
};

const checkMediaHash = function(_hash) {
  return new Promise((resolve, reject) => {
    getFileUrl(_hash)
      .then(url => {
        return $request(url);
      })
      .then(image => {
        const base64 = convertToBase64(image);
        console.log("CONTENT TYPE", image.response.headers["content-type"]);
        console.log("COMPARISON", _hash, hash(base64));
        resolve(_hash === hash(base64));
      })
      .catch(error => reject(error));
  });
};

const convertToBase64 = image => {
  return (
    "data:" +
    image.response.headers["content-type"] +
    ";base64," +
    Buffer.from(image.buffer, "binary").toString("base64")
  );
};

const $request = url => {
  return new Promise((resolve, reject) => {
    request({ url, encoding: null }, (err, resp, buffer) => {
      // Use the buffer
      // buffer contains the image data
      // typeof buffer === 'object'
      if (err) {
        reject(err);
      } else {
        resolve({ response: resp, buffer: buffer });
      }
    });
  });
};

const getFile = key => {
  const getParams = {
    Bucket: bucket, // your bucket name,
    Key: key // path to the object you're looking for
  };

  return new Promise((resolve, reject) => {
    s3.getObject(getParams, (err, data) => {
      /* istanbul ignore if */
      if (err) {
        reject(err);
      }

      resolve(data);
    });
  });
};

const getFileUrl = key => {
  const baseUrl = process.env.AWS_URL;

  return new Promise((resolve, reject) => {
    resolve(baseUrl + key);
  });
};

const listFileUrls = (amount, fromKey) => {
  const params = {
    Bucket: bucket,
    MaxKeys: amount
  };

  // If user provides previous filename, continue fetching results from there.
  // For pagination.
  fromKey ? (params.StartAfter = fromKey) : null;

  return new Promise((resolve, reject) => {
    s3.listObjectsV2(params, (err, data) => {
      /* istanbul ignore if */
      if (err) {
        reject(err);
        return;
      }

      // create url array
      const keys = data.Contents.map(file => {
        return bloomenFileUrl(file.Key);
      });

      resolve(keys);
    });
  });
};

const uploadBase64 = base64 => {
  const type = base64.split(";")[0].split("/")[1];
  const contentType = "image/" + type;
  const encoding = "base64";

  // TODO: check content type, only allow images

  const base64Data = Buffer.from(
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
  bloomenFileUrl: bloomenFileUrl,
  checkMediaHash: checkMediaHash
};
