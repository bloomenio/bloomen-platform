const express = require('express');
const Photo = require('../models/photo');
const User = require('../models/user');
const Organisation = require('../models/organisation');
const hash = require('../helpers/hash');
const router = express.Router();

/**
 * Logged in user (with KYC info)
 * @route GET /me
 * @group me - Logged in user functions
 * @returns {User.model} 200 - Logged in user
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/', getUser);

/**
 * Update user profile
 * @route PUT /me
 * @group me - Logged in user functions
 * @param {UpdateUserDTO.model}  data.body.required - Updated user info
 * @returns {User.model} 200 - Updated user
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.put('/', updateUser);

/**
 * Update user password
 * @route PUT /me/password
 * @group me - Logged in user functions
 * @param {ChangePasswordDTO.model}  data.body.required - Old and new password
 * @returns {MessageDTO.model} 200 - Success message
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.put('/password', changePassword);

/**
 * Photos where user has rights, or is owner of
 * @route GET /me/photos
 * @group me - Logged in user functions
 * @returns {Array<Photo>} 200 - Array of photos
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/photos', getPhotos);

/**
 * Returns user's organisation
 * @route GET /me/organisation
 * @group me - Logged in user functions
 * @returns {Organisation.model} 200 - User's organisation
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/organisation', getOrganisation);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function getUser(req, res, next) {
  User.findOne({ hash: hash(req.user.username) })
    .populate('org')
    .then(user => {
      return res.send(user);
    })
    .catch(next);
}

function updateUser(req, res, next) {
  let profile = {};
  profile.email = req.body.email || req.user.email;
  profile.settings = req.body.settings || req.user.settings;
  profile.organisation = req.body.organisation || req.user.organisation;
  User.findOneAndUpdate({ hash: hash(req.user.username) }, profile, {
    new: true
  })
    .then(user => {
      res.send(user);
    })
    .catch(error => {
      next(error);
    });
}

function changePassword(req, res, next) {
  User.findOne({ hash: req.user.hash, password: hash(req.body.oldPassword) })
    .select('+password')
    .then(user => {
      if (user === null) {
        throw {
          status: 404,
          error: 'Credentials incorrect. Check old password.'
        };
      }

      return User.findOneAndUpdate(
        { hash: req.user.hash },
        { password: hash(req.body.newPassword) }
      );
    })
    .then(user => {
      res.send({ message: 'Password updated successfully' });
    })
    .catch(error => {
      next(error);
    });
}

function getPhotos(req, res, next) {
  let orgHash = hash(req.user.organisation);

  Photo.find({ $or: [{ owner: orgHash }, { rights: orgHash }] })
    .populate('ownerUser')
    .populate({ path: 'transactions', options: { sort: { createdAtUTC: -1 } } })
    .populate({
      path: 'myTransaction',
      match: { userHash: req.user.hash },
      select: 'createdAtUTC'
    })
    .sort({ createdAtUTC: -1 })
    .then(function(response) {
      res.send(response);
    })
    .catch(function(error) {
      next(error);
    });
}

function getOrganisation(req, res, next) {
  Organisation.findOne({ name: req.user.organisation })
    .then(organisation => {
      return res.send(organisation);
    })
    .catch(next);
}

module.exports = router;
