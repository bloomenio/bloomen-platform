const Web3 = require("web3");
const path = require("path");
const fs = require("fs");

const config = require("../config.json");
const truffle = require("../truffle-config");
const { Observable } = require("rxjs");

const CONTRACT_JSON_FILE = path.join(__dirname + "/../.contract.json");
let web3;

let mem = {
  token: {},
  contract: {},
  name: ""
};

function saveToFile() {
  fs.writeFile(CONTRACT_JSON_FILE, JSON.stringify(mem), "utf8", function() {});
}

function loadFromFile() {
  try {
    let fileData = fs.readFileSync(CONTRACT_JSON_FILE, "UTF-8");

    if (!!fileData && fileData.length > 0) {
      fileData = JSON.parse(fileData);
      mem = fileData;
    } else {
      throw {
        error: ".contract.json format error. blockchain.js:loadFromFile()"
      };
    }
  } catch (error) {
    console.warn(error);
    return null;
  }
}

function getName() {
  return mem.name;
}

function getGas() {
  const network = getName();
  if (!network) throw "Network not provided. blockchain.js:getGas()";
  const networkInfo = truffle.networks[network];
  return networkInfo.gas;
}

function setName(_name) {
  mem.name = _name;
}

function getWeb3() {
  return new Web3(getProvider());
}

function getProvider(name) {
  const network = getName() || name;
  if (!network) throw "Network not provided. blockchain.js:getProvider()";
  const truffleNetwork = truffle.networks[network];
  let providerObject;

  if (truffleNetwork.hasOwnProperty("provider")) {
    providerObject = truffleNetwork.provider();
  } else {
    providerObject =
      "http://" + truffleNetwork.host + ":" + truffleNetwork.port;
  }

  return providerObject;
}

function getContractInstance() {
  const web3 = getWeb3();
  return new web3.eth.Contract(mem.contract.abi, mem.contract.address);
}

function getTokenInstance() {
  const web3 = getWeb3();
  return new web3.eth.Contract(mem.token.abi, mem.token.address);
}

function setContractInstance(_contractInstance) {
  mem.contract.abi = _contractInstance.abi;
  mem.contract.address = _contractInstance.address;
}

function setTokenInstance(_tokenInstance) {
  mem.token.abi = _tokenInstance.abi;
  mem.token.address = _tokenInstance.address;
}

async function getWeiValue(value) {
  return await web3.utils.toWei(value, "ether");
}

function unlockMainAccount(network) {
  const address = config[network].address;
  const password = config[network].passphrase;

  const web3 = new Web3(getProvider(network));

  console.log(">> Unlocking account " + address, password);

  return web3.eth.personal.unlockAccount(address, password, 36000);
}

function initMemory() {
  if (mem.name == "") {
    loadFromFile();
  }
}
initMemory();

module.exports = {
  unlockMainAccount: unlockMainAccount,
  saveToFile: saveToFile,
  getProvider: getProvider,
  getGas: getGas,
  getName: getName,
  setName: setName,
  getWeb3: getWeb3,
  getWeiValue: getWeiValue,
  getContractInstance: getContractInstance,
  getTokenInstance: getTokenInstance,
  setContractInstance: setContractInstance,
  setTokenInstance: setTokenInstance
};
