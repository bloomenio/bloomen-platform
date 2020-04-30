const ac = require('../helpers/access-control');

const create = function(req, res, next) {
  ac.checkPermission('create', 'invitation', req, res, next);
};

const read = function(req, res, next) {
  ac.checkPermission('read', 'invitation', req, res, next);
};

module.exports = {
  create: create,
  read: read
};
