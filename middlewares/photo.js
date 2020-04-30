const ac = require('../helpers/access-control');

const create = function(req, res, next) {
  ac.checkPermission('create', 'photo', req, res, next);
};

const update = function(req, res, next) {
  ac.checkPermission('update', 'photo', req, res, next);
};

const pay = function(req, res, next) {
  ac.checkPermission('pay', 'photo', req, res, next);
};

module.exports = {
  create: create,
  update: update,
  pay: pay
};
