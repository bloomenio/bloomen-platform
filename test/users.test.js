const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
require("dotenv").config();

const User = require("../models/user");
const Organisation = require("../models/organisation");
const hash = require("../helpers/hash");
const server = require("../app");
const _data = require("./_data");

chai.use(chaiHttp);

const _publisher = _data.publisher;
const _photographer = _data.photographer;
const _kyc = _data.kyc;

let _publisher_token;

//Our parent block
describe("Users", () => {
  before(done => {
    chai
      .request(server)
      .post("/auth/login")
      .send(_photographer)
      .then(res => {
        _photographer_token = res.body.token;

        return chai
          .request(server)
          .post("/auth/login")
          .send(_publisher);
      })
      .then(res => {
        // retrieve and save token
        _publisher_token = res.body.token;
        done();
      });
  });

  describe("kyc", () => {
    it("it should get all approved users", done => {
      chai
        .request(server)
        .get("/users")
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("it should throw 401 error when no token provided", done => {
      chai
        .request(server)
        .get("/users")
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });

    it("it should get all kyc requests", done => {
      chai
        .request(server)
        .get("/users/kyc")
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("it should get specific user's kyc request", done => {
      chai
        .request(server)
        .get("/users/" + hash(_publisher.username) + "/kyc")
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("it should let publisher rate a photographer", done => {
      chai
        .request(server)
        .put("/users/" + hash(_photographer.username) + "/vote")
        .send({ vote: 1 })
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("it should let publishers upload kyc info", done => {
      chai
        .request(server)
        .post("/users/kyc")
        .send(_kyc)
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("it should let photographers upload kyc info", done => {
      chai
        .request(server)
        .post("/users/kyc")
        .send(_kyc)
        .set("Authorization", "Bearer " + _photographer_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("it should let publishers approve kyc request", done => {
      chai
        .request(server)
        .put("/users/" + hash(_publisher.username) + "/kyc")
        .send({ approve: true })
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    it("it should let publishers decline kyc request", done => {
      chai
        .request(server)
        .put("/users/" + hash(_photographer.username) + "/kyc")
        .send({ approve: false })
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});
