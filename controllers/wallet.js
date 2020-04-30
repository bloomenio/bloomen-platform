const express = require("express");
const Blockchain = require("../helpers/blockchain");
const hash = require("../helpers/hash");
const User = require("../models/user");
const Organisation = require("../models/organisation");
const request = require("request");
const sharp = require("sharp");
const sizeOf = require("buffer-image-size");
const router = express.Router();
const { Wallet } = require("ethers");

const config = require("../config.json");
// const bloomen_account = config[Blockchain.getName()].address;
// const bloomen_passphrase = config[Blockchain.getName()].passphrase || '';

/**
 * Send funds to another user
 * @route GET /wallet/send
 * @group wallet - Wallet functions
 * @param {SendTokensDTO.model} data.body.required - Transaction info
 * @returns {User} 200 - Blockchain response
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post("/send", sendTokens);

/**
 * Create new mnemonic wallet
 * @route GET /wallet/mnemonic
 * @group wallet - Wallet functions
 * @returns {Object} 200 - Newly created wallet
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/mnemonic", createMnemonicWallet);

/**
 * Create new mnemonic wallet
 * @route POST /wallet/mnemonic/retrieve
 * @group wallet - Wallet functions
 * @param {MnemonicDTO.model} mnemonic.body.required - Mnemonic
 * @returns {Object} 200 - Retrieved wallet
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.post("/mnemonic/retrieve", retrieveMnemonicWallet);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function sendTokens(req, res, next) {
  const to = req.body.address;
  const amount = req.body.amount;

  Organisation.findOne({ name: req.user.organisation })
    .then(organisation => {
      console.log("organisation", organisation);
      return Blockchain.transferTokensMnemonic(
        organisation.mnemonic,
        to,
        amount
      );
    })
    .then(function(response) {
      res.send(response);
    })
    .catch(function(error) {
      console.warn(error);
      res.status(500).send(error);
    });
}

async function createMnemonicWallet(req, res, next) {
  res.send(await Blockchain.createWallet(Blockchain.createMnemonic()));
}

async function retrieveMnemonicWallet(req, res, next) {
  res.send(await Blockchain.createWallet(req.body.mnemonic));
}

module.exports = router;
