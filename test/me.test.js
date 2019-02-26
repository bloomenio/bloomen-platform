const chai = require("chai");
const chaiHttp = require("chai-http");
const faker = require("faker");
const should = chai.should();
require("dotenv").config();

const server = require("../app");
const _data = require("./_data");

chai.use(chaiHttp);

const _user = _data.user;

let _token;

//Our parent block
describe("Users", () => {
  before(function(done) {
    chai
      .request(server)
      .post("/auth/login")
      .send(_user)
      .then(res => {
        // retrieve and save token
        _token = res.body.token;
        done();
      });
  });

  /*
  * Get logged in User - Authorized
  */
  describe("get logged in user", () => {
    it("it should retrieve logged in user", done => {
      chai
        .request(server)
        .get("/me")
        .set("Authorization", "Bearer " + _token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("username");
          done();
        });
    });

    it("it should throw 401 error when no token provided", done => {
      chai
        .request(server)
        .get("/me")
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });

    it("it should throw 401 error when corrupted token provided", done => {
      chai
        .request(server)
        .get("/me")
        .set("Authorization", "Bearer " + _token + "123")
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });
  });

  /*
  * Update user profile info - Authorized
  */
  describe("update profile", () => {
    it("it should update user profile", done => {
      const request = {
        email: faker.internet.email()
      };

      chai
        .request(server)
        .put("/me")
        .set("Authorization", "Bearer " + _token)
        .send(request)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("it should throw 401 error when no token provided", done => {
      const request = {
        email: faker.internet.email()
      };

      chai
        .request(server)
        .put("/me")
        .send(request)
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });
  });

  /*
  * Update user password - Authorized
  */
  describe("update password", () => {
    it("it should update user password", done => {
      const request = {
        oldPassword: _user.password,
        newPassword: faker.hacker.phrase()
      };

      chai
        .request(server)
        .put("/me/password")
        .set("Authorization", "Bearer " + _token)
        .send(request)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });

    it("it should throw 401 error when no token provided", done => {
      const request = {
        oldPassword: _user.password,
        newPassword: faker.hacker.phrase()
      };

      chai
        .request(server)
        .put("/me/password")
        .send(request)
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });

    it("it should throw 404 error when wrong old password given", done => {
      const request = {
        oldPassword: faker.hacker.phrase(),
        newPassword: faker.hacker.phrase()
      };

      chai
        .request(server)
        .put("/me/password")
        .set("Authorization", "Bearer " + _token)
        .send(request)
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.be.a("object");
          res.body.should.have.property("error");
          done();
        });
    });
  });

  describe("user data", () => {
    it("it should get user photos", done => {
      chai
        .request(server)
        .get("/me/photos")
        .set("Authorization", "Bearer " + _token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("array");
          done();
        });
    });

    it("it should get user organisation hash", done => {
      chai
        .request(server)
        .get("/me/organisation")
        .set("Authorization", "Bearer " + _token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          done();
        });
    });
  });
});
