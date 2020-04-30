const ac = require('../helpers/access-control');

const read = function(req, res, next) {
  ac.checkPermission('read', 'user', req, res, next);
};

const update = function(req, res, next) {
  ac.checkPermission('update', 'user', req, res, next);
};

const kyc = function(req, res, next) {
  ac.checkPermission('kyc', 'user', req, res, next);
};

module.exports = {
  read: read,
  update: update,
  kyc: kyc
};
