const crypto = require("crypto");

module.exports = function hash(input) {
  if (input === null || input === undefined)
    throw { error: "Can not hash null input." };
  return crypto
    .createHash("md5")
    .update(input)
    .digest("hex");
};
