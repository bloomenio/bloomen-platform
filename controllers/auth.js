const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ObjectId = require('mongoose').Types.ObjectId;
const Organisation = require('../models/organisation');
const Invitation = require('../models/invitation');
const hash = require('../helpers/hash');
const Wallet = require('../helpers/wallet');
const mailer = require('../helpers/mailer');
const router = express.Router();
require('dotenv').config();

/**
 * User login, returns JWT token.
 * @route POST /auth/login
 * @group authentication - User authentication
 * @param {LoginDTO.model} credentials.body.required - Login info
 * @returns {JwtDTO.model} 200 - JWT token
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 */
router.post('/login', loginUser);

/**
 * User registration, returns JWT token.
 * @route POST /auth/register
 * @group authentication - User authentication
 * @param {RegisterDTO.model} data.body.required - Register info
 * @returns {JwtDTO.model} 200 - JWT token
 * @returns {Error} 400 - Invalid Invitation
 * @returns {Error} 500 - Unexpected
 */
router.post('/register', registrerUser);

/**
 * Forgot password, resets password and sends email to user to reset it.
 * @route POST /auth/forgot
 * @group authentication - User authentication
 * @param {ForgotDTO.model} body.body.required - User email
 * @returns {MessageDTO.model} 200 - Response message
 * @returns {Error} 404 - User not found
 * @returns {Error} 500 - Unexpected
 */
router.post('/forgot', forgotPassword);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function loginUser(req, res, next) {
  const username = req.body.username;
  const password = hash(req.body.password);

  User.findOne({
    username: username,
    password: password
  })
    .then(user => {
      if (user) {
        const token = jwt.sign({ user: user }, process.env.JWT_SECRET);
        res.send({ token: token });
      } else {
        throw { status: 401, error: 'Wrong credentials' };
      }
    })
    .catch(err => {
      next(err);
    });
}

/**
 * used to get organisation for user registration
 */
async function getOrganisation(req) {
  if (req.body.invitation) {
    return Invitation.findOne({ _id: req.body.invitation })
      .then(inv => {
        return { organisation: inv.organisation, isNew: false };
      })
      .catch(err => {
        throw { status: 400, error: err };
      });
  } else {
    return { organisation: req.body.username, isNew: true };
  }
}

async function registrerUser(req, res, next) {
  const ETH = Math.pow(10, 18);

  // check if invitation id is valid ObjectId;
  if (req.body.invitation) {
    try {
      if (!ObjectId.isValid(req.body.invitation)) {
        throw { status: 400, error: 'Invitation not valid.' };
      }
    } catch (error) {
      next(error);
    }
  }

  // if invitation is not set, set username as organisation
  const organisationInfo = await getOrganisation(req);

  const organisation = organisationInfo.organisation;
  const organisationIsNew = organisationInfo.isNew;
  let role = 'photographer';

  let orgData = {
    name: organisation,
    hash: hash(organisation)
  };

  // if organisation is new, create a wallet
  if (organisationIsNew) {
    const wallet = await Wallet.createWallet(hash(organisation), 0 * ETH);
    orgData.walletAddress = wallet;
    role = 'photographer';
  } else {
    role = 'publisher';
  }

  //create organisation if it does not exist
  Organisation.findOneAndUpdate({ name: organisation }, orgData, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  }).catch(console.warn);

  const user = new User();

  user.username = req.body.username;
  user.hash = hash(req.body.username);
  user.email = req.body.email;
  user.password = hash(req.body.password);
  user.settings = req.body.settings || { attribution: true };
  user.role = role;
  user.organisation = organisation;
  user.reputation = { positive: 0, negative: 0 };
  user.reviewedBy = '';
  user.createdAtUTC = new Date();

  user
    .save()
    .then(user => {
      // fetch user from db to hide private fields
      return User.findOne({ username: user.username });
    })
    .then(safeUser => {
      const token = jwt.sign({ user: safeUser }, process.env.JWT_SECRET);

      //set invitation as "accepted" and pass user object
      Invitation.findOneAndUpdate(
        { _id: req.body.invitation },
        { accepted: true, user: safeUser },
        {
          upsert: true,
          setDefaultsOnInsert: true
        }
      ).catch(console.warn);

      res.send({ token: token });
    })
    .catch(err => {
      next(err);
    });
}

function forgotPassword(req, res, next) {
  let password;
  User.findOne({ email: req.body.email })
    .select('+password')
    .then(user => {
      if (user === null) {
        throw {
          status: 404,
          error: 'User with given email not found in database.'
        };
      }

      // create new password
      password = hash(user.password);
      return User.findOneAndUpdate(
        { email: req.body.email },
        { password: hash(password) }
      );
    })
    .then(user => {
      const text =
        'Your new password is ' +
        password +
        '. You should change it from your profile page as soon as you log in.';
      return mailer.sendEmail(user.email, 'Reset Password', text, text);
    })
    .then(response => {
      res.send({ message: 'Email sent.' });
    })
    .catch(error => {
      next(error);
    });
}

module.exports = router;
