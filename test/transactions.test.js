const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
require('dotenv').config();

const User = require('../models/user');
const Transaction = require('../models/transaction');
const server = require('../app');
const hash = require('../helpers/hash');
const _data = require('./_data');

chai.use(chaiHttp);

const _photographer = _data.photographer;
const _photo = _data.photo;

let _photographer_token, _transaction;

//Our parent block
describe('Transactions', () => {
  before(done => {
    Transaction.findOne({ mediaHash: hash(_photo.base64) })
      .then(transaction => {
        _transaction = transaction;

        return chai
          .request(server)
          .post('/auth/login')
          .send(_photographer);
      })
      .then(res => {
        // retrieve and save token
        _photographer_token = res.body.token;
        done();
      });
  });

  /*
   * Get transactions
   */
  describe('get transactions', () => {
    it('it should get all transactions', done => {
      chai
        .request(server)
        .get('/transactions')
        .set('Authorization', 'Bearer ' + _photographer_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });

    it('it should throw 401 error when no token provided', done => {
      chai
        .request(server)
        .get('/transactions')
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should get photo transactions', done => {
      chai
        .request(server)
        .get('/transactions/photo/' + hash(_photo.base64))
        .set('Authorization', 'Bearer ' + _photographer_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });

    it('it should throw 401 error when no token provided', done => {
      chai
        .request(server)
        .get('/transactions/photo/' + hash(_photo.base64))
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should get user transactions', done => {
      chai
        .request(server)
        .get('/transactions/me')
        .set('Authorization', 'Bearer ' + _photographer_token)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });

    it('it should throw 401 error when no token provided', done => {
      chai
        .request(server)
        .get('/transactions/me')
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.be.a('object');
          res.body.should.have.property('error');
          done();
        });
    });

    it('it should get transaction status from blockchain', done => {
      chai
        .request(server)
        .get('/transactions/check?transaction=' + _transaction.hash)
        .set('Authorization', 'Bearer ' + _photographer_token)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});
