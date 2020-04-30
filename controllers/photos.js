const express = require("express");
const router = express.Router();
const sizeOf = require("image-size");
const ExifReader = require("exifreader");
const Media = require("../models/media");
const Organisation = require("../models/organisation");
const Transaction = require("../models/transaction");
const aws = require("../helpers/aws");
const hash = require("../helpers/hash");
const Versioning = require("../helpers/versioning");
const Blockchain = require("../helpers/blockchain");
const PhotoService = require("../helpers/photo");
const photo = require("../middlewares/photo");

const PAGE_SIZE = 20;
const ETH = Math.pow(10, 18);

/**
 * Returns all photos
 * @route GET /photos
 * @group photos - Operations about photos
 * @param {string} before.query - Optional - used for pagination. Gets all photos with createdAtUTC before given timestamp
 * @returns {Array<Media>} 200 - An array of photos
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/", getPhotos);

/**
 * Returns a photo by its hash
 * @route GET /photos/{hash}
 * @group photos - Operations about photos
 * @param {string} hash.path.required - Unique hash of the photo
 * @returns {Media} 200 - A single photo
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 404 - Photo not found
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/:hash", getPhoto);

/**
 * Returns a comparison of aws and db hash
 * @route GET /photos/comparison/{hash}
 * @group photos - Operations about photos
 * @param {string} hash.path.required - Unique hash of the photo
 * @returns {Media} 200 - A single photo
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 404 - Photo not found
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/compare/:hash", getPhotoComparison);

/**
 * Upload a new photo
 * @route POST /photos
 * @group photos - Operations about photos
 * @param {UploadPhotoDTO.model} photo.body.required - New photo info
 * @returns {object} 200 - The uploaded photo and the blockchain transaction
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post("/", photo.create, uploadPhoto);

/**
 * Mass upload photos (no blockchain transaction, will not be public until properly edited)
 * @route POST /photos/mass
 * @group photos - Operations about photos
 * @param {MassUploadPhotoDTO.model} photos.body.required - New photo info
 * @returns {object} 200 - The uploaded photo
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post("/mass", photo.create, massUploadPhoto);

/**
 * Updates a photo by its hash
 * @route PUT /photos/{hash}
 * @group photos - Operations about photos
 * @param {string} hash.path.required - Unique hash of the photo
 * @param {UpdatePhotoDTO.model} photo.body.required - Updated photo fields
 * @returns {Photo} 200 - Updated photo
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Only photo owner can update photo info
 * @returns {Error} 404 - Photo not found
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post("/annotations/:hash", updateAnnotations);
/**
 * Updates a photo by its hash
 * @route PUT /photos/{hash}
 * @group photos - Operations about photos
 * @param {string} hash.path.required - Unique hash of the photo
 * @param {UpdatePhotoDTO.model} photo.body.required - Updated photo fields
 * @returns {Photo} 200 - Updated photo
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Only photo owner can update photo info
 * @returns {Error} 404 - Photo not found
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.put("/:hash", photo.create, updatePhoto);

/**
 * Pay for a photo
 * @route PUT /photos/{hash}/pay
 * @group photos - Operations about photos
 * @param {string} hash.path.required - Unique hash of the photo
 * @returns {Photo} 200 - The photo and the blockchain transaction
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Only ppublisher can pay for photo
 * @returns {Error} 404 - Photo not found
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.put("/:hash/pay", photo.pay, purchasePhoto);

/**
 * Search for photos
 * @route POST /photos/search
 * @group photos - Operations about photos
 * @param {string} before.query - Optional - Used for pagination. Gets photos with createdAtUTC before given timestamp
 * @param {string} type.query - Optional - Gets photos with given type (string)
 * @param {string} attribution.query - Optional - Gets photos with given attribution flag (boolean)
 * @param {string} priceGreaterThan.query - Optional - Gets photos with price greater than provided (numeric)
 * @param {string} priceLessThan.query - Optional - Gets photos with price less than provided (numeric)
 * @param {string} sold.query - Optional - Gets photos that are already sold or not (boolean)
 * @param {SearchPhotoDTO.model} search.body.required - Search term
 * @returns {Photo} 200 - An array of photos
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post("/search", searchPhotos);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function getPhotos(req, res, next) {
  const before = req.query.before ? new Date(req.query.before) : new Date();

  let query = {};

  query["createdAtUTC"] = { $lt: before };

  Media.find(query)
    .populate("ownerUser")
    .limit(PAGE_SIZE)
    .sort({ createdAtUTC: -1 })
    .then(response => {
      res.send(response);
    })
    .catch(error => {
      next(error);
    });
}

function getPhoto(req, res, next) {
  Media.findOne({ hash: req.params.hash })
    .populate("ownerUser")
    .populate("versions")
    .populate({
      path: "transactions",
      populate: {
        path: "user"
      }
    })
    .then(response => {
      return res.send(response);
    })
    .catch(error => {
      next(error);
    });
}

function getPhotoComparison(req, res, next) {
  Media.findOne({ hash: req.params.hash })
    .then(response => {
      if (response == null) throw { status: 404, error: "Hash not found" };
      return aws.checkMediaHash(response.hash);
    })
    .then(isOriginal => {
      return res.send({ isOriginal: isOriginal });
    })
    .catch(error => {
      next(error);
    });
}

function updateAnnotations(req, res, next) {
  const { hash } = req.params;
  const annotations = req.body;
  console.log("PHOTO HASH IS", hash);
  console.log("PHOTO Hannotations", annotations);
  Media.findOneAndUpdate({ hash }, { annotations }, { new: true })
    .then(updatedPhoto => {
      res.send(updatedPhoto);
    })
    .catch(error => {
      next(error);
    });
}

function massUploadPhoto(req, res, next) {
  // ["base64data", "base64data"]
  return PhotoService.uploadPhotos(req.body.photos, req.user)
    .then(response => res.send({ "Successfuly uploaded": response.length }))
    .catch(next);
}

function uploadPhoto(req, res, next) {
  return PhotoService.uploadPhoto(req.body, req.user)
    .then(response => res.send(response))
    .catch(next);
}

function purchasePhoto(req, res, next) {
  return PhotoService.purchasePhoto(req.params.hash, req.user)
    .then(response => res.send(response))
    .catch(next);
}

function updatePhoto(req, res, next) {
  Media.findOne({ hash: req.params.hash })
    .then(async photo => {
      // save this version of the photo
      this.previousVersion = photo;

      // if user requesting update is not the owner or an admin, return 403 Forbidden
      if (
        photo.owner !== req.user.hash &&
        req.user.role.indexOf("admin") === -1
      ) {
        throw { status: 403, error: "Only photo owner can update photo info." };
      }

      photo = {};
      photo.hash = req.params.hash;
      photo.description = req.body.description || "";
      photo.keywords = req.body.keywords || [];
      photo.type = req.body.type || "photo";
      photo.price = req.body.price || 0;
      photo.rightsTime = req.body.rightsTime;
      photo.rightsRegion = req.body.rightsRegion;
      photo.geo = req.body.geo;

      // if photo is not yet written in blockchain, write it
      if (this.previousVersion.price == 0) {
        // upload to blockchain
        await PhotoService.createUploadTransaction(photo, req.user);
      }

      return Media.findOneAndUpdate({ hash: req.params.hash }, photo, {
        new: true
      });
    })
    .then(photo => {
      // save original version
      Versioning.saveVersion(
        this.previousVersion._id,
        "photo",
        this.previousVersion
      );
      res.send(photo);
    })
    .catch(error => {
      next(error);
    });
}

function searchPhotos(req, res, next) {
  let query = {};
  const before = req.query.before ? new Date(req.query.before) : new Date();
  let annotations,
    license,
    type,
    sold,
    attribution,
    priceGreaterThan,
    priceLessThan;

  if (req.body.filters) {
    annotations = req.body.filters.annotations || null;
    license = req.body.filters.license || null;
    attribution = req.body.filters.attribution || null;
    sold = req.body.filters.sold || null;
    priceGreaterThan = req.body.filters.priceGreaterThan || null;
    priceLessThan = req.body.filters.priceLessThan || null;
  }

  // only fetch images written in blockchain
  query["price"] = { $gt: 0 };

  query["createdAtUTC"] = { $lt: before };

  if (req.body.term || req.body.term !== "") {
    query["$text"] = { $search: req.body.term, $caseSensitive: false };
  }

  if (annotations) {
    query["annotations.0"] = { $exists: true };
  }

  if (license) {
    query["license"] = license;
  }

  if (type) {
    query["type"] = type;
  }

  if (attribution) {
    query["attribution"] = attribution;
  }

  if (sold) {
    query["rights.1"] = { $exists: true };
  } else if (sold == "false") {
    query["rights.1"] = { $exists: false };
  }

  if (priceGreaterThan) {
    query["price"] = {
      $gte: parseFloat(priceGreaterThan)
    };
  }

  if (priceLessThan) {
    query["price"] = { $lte: parseFloat(priceLessThan) };
  }

  console.log("query", query);
  Media.find(query)
    .populate("ownerUser")
    .populate({ path: "transactions", options: { sort: { createdAtUTC: -1 } } })
    .limit(PAGE_SIZE)
    .sort({ createdAtUTC: -1 })
    .then(response => {
      res.send(response);
    })
    .catch(error => {
      next(error);
    });
}

module.exports = router;
