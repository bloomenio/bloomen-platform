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
var Web3 = require("web3");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      network_id: "*",
      host: "127.0.0.1",
      port: 8545,
      gas: 0xffffff,
      gasPrice: 0,
      from: "0x527ef00666deb1772f9b165e385ca04e40147426"
    },
    quorum: {
      // doesnt work for port 8546
      network_id: "*",
      host: "squall-3.atc.gr",
      port: 22000,
      gas: 0xffffff,
      gasPrice: 0,
      from: "0xfa2645c74efa3989878530df401410e61439b2c7"
    },
    cakeshop: {
      // doesnt work
      network_id: "*",
      host: "squall-6.atc.gr",
      port: 8546,
      gas: 0xffffff,
      gasPrice: 0,
      from: "0xfa2645c74efa3989878530df401410e61439b2c7"
    },
    alastria: {
      provider: () => {
        /* istanbul ignore next */
        Web3.providers.HttpProvider.prototype.sendAsync =
          Web3.providers.HttpProvider.prototype.send;

        /* istanbul ignore next */
        return new Web3.providers.HttpProvider(
          process.env.ALASTRIA
        );
      },
      network_id: "*",
      gasPrice: 0,
      gas: 4500000,
      from: "0x626ccee909a308f8908927b4537614dabbc88efc"
    }
  }
};
