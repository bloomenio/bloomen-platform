/**
 * Checks if user is a kyc approved.
 * If not returns 403 Forbidden.
 * If no JWT given returns 401 Unauthorized.
 */
let middleware = function(req, res, next) {
  if (!req.hasOwnProperty("user")) {
    return res.status(401).send({
      error: "Unauthorized request."
    });
  }

  if (req.user.kyc.status !== 3) {
    return res.status(403).send({
      error:
        "Only approved users can request this resource. Please upload your KYC information."
    });
  }

  next();
};

module.exports = middleware;
