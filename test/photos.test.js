const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
require("dotenv").config();

const server = require("../app");
const hash = require("../helpers/hash");
const _data = require("./_data");

chai.use(chaiHttp);

const _photographer = _data.photographer;
const _publisher = _data.publisher;
const _base64 = _data.base64;
const _photo = _data.photo;

let _photographer_token, _publisher_token;

//Our parent block
describe("Photos", () => {
  before(function(done) {
    chai
      .request(server)
      .post("/auth/login")
      .send(_publisher)
      .then(res => {
        // get publisher token
        _publisher_token = res.body.token;
        return chai
          .request(server)
          .post("/auth/login")
          .send(_photographer);
      })
      .then(res => {
        // get photographer token
        _photographer_token = res.body.token;
        done();
      });
  });

  /*
  * Upload photo
  */
  describe("upload photo", () => {
    it("it should upload photo", done => {
      chai
        .request(server)
        .post("/photos")
        .send(_photo)
        .set("Authorization", "Bearer " + _photographer_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("it should throw 401 error when no token provided", done => {
      chai
        .request(server)
        .post("/photos")
        .send(_photo)
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          done();
        });
    });

    it("it should not allow publisher to upload photo", done => {
      chai
        .request(server)
        .post("/photos")
        .send(_photo)
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.be.a("object");
          done();
        });
    });

    it("it should throw 409 error when image already exists", done => {
      chai
        .request(server)
        .post("/photos")
        .send(_photo)
        .set("Authorization", "Bearer " + _photographer_token)
        .end((err, res) => {
          res.should.have.status(409);
          res.body.should.be.a("object");
          done();
        });
    });
  });

  describe("purchase photo", () => {
    it("it should allow publisher to purchase photo", done => {
      chai
        .request(server)
        .put("/photos/" + hash(_base64) + "/pay")
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("it should not allow photographer to purchase photo", done => {
      chai
        .request(server)
        .put("/photos/" + hash(_base64) + "/pay")
        .set("Authorization", "Bearer " + _photographer_token)
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.be.a("object");
          done();
        });
    });
  });

  describe("get photos", () => {
    it("it should allow users to get photos", done => {
      chai
        .request(server)
        .get("/photos")
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          done();
        });
    });

    it("it should allow users to search for photos", done => {
      chai
        .request(server)
        .post("/photos/search")
        .send({ term: "test" })
        .set("Authorization", "Bearer " + _publisher_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          done();
        });
    });
  });

  describe("update photo", () => {
    it("it should allow photographer to update photo info", done => {
      chai
        .request(server)
        .put("/photos/" + hash(_base64))
        .send(_photo)
        .set("Authorization", "Bearer " + _photographer_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });
  });
});
