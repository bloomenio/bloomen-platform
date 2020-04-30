const mongoose = require("mongoose");
const db = require("../helpers/db");

const Schema = mongoose.Schema;

const orgSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    hash: { type: String, unique: true, required: true },
    mnemonic: { type: String, required: true },
    walletAddress: { type: Object, default: "", required: true },
    group: { type: String, unique: false, required: false }
  },
  { minimize: false }
);

db.errorHandler(orgSchema);

/**
 * @typedef Organisation
 * @property {string} name.required - Organisation name
 * @property {string} hash.required - Organisation hash
 * @property {object} walletAddress.required - Wallet address of the organisation
 * @property {string} group - Organisation belongs to this group
 */
const Organisation = mongoose.model("Organisation", orgSchema, "organisations");

module.exports = Organisation;
