const Media = require("../models/media");
const Organisation = require("../models/organisation");
const Transaction = require("../models/transaction");
const Blockchain = require("./blockchain");
const hash = require("./hash");
const aws = require("./aws");
const sizeOf = require("image-size");
const ExifReader = require("exifreader");

function uploadPhoto(photoInfo, user) {
  const photo_data = photoInfo.base64;
  let uploaded_photo, organisation;
  // steps
  // 1. check if photo already exists
  // 2. if not, upload it
  // 3. record transaction to blockchain
  // 4. save metadata to db

  return Media.findOne({ hash: hash(photo_data) })
    .then(photo => {
      if (photo === null) {
        return aws.uploadBase64(photo_data);
      } else {
        throw { status: 409, error: "Image already exists." };
      }
    })
    .then(s3file => {
      // create photo model
      let photo = new Media();
      photo.hash = s3file.key || s3file.Key;
      photo.url = aws.bloomenFileUrl(photo.hash);

      // mandatory fields
      photo.description = photoInfo.description || "";
      photo.keywords = photoInfo.keywords || [];
      photo.type = photoInfo.type || "photo";
      photo.price = photoInfo.price.toString() || 0;
      photo.owner = hash(user.organisation);
      photo.license = photoInfo.license;
      photo.rights = [photo.owner];
      photo.attribution = photoInfo.attribution || user.settings.attribution;
      photo.analytics = {};
      photo.createdAtUTC = new Date();

      // optional fields
      photo.rightsTime = photoInfo.rightsTime || null;
      photo.rightsRegion = photoInfo.rightsRegion || null;
      photo.geo = photoInfo.geo || null;

      // extract image metadata
      const base64data = photoInfo.base64.split(",")[1];
      const img = Buffer.from(base64data, "base64");
      const dimensions = sizeOf(img);
      let exif_metadata = {};

      try {
        exif_metadata = ExifReader.load(img);
      } catch (ex) {
        console.log("EXIF EXCEPTION", ex);
        exif_metadata = {};
      }

      photo.metadata = {
        width: dimensions.width,
        height: dimensions.height,
        exif: exif_metadata
      };

      uploaded_photo = photo;

      // find user's organisation
      return Organisation.findOne({ name: user.organisation });
    })
    .then(org => {
      if (org === null) {
        throw { status: 404, error: "User's organisation not found." };
      }
      organisation = org;
      console.log(
        "\x1b[35m",
        "Organisation wallet.",
        "\x1b[37m",
        organisation.walletAddress
      );

      let price = Number(uploaded_photo.price);
      return Blockchain.uploadPhoto(organisation.mnemonic, price);
    })
    .then(async receipt => {
      // save blockchain transaction to database
      let transaction = createTransaction(
        receipt.transaction_hash,
        "upload",
        uploaded_photo.hash,
        receipt.photo_id,
        0,
        user.hash,
        null
      );
      transaction.save();

      uploaded_photo.ownerUser = user;

      // save uploaded photo to database
      await uploaded_photo.save();

      return {
        photo: uploaded_photo,
        transaction: transaction
      };
    });
}

function uploadPhotos(photos, user) {
  return Promise.all(photos.map(p => uploadOffchain(p, user)));
}

