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

const Blockchain = require("./blockchain");
const Organisation = require("../models/organisation");
const Transaction = require("../models/transaction");
const Media = require("../models/media");
const hash = require("./hash");
const db = require("./db");

const ETH = Math.pow(10, 18);
const _balance = 100;

db.connect();

/**
 * gets organisations from the Database
 * and creates new wallets for them.
 * Empties transactions and photos.
 */
async function reinitializeWallets(initialBalance, specificOrganisation) {
  let balance = !!initialBalance ? initialBalance : 100;

  let getOrgQuery = {};
  let deletePhotoQuery = {};
  let deleteTransactionQuery = {};

  if (!!specificOrganisation) {
    getOrgQuery = { name: specificOrganisation };
    deletePhotoQuery = { owner: hash(specificOrganisation) };
    deleteTransactionQuery = { userHash: hash(specificOrganisation) };
  }

  try {
    const organisations = await Organisation.find(getOrgQuery);
    console.log("WALLETS TO BE UPDATED", organisations.length);

    for (let i = 0; i < organisations.length; i++) {
      const org = organisations[i];

      const wallet = await Blockchain.createWallet(Blockchain.createMnemonic());
      console.log("\x1b[36m%s\x1b[0m", "wallet created", wallet.address);
      const transaction = await Blockchain.transferTokensFromContract(
        wallet.address,
        balance
      );
      console.log("\x1b[36m%s\x1b[0m", "transaction sent");
      org.walletAddress = wallet.address;
      org.mnemonic = wallet.mnemonic;
      console.log("\x1b[36m%s\x1b[0m", org.name, org.walletAddress);
      await org.save();
    }

    await Media.remove(deletePhotoQuery);
    console.log("Removed all photos from DB.");

    await Transaction.remove(deleteTransactionQuery);
    console.log("Removed all transactions from DB.");
    process.exit();
  } catch (ex) {
    console.log("ERROR", ex);
    process.exit();
  }
}

async function runScript() {
  console.log("Balance of new wallets:", _balance);
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
