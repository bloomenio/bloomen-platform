const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
require("dotenv").config();

const User = require("../models/user");
const Organisation = require("../models/organisation");
const Transaction = require("../models/transaction");
const Invitation = require("../models/invitation");
const Photo = require("../models/photo");
const server = require("../app");
const hash = require("../helpers/hash");
const db = require("../helpers/db");

const _data = require("./_data");

chai.use(chaiHttp);

const _photographer = _data.photographer;
const _user = _data.user;
const _publisher = _data.publisher;
const _base64 = _data.base64;
const _invitation = _data.invitation;

before(function(done) {
  db.connect()
    .then(con => {
      return cleanup();
    })
    .then(con => {
      return chai
        .request(server)
        .post("/auth/register")
        .send(_publisher);
    })
    .then(pub => {
      return chai
        .request(server)
        .post("/auth/register")
        .send(_photographer);
    })
    .then(res => {
      // update one to publisher
      return User.findOneAndUpdate(
        { username: _publisher.username },
        { $set: { role: "publisher" } },
        { new: true }
      );
    })
    .then(res => {
      console.log("Bootstraping finished.");
      done();
    });
});

/**
 * Cleanup DB
 */
after(done => {
  cleanup().then(res => {
    done();
  });
});

function cleanup() {
  const promises = [
    User.remove({ username: { $regex: /^_/ } }),
    Organisation.remove({ name: { $regex: /^_/ } }),
    Photo.remove({ hash: hash(_base64) }),
    Transaction.remove({ photoHash: hash(_base64) }),
    Invitation.remove({ organisation: { $regex: /^_/ } }),
    Invitation.remove({ "user.username": { $regex: /^_/ } })
  ];

  return new Promise((resolve, reject) => {
    Promise.all(promises)
      .then(all => {
        console.log("Cleanup finished.");
        resolve(true);
      })
      .catch(err => {
        console.log("Cleanup error.", err);
        reject(err);
      });
  });
}
