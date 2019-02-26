const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Checks if a JWT is passed in the request.
 * Used in restricted routes.
 * If JWT is given, passes user object in request, else response with 401 Unauthorized.
 */
let middleware = function(req, res, next) {
  let jwtToken, decoded;

  try {
    jwtToken = req.headers.authorization.split("Bearer ")[1];
  } catch (e) {
    // if not provided
    res.status(401).send({
      error: "Unauthorized request."
    });
    return;
  }

  try {
    decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
  } catch (e) {
    // if corrupted token
    res.status(401).send({
      error: "Corrupted token."
    });
    return;
  }

  // if (decoded) {
  req.user = decoded.user;
  next();
  // } else {
  //   res.status(401).send({
  //     error: "Unauthorized request."
  //   });
  // }
};

module.exports = middleware;
