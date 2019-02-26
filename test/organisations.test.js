const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
require("dotenv").config();

const User = require("../models/user");
const Organisation = require("../models/organisation");
const server = require("../app");
const _data = require("./_data");

chai.use(chaiHttp);

const _publisher = _data.publisher;
const _organisation_data = _data.organisation;
const _organisation = { name: _publisher.username };

let _publisher_token;

//Our parent block
describe("Organisations", () => {
  before(done => {
    chai
      .request(server)
      .post("/auth/login")
      .send(_publisher)
      .then(res => {
        // retrieve and save token
        _publisher_token = res.body.token;
        done();
      });
  });

  /*
  * Get organisation
  */
  describe("get organisation", () => {
    it("it should get organisation", done => {
      chai
        .request(server)
        .get("/organisations/" + _organisation.name)
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("it should throw 401 error when no token provided", done => {
      chai
        .request(server)
        .get("/organisations/" + _organisation.name)
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });

    it("it should throw 404 error when organisation not found", done => {
      chai
        .request(server)
        .get("/organisations/" + "lalala123")
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });
  });

  describe("create organisation", () => {
    it("it should get organisation", done => {
      chai
        .request(server)
        .post("/organisations")
        .send(_organisation_data)
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("it should throw 401 error when no token provided", done => {
      chai
        .request(server)
        .post("/organisations")
        .send(_organisation_data)
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });

    it("it should throw 409 error if organisation already exists", done => {
      chai
        .request(server)
        .post("/organisations")
        .send(_organisation_data)
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(409);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });
  });
});
