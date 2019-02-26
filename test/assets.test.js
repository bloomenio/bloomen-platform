const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
require("dotenv").config();

const User = require("../models/user");
const aws = require("../helpers/aws");
const server = require("../app");
const _data = require("./_data");

chai.use(chaiHttp);

const _base64 = _data.base64;
const _amazonUrl = process.env.AWS_URL;
let _image;

//Our parent block
describe("Assets", () => {
  before(function(done) {
    aws
      .uploadBase64(_base64)
      .then(image => {
        _image = image;
        done();
      })
      .catch(done);
  });

  /*
  * Get image aws hosted image
  */
  describe("get asset", () => {
    it("it should redirect to image url", done => {
      chai
        .request(server)
        .get("/assets/host/" + _image.key)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.redirectTo(_amazonUrl + _image.key);
          done();
        });
    });

    it("it should respond 403 error if image key is wrong", done => {
      chai
        .request(server)
        .get("/assets/host/" + _image.key + "123")
        .end((err, res) => {
          res.should.have.status(403);
          done();
        });
    });
  });

  /*
  * Get list of aws images
  */
  describe("get asset list", () => {
    it("it should return a list of hosted images", done => {
      chai
        .request(server)
        .get("/assets/list")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          done();
        });
    });
  });
});
