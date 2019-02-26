const Web3 = require("web3");
const Blockchain = require("../helpers/blockchain");
const config = require("../config.json");
require("dotenv").config();

// QUORUM
const provider = "http://squall-3.atc.gr:8546";
const account = config.quorum.address;
const passphrase = config.quorum.passphrase;

// GANACHE
// const provider = "http://localhost:8545";
// const account_local = config.ganache.address;
// const privatekey_local = config.ganache.privatekey;

const web3 = new Web3(new Web3.providers.HttpProvider(provider));

let sendTransaction = function(from, _passphrase, to, value) {
  getBalance(from);
  web3.eth.personal
    .unlockAccount(from, _passphrase, 15000)
    .then(res => {
      console.log("RES", res);

      web3.eth
        .sendTransaction({
          from: from,
          to: to,
          value: value,
          gas: 21000
        })
        .on("error", function(err) {
          throw err;
        })
        .on("transactionHash", function(transactionHash) {
          console.log("transactionHash", transactionHash);
        })
        .on("receipt", function(receipt) {
          console.log("receipt", receipt);
          getBalance(from);
        })
        .on("confirmation", function(confirmationNumber, receipt) {
          console.log("confirmation", confirmationNumber, receipt);
        });
    })
    .catch(err => {
      console.log("ERROR", err);
    });
};

let getBalance = function(account) {
  web3.eth
    .getBalance(account)
    .then(balance => {
      console.log("WALLET", account);
      console.log("BALANCE", web3.utils.fromWei(String(balance)));
    })
    .catch(err => {
      console.log("ERROR", err);
    });
};

let createWallet = async function(password) {
  let wallet = await web3.eth.personal.newAccount(String(password));
  getBalance(wallet);
};

// createWallet("random");

let sendGanacheTransaction = function(to, balance) {
  web3.eth
    .sendTransaction({
      from: account_local,
      to: to,
      value: balance,
      gas: 21000
    })
    .on("error", function(err) {
      throw err;
    })
    .on("transactionHash", function(transactionHash) {
      console.log("transactionHash", transactionHash);
    })
    .on("receipt", function(receipt) {
      console.log("receipt", receipt);
      getBalance(to);
    })
    .on("confirmation", function(confirmationNumber, receipt) {
      console.log("confirmation", confirmationNumber, receipt);
    });
};

function createAccount(passphrase) {
  web3.eth.personal
    .newAccount(passphrase)
    .then(account => {
      console.log(account);

      return web3.eth.personal.unlockAccount(account, passphrase, 600);
    })
    .then(account => {
      console.log("UNLOCKED", account);
    });
  //
}

const account_user = "0x0E69741a85783A1F59884Fc2eAa645378A1F76f6";
// sendGanacheTransaction(
//   "0xacBDE856510A34A30f30787D43dba4786192E9ad",
//   Math.pow(10, 18)
// );

// getBalance(account_local);

// sendTransaction(account_local, "", account_user, Math.pow(10, 18));

// getBalance(account_user);

// createAccount("bloomen");
getBalance("0xD7bd252e3Ada0D1561f66Fd371e9B50a443C06fC");
