const chai = require("chai");
const assert = chai.assert;
const should = chai.should();
const Blockchain = require("../helpers/blockchain");
const db = require("../helpers/db");

describe("helpers", () => {
  describe("blockchain", () => {
    it("should unlock main account", done => {
      const network = Blockchain.getName();
      Blockchain.unlockMainAccount(network)
        .then(isUnlocked => {
          should.equal(isUnlocked, true);
          done();
        })
        .catch(done);
    });
  });
});
