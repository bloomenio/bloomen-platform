const ac = require('../helpers/access-control');

const create = function(req, res, next) {
  ac.checkPermission('create', 'sound', req, res, next);
};

const update = function(req, res, next) {
  ac.checkPermission('update', 'sound', req, res, next);
};

const read = function(req, res, next) {
  ac.checkPermission('read', 'sound', req, res, next);
};

const remove = function(req, res, next) {
  ac.checkPermission('remove', 'sound', req, res, next);
};

module.exports = {
  read: read,
  create: create,
  update: update,
  remove: remove
};
