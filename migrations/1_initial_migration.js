const Migrations = artifacts.require("./Migrations.sol");
const Blockchain = require("../helpers/blockchain");

module.exports = function(deployer, network) {
  Blockchain.unlockMainAccount(network);
  deployer.deploy(Migrations);
};
