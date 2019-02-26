const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const should = chai.should();
require("dotenv").config();

const server = require("../app");

chai.use(chaiHttp);

//Our parent block
describe("Index", () => {
  describe("backend index page", () => {
    it("it should respond with static html", done => {
      chai
        .request(server)
        .get("/")
        .end((err, res) => {
          res.should.have.status(200);
          res.should.have.header("content-type", "text/html; charset=UTF-8");
          done();
        });
    });

    it("it should respond with 404 when resource not found", done => {
      chai
        .request(server)
        .get("/" + faker.hacker.adjective())
        .end((err, res) => {
          res.should.have.status(404);
          done();
        });
    });
  });
});
