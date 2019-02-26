const express = require('express');
const User = require('../models/user');
const hash = require('../helpers/hash');
const aws = require('../helpers/aws');
const publisher = require('../middlewares/publisher');
const router = express.Router();

/**
 * Get all approved users
 * @route GET /users
 * @group users - Operations about users
 * @returns {Array<User>} 200 - An array of users
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - User is not a publisher
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/', publisher, getUsers);

/**
 * Get all users with KYC requests
 * @route GET /users/kyc
 * @group users - Operations about users
 * @returns {Array<User>} 200 - An array of users
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - User is not a publisher
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/kyc', publisher, getKYC);

/**
 * Get user's KYC request
 * @route GET /users/{hash}/kyc
 * @group users - Operations about users
 * @param {KYCRequestDTO.model} data.body.required - KYC data
 * @returns {User} 200 - Requested user
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post('/kyc', addKYC);

/**
 * Get user's KYC request
 * @route GET /users/{hash}/kyc
 * @group users - Operations about users
 * @param {string} hash.path.required - Unique hash of the user
 * @returns {User} 200 - Requested user
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - User is not a publisher
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/:hash/kyc', publisher, getUserKYC);

/**
 * Review user's KYC request
 * @route PUT /users/{hash}/kyc
 * @group users - Operations about users
 * @param {string} hash.path.required - Unique hash of the user
 * @param {KYCApprovalDTO.model} data.body.required - KYC approval
 * @returns {User} 200 - Requested user
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - User is not a publisher
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.put('/:hash/kyc', publisher, reviewKYC);

/**
 * Vote photographer
 * @route PUT /users/{hash}/vote
 * @group users - Operations about users
 * @param {string} hash.path.required - Unique hash of the user
 * @param {VoteDTO.model} vote.body.required - Vote object
 * @returns {User} 200 - Voted user
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.put('/:hash/vote', vote);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function getUsers(req, res, next) {
  User.find({ 'kyc.status': 1 })
    .then(users => {
      res.send(users);
    })
    .catch(error => {
      next(error);
    });
}

function getKYC(req, res, next) {
  User.find({ role: 'photographer' })
    .sort({ 'kyc.status': -1 })
    .then(users => {
      res.send(users);
    })
    .catch(error => {
      next(error);
    });
}

function addKYC(req, res, next) {
  let filesToUpload = [];
  let uploadPromises = [];
  if (
    req.body.id1 !== '' &&
    req.body.id1 !== null &&
    req.body.id1 !== undefined
  ) {
    filesToUpload.push(req.body.id1);
  }

  if (
    req.body.id2 !== '' &&
    req.body.id2 !== null &&
    req.body.id2 !== undefined
  ) {
    filesToUpload.push(req.body.id2);
  }

  for (let i = 0; i < filesToUpload.length; i++) {
    uploadPromises.push(aws.uploadBase64(filesToUpload[i]));
  }

  Promise.all(uploadPromises)
    .then(files => {
      let kyc = {};
      kyc.address = req.body.address || '';
      kyc.phone = req.body.phone || '';
      kyc.firstname = req.body.firstname || '';
      kyc.lastname = req.body.lastname || '';
      kyc.id1 = files.length > 0 ? files[0].Location : '';
      kyc.id2 = files.length > 1 ? files[1].Location : '';
      kyc.status = 1; // see user model for enum meaning

      return User.findOneAndUpdate(
        { hash: hash(req.user.username) },
        { $set: { kyc: kyc } },
        { new: true }
      );
    })
    .then(user => {
      res.send(user);
    })
    .catch(error => {
      next(error);
    });
}

function getUserKYC(req, res, next) {
  User.findOne({ hash: req.params.hash })
    .then(response => {
      res.send(response);
    })
    .catch(error => {
      next(error);
    });
}

function reviewKYC(req, res, next) {
  /**
   * status 2 : approved
   * status 3 : declined
   */
  let status = req.body.approve ? 3 : 2;

  User.findOneAndUpdate(
    { hash: req.params.hash },
    { $set: { 'kyc.status': status, 'kyc.reviewdBy': req.user.username } },
    { new: true }
  )
    .exec()
    .then(user => {
      res.send(user);
    })
    .catch(error => {
      next(error);
    });
}

function vote(req, res, next) {
  // vote +1 or -1
  let vote = req.body.vote;

  User.findOne({ hash: req.params.hash })
    .then(user => {
      let updated = {};
      updated['reputation.positive'] =
        vote > 0 ? user.reputation.positive + 1 : user.reputation.positive;
      updated['reputation.negative'] =
        vote < 0 ? user.reputation.negative + 1 : user.reputation.negative;

      return User.findOneAndUpdate(
        { hash: req.params.hash },
        { $set: updated },
        { new: true }
      );
    })
    .then(user => {
      res.send(user);
    })
    .catch(error => {
      next(error);
    });
}

module.exports = router;
