const PRM = artifacts.require("./PRM.sol");

module.exports = function(deployer, network) {
  deployer.deploy(PRM);
};
