const express = require('express');
const Organisation = require('../models/organisation');
const User = require('../models/user');
const hash = require('../helpers/hash');
const Wallet = require('../helpers/wallet');
const router = express.Router();
require('dotenv').config();

/**
 * register new organisation
 */
router.post('/', createOrganisation);

/**
 * Get organisation with wallet balance
 * @route GET /organisations/{organisation}
 * @group organisations - Operations about organisations
 * @param {string} organisation.path.required - Organisation name
 * @returns {OrganisationDTO.model} 200 - Organisation info with balance
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 404 - Organisation not found
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get('/:organisation', getOrganisation);

/**
 * FUNCTIONS IMPLEMENTATION
 */
// TODO: check this out, make swagger
async function createOrganisation(req, res, next) {
  const ETH = Math.pow(10, 18);

  console.log(req.body);

  Organisation.findOne({ name: req.body.organisation })
    .then(org => {
      if (!!org) {
        throw { status: 409, error: 'Organisation name already exists.' };
      }
      return true;
    })
    .then(async bool => {
      let organisation = new Organisation();
      organisation.name = req.body.organisation;
      organisation.hash = hash(req.body.organisation);

      const wallet = await Wallet.createWallet(organisation.hash, 100 * ETH);
      organisation.walletAddress = wallet;
      console.log('org', organisation);
      return organisation.save();
    })
    .then(organisation => {
      let user = new User();
      user.username = req.body.username;
      user.hash = hash(req.body.username);
      user.email = req.body.email;
      user.password = hash(req.body.password);
      user.settings = req.body.settings || { attribution: true };
      user.role = 'publisher';
      user.organisation = organisation.name;
      user.reputation = { positive: 0, negative: 0 };
      user.reviewedBy = '';
      user.createdAtUTC = new Date();
      return user.save();
    })
    .then(response => {
      res.send(response);
    })
    .catch(next);
}

async function getOrganisation(req, res, next) {
  Organisation.findOne({ name: req.params.organisation })
    .then(async org => {
      if (!org) {
        throw { status: 404, error: 'Organisation not found' };
      }

      const balance = await Wallet.getTokenBalance(org.walletAddress);
      const orgInfo = JSON.parse(JSON.stringify(org));
      orgInfo.balance = balance;
      res.send(orgInfo);
    })
    .catch(next);
}

module.exports = router;
