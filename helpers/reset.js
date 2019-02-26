/**
 * ▓█████▄ ▓█████  ██▓███   ██▓     ▒█████ ▓██   ██▓ ███▄ ▄███▓▓█████  ███▄    █ ▄▄▄█████▓
 * ▒██▀ ██▌▓█   ▀ ▓██░  ██▒▓██▒    ▒██▒  ██▒▒██  ██▒▓██▒▀█▀ ██▒▓█   ▀  ██ ▀█   █ ▓  ██▒ ▓▒
 * ░██   █▌▒███   ▓██░ ██▓▒▒██░    ▒██░  ██▒ ▒██ ██░▓██    ▓██░▒███   ▓██  ▀█ ██▒▒ ▓██░ ▒░
 * ░▓█▄   ▌▒▓█  ▄ ▒██▄█▓▒ ▒▒██░    ▒██   ██░ ░ ▐██▓░▒██    ▒██ ▒▓█  ▄ ▓██▒  ▐▌██▒░ ▓██▓ ░
 * ░▒████▓ ░▒████▒▒██▒ ░  ░░██████▒░ ████▓▒░ ░ ██▒▓░▒██▒   ░██▒░▒████▒▒██░   ▓██░  ▒██▒ ░
 *  ▒▒▓  ▒ ░░ ▒░ ░▒▓▒░ ░  ░░ ▒░▓  ░░ ▒░▒░▒░   ██▒▒▒ ░ ▒░   ░  ░░░ ▒░ ░░ ▒░   ▒ ▒   ▒ ░░
 *  ░ ▒  ▒  ░ ░  ░░▒ ░     ░ ░ ▒  ░  ░ ▒ ▒░ ▓██ ░▒░ ░  ░      ░ ░ ░  ░░ ░░   ░ ▒░    ░
 *  ▄████▄   ▒█████   ███▄ ▄███▓ ███▄ ▄███▓ ▄▄▄       ███▄    █ ▓█████▄   ██████
 * ▒██▀ ▀█  ▒██▒  ██▒▓██▒▀█▀ ██▒▓██▒▀█▀ ██▒▒████▄     ██ ▀█   █ ▒██▀ ██▌▒██    ▒
 * ▒▓█    ▄ ▒██░  ██▒▓██    ▓██░▓██    ▓██░▒██  ▀█▄  ▓██  ▀█ ██▒░██   █▌░ ▓██▄
 * ▒▓▓▄ ▄██▒▒██   ██░▒██    ▒██ ▒██    ▒██ ░██▄▄▄▄██ ▓██▒  ▐▌██▒░▓█▄   ▌  ▒   ██▒
 * ▒ ▓███▀ ░░ ████▓▒░▒██▒   ░██▒▒██▒   ░██▒ ▓█   ▓██▒▒██░   ▓██░░▒████▓ ▒██████▒▒
 * ░ ░▒ ▒  ░░ ▒░▒░▒░ ░ ▒░   ░  ░░ ▒░   ░  ░ ▒▒   ▓▒█░░ ▒░   ▒ ▒  ▒▒▓  ▒ ▒ ▒▓▒ ▒ ░
 *   ░  ▒     ░ ▒ ▒░ ░  ░      ░░  ░      ░  ▒   ▒▒ ░░ ░░   ░ ▒░ ░ ▒  ▒ ░ ░▒  ░ ░
 * ░        ░ ░ ░ ▒  ░      ░   ░      ░     ░   ▒      ░   ░ ░  ░ ░  ░ ░  ░  ░
 * ░ ░          ░ ░         ░          ░         ░  ░         ░    ░          ░
 * ░                                                             ░
 *
 * Reset single organisation
 * > npm config set bloomen-photo:reset ATC
 *
 * Reset multiple organisations
 * > npm config set bloomen-photo:reset ATC,photographer
 *
 * Reset all organisations
 * > npm config set bloomen-photo:reset
 *
 */

const Wallet = require("./wallet");
const Organisation = require("../models/organisation");
const Transaction = require("../models/transaction");
const Photo = require("../models/photo");
const hash = require("./hash");
const db = require("./db");

const ETH = Math.pow(10, 18);
const _balance = 100 * ETH;

db.connect();

/**
 * gets organisations from the Database
 * and creates new wallets for them.
 * Empties transactions and photos.
 */
function reinitializeWallets(initialBalance, specificOrganisation) {
  let balance = !!initialBalance ? initialBalance : 100 * ETH;

  let getOrgQuery = {};
  let deletePhotoQuery = {};
  let deleteTransactionQuery = {};

  if (!!specificOrganisation) {
    getOrgQuery = { name: specificOrganisation };
    deletePhotoQuery = { owner: hash(specificOrganisation) };
    deleteTransactionQuery = { userHash: hash(specificOrganisation) };
  }

  Organisation.find(getOrgQuery)
    .then(organisations => {
      console.log("WALLETS TO BE UPDATED", organisations.length);
      return organisations.reduce((p, org) => {
        return p.then(async () => {
          console.log("\x1b[36m%s\x1b[0m", org.name, org.walletAddress);
          org.walletAddress = await Wallet.createWallet(org.hash, balance);
          return org.save();
        });
      }, Promise.resolve());
    })
    .then(async orgs => {
      console.log("WALLETS UPDATED");
      let last_balance = await Wallet.getTokenBalance(orgs.walletAddress);
      console.log("LAST BALANCE IS", last_balance);
      return Photo.remove(deletePhotoQuery);
    })
    .then(removed => {
      console.log("Removed all photos from DB.");
      return Transaction.remove(deleteTransactionQuery);
    })
    .then(removed => {
      console.log("Removed all transactions from DB.");
      process.exit();
    })
    .catch(process.exit);
}

async function runScript() {
  if (process.env.npm_package_config_reset) {
    let organisations = [];

    const orgsString =
      process.env.npm_package_config_reset !== String(true)
        ? process.env.npm_package_config_reset
        : null;

    if (orgsString) {
      organisations = orgsString.split(",");
      console.log("Resetting Organisations:", organisations);
      organisations.forEach(org => {
        reinitializeWallets(_balance, org);
      });
    } else {
      console.log("Resetting Organisations: All");
      reinitializeWallets(_balance, null);
    }
  } else {
    console.log("Resetting Organisations: All");
    reinitializeWallets(_balance, null);
  }
}

runScript();
