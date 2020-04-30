const ac = require('../helpers/access-control');

const me = function(req, res, next) {
  ac.checkPermission('*', 'me', req, res, next);
};

module.exports = me;
