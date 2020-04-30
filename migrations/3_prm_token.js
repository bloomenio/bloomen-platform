const PRMToken = artifacts.require("./PRMToken.sol");
const PRM = artifacts.require("./PRM.sol");
module.exports = function(deployer, network) {
  deployer.deploy(PRMToken).then(async () => {
    const tokenInstance = await PRMToken.deployed();
    const contractInstance = await PRM.deployed();

    // set PRM token address in Smart Contract and vice versa
    // to make all transactions with the token
    await contractInstance.setPRMTokenAddress(tokenInstance.address);
    await tokenInstance.setPRMAddress(contractInstance.address);
  });
};
