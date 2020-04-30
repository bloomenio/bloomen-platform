require("dotenv").config();
const {
  Wallet,
  Contract,
  utils,
  providers: { JsonRpcProvider }
} = require("ethers");
const fs = require("fs");

const PROVIDER_URL = "https://0x.bloomen.io/rpc/telsius/atc";
const TOKEN_FILE = "./build/contracts/PRMToken.json";
const CONTRACT_FILE = "./build/contracts/PRM.json";

const TokenArtifacts = JSON.parse(fs.readFileSync(TOKEN_FILE, "UTF-8"));
const ContractArtifacts = JSON.parse(fs.readFileSync(CONTRACT_FILE, "UTF-8"));

const TOKEN_ABI = TokenArtifacts.abi;
const TOKEN_ADDRESS = TokenArtifacts.networks[process.env.NETWORK_ID].address;

const CONTRACT_ABI = ContractArtifacts.abi;
const CONTRACT_ADDRESS =
  ContractArtifacts.networks[process.env.NETWORK_ID].address;

const BLOOMEN_PROVIDER = new JsonRpcProvider(PROVIDER_URL);
const CREATOR_WALLET = Wallet.fromMnemonic(process.env.MNEMONIC).connect(
  BLOOMEN_PROVIDER
);
const contractInstance = new Contract(
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  BLOOMEN_PROVIDER
);
const tokenInstance = new Contract(TOKEN_ADDRESS, TOKEN_ABI, BLOOMEN_PROVIDER);

// Generates random mnemonic
function createMnemonic() {
  return utils.HDNode.entropyToMnemonic(utils.randomBytes(16));
}

// Creates wallet from mnemonic
function createWallet(mnemonic) {
  return Wallet.fromMnemonic(mnemonic).connect(BLOOMEN_PROVIDER);
}

// Transfers Tokens from contract creator
async function transferTokensFromContract(toAddress, amount) {
  return transferTokens(CREATOR_WALLET, toAddress, amount);
}

// Gets Balance
async function getTokenBalance(address) {
  return (await tokenInstance.balanceOf(address)).toString();
}

// Transfers Tokens
async function transferTokens(fromWallet, toAddress, tokenAmount) {
  const listener = eventToListener(tokenInstance, "Transfer");

  const tx = await tokenInstance
    .connect(fromWallet)
    ["transfer(address,uint256)"](toAddress, tokenAmount);

  // Waiting for mining
  await tx.wait();

  // Waiting for event
  const [from, to, amount] = await listener;

  console.log("\nTransfer Completed:");
  console.log("- from: ", from);
  console.log("- to: ", to);
  console.log("- amount: ", amount.toString());

  console.log("\nVerifying...");
  console.log(
    "Was balance updated: ",
    (await getTokenBalance(to)) === amount.toString()
  );

  return tx;
}

function transferTokensMnemonic(mnemonic, to, amount) {
  const from_wallet = Wallet.fromMnemonic(mnemonic).connect(BLOOMEN_PROVIDER);
  return transferTokens(from_wallet, to, amount);
}

async function uploadPhoto(organisationMnemonic, price) {
  const listener = eventToListener(contractInstance, "PhotoUpload");

  console.log("1");
  // Here, the first parameter indicates sale type (sale = 1, resale = 2, auction > 2) and the boolean whether to accept tokens or ETH for this sale, with true meaning "ACCEPT TOKENS"
  const tx = await contractInstance
    .connect(createWallet(organisationMnemonic))
    .photoUpload(2, price, true);

  console.log("2");

  await tx.wait();

  console.log("3");

  // Get our values
  const [from, photo_id] = await listener;

  console.log("\nPhoto Upload Completed:");
  console.log("- from: ", from);
  console.log("- photo_id: ", photo_id.toString());
  console.log("\nVerifying...");
  console.log(
    "Photo Info (Raw, in sequence: photo.photoPrice, photo.photoTokenPrice, photo.expiryDate, photo.saleType, photo.owner, photo.lastBidder): ",
    await contractInstance.getPhotoInfo(photo_id.toString())
  );

  return { photo_id: photo_id, transaction_hash: tx.hash };
}

// .purchaseUsageRight(photoId, price)
async function purchasePhoto(organisationMnemonic, photoId, price) {
  const listener = eventToListener(contractInstance, "PhotoRelease");

  // Here, the first parameter indicates sale type (sale = 1, resale = 2, auction > 2) and the boolean whether to accept tokens or ETH for this sale, with true meaning "ACCEPT TOKENS"
  const tx = await contractInstance
    .connect(createWallet(organisationMnemonic))
    .purchaseUsageRight(photoId, price);

  await tx.wait();

  // Get our values
  const [from, photo_id] = await listener;

  console.log("\nPhoto Upload Completed:");
  console.log("- from: ", from);
  console.log("- photo_id: ", photo_id.toString());
  console.log("\nVerifying...");
  console.log(
    "Photo Info (Raw, in sequence: photo.photoPrice, photo.photoTokenPrice, photo.expiryDate, photo.saleType, photo.owner, photo.lastBidder): ",
    await contractInstance.getPhotoInfo(photo_id.toString())
  );

  return { photo_id: photo_id, transaction_hash: tx.hash };
}

// UTILITIES
function eventToListener(contract, event, timeout = undefined) {
  return new Promise((resolve, reject) => {
    if (timeout)
      setTimeout(() => {
        resolve = () => {};
        reject("Timeout");
      }, timeout);

    contract.on(event, function() {
      reject = () => {};
      resolve(arguments);
    });
  });
}

module.exports = {
  createMnemonic,
  createWallet,
  getTokenBalance,
  transferTokensFromContract,
  transferTokensMnemonic,
  uploadPhoto,
  purchasePhoto
};
