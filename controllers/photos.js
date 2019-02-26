const express = require('express');
const router = express.Router();
const Photo = require('../models/photo');
const Organisation = require('../models/organisation');
const Transaction = require('../models/transaction');
const aws = require('../helpers/aws');
const hash = require('../helpers/hash');
const Blockchain = require('../helpers/blockchain');
const Wallet = require('../helpers/wallet');
const photographer = require('../middlewares/photographer');
const publisher = require('../middlewares/publisher');

const PAGE_SIZE = 10;
const ETH = Math.pow(10, 18);

/**
 * Returns all photos
 * @route GET /photos
 * @group photos - Operations about photos
 * @param {string} before.query - Optional - used for pagination. Gets all photos with createdAtUTC before given timestamp
 * @returns {Array<Photo>} 200 - An array of photos
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/', getPhotos);

/**
 * Returns a photo by its hash
 * @route GET /photos/{hash}
 * @group photos - Operations about photos
 * @param {string} hash.path.required - Unique hash of the photo
 * @returns {Photo} 200 - A single photo
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 404 - Photo not found
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/:hash', getPhoto);

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
router.post('/', photographer, uploadPhoto);

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
router.put('/:hash', photographer, updatePhoto);

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
router.put('/:hash/pay', publisher, purchasePhoto);

/**
 * Search for photos
 * @route POST /photos
 * @group photos - Operations about photos
 * @param {string} before.query - Optional - used for pagination. Gets photos with createdAtUTC before given timestamp
 * @param {SearchPhotoDTO.model} search.body.required - Search term
 * @returns {Photo} 200 - An array of photos
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post('/search', searchPhotos);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function getPhotos(req, res, next) {
  const before = req.query.before ? new Date(req.query.before) : new Date();

  Photo.find({
    createdAtUTC: { $lt: before }
  })
    .populate('ownerUser')
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
  Photo.findOne({ hash: req.params.hash })
    .populate('ownerUser')
    .populate({
      path: 'transactions',
      populate: {
        path: 'user'
      }
    })
    .then(response => {
      if (response == null) throw { status: 404, error: 'Hash not found' };
      return res.send(response);
    })
    .catch(error => {
      next(error);
    });
}

function uploadPhoto(req, res, next) {
  const photo_data = req.body.base64;
  const contractInstance = Blockchain.getContractInstance();
  let uploaded_photo, organisation;
  // steps
  // 1. check if photo already exists
  // 2. if not, upload it
  // 3. record transaction to blockchain
  // 4. save metadata to db

  Photo.findOne({ hash: hash(photo_data) })
    .then(photo => {
      if (photo === null) {
        return aws.uploadBase64(photo_data);
      } else {
        throw { status: 409, error: 'Image already exists.' };
      }
    })
    .then(s3file => {
      // create photo model
      let photo = new Photo();
      photo.hash = s3file.key;
      photo.url = aws.bloomenFileUrl(s3file.key);

      // mandatory fields
      photo.description = req.body.description || '';
      photo.keywords = req.body.keywords || [];
      photo.type = req.body.type || 'photo';
      photo.price = req.body.price.toString() || 0;
      photo.owner = hash(req.user.organisation);
      photo.rights = [photo.owner];
      photo.attribution = req.body.attribution || req.user.settings.attribution;
      photo.analytics = {};
      photo.createdAtUTC = new Date();

      // optional fields
      photo.rightsTime = req.body.rightsTime || null;
      photo.rightsRegion = req.body.rightsRegion || null;
      photo.geo = req.body.geo || null;

      uploaded_photo = photo;

      // find user's organisation
      return Organisation.findOne({ name: req.user.organisation });
    })
    .then(org => {
      if (org === null) {
        throw { status: 404, error: "User's organisation not found." };
      }
      organisation = org;
      console.log(
        '\x1b[35m',
        'Organisation wallet.',
        '\x1b[37m',
        organisation.walletAddress
      );

      // unlock organisation's wallet
      let web3 = Blockchain.getWeb3();
      return web3.eth.personal.unlockAccount(
        String(organisation.walletAddress),
        String(organisation.hash),
        15000
      );
    })
    .then(accountUnlocked => {
      if (!accountUnlocked) {
        throw { status: 500, error: "User's wallet could not be unlocked." };
      }

      let transactionData = {};
      let price = ETH * Number(uploaded_photo.price);
      transactionData.from = organisation.walletAddress;

      if (Blockchain.getName() !== 'quorum') {
        transactionData.gas = Blockchain.getGas();
      }

      console.log('\x1b[35m', 'Transaction data.', '\x1b[37m', transactionData);

      // upload photo to blockchain (2 -> Resale type | false -> no working with tokens)
      return contractInstance.methods
        .photoUpload(2, price, true)
        .send(transactionData)
        .on('receipt', function(receipt) {
          console.log(
            '\x1b[35m',
            'Upload transaction completed.',
            '\x1b[37m',
            'for block:',
            receipt.blockNumber
          );
          return receipt;
        })
        .catch(err => {
          throw { status: 503, error: String(err) };
        });
    })
    .then(receipt => {
      if (!receipt.events.PhotoUpload) {
        throw {
          status: 500,
          error: 'An error occured during upload process.'
        };
      }

      // save uploaded photo to database
      uploaded_photo.save();

      // save blockchain transaction to database
      let transaction = createTransaction(
        receipt.transactionHash,
        'upload',
        uploaded_photo.hash,
        receipt.events.PhotoUpload.returnValues._photoID,
        0,
        req.user.hash,
        null
      );
      transaction.save();

      uploaded_photo.ownerUser = req.user;

      res.send({
        photo: uploaded_photo,
        transaction: transaction
      });
    })
    .catch(next);
}

function updatePhoto(req, res, next) {
  Photo.findOne({ hash: req.params.hash })
    .then(photo => {
      // if user requesting update is now the owner, return 403 Forbidden
      if (photo.owner !== req.user.hash) {
        throw { status: 403, error: 'Only photo owner can update photo info.' };
      }

      photo = {};
      photo.description = req.body.description || '';
      photo.keywords = req.body.keywords || [];
      photo.type = req.body.type || 'photo';
      photo.price = req.body.price || 0;
      photo.rightsTime = req.body.rightsTime;
      photo.rightsRegion = req.body.rightsRegion;
      photo.geo = req.body.geo;

      return Photo.findOneAndUpdate({ hash: req.params.hash }, photo, {
        new: true
      });
    })
    .then(photo => {
      res.send(photo);
    })
    .catch(error => {
      next(error);
    });
}

function purchasePhoto(req, res, next) {
  const contractInstance = Blockchain.getContractInstance();
  const orgHash = hash(req.user.organisation);
  let saved_photo, organisation;

  Photo.findOne({ hash: req.params.hash })
    .then(photo => {
      // if user's organisation is owner, or has already bought rights to this photo
      if (photo.owner === orgHash || photo.rights.indexOf(orgHash) !== -1) {
        throw { status: 403, error: 'You already have rights on this image.' };
      }

      saved_photo = photo;
      return Organisation.findOne({ name: req.user.organisation });
    })
    .then(org => {
      if (org === null) {
        throw { status: 404, error: "User's organisation not found." };
      }
      organisation = org;
      console.log(
        '\x1b[36m',
        'Organisation wallet.',
        '\x1b[37m',
        organisation.walletAddress
      );

      return Wallet.getTokenBalance(organisation.walletAddress);
    })
    .then(balance => {
      // check organisation's wallet balance
      if (balance < ETH * Number(saved_photo.price)) {
        throw {
          status: 500,
          error: "User's wallet does not have the sufficient amount."
        };
      }
      // unlock organisation's wallet
      let web3 = Blockchain.getWeb3();
      return web3.eth.personal.unlockAccount(
        String(organisation.walletAddress),
        String(organisation.hash),
        15000
      );
    })
    .then(accountUnlocked => {
      if (!accountUnlocked) {
        throw { status: 500, error: "User's wallet could not be unlocked." };
      }

      // find photo's upload transaction
      return Transaction.findOne({
        photoHash: req.params.hash,
        type: 'upload'
      });
    })
    .then(transaction => {
      if (transaction === null) {
        throw { status: 404, error: 'Image upload transaction not found.' };
      }

      let transactionData = {};
      transactionData.from = organisation.walletAddress;
      transactionData.value = 0; //If working with ETH = ETH * Number(saved_photo.price)

      if (Blockchain.getName() !== 'quorum') {
        transactionData.gas = Blockchain.getGas();
      }

      console.log('\x1b[36m', 'Transaction data.', '\x1b[37m', transactionData);

      // pay photo in blockchain
      return contractInstance.methods
        .purchaseUsageRight(
          transaction.photoId,
          ETH * Number(saved_photo.price)
        )
        .send(transactionData)
        .on('receipt', function(receipt) {
          console.log(
            '\x1b[36m',
            'Purchase transaction completed.',
            '\x1b[37m',
            'for block:',
            receipt.blockNumber
          );
          return receipt;
        })
        .catch(err => {
          throw { status: 503, error: String(err) };
        });
    })
    .then(receipt => {
      if (!receipt.events.PhotoRelease) {
        throw {
          status: 500,
          error: 'An error occured during purchase process.'
        };
      }

      let transaction = createTransaction(
        receipt.transactionHash,
        'purchase',
        saved_photo.hash,
        receipt.events.PhotoRelease.returnValues._photoID,
        saved_photo.price,
        req.user.hash,
        saved_photo.owner
      );
      transaction.save();

      // update row to database
      let updated = {};
      updated.rights = saved_photo.rights;
      updated.rights.push(orgHash);

      Photo.findOneAndUpdate({ hash: req.params.hash }, updated, {
        new: true
      })
        .populate({
          path: 'transactions',
          populate: {
            path: 'user'
          }
        })
        .then(updated_photo => {
          let response = {};
          response.photo = JSON.parse(JSON.stringify(updated_photo));
          response.transaction = transaction; // add transaction to response
          res.send(response);
        });
    })
    .catch(next);
}

function searchPhotos(req, res, next) {
  const searchTerm = req.body.term || '';

  const before = req.query.before ? new Date(req.query.before) : new Date();

  // find all that contain the term in the description, or have a tag with the term,
  // AND are created before given date
  Photo.find({
    $and: [
      {
        $or: [
          {
            description: { $regex: '.*' + searchTerm + '.*' }
          },
          { keywords: searchTerm }
        ]
      },
      {
        createdAtUTC: { $lt: before }
      }
    ]
  })
    .populate('ownerUser')
    .populate({ path: 'transactions', options: { sort: { createdAtUTC: -1 } } })
    .limit(PAGE_SIZE)
    .sort({ createdAtUTC: -1 })
    .then(response => {
      res.send(response);
    })
    .catch(error => {
      next(error);
    });
}

function createTransaction(
  hash,
  type,
  photoHash,
  photoId,
  payment,
  userHash,
  receiverHash
) {
  let transaction = new Transaction();
  transaction.hash = hash;
  transaction.type = type;
  transaction.photoHash = photoHash;
  transaction.photoId = photoId;
  transaction.payment = payment;
  transaction.userHash = userHash;
  transaction.receiverHash = receiverHash;
  transaction.createdAtUTC = new Date();
  return transaction;
}

module.exports = router;
