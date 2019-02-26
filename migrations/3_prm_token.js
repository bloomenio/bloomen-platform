const PRMToken = artifacts.require("./PRMToken.sol");
const PRM = artifacts.require("./PRM.sol");
const Blockchain = require("../helpers/blockchain");

module.exports = function(deployer, network) {
  deployer.deploy(PRMToken).then(async () => {
    const tokenInstance = await PRMToken.deployed();
    const contractInstance = await PRM.deployed();

    // console.log(contractInstance.constructor.web3.currentProvider);

    // save network config to memory
    Blockchain.setName(network);
    Blockchain.setContractInstance(contractInstance);
    Blockchain.setTokenInstance(tokenInstance);

    // save network config to filesystem
    Blockchain.saveToFile();

    // set PRM token address in Smart Contract and vice versa
    // to make all transactions with the token
    await contractInstance.setPRMTokenAddress(tokenInstance.address);
    await tokenInstance.setPRMAddress(contractInstance.address);
  });
};
