const Blockchain = require('../helpers/blockchain');
const config = require('../config.json');

const web3 = Blockchain.getWeb3();
const tokenInstance = Blockchain.getTokenInstance();

const bloomen_account = config[Blockchain.getName()].address;
const bloomen_passphrase = config[Blockchain.getName()].passphrase || '';

let sendInitialTransaction = function(new_account, balance) {
  return new Promise((resolve, reject) => {
    web3.eth.personal
      .unlockAccount(bloomen_account, bloomen_passphrase, 15000)
      .then(res => {
        sendToken(bloomen_account, new_account, balance).then(txHash => {
          resolve(txHash);
        });
      })
      .catch(err => {
        console.log('\x1b[36m%s\x1b[0m', 'ERROR', err);
        reject(err);
      });
  });
};

let createWallet = async function(password, balance) {
  let wallet = await web3.eth.personal.newAccount(String(password));

  if (balance > 0) {
    return sendInitialTransaction(wallet, balance)
      .then(receipt => {
        return wallet;
      })
      .catch(err => {
        return wallet;
      });
  } else {
    return wallet;
  }
};

let getBalance = async function(account) {
  return web3.eth.getBalance(account);
};

let getTokenBalance = async function(account) {
  return tokenInstance.methods
    .balanceOf(account)
    .call({ from: tokenInstance.options.address });
};

let sendToken = async function(from, to, amount) {
  return new Promise((resolve, reject) => {
    tokenInstance.methods
      .transfer(to, amount)
      .send({ from: from })
      .on('error', function(err) {
        reject(err);
      })
      .on('transactionHash', function(transactionHash) {
        console.log(
          '\x1b[35m%s\x1b[0m',
          'Token Transaction sent.',
          transactionHash
        );
      })
      .on('receipt', function(receipt) {
        console.log(
          '\x1b[35m%s\x1b[0m',
          'Receipt received (block number):',
          receipt.blockNumber
        );
        resolve(receipt.transactionHash);
      });
  });
};

module.exports = {
  createWallet: createWallet,
  getBalance: getBalance,
  getTokenBalance: getTokenBalance
};
