const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Checks if a JWT is passed in the request.
 * Used in restricted routes.
 * If JWT is given, passes user object in request, else response with 401 Unauthorized.
 */
let middleware = function(req, res, next) {
  let jwtToken, decoded;

  try {
    if (req.headers.authorization) {
      jwtToken = req.headers.authorization.split('Bearer ')[1];
      decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    } else if (req.query.token) {
      decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
    }
  } catch (e) {
    console.log('Error', e);
    //do nothing
  }

  if (decoded) {
    req.user = decoded.user;
  } else {
    req.user = null;
  }
  next();
};

module.exports = middleware;
