const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
require("dotenv").config();

const server = require("../app");
const _data = require("./_data");
const User = require("../models/user");
const hash = require("../helpers/hash");

const _user = _data.user;

chai.use(chaiHttp);

//Parent block
describe("Auth", () => {
  /*
  * User Resgistration
  */
  describe("register new user", () => {
    it("it should create new user", done => {
      let user = _user;
      chai
        .request(server)
        .post("/auth/register")
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("token");
          done();
        });
    });
  });

  /*
  * User Login
  */
  describe("login user", () => {
    it("it should login user", done => {
      let user = {
        username: _user.username,
        password: _user.password
      };

      chai
        .request(server)
        .post("/auth/login")
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("token");
          done();
        });
    });
  });

  describe("forgot password", () => {
    it("it should send new password to user's email", done => {
      chai
        .request(server)
        .post("/auth/forgot")
        .send({ email: _user.email })
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });

    after(done => {
      // re-enter old password for later tests
      User.findOneAndUpdate(
        { username: _user.username },
        { password: hash(_user.password) },
        { new: true }
      ).then(user => {
        done();
      });
    });
  });
});
