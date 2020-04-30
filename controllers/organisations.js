const express = require("express");
const Organisation = require("../models/organisation");
const user = require("../middlewares/user");
const User = require("../models/user");
const hash = require("../helpers/hash");
const Blockchain = require("../helpers/blockchain");
const router = express.Router();
require("dotenv").config();

/**
 * register new organisation
 */
router.post("/", user.update, createOrganisation);

/**
 * Get all organisations
 * @route GET /organisations
 * @group organisations - Operations about organisations
 * @returns {Array<Organisation>} 200 - Organisation info with balance
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 404 - Organisation not found
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/", getOrganisations);

/**
 * Get list of groups
 * @route GET /organisations/groups
 * @group organisations - Operations about organisations
 * @returns {Array<string>} 200 - All groups
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/groups", user.update, listAllGroups);

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
router.get("/:organisation", getOrganisation);

/**
 * Update organisation
 * @route PUT /organisations/{organisation}
 * @group organisations - Operations about organisations
 * @param {string} organisation.path.required - Organisation name
 * @param {Organisation.model} organisation.body.required - Updated organisation object
 * @returns {Organisation.model} 200 - Organisation info with balance
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 404 - Organisation not found
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.put("/:organisation", user.update, updateOrganisation);

/**
 * FUNCTIONS IMPLEMENTATION
 */
// TODO: check this out, make swagger
async function createOrganisation(req, res, next) {
  const ETH = Math.pow(10, 18);
  const startingBalance = 10000 * ETH;

  Organisation.findOne({ name: req.body.organisation })
    .then(org => {
      if (!!org) {
        throw { status: 409, error: "Organisation name already exists." };
      }
      return true;
    })
    .then(async bool => {
      let organisation = new Organisation();
      organisation.name = req.body.organisation;
      organisation.group = req.body.group;
      organisation.hash = hash(req.body.organisation);

      const wallet = await Blockchain.createWallet(Blockchain.createMnemonic());
      await Blockchain.transferTokensFromContract(
        wallet.address,
        startingBalance
      );
      organisation.walletAddress = wallet.address;
      organisation.mnemonic = wallet.mnemonic;
      return organisation.save();
    })
    // .then(organisation => {
    //   let user = new User();
    //   user.username = req.body.username;
    //   user.hash = hash(req.body.username);
    //   user.email = req.body.email;
    //   user.password = hash(req.body.password);
    //   user.settings = req.body.settings || { attribution: true };
    //   user.role = ['publisher'];
    //   user.organisation = organisation.name;
    //   user.reputation = { positive: 0, negative: 0 };
    //   user.reviewedBy = '';
    //   user.createdAtUTC = new Date();
    //   return user.save();
    // })
    .then(response => {
      res.send(response);
    })
    .catch(next);
}

async function getOrganisation(req, res, next) {
  Organisation.findOne({ name: req.params.organisation })
    .then(async org => {
      if (!org) {
        throw { status: 404, error: "Organisation not found" };
      }

      let balance = 0;
      try {
        balance = await Blockchain.getTokenBalance(org.walletAddress);
      } catch (e) {
        console.log("WALLET EXCEPTIONS", e);
      }

      const orgInfo = JSON.parse(JSON.stringify(org));
      orgInfo.balance = balance;
      res.send(orgInfo);
    })
    .catch(next);
}

function getOrganisations(req, res, next) {
  Organisation.find({})
    .then(orgs => res.send(orgs))
    .catch(next);
}

function updateOrganisation(req, res, next) {
  let updated = req.body;
  delete updated._id;

  Organisation.findOne({ name: req.params.organisation })
    .then(organisation => {
      Object.keys(updated).forEach(key => {
        organisation[key] = updated[key];
      });
      return organisation.save();
    })
    .then(organisation => {
      res.send(organisation);
    })
    .catch(error => {
      next(error);
    });
}

function listAllGroups(req, res, next) {
  Organisation.find({})
    .then(orgs => {
      const groups = orgs.filter(org => !!org.group).map(org => org.group);
      res.send(groups);
    })
    .catch(next);
}

module.exports = router;
