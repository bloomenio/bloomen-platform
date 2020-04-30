const AccessControl = require('role-acl');

const ac = new AccessControl();

/**
 * General user object
 */
ac.grant('user')
  .condition({
    Fn: 'EQUALS',
    args: { requester: '$.owner' }
  })
  .execute('*')
  .on('me');

/**
 * Photographer
 */
ac.grant('photographer').extend('user');
ac.grant('photographer')
  .execute('create')
  .on('photo')
  .condition({
    Fn: 'EQUALS',
    args: { category: 'photo', requester: '$.owner' }
  })
  .execute('edit')
  .on('photo');

/**
 * Publisher
 */
ac.grant('publisher').extend('user');
ac.grant('publisher')
  .execute('*')
  .on('invitation')
  .execute('pay')
  .on('photo')
  .execute('read')
  .on('user');

/**
 * Reviewer
 */
ac.grant('reviewer').extend('user');
ac.grant('reviewer')
  .execute('kyc')
  .on('user');

/**
 * Admin
 */
ac.grant('admin').extend('user');
ac.grant('admin')
  .execute('*')
  .on('*');

/**
 * Check permission for request
 */
function checkPermission(action, object, req, res, next) {
  const check = ac
    .can(req.user.role)
    .execute(action)
    .on(object);

  check
    .then(permission => {
      if (!permission.granted) {
        return res.status(403).send({
          error: 'You have no permission to request this resource.'
        });
      }

      next();
    })
    .catch(err => {
      return res.status(500).send({
        error: err
      });
    });
}

module.exports = {
  accessControl: ac,
  checkPermission: checkPermission
};
