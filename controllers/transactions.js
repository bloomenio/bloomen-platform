const express = require("express");
const router = express.Router();
const Transaction = require("../models/transaction");
const Blockchain = require("../helpers/blockchain");
const hash = require("../helpers/hash");
const PAGE_SIZE = 10;

/**
 * Get all transactions
 * @route GET /transactions
 * @group transactions - Operations about transactions
 * @param {string} before.query - Optional - used for pagination. Gets all transactions with createdAtUTC before given timestamp
 * @returns {Array<Transaction>} 200 - An array of transactions
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/", getTransactions);

/**
 * Get all transactions for photo
 * @route GET /transactions/photo/{hash}
 * @group transactions - Operations about transactions
 * @param {string} hash.path.required - Unique hash of the photo
 * @param {string} before.query - Optional - used for pagination. Gets all transactions with createdAtUTC before given timestamp
 * @returns {Array<Transaction>} 200 - An array of transactions
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/photo/:hash", getPhotoTransactions);

/**
 * Get all transactions for photo
 * @route GET /transactions/me
 * @group transactions - Operations about transactions
 * @group me - Logged in user functions
 * @param {string} before.query - Optional - used for pagination. Gets all transactions with createdAtUTC before given timestamp
 * @returns {Array<Transaction>} 200 - An array of transactions
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/me", getUserTransactions);

/**
 * Check transaction status in the blockchain
 * @route GET /transactions/check
 * @group transactions - Operations about transactions
 * @param {string} before.transaction.required - Transaction hash to check
 * @returns {object} 200 - Transaction status object
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Unexpected
 * @security JWT
 */
router.get("/check", checkTransactionStatus);

/**
 * FUNCTIONS IMPLEMENTATION
 */

function getTransactions(req, res, next) {
  const before = req.query.before ? new Date(req.query.before) : new Date();

  Transaction.find({
    createdAtUTC: { $lt: before }
  })
    .populate("user")
    .populate("photo")
    .limit(PAGE_SIZE)
    .sort({ createdAtUTC: -1 })
    .then(response => {
      res.send(response);
    })
    .catch(next);
}

// FIXME: replace with ethers.js method
function checkTransactionStatus(req, res, next) {
  // const web3 = Blockchain.getWeb3();
  // const transaction = req.query.transaction;

  // web3.eth.getTransactionReceipt(transaction).then(response => {
  //   if (!!response) {
  //     res.send({
  //       completed: true,
  //       transaction: response
  //     });
  //   } else {
  //     res.send({
  //       completed: false,
  //       transaction: response
  //     });
  //   }
  // });

  res.send({
    completed: true,
    transaction: { tx: req.query.transaction }
  });
}

function getPhotoTransactions(req, res, next) {
  const before = req.query.before ? new Date(req.query.before) : new Date();

  Transaction.find({
    mediaHash: req.params.hash,
    createdAtUTC: { $lt: before }
  })
    .populate("user")
    .limit(PAGE_SIZE)
    .sort({ createdAtUTC: -1 })
    .then(response => {
      res.send(response);
    })
    .catch(next);
}

function getUserTransactions(req, res, next) {
  const before = req.query.before ? new Date(req.query.before) : new Date();

  Transaction.find({
    $or: [{ userHash: req.user.hash }, { receiverHash: req.user.hash }],
    createdAtUTC: { $lt: before }
  })
    .populate("user")
    .populate("receiver")
    .populate("photo")
    .limit(PAGE_SIZE)
    .sort({ createdAtUTC: -1 })
    .then(response => {
      res.send(response);
    })
    .catch(next);
}

module.exports = router;
