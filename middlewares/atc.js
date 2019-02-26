/**
 * Checks if user is a member of ATC.
 * If not returns 403 Forbidden.
 * If no JWT given returns 401 Unauthorized.
 */
let middleware = function(req, res, next) {
  if (!req.hasOwnProperty("user")) {
    return res.status(401).send({
      error: "Unauthorized request."
    });
  }

  if (req.user.organisation === "ATC") {
    return res.status(403).send({
      error: "Only admins can request this resource."
    });
  }

  next();
};

module.exports = middleware;