function purchasePhoto(photoHash, user) {
  const orgHash = hash(user.organisation);
  let saved_photo, organisation, mnemonic;

  return Media.findOne({ hash: photoHash })
    .then(photo => {
      // if user's organisation is owner, or has already bought rights to this photo
      if (photo.owner === orgHash || photo.rights.indexOf(orgHash) !== -1) {
        throw { status: 403, error: "You already have rights on this image." };
      }

      saved_photo = photo;
      return Organisation.findOne({ name: user.organisation });
    })
    .then(org => {
      if (org === null) {
        throw { status: 404, error: "User's organisation not found." };
      }
      organisation = org;
      mnemonic = org.mnemonic;
      console.log(
        "\x1b[36m",
        "Organisation wallet.",
        "\x1b[37m",
        organisation.walletAddress
      );

      return Blockchain.getTokenBalance(organisation.walletAddress);
    })
    .then(balance => {
      // check organisation's wallet balance
      if (balance < Number(saved_photo.price)) {
        throw {
          status: 500,
          error: "User's wallet does not have the sufficient amount."
        };
      }

      // find photo's upload transaction
      return Transaction.findOne({
        mediaHash: photoHash,
        type: "upload"
      });
    })
    .then(transaction => {
      if (transaction === null) {
        throw { status: 404, error: "Image upload transaction not found." };
      }

      this.mediaId = transaction.mediaId;
      let transactionData = {};
      transactionData.from = organisation.walletAddress;
      transactionData.value = 0; //If working with ETH = ETH * Number(saved_photo.price)
      transactionData.gas = 0;

      console.log(
        "\x1b[36m",
        "data",
        "\x1b[37m",
        this.mediaId,
        saved_photo.price
      );

      // pay photo in blockchain
      return Blockchain.purchasePhoto(
        mnemonic,
        this.mediaId,
        saved_photo.price
      );
    })
    .then(receipt => {
      console.log("receipt", receipt);
      let transaction = createTransaction(
        receipt.transaction_hash,
        "purchase",
        saved_photo.hash,
        this.mediaId,
        saved_photo.price,
        user.hash,
        saved_photo.owner
      );
      transaction.save();

      // update row to database
      let updated = {};
      updated.rights = saved_photo.rights;
      updated.rights.push(orgHash);

      return Media.findOneAndUpdate({ hash: photoHash }, updated, {
        new: true
      })
        .populate({
          path: "transactions",
          populate: {
            path: "user"
          }
        })
        .then(updated_photo => {
          let response = {};
          response.photo = JSON.parse(JSON.stringify(updated_photo));
          response.transaction = transaction; // add transaction to response
          return response;
        });
    });
}

function createUploadTransaction(photo, user) {
  return Organisation.findOne({ name: user.organisation })
    .then(org => {
      if (org === null) {
        throw { status: 404, error: "User's organisation not found." };
      }
      organisation = org;
      console.log(
        "\x1b[35m",
        "Organisation wallet.",
        "\x1b[37m",
        organisation.walletAddress
      );

      let price = Number(photo.price);
      return Blockchain.uploadPhoto(organisation.mnemonic, price);
    })
    .then(async receipt => {
      // save blockchain transaction to database
      let transaction = createTransaction(
        receipt.transaction_hash,
        "upload",
        photo.hash,
        receipt.photo_id,
        0,
        user.hash,
        null
      );
      await transaction.save();

      return {
        photo: photo,
        transaction: transaction
      };
    });
}

function createTransaction(
  hash,
  type,
  mediaHash,
  mediaId,
  payment,
  userHash,
  receiverHash
) {
  let transaction = new Transaction();
  transaction.hash = hash;
  transaction.type = type;
  transaction.mediaHash = mediaHash;
  transaction.mediaId = mediaId;
  transaction.payment = payment;
  transaction.userHash = userHash;
  transaction.receiverHash = receiverHash;
  transaction.createdAtUTC = new Date();
  return transaction;
}

function uploadOffchain(photo_data, user) {
  return Media.findOne({ hash: hash(photo_data) })
    .then(photo => {
      if (photo === null) {
        return aws.uploadBase64(photo_data);
      } else {
        throw { status: 409, error: "Image already exists." };
      }
    })
    .then(s3file => {
      // create photo model
      let photo = new Media();
      photo.hash = s3file.key;
      photo.url = aws.bloomenFileUrl(s3file.key);

      // mandatory fields
      photo.description = "";
      photo.keywords = [];
      photo.type = "photo";
      photo.price = 0;
      photo.owner = hash(user.organisation);
      //   photo.license = "";
      photo.rights = [photo.owner];
      photo.attribution = false;
      photo.analytics = {};
      photo.createdAtUTC = new Date();

      // optional fields
      photo.rightsTime = null;
      photo.rightsRegion = null;
      photo.geo = null;

      // extract image metadata
      const base64data = photo_data.split(",")[1];
      const img = Buffer.from(base64data, "base64");
      const dimensions = sizeOf(img);
      let exif_metadata = {};

      try {
        exif_metadata = ExifReader.load(img);
      } catch (ex) {
        console.log("EXIF EXCEPTION", ex);
        exif_metadata = {};
      }

      photo.metadata = {
        width: dimensions.width,
        height: dimensions.height,
        exif: exif_metadata
      };

      return photo.save();
    })
    .then(photo => {
      return photo;
    });
}

module.exports = {
  uploadPhoto: uploadPhoto,
  uploadPhotos: uploadPhotos,
  createUploadTransaction: createUploadTransaction,
  purchasePhoto: purchasePhoto
};
