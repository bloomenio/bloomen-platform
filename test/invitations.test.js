const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const should = chai.should();
require("dotenv").config();

const server = require("../app");
const _data = require("./_data");

const _publisher = _data.publisher;
const _invitation = _data.invitation;
let _publisher_token;

chai.use(chaiHttp);

//Our parent block
describe("Invitations", () => {
  before(done => {
    chai
      .request(server)
      .post("/auth/login")
      .send(_publisher)
      .then(res => {
        // get publisher token
        _publisher_token = res.body.token;
        done();
      });
  });

  describe("Invitations endpoint", () => {
    it("it should send invitation for publisher", done => {
      chai
        .request(server)
        .post("/invitations")
        .send(_invitation)
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("it should get a list of invitations", done => {
      chai
        .request(server)
        .get("/invitations")
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          done();
        });
    });
  });
});
