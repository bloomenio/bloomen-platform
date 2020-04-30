/*
 * NB: since truffle-hdwallet-provider 0.0.5 you must wrap HDWallet providers in a
 * function when declaring them. Failure to do so will cause commands to hang. ex:
 * ```
 * mainnet: {
 *     provider: function() {
 *       return new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/<infura-key>')
 *     },
 *     network_id: '1',
 *     gas: 4500000,
 *     gasPrice: 10000000000,
 *   },
 */
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ganache = require('ganache-cli');
require('dotenv').config();

const mnemonic = process.env.MNEMONIC;
console.log(mnemonic);
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      provider: () => new HDWalletProvider(mnemonic, 'http://127.0.0.1:8545'),
      network_id: '*'
    },
    // development: {
    //   network_id: '*',
    //   host: '127.0.0.1',
    //   port: 8545,
    //   gas: 0xffffff,
    //   gasPrice: 0,
    //   from: '0x527ef00666deb1772f9b165e385ca04e40147426'
    // },
    alastria: {
      provider: () =>
        new HDWalletProvider(mnemonic, 'https://0x.bloomen.io/rpc/telsius/atc'),
      network_id: '*', // Match Alastria network id
      gasPrice: 0,
      type: 'quorum'
    }
  }
};
